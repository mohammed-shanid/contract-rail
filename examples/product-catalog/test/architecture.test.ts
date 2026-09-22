// Second, independent enforcement of CR-0001 section 3. The lint rule catches
// the same violations at edit time; this test catches them even if someone
// disables ESLint, adds an eslint-disable comment, or uses dynamic import().
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { computeContractHash, readLock } from "../scripts/contract-lock.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const DATA = join(SRC, "data");
const CONTRACTS = join(SRC, "contracts");
const COMPOSITION_ROOT = join(SRC, "main.ts");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".ts") ? [p] : [];
  });
}

/** Static and dynamic import specifiers in a file, resolved to absolute paths when relative. */
function importsOf(file: string): { spec: string; resolved: string | null }[] {
  const src = readFileSync(file, "utf8");
  const re = /(?:from\s*|import\s*\(\s*|import\s+)["']([^"']+)["']/g;
  const out: { spec: string; resolved: string | null }[] = [];
  for (const m of src.matchAll(re)) {
    const spec = m[1]!;
    out.push({ spec, resolved: spec.startsWith(".") ? resolve(dirname(file), spec) : null });
  }
  return out;
}

const isInside = (p: string, dir: string) => p === dir || p.startsWith(dir + sep);
const rel = (p: string) => relative(ROOT, p);

describe("CR-0001 boundary rules", () => {
  const srcFiles = walk(SRC);

  it("rule 1+2: only src/main.ts and src/data may import src/data", () => {
    const violations = srcFiles
      .filter((f) => f !== COMPOSITION_ROOT && !isInside(f, DATA))
      .flatMap((f) =>
        importsOf(f)
          .filter((i) => i.resolved && isInside(i.resolved, DATA))
          .map((i) => `${rel(f)} imports "${i.spec}"`),
      );
    expect(violations, "files importing src/data outside the composition root").toEqual([]);
  });

  it("rule 3: src/contracts imports nothing outside itself", () => {
    const violations = walk(CONTRACTS).flatMap((f) =>
      importsOf(f)
        .filter((i) => i.resolved === null || !isInside(i.resolved, CONTRACTS))
        .map((i) => `${rel(f)} imports "${i.spec}"`),
    );
    expect(violations, "contract layer must be a leaf").toEqual([]);
  });

  it("rule 4: src/contracts matches CONTRACT_LOCK (frozen by CR-0001)", () => {
    const expected = readLock();
    const actual = computeContractHash();
    expect(
      actual,
      "src/contracts changed without a superseding CR. Write CR-000N, then run `npm run contracts:lock`.",
    ).toBe(expected);
  });
});
