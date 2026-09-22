# Getting started

Fifteen minutes: run the example, break it, watch it go red, then write your
own contract.

## 1. Run the gates

Verified on Node 24, locally and in CI. The example runs TypeScript
through Node's native type-stripping, on by default since 22.18 / 23.6, so
those should work too; they have not been run here.

```sh
git clone https://github.com/mohammed-shanid/contract-rail.git && cd contract-rail/examples/product-catalog
npm ci
npm run gates     # typecheck + lint + test
npm start         # renders the catalog page
```

Expected tail of `npm run gates`:

```
 Test Files  4 passed (4)
      Tests  14 passed (14)
```

## 2. Break it

Do what an agent in a hurry does — skip the interface and read the data
directly:

```sh
patch -p1 < violations/ui-bypasses-repository.patch
npm run lint
```

```
src/ui/catalogPage.ts
  3:1  error  '../data/inMemoryCatalogRepository.ts' import is restricted from being used by a pattern.
       CR-0001 rule 1: this layer may not import src/data. …
```

Now pretend you disabled the linter:

```sh
npx vitest run test/architecture.test.ts
```

```
 × rule 1+2: only src/main.ts and src/data may import src/data
   → files importing src/data outside the composition root
     + Received [ "src/ui/catalogPage.ts imports \"../data/inMemoryCatalogRepository.ts\"" ]
```

Undo: `patch -R -p1 < violations/ui-bypasses-repository.patch`.

Try the other patch, `contract-edited-without-cr.patch`, to see the frozen
layer refuse a silent change.

## 3. Read the contract that governs what you just ran

`contracts/CR-0001-catalog-repository.md`. Note section 3: every rule names
the mechanism that enforces it. That column is the whole idea.

## 4. Write your own

1. Copy `contracts/TEMPLATE.md` to `contracts/CR-0002-<name>.md`.
2. Write **Out** first. Then **In**. Then paste the interface as code.
3. For each boundary rule, decide the mechanism. In a TypeScript project the
   pattern from the example transfers directly:
   - `no-restricted-imports` with `files` + `ignores` globs in
     `eslint.config.js`
   - a test that walks `src/`, parses import specifiers, and asserts none
     resolve into the forbidden directory (`test/architecture.test.ts` is
     ~60 lines and has no dependencies beyond Node)
   - a hash lock over the frozen directory (`scripts/contract-lock.mjs`)
4. Commit the contract alone. Then implement. Then run the gates and paste
   the output into the handoff.

If you use an agent, hand it `skills/architect/SKILL.md` for step 1–4 and
`skills/implementer/SKILL.md` for the rest. `AGENTS.md` at the repo root
tells any agent where things are.

## Adapting to other languages

The principle — boundaries as machine-checked import rules plus a frozen
directory — is language-independent. The implementation here is not: it is
a TypeScript/JavaScript reference implementation (ESLint
`no-restricted-imports`, a Node script over the import graph, a SHA-256
lock). Equivalent dependency-analysis tools exist elsewhere:

| Ecosystem | Import-boundary tool                          |
| --------- | --------------------------------------------- |
| Python    | `import-linter` (contracts over import graph) |
| JVM       | ArchUnit (architecture rules as unit tests)   |
| Go        | `depguard` (allow/deny lists for imports)     |

None of these are exercised in this repo. Treat the table as pointers, not
as anything this project has verified.
