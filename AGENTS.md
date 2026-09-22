# AGENTS.md

Project context for any coding agent working in this repo. This file follows
the AGENTS.md convention (agents.md). Skills live in `skills/` and follow the
Agent Skills `SKILL.md` format (agentskills.io); load the one for your role.

## What this repo is

A method for letting coding agents work in parallel without crossing each
other's boundaries, plus a working example that proves the boundaries are
enforced by the build. The method is: freeze a contract, implement against
it, run gates, review. The example is `examples/product-catalog/`.

## Layout

```
contracts/           TEMPLATE.md + one frozen contract per change (CR-NNNN)
skills/              architect/, implementer/ — one SKILL.md each
examples/product-catalog/
  src/contracts/     frozen layer; hashed into CONTRACT_LOCK
  src/data/          the only place that knows about storage
  src/ui/            reducer + page; may import contracts, never data
  src/main.ts        composition root; the one file allowed to import data
  test/              unit tests + architecture.test.ts
  violations/        patches that MUST make the gates fail
scripts/             prove-gates-fail.sh, claim-audit.sh
docs/                getting-started, agent-roles, failure-recovery,
                     when-not-to-use, case-study
.github/workflows/   ci.yml runs every gate above
```

## Commands

Run from `examples/product-catalog/` unless noted.

```sh
npm ci                 # once
npm run typecheck
npm run lint
npm test
npm start              # renders the catalog page to stdout
npm run contracts:lock # ONLY when a new CR supersedes the current one
../../scripts/prove-gates-fail.sh   # from anywhere: proves the gates bite
../../scripts/claim-audit.sh        # from anywhere: flags unbacked claims in docs
```

## Rules that the build enforces (the CI workflow runs all of these)

1. Nothing outside `src/data/` and `src/main.ts` imports `src/data/`.
2. `src/contracts/` imports nothing outside itself.
3. `src/contracts/` cannot change without a superseding `contracts/CR-*.md`
   and a regenerated `CONTRACT_LOCK`.
4. Every patch in `violations/` must make both lint and the architecture
   test fail.
5. Docs cannot contain the phrases listed in `scripts/claim-audit.sh`.

## Rules the build cannot enforce (so read them)

- Pick a role before editing: architect or implementer (`skills/`). One
  agent can play both, in sequence, but never in the same commit.
- Do not add files to "fill out" the tree. Every file must be referenced by
  a doc, a test, or CI. If it is not, delete it.
- Do not add a claim to any `.md` that is not demonstrated in this repo.
  "Works with X" requires X to be exercised here. Prefer under-claiming.
- Commit contracts separately from implementations so history shows order.
