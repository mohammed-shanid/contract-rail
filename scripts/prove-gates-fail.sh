#!/usr/bin/env bash
# Proves the boundary gates actually bite. For each patch in
# examples/product-catalog/violations/, apply it to a scratch copy of the
# example, run lint and the architecture test, and require BOTH to fail.
# A gate that stays green under a known violation is a bug in the gate.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE="$ROOT/examples/product-catalog"
status=0

for patch in "$EXAMPLE"/violations/*.patch; do
  name="$(basename "$patch" .patch)"
  work="$(mktemp -d)"
  # Copy sources only; reuse the installed node_modules via symlink.
  (cd "$EXAMPLE" && tar --exclude=node_modules --exclude=violations -cf - .) | (cd "$work" && tar -xf -)
  ln -s "$EXAMPLE/node_modules" "$work/node_modules"

  echo "== $name: applying violation"
  (cd "$work" && patch -p1 --silent < "$patch")

  echo "-- expecting lint to FAIL"
  if (cd "$work" && npx eslint . >/dev/null 2>&1); then
    echo "!! lint stayed green under $name"; status=1
  else
    echo "   lint failed as expected"
  fi

  echo "-- expecting architecture test to FAIL"
  if (cd "$work" && npx vitest run test/architecture.test.ts >/dev/null 2>&1); then
    echo "!! architecture test stayed green under $name"; status=1
  else
    echo "   architecture test failed as expected"
  fi

  rm -rf "$work"
done

if [ "$status" -eq 0 ]; then
  echo "OK: every known violation is caught by both mechanisms."
else
  echo "FAIL: at least one gate did not catch a known violation."
fi
exit "$status"
