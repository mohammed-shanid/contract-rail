#!/usr/bin/env bash
# Claim audit. Hard-fails on marketing phrases nothing in this repo backs up,
# and prints every soft claim (CI, tested, supported, numbers) for a human to
# check against the repo before merging. Lines containing "claim-audit:allow"
# are skipped so docs can talk about the audit itself.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FILES=$(git ls-files -co --exclude-standard '*.md' 2>/dev/null || find . -name '*.md' -not -path '*/node_modules/*')

HARD='production-ready|production ready|battle-tested|battle tested|enterprise-grade|vendor-neutral|vendor neutral|works with any|industry standard|fully compatible|drop-in replacement'
SOFT='\bCI\b|\btested\b|\bverified\b|\bsupported\b|\bcompatible\b|works with|every push|re-proves|\badopted\b|\badoption\b|\bproduction\b|\bbenchmark|[0-9][0-9,.]*[kK]?\+? ?(stars|users|projects|companies|teams|downloads|open-source projects)'

status=0
echo "== hard-banned phrases (fail)"
hits=$(grep -nEi "$HARD" $FILES | grep -v 'claim-audit:allow' || true)
if [ -n "$hits" ]; then echo "$hits"; status=1; else echo "   none"; fi

echo "== soft claims (review each against the repo)"
grep -nE "$SOFT" $FILES | grep -v 'claim-audit:allow' || echo "   none"

exit $status
