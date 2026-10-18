# CLAUDE.md

## Project

Cronoz is an offline-first PWA for timing work per project: each project has its own stopwatch,
named laps and an hourly price. A small group of devices (the user's and their wife's PC and phone)
pairs with a code and syncs projects and settings.

| Service           | Port | What it is                                                                                     |
| ----------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `apps/web`        | 5173 | Vite + React 19 + React Router SPA, PWA, Dexie (IndexedDB). See `apps/web/CLAUDE.md`           |
| `apps/api`        | 3001 | Hono on `@hono/node-server`, Drizzle + Postgres (Neon in production). See `apps/api/CLAUDE.md` |
| `packages/shared` |      | Zod schemas and constants imported by both apps                                                |

Data flow: the web app reads and writes IndexedDB only, so it works with no network. When paired,
`syncManager` pushes local changes to `/sync/push` and pulls the group's changes from `/sync/pull`,
merged last-write-wins per record. Both sides validate payloads with the schemas in
`packages/shared`.

Turborepo with npm workspaces. Node 24.13.0 (`.nvmrc`).

## Working Methodology

XP practices adapted for AI-assisted development: engineering discipline applied to building
resilient, production-ready software with an AI pair. You drive, the user navigates. They act as
PM, tech lead and QA.

1. **Plan before coding.** Describe exactly what you are going to do before a large change and wait
   for confirmation. Small, localized changes can be made directly. When the user says "review" or
   "analyze", answer with a diagnosis, trade-offs and questions, not a patch.
2. **UI checks.** You MAY run the app and take your own screenshots when that saves the user a
   step, but MUST NOT start a second instance while the user is already checking the change live.
   Manual test instructions stay short: two or three quick checks of what is new or risky. Detailed
   coverage belongs in the automated tests. Run single test files while iterating and the full
   suite of every touched workspace before asking to commit.
3. **TDD.** Every feature ships with a test and every bug fix gets a regression test,
   red-green-refactor when possible. Tests must be F.I.R.S.T: fast, independent, repeatable,
   self-validating, timely. Mock external I/O (API, DB, filesystem) with named fakes, not inline
   stubs. For a visual change, write the tests after the user approves how it looks.
4. **Small, logical commits**, each self-contained, functional and passing CI. Never `git add .`,
   stage files explicitly. Never mix unrelated responsibilities in one commit. Ask before
   committing.
5. **Continuous, incremental refactoring**, minutes not hours. The moment a file grows too large or
   picks up a second responsibility, extract the component, hook or module right away. Don't let
   debt accumulate.
6. **Strategic interruption (KISS/YAGNI).** The moment something starts feeling over-engineered,
   stop and cut it at the root.
7. **Ask before narrowing an open design.** Don't settle enums, values or scope on your own just
   because one option looks obvious.
8. **Disable, don't delete.** When retiring a feature that may come back, comment out the call
   sites and keep the machinery. Ask before deleting anything you believe is dead code.

## Running the Project

```bash
npm install
npm run dev          # web on :5173, API on :3001
npm run lint         # ESLint in every workspace
npm run lint:check   # Prettier check
npm run build
```

Each app reads its own `.env`, copied from the `.env.example` next to it. Local Postgres comes from
`docker-compose.yml` (`npm run services:up`).

Vercel builds the web and the API from the same push to `main`, so there is no deploy order between
them. A change that crosses them only has to survive the minutes when one build is live and the
other isn't. The PWA updates only through its prompt, so clients keep the old build until the user
taps update. Database migrations are the one manual step: see `docs/runbook-database-migrations.md`.

## Testing

Vitest in every workspace. Test files sit in `__tests__/` next to the code. The web runs on jsdom
with `fake-indexeddb`. The API runs against a real Postgres: its `pretest` starts Docker, so Docker
MUST be running or no API test runs.

```bash
npx vitest run src/hooks/__tests__/useProject.test.js   # from the workspace, while iterating
npm test --workspace=apps/web                            # one workspace
npm test                                                 # everything
```

Test the logic, not the wiring: no tests that merely assert a schema or a type declaration, no
tests for fine plumbing, and don't open a brand new mocking layer just to reach something.

## Conventions

### Commits

Conventional Commits: `<type>(<scope>): <imperative present tense description>`. Common types are
`feat`, `fix`, `refactor`, `style`, `docs`, `test`, `build`. The scope is the workspace (`web`,
`api`, `shared`). commitlint enforces the format through a husky hook. Use `git commit` directly.

Subject line only, most of the time. Add a body only when it carries something the diff cannot show
(the why, a trade-off, a gotcha), and keep it short. Never restate what changed.

Commit messages are always in English. Never `git add .`. Ask before committing. No
`Co-Authored-By` trailer for the AI, in commits or in PR bodies. Never create a branch on your own;
commit on the current one and ask first when it is `main`. Don't amend or rewrite a commit that was
already pushed, and re-check `HEAD` before any amend, since `--amend` rewrites whatever `HEAD`
currently is, not the commit you had in mind. Never stage with `git add -N`: lint-staged cannot
stash intent-to-add entries and drops unstaged hunks.

### Code Style

- Functions: 4 to 20 lines. Split if longer.
- Files: under 500 lines as a hard ceiling. Components keep a tighter guideline around 150 lines
  and split earlier.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`. Prefer names returning fewer than
  five grep hits. Spell identifiers out (`stopwatch`, not `sw`; `response`, not `res`; `event`, not
  `e`) and write numbers as digits (`view2d`, not `twoD`).
- Types: the codebase is plain JS, so use explicit, destructured signatures instead of vague
  `props` or `options` catch-alls.
- No code duplication (DRY). Extract shared logic into a function or module.
- Simplest thing that works (KISS), and only what the current task needs (YAGNI). No abstractions,
  flags or error handling for hypothetical futures.
- Early returns over nested ifs. Max two levels of indentation.
- Exception messages must include the offending value and the expected shape. A device secret or a
  connection string is never the offending value (see `apps/api/CLAUDE.md`).
- Dependencies: inject through constructor or parameter, not global import; wrap third-party libs
  behind a thin interface owned by this project.
- Formatting: Prettier and ESLint (`npm run lint`, `npm run lint:check`). Don't debate style
  beyond that.
- Logging: structured JSON for debugging and observability; plain text only for user-facing CLI
  output.

### Comments

The default is NO comment. Before writing one, ask: would a competent reader get this from the code
alone? If yes, write nothing. Never sprinkle comments around a change to explain the change.

A comment is ONE line. It states _why_, never _what_. If the rationale needs more than one line, it
does not belong in the source: put it in the commit message, the PR or a doc in `docs/`. Warranted
_why_: a subtle choice a future edit could silently break (ordering, race, coupling to something
outside the file). Applies equally to test code. Use RFC 2119 keywords for obligations.

One explanatory comment per change is the budget; a second needs a distinct gotcha. Never repeat
the same rationale at the producer and at each consumer. Before committing, audit what the diff
adds: `git diff --cached -U0 | grep -E '^\+[[:space:]]*(#|//)'`.

Keep existing comments when refactoring, don't strip them: they carry intent and provenance the
diff will not restate. Comments written before this rule may span several lines; leave them be.
Never point a code comment at `.scratch/`: that folder is disposable and the reference will rot.

## Writing

Applies to everything you author: chat replies, code comments, commit messages, PR descriptions,
docs and notes.

- Never use an em dash, and never an en dash as punctuation. They read as AI-generated text.
  Rephrase with a period, comma, colon or parentheses.
- Be concise and direct. Lead with the answer. No flattery, no filler, no preamble, no restating the
  question, no narrating what you are about to do.
- No trailing summaries of what the diff already shows.
- In documents, state the finding, the evidence and the fix; drop the story of how you got there.
  If a sentence doesn't change what the reader does next, delete it.
- Conversations happen in Brazilian Portuguese. Developer-facing text (code, comments, errors,
  logs, commits, `.env.example`, docs) is in English. UI copy is in Brazilian Portuguese.

## Working Notes (`.scratch/`)

Issues, PRDs and roadmaps live as markdown under `.scratch/<feature-slug>/`. The folder is in
`.gitignore`, so nothing there is ever committed, and none of it should be treated as durable.

- `issue.md` carries a `Status:` line with one of five triage values: `needs-triage`, `needs-info`,
  `ready-for-agent`, `ready-for-human`, `wontfix`.
- Multi-stage work gets one lightweight `roadmap.md`, not heavy spec plus plan ceremony.
- Write findings, not conclusions. Split notes into **Decided**, **Discovered** and **Open**. A
  recommendation of yours is not a decision and does not go under Decided until the user agrees.
- These notes die with the task. When something must survive it, leave a short self-contained brief
  for the next task instead of assuming the folder will still be there.

## Gotchas

- **Sync payload limits** live in `packages/shared/src/constants.js`. The push schema rejects
  anything above them, so the client MUST enforce the same numbers: a record over a limit fails
  every push and sync stalls for good. A new user-editable text field needs a `maxLength` from
  there, and a new list that grows without bound needs a cap in its repository.
- **Zod drops undeclared keys.** A field added to a local record MUST be added to the shared schema
  in the same change, or sync and backup import lose it silently. A new optional field stays
  `.optional()` and unbounded so older builds keep pushing.
- **A schema change crosses a live deploy.** Old clients keep pushing the old shape until they
  update, so the API MUST accept both.

## Knowledge (`docs/`)

Write down everything that did not become code. `docs/` is versioned and durable: it is where the
next session starts instead of starting from zero.

`docs/IDEA.md` is the project's founding brief: the problem, use cases, stack and constraints, in
the user's words. Read it to understand intent and to align decisions with the product vision. It
belongs to the user: never rewrite it, ask before adding to it. Whenever a decision changes the
product vision (scope, features, stack, priorities), ask whether `docs/IDEA.md` should be updated.

- Research: options considered, the one chosen, and why the others were rejected.
- Experiments and PoCs: what was tried, how to reproduce it, the measured result, the verdict.
- Oracles: reference data a result must match (golden files, recorded runs, benchmarks).
- Post-mortems of approaches that failed, and runbooks for operating the system.

One topic per file, kebab-case (`research-video-streaming.md`, `poc-webrtc-turn.md`).
`docs/README.md` indexes every file in one line each; read it before a non-trivial task and update
it when adding a file. When a significant finding comes up mid-session, save it here without being
asked.

`.scratch/` holds work in progress; when a task ends, promote what is worth keeping into `docs/`.

## Living Document

These files are living documents. Whenever we hit a recurring technical obstacle or settle on a new
design pattern, write it down so the context survives into future sessions.

Rules that only matter inside one workspace live in its own `CLAUDE.md` (`apps/web/CLAUDE.md`,
`apps/api/CLAUDE.md`). Split `packages/shared` out the same way once it accumulates its own.
