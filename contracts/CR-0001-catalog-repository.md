# CR-0001: Product catalog behind a repository interface

| Field    | Value                                                          |
| -------- | -------------------------------------------------------------- |
| Status   | frozen                                                         |
| Frozen   | 2026-09-22                                                     |
| Author   | Claude (Opus 5) acting as architect, reviewed by repo owner    |
| Governs  | `examples/product-catalog/src/contracts/**`                    |

## 1. Scope

**In:**

- A frozen `CatalogRepository` interface and the `Product` type it returns.
- An in-memory implementation of the repository in `src/data/`.
- A reducer in `src/ui/` that holds catalog page state (loading, loaded,
  failed) and a category filter.
- A page renderer in `src/ui/` that turns reducer state into an HTML string.
- A composition root `src/main.ts` that is the only place the concrete
  repository is wired to the UI.
- Unit tests for the reducer and the page.
- An architecture test and a lint rule that fail if any file outside
  `src/data/` and `src/main.ts` imports from `src/data/`.
- A lock check that fails if `src/contracts/` changes without this CR
  being superseded.

**Out:**

- No real database, HTTP client, or framework. In-memory only.
- No React/Vue/etc. The page is a pure function returning a string.
- No pagination, sorting, search, cart, or auth. Category filter only.
- No changes to anything outside `examples/product-catalog/` under this CR.

## 2. Frozen interface

```ts
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly priceCents: number;
  readonly inStock: boolean;
}

export interface ProductQuery {
  readonly category?: string;
  readonly inStockOnly?: boolean;
}

export interface CatalogRepository {
  list(query?: ProductQuery): Promise<readonly Product[]>;
  getById(id: string): Promise<Product | null>;
}
```

## 3. Boundary rules

| # | Rule                                                                          | Enforced by                                        |
| - | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| 1 | `src/ui/**` MUST NOT import from `src/data/**`                                | `eslint` `no-restricted-imports` + `test/architecture.test.ts` |
| 2 | Only `src/main.ts` and `src/data/**` may import from `src/data/**`            | same two mechanisms                                |
| 3 | `src/contracts/**` MUST NOT import from outside `src/contracts/`              | same two mechanisms                                |
| 4 | `src/contracts/**` MUST NOT change unless a CR supersedes this one            | `src/contracts/CONTRACT_LOCK` hash check in `test/architecture.test.ts` |

## 4. Invariants

- `list()` with no query returns every product; `list({ category })` returns
  only products in that category; `inStockOnly: true` drops out-of-stock rows.
- `getById()` returns `null` for unknown ids and never throws for them.
- The reducer is pure: same state + same action → same result, no I/O.
- The page renders a distinct, testable marker for each of the three states
  (loading / loaded / failed) and lists products by name and price.
- Prices are rendered from integer cents; the UI never does float math.

## 5. Acceptance gates

Run from `examples/product-catalog/`:

```sh
npm run typecheck
npm run lint
npm test
```

And from the repo root, the proof that the gates actually bite:

```sh
./scripts/prove-gates-fail.sh
```

## 6. Change procedure

This contract is frozen. To change the interface, write `CR-0002` marking
this one superseded, edit `src/contracts/`, run `npm run contracts:lock`, and
re-run all gates. A diff that touches `CONTRACT_LOCK` without a new CR in
`contracts/` should be rejected in review.
