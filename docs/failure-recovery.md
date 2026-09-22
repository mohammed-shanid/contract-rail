# Failure recovery

What to do when the loop breaks. Each entry: symptom → cause → command.

## A gate is red after the implementer said it was green

**Cause:** the implementer summarised instead of pasting output, or ran a
subset. **Do:** bounce with the raw output. Do not fix it yourself; the
implementer's handoff format exists so this cannot recur silently.

## `rule 4: src/contracts matches CONTRACT_LOCK` fails

**Cause:** someone edited the frozen layer. Two legitimate cases, one not.

- A new CR supersedes the old one → `npm run contracts:lock`, commit the
  lock **with** the CR in the same commit.
- Whitespace/comment-only change → still a change. Same procedure; the lock
  is deliberately dumb.
- "I just needed one more method" → revert. That is the implementer asking
  the architect for a CR, and the answer is a CR, not a lock regeneration.

```sh
git checkout -- examples/product-catalog/src/contracts/
```

## The contract turns out to be wrong mid-implementation

This is normal; it is what the loop is for. **Do not** patch the interface
in place. The implementer stops, writes down exactly what is missing (the
"Out-of-scope things I noticed" line in the handoff), and the architect
writes `CR-000(N+1)` with `Status: supersedes CR-000N`. Old CR gets
`Status: superseded by CR-000(N+1)`. Then lock, then continue.

Cost: one commit. Benefit: history shows why the interface changed.

## Implementer touched files outside the CR's scope

**Detect:** `git diff --stat main` against the paths in the CR's **In**
list. **Do:** split the commit. In-scope goes forward; out-of-scope becomes
a note for the architect. If the out-of-scope change was needed to make a
gate pass, the contract's **In** list was incomplete — new CR.

## `prove-gates-fail.sh` reports a gate stayed green

This is the worst failure and the reason the script exists: a violation the
gates no longer catch. **Cause** is usually one of:

- a lint `ignores` glob was widened (check `eslint.config.js`)
- the architecture test's `walk()` root or exclusions changed
- the patch no longer applies cleanly (`patch` exits non-zero but the script
  keeps going; check for `.rej` files in the temp dir)

Fix the gate, not the patch. Add a new patch if you found a new escape.

## Lint passes but the architecture test fails (or vice versa)

Expected occasionally; it is why there are two. Dynamic `import()` and
`require()` slip past `no-restricted-imports` in some configs; the test
catches those. A test regex miss might let a weird specifier through; lint
catches that. Treat a disagreement as a bug in the quieter mechanism and add
a violation patch that exercises it.

## Two implementers' CRs overlap

Their **Governs** paths intersect. The architect made an error; there is no
runtime fix. Pick one CR to supersede with a narrower path, re-run the
gates for both, and add an assertion to the architecture test that the
two directories do not import each other.

## Node says `ERR_MODULE_NOT_FOUND` or rejects TypeScript syntax on `npm start`

Check `node --version` first: type-stripping is on by default from 22.18
and 23.6; only 24 has been run here.

The example runs on Node's native type-stripping. Use `.ts` import
specifiers and stay inside `erasableSyntaxOnly` (no enums, no parameter
properties, no namespaces). `tsc` enforces the second; the first shows up
only at runtime, which is why `npm start` is a CI gate.
