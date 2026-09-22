#!/usr/bin/env bash
# Proves the boundary gates actually bite.
#
# For each patch in examples/product-catalog/violations/, apply it to a
# scratch COPY of the example (the repo itself is never modified), run lint
# and the architecture test, and require BOTH to fail. A gate that stays
# green under a known violation is a bug in the gate, and this script exits 1.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE="$ROOT/examples/product-catalog"

if [ ! -d "$EXAMPLE/node_modules" ]; then
  echo "error: run 'npm ci' in examples/product-catalog first" >&2
  exit 2
fi

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

status=0
printf '%-32s %-10s %-10s\n' "violation" "lint" "arch-test"
printf '%-32s %-10s %-10s\n' "---------" "----" "---------"

for patch in "$EXAMPLE"/violations/*.patch; do
  name="$(basename "$patch" .patch)"
  work="$SCRATCH/$name"
  mkdir -p "$work"
  (cd "$EXAMPLE" && tar --exclude=node_modules --exclude=violations -cf - .) | (cd "$work" && tar -xf -)
  ln -s "$EXAMPLE/node_modules" "$work/node_modules"

  if ! (cd "$work" && patch -p1 --silent < "$patch"); then
    printf '%-32s %-10s %-10s\n' "$name" "NO-APPLY" "NO-APPLY"
    echo "!! $name does not apply cleanly to the current example; regenerate it" >&2
    status=1
    continue
  fi

  if (cd "$work" && npx eslint . >/dev/null 2>&1); then lint="GREEN (bug)"; status=1; else lint="red (ok)"; fi
  if (cd "$work" && npx vitest run test/architecture.test.ts >/dev/null 2>&1); then arch="GREEN (bug)"; status=1; else arch="red (ok)"; fi
  printf '%-32s %-10s %-10s\n' "$name" "$lint" "$arch"
done

echo
if [ "$status" -eq 0 ]; then
  echo "OK: every known violation is caught by both lint and the architecture test."
else
  echo "FAIL: at least one gate did not catch a known violation (or a patch did not apply)."
fi
exit "$status"
