# contract-rail

**Boundaries the build enforces, not the prompt.**

Freeze the interface. Let agents implement against it. If one crosses a
boundary, the build fails — not a reviewer, not a prompt, the build.

```
$ patch -p1 < violations/ui-bypasses-repository.patch    # UI reads the data source directly
$ npm run lint
src/ui/catalogPage.ts
  3:1  error  '../data/inMemoryCatalogRepository.ts' import is restricted from being used by a pattern.
       CR-0001 rule 1: this layer may not import src/data. Depend on the CatalogRepository
       interface from src/contracts and let src/main.ts inject the implementation

$ npx vitest run test/architecture.test.ts                 # even with ESLint disabled
 × rule 1+2: only src/main.ts and src/data may import src/data
   + Received [ "src/ui/catalogPage.ts imports \"../data/inMemoryCatalogRepository.ts\"" ]
```

That output is real (paths shortened, lines wrapped), from
`examples/product-catalog/`. The CI workflow is configured to re-prove it
on every push by applying the violation and requiring both gates to fail;
so far the proof has been verified locally (see *Status* below).

## What this is

Three things, and only three:

1. **A contract format** (`contracts/TEMPLATE.md`). Scope in, scope out, the
   frozen interface as code, and a boundary-rules table where every rule
   must name the mechanism that enforces it. One filled example:
   `contracts/CR-0001-catalog-repository.md`.
2. **A working example** (`examples/product-catalog/`) — typed
   `CatalogRepository` interface, in-memory implementation, reducer, page,
   14 tests — with a lint rule and an architecture test that fail if the UI
   imports the data layer, and a hash lock that fails if the frozen
   interface changes without a superseding contract.
3. **Two skills** (`skills/architect`, `skills/implementer`) in the Agent
   Skills `SKILL.md` format, plus an `AGENTS.md`, so an agent can play each
   role with the guardrails loaded.

The loop: **architect** freezes a contract → **implementer** builds against
it → **validator** runs the gates → **reviewer** merges or bounces. Roles
are defined in `docs/agent-roles.md` by what each one may *not* do.

## Run it

```sh
cd examples/product-catalog
npm ci
npm run gates          # typecheck + lint + 14 tests
npm start              # renders the catalog page to stdout
../../scripts/prove-gates-fail.sh   # applies each violation patch, requires red
```

Verified locally on Node 24; the CI workflow is configured for the same
version. Node 22.18+ has the same native TypeScript support and should
work, but has not been run here. Then read `docs/getting-started.md` to
break it yourself and write your own contract.

**Scope of the enforcement.** The method is language-independent; the
shipped enforcement is not. `architecture.test.ts` and the ESLint rule are
a TypeScript/JavaScript reference implementation of the pattern (import
graph + frozen-directory hash). Other ecosystems have their own dependency
analysis tools for the same job — `import-linter` for Python, ArchUnit for
the JVM, `depguard` for Go — but none of those are exercised in this repo.
This is not a cross-language enforcement framework.

## Built with the method it teaches

The contract for the example (`CR-0001`) was written and committed before
any implementation existed — `git show --stat 96c7465` has no `src/` files
in it. One agent (Claude Opus 5 in Claude Code) then played implementer and
validator in sequence, with the repo owner as reviewer. Along the way the
`npm start` gate caught two runtime failures that typecheck and tests
missed, which is why `npm start` is a step in the CI workflow. The full
account, with the ADRs and the raw gate output, is in `docs/case-study.md`.

Honest shape of that claim: one agent, sequential roles, one human
reviewer. Not a parallel multi-agent run. The mechanism is the same; the
coordination has not been exercised here at N > 1.

## What already exists, and what this adds

Agent-instruction templates and multi-agent handoff repos already exist and
several are good. Most stop at the prompt: they tell the agent not to cross
the boundary. This repo assumes the agent will cross it anyway — under time
pressure, after a context reset, or because the "quick fix" was genuinely
quicker — and makes the build refuse. The additions are:

- an enforcement column in the contract (a rule without a mechanism is not
  allowed in the template),
- a runnable example whose gates go red on a committed violation patch,
- a hash lock that makes silent interface changes impossible,
- a CI job configured to re-run that proof on every push.

Nothing here invents multi-agent workflows or agent instruction files. It
stands on the existing standards below.

## Standards this stands on

These are different tools, not parallel equals:

- **AGENTS.md** — a single, project-scoped Markdown file that gives any
  coding agent the context for *this* repo. Introduced by OpenAI in
  August 2025; contributed to the Linux Foundation's Agentic AI Foundation
  at its formation on 9 December 2025, alongside MCP and goose. The
  foundation's announcement cited adoption by more than 60,000 open-source
  projects at that date. MIT-licensed. This repo's `AGENTS.md` follows it.
- **Agent Skills (`SKILL.md`)** — a directory-per-capability format for
  reusable, on-demand instructions an agent loads when a task matches.
  Two required frontmatter fields (`name`, `description`) and a Markdown
  body. Originated at Anthropic (October 2025 in Claude); published as an
  open specification at agentskills.io on 18 December 2025, and since read
  by Claude Code, Codex CLI, Cursor, VS Code and others. It is not a
  per-project file the way `AGENTS.md` is; it is portable across projects
  and tools. `skills/architect` and `skills/implementer` follow the spec.

Dates and figures above are as reported in the Linux Foundation and
Anthropic announcements; this repo has not independently measured adoption.

## Layout

```
contracts/       TEMPLATE.md, CR-0001-catalog-repository.md
skills/          architect/SKILL.md, implementer/SKILL.md
examples/product-catalog/
  src/contracts/ frozen; CONTRACT_LOCK hashes it
  src/data/      the only layer that knows about storage
  src/ui/        reducer + page renderer; may not import data
  src/main.ts    composition root; the one file allowed to import data
  test/          unit tests + architecture.test.ts
  violations/    patches that must turn the gates red
scripts/         prove-gates-fail.sh, claim-audit.sh
docs/            getting-started, agent-roles, failure-recovery,
                 when-not-to-use, case-study
.github/         ci.yml — example gates, prove-gates-fail, claim-audit
```

Every file above is referenced by a doc, a test, or CI. If you find one
that is not, that is a bug; see `CONTRIBUTING.md`.

## Status

Pre-release. Every gate in `.github/workflows/ci.yml` has been run locally
on Node 24 with the output shown in `docs/case-study.md`; the workflow
itself has not yet executed on a hosted runner because the repo has not
been pushed. Once it has, this paragraph should be replaced by a link to a
green run.

## Not for you if

You do not know the interface yet, one human reads every diff, or the
boundary you care about is behavioural rather than structural.
`docs/when-not-to-use.md` is short and honest about this.

## License

MIT. See `LICENSE`.
