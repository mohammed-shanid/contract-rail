# Agent roles

Four roles, one loop. A role is defined by what it is **not allowed** to do;
the permissions are the boring part.

```
architect ──contract──▶ implementer ──code + gate output──▶ validator ──verdict──▶ reviewer
     ▲                                                          │
     └──────────── "contract is wrong, supersede it" ◀──────────┘
```

| Role        | Input                       | Output                                   | May not                                                      |
| ----------- | --------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Architect   | the ask, existing CRs       | one frozen `CR-NNNN.md` + interface code | write implementation; edit a frozen CR; leave a rule unenforced |
| Implementer | one frozen CR               | code, tests, enforcement, real gate output | touch the frozen layer; add scope; silence a gate; skip `Out` |
| Validator   | the CR + the implementer's diff | pass/fail per gate, per invariant    | read the implementer's summary instead of running the gates |
| Reviewer    | everything above            | merge / bounce / supersede-the-CR        | approve with any gate red; approve a `CONTRACT_LOCK` diff without a new CR |

## Who is what

- **One agent, sequential.** Load `skills/architect`, produce the CR, commit.
  Load `skills/implementer`, build, run gates, commit. This is how this repo
  was built (see `docs/case-study.md`). It works because the commit boundary
  is the hat change.
- **Two agents, parallel.** The architect freezes N contracts up front; N
  implementers each take one. They cannot collide because each CR's
  **Governs** path is disjoint and the architecture test fails if one
  reaches into another's layer. Untested here at N > 1; the mechanism is the
  same, the coordination cost is not.
- **Validator = the CI workflow** (`.github/workflows/ci.yml`) once it runs
  on a host; until then, the same commands run locally (`npm run gates`,
  `scripts/prove-gates-fail.sh`, `scripts/claim-audit.sh`).
  A human or agent validator adds value only by checking invariants
  (contract section 4) that no test covers yet — and the right output of
  that is a new test, not a comment.
- **Reviewer = human**, at least for now. The reviewer's one hard job is
  refusing a `CONTRACT_LOCK` change that has no `CR-*.md` next to it.

## Handoffs are files, not messages

The architect hands off a committed file. The implementer hands off a diff
plus pasted gate output. If a handoff needs a chat message to be understood,
the contract was under-specified; fix the contract, not the message.

## Why the implementer can't self-certify

Because "tests pass" from the agent that wrote the tests is the same
statement as "I think I'm done". The validator runs the commands. The
implementer's skill requires pasting raw output precisely so the validator
can diff it against what it sees.
