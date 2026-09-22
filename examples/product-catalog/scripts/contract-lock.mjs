// Computes a hash over src/contracts/**/*.ts and writes/verifies CONTRACT_LOCK.
// Enforces CR rule: the frozen layer cannot change silently.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
export const CONTRACTS_DIR = join(root, "src", "contracts");
export const LOCK_FILE = join(CONTRACTS_DIR, "CONTRACT_LOCK");

export function computeContractHash() {
  const files = readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();
  const h = createHash("sha256");
  for (const f of files) {
    h.update(relative(root, join(CONTRACTS_DIR, f)) + "\n");
    h.update(readFileSync(join(CONTRACTS_DIR, f), "utf8"));
    h.update("\n\0");
  }
  return `sha256:${h.digest("hex")}`;
}

export function readLock() {
  return existsSync(LOCK_FILE) ? readFileSync(LOCK_FILE, "utf8").trim() : null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const actual = computeContractHash();
  if (process.argv.includes("--write")) {
    writeFileSync(LOCK_FILE, actual + "\n");
    console.log(`wrote ${relative(process.cwd(), LOCK_FILE)}\n${actual}`);
  } else {
    const expected = readLock();
    if (expected !== actual) {
      console.error(`CONTRACT_LOCK mismatch\n expected ${expected}\n actual   ${actual}`);
      process.exit(1);
    }
    console.log("contract lock ok");
  }
}
