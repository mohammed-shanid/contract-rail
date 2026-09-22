# Case study: this repo was built with the loop it teaches

This is the evidence behind the "built using the method" claim on the README.
Everything below is checkable from `git log` and the files it names.

## What actually happened (2026-09-22)

One agent (Claude Opus 5, running in Claude Code) built the repo in a single
session, directed by the repo owner. It played the roles **in sequence**, not
in parallel, and the repo owner acted as reviewer. That is the honest shape
of it: the loop, with one worker switching hats and a human at the review
gate. It was not a multi-agent parallel run.

| Step         | Artifact                                             | Commit    |
| ------------ | ---------------------------------------------------- | --------- |
| Architect    | `contracts/CR-0001-catalog-repository.md`, frozen    | `a53c4ef` |
| Implementer  | `examples/product-catalog/` built against CR-0001    | `d66f07b` |
| Validator    | `npm run gates` + `scripts/prove-gates-fail.sh`      | output below |
| Reviewer     | repo owner, plus the self-review findings listed below | — |

`git show --stat a53c4ef` contains no implementation files. The contract was
frozen — interface, boundary rules, out-of-scope list, gates — before a
single line of `src/` existed.

## What the gates caught during the build

These are real, not staged. They are the reason the gates are in CI.

1. **`npm start` caught two runtime failures that typecheck and tests
   missed.** The first implementation used `.js` import specifiers (the
   common TypeScript convention). Vitest and `tsc` were happy; Node's native
   TypeScript runner was not: `ERR_MODULE_NOT_FOUND`. Fixed by using `.ts`
   specifiers with `allowImportingTsExtensions`. Then Node rejected a
   constructor parameter property (`constructor(private readonly x)`), which
   type-stripping cannot erase. Fixed with an explicit field, and
   `erasableSyntaxOnly: true` was added to tsconfig so it cannot come back.
   Lesson recorded in CI: `npm start` runs as a gate, not just the tests.

2. **Self-review caught a rule-2 violation before lint ran.** The data
   layer's test was first written in `test/`, importing `src/data`. That is
   exactly what rule 2 forbids from `test/`. Rather than add an exception,
   the test was moved into `src/data/` next to the code it tests, so the
   rule stays literal. The lint config's `ignores` list did not grow.

3. **Typecheck failed on a missing `@types/node`** for the architecture
   test's `node:fs` imports. Added, `types: ["node"]` set. Boring, but it is
   why "typecheck" is listed as a gate and not assumed.

## The architecture test catching a violation

Applying `violations/ui-bypasses-repository.patch` (UI news up the concrete
repository instead of using the injected interface):

```
$ npm run lint
/…/examples/product-catalog/src/ui/catalogPage.ts
  3:1  error  '../data/inMemoryCatalogRepository.ts' import is restricted from being used by a pattern.
       CR-0001 rule 1: this layer may not import src/data. Depend on the CatalogRepository
       interface from src/contracts and let src/main.ts inject the implementation  no-restricted-imports
✖ 1 problem (1 error, 0 warnings)

$ npx vitest run test/architecture.test.ts
 ❯ test/architecture.test.ts (3 tests | 1 failed)
   × CR-0001 boundary rules > rule 1+2: only src/main.ts and src/data may import src/data
     → files importing src/data outside the composition root: expected [ Array(1) ] to deeply equal []
- Expected  []
+ Received  [ "src/ui/catalogPage.ts imports \"../data/inMemoryCatalogRepository.ts\"" ]
```

Applying `violations/contract-edited-without-cr.patch` (someone adds a
method to the frozen interface that leaks the concrete type):

```
   × rule 1+2: only src/main.ts and src/data may import src/data
   × rule 3: src/contracts imports nothing outside itself
     → contract layer must be a leaf: expected [ Array(1) ] to deeply equal []
   × rule 4: src/contracts matches CONTRACT_LOCK (frozen by CR-0001)
     → src/contracts changed without a superseding CR. Write CR-000N, then run `npm run contracts:lock`.
       expected 'sha256:eac2a1c8…' to be 'sha256:3ade8605…'
```

And the proof that both mechanisms catch both patches, which
`.github/workflows/ci.yml` runs on every push. (Its steps are exactly the
commands shown in this document; at the time of this commit the workflow
had not yet executed on GitHub Actions because the repo had not been
pushed. If you are reading this on GitHub, the badge-less way to check is
the Actions tab.)

```
$ ./scripts/prove-gates-fail.sh
== contract-edited-without-cr: applying violation
-- expecting lint to FAIL
   lint failed as expected
-- expecting architecture test to FAIL
   architecture test failed as expected
== ui-bypasses-repository: applying violation
-- expecting lint to FAIL
   lint failed as expected
-- expecting architecture test to FAIL
   architecture test failed as expected
OK: every known violation is caught by both mechanisms.
```

## Decision record

**ADR-1: Two enforcement mechanisms per rule, not one.** The lint rule
gives fast feedback in the editor; the architecture test survives
`eslint-disable`, a deleted ESLint config, or a dynamic `import()`. An agent
under pressure will reach for the first escape hatch it finds. Two
independent mechanisms means the second one still fires.

**ADR-2: A hash lock file instead of branch protection or CODEOWNERS.**
Those depend on hosting configuration that a clone does not carry. A
`CONTRACT_LOCK` committed next to the frozen layer fails locally, in any CI,
and in any fork, and makes an interface change show up as a visible diff a
reviewer can demand a CR for.

**ADR-3: Violations are committed as patches and CI proves they fail.** A
gate that has never been seen red is not known to work. `violations/` plus
`prove-gates-fail.sh` turns "the test would catch that" into something the
build asserts every run.

**ADR-4: No framework in the example.** The page is a function returning a
string. React would have added a build step and a second import graph to
police, and would have made the example about React. The boundary is the
lesson; the UI library is not.

**ADR-5: `.ts` import specifiers and `erasableSyntaxOnly`.** So the example
runs with `node src/main.ts` on Node 22.6+ with no bundler. The one-line
cost is that these files would need a rewrite step to publish as a library,
which the example never intends to be.
