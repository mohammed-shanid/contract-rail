# CR-XXXX: <one-line title>

| Field    | Value                                              |
| -------- | -------------------------------------------------- |
| Status   | draft \| frozen \| superseded by CR-YYYY           |
| Frozen   | YYYY-MM-DD (blank while draft)                     |
| Author   | <who wrote it — human, agent, or both>             |
| Governs  | <paths this contract freezes, e.g. `src/contracts/**`> |

A contract is the only artifact an implementer is allowed to build against.
If something is not written here, the implementer does not get to assume it.

## 1. Scope

**In:** what the implementer must deliver. Bullet list, each item testable.

**Out:** what the implementer must not touch or build, even if it seems
helpful. Be explicit — scope creep hides in "while I was in there".

## 2. Frozen interface

The exact types/signatures the implementation must satisfy. Paste the code.
This is what gets copied into the frozen layer and hashed into the lock file.

```ts
// paste the interface here
```

## 3. Boundary rules

Every rule must name the mechanism that enforces it. A rule with no
enforcement column is a suggestion, and suggestions do not survive contact
with an agent under time pressure.

| # | Rule                                              | Enforced by                     |
| - | ------------------------------------------------- | ------------------------------- |
| 1 | `<layer A>` MUST NOT import `<layer B>`           | lint rule + architecture test   |
| 2 | `<frozen layer>` MUST NOT change without a new CR | contract lock check             |

## 4. Invariants

Behavioral guarantees that must hold regardless of implementation. Each one
should map to at least one test.

- ...

## 5. Acceptance gates

Commands that must exit 0 before the work is considered done. The validator
runs these; the implementer does not get to declare success.

```sh
npm run typecheck
npm run lint
npm test
```

## 6. Change procedure

How this contract can change. Default: it can't — write a new CR that
supersedes this one, update the lock, and re-run the gates.
