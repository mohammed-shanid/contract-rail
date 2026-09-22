# When not to use this

The method costs a contract per change and a gate per rule. That is cheap
when agents run in parallel on a codebase that will outlive the sprint. It
is pure overhead in these cases:

**You don't know the interface yet.** If the shape of the thing is the
question, freezing it first produces a wrong contract and a superseding CR
an hour later. Explore first with no contract, throw the exploration away,
then write the CR. The loop starts when the exploring stops.

**One person, one agent, every diff read.** If a human reads every line
before merge, the human is the architecture test. Add the enforcement when
the reading stops, which is usually sooner than planned.

**Single-file scripts, notebooks, throwaway prototypes.** There is no
boundary to cross.

**The boundary is not expressible as an import rule.** This repo enforces
*structural* boundaries: who may import whom, and which directory is frozen.
It does not enforce behavioural ones ("the reducer must be pure", "never
does float math"). Those go in section 4 of the contract and need ordinary
tests. If most of what you want to protect is behavioural, this repo gives
you a contract template and not much else.

**You want the agents to talk to each other.** The loop deliberately makes
handoffs files, not conversations. If your workflow depends on agents
negotiating scope in real time, the frozen contract will feel like a wall.
It is one, on purpose.

**Your ecosystem has no cheap import-graph tool.** The example's
architecture test is 60 lines of Node with a regex. If your language makes
that hard, the second enforcement mechanism disappears and you are back to
a lint rule someone can disable. Still better than nothing; not the full
method.

## What it is not a substitute for

- Code review. The reviewer role exists; the gates make the review shorter,
  not optional.
- Tests of behaviour. Boundary tests say who can call whom. They say
  nothing about whether the call is right.
- Design. A contract records a decision. It does not make it.
