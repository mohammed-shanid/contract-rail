# Contributing

The repo is small on purpose. A pull request that adds a file must say, in
the description, which doc, test, or CI job references it. If nothing does,
the file will be asked to leave.

## Before opening a PR

From `examples/product-catalog/`:

```sh
npm run gates
```

From the repo root:

```sh
./scripts/prove-gates-fail.sh
./scripts/claim-audit.sh
```

All three must exit 0. `claim-audit.sh` prints soft claims (mentions of CI,
tested, numbers) for you to check by hand; if you added one, the PR
description should say what in the repo backs it.

## Changing the example

- Anything under `src/contracts/` needs a new `contracts/CR-*.md` that
  supersedes `CR-0001`, then `npm run contracts:lock`, committed together.
- If you find a way to cross a boundary that the gates miss, add a patch to
  `violations/` first (so `prove-gates-fail.sh` goes red), then fix the
  gate. Patch and fix in the same PR.
- Keep it framework-free. The point is the boundary, not the UI library.

## Changing the method

Contract template, skills, and docs. Prefer deleting to adding. If a section
would only restate "use contracts", cut it.

## Using an agent to contribute

Fine — this repo was built that way. Load `skills/architect` or
`skills/implementer` for the role, commit the contract separately from the
implementation, and paste raw gate output in the PR.
