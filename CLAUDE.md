# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start all apps in dev mode (Vite on :5173, API on :3001)
npm run build        # Build all apps for production
npm run lint         # Run ESLint across all workspaces
npm run lint:check   # Check Prettier formatting
npm run test         # Run all tests
npm run test:coverage # Run tests with coverage
```

**Node version:** 24.13.0 (see `.nvmrc`)

## Monorepo Structure

Cronoz is a Turborepo monorepo with npm workspaces:

```
cronoz/
  apps/
    web/     — Vite + React Router SPA (PWA, offline-first)
    api/     — Hono API (sync/pairing)
  packages/
    shared/  — Zod schemas and constants shared by apps/web and apps/api
```

## apps/web

PWA multi-project stopwatch built with Vite, React 19, and React Router. Users can create named projects, each with its own independent stopwatch and lap tracking.

### Routes

- `/` (`src/pages/Home.jsx`) — Lists all projects (active and completed). Handles project creation, completion, and reopening.
- `/project/:id` (`src/pages/ProjectPage.jsx`) — Individual project view with stopwatch controls, lap tracking, and rename/delete.

### Code Organization

- `src/pages/` — Route components (Home, ProjectPage)
- `src/components/` — Presentational React components
- `src/hooks/` — Custom React hooks (`useProject`, `useAutoPause`, `useKeyboardShortcuts`, `useInstallPrompt`, …)
- `src/lib/` — Pure utility functions (`stopwatch.js`: time calculation and formatting)
- `src/services/` — Data access layer (Dexie/IndexedDB wrappers)
- `src/main.jsx` — Entry point with React Router setup
- `src/App.jsx` — Root layout with `<Outlet />`

Components are grouped by family in subfolders, each with its own `__tests__/`:

```
components/
  laps/     Laps LapItem LapCard LapName LapNameForm LapTime LapMenu
  timer/    TimerStage {Minimal,Inline,Stacked}Stage TimerDisplay TimerMeta TimerSlot
            RunningIndicator TimerControls TimerAdjuster AdjusterFrame
            TimerAdjustSlot StepGroup AdjustActions
  pip/      PiPContent PiPTimer PiPIdleView PiPLapView PiPDiscardView PiPPlaceholder
  project/  ProjectCard ProjectHeader ProjectTitle ProjectMenu ProjectRenameActions
  sync/     SyncCard SyncIndicator SyncPairingStart SyncPairingCode SyncPairingEnded
            SyncJoinForm SyncPairedPanel
  tag/      TagChip TagManagerDialog DynamicTagRow ProjectFilters
  ui/       shadcn primitives
```

Standalone components (`AppHeader`, `ConfirmDialog`, `FormattedTime`, …) stay at the root of `components/`. A family gets a folder once it has more than one file. Keep the name prefix inside the folder — `laps/LapItem.jsx`, not `laps/Item.jsx`.

**Sizing rule:** when a component passes ~150 lines, split it. Branches on mutually exclusive states (one per layout, one per pairing step) become one file each; state and handlers move to a `use*` hook in `src/hooks/`; pure helpers move to `src/lib/`, where they become testable.

### Data Layer

Persistence uses **Dexie** (IndexedDB wrapper) via `src/services/db.js`. There are two stores:

- `projects` — indexed by `id`, `completedAt`, `createdAt`
- `settings` — key/value store (e.g. `hourlyPrice`)

Repository modules wrap all DB access:

- `src/services/projectRepository.js` — CRUD, lap management, complete/reopen
- `src/services/settingsRepository.js` — get/set with defaults

Pages and hooks subscribe to live DB queries using `useLiveQuery` from `dexie-react-hooks`, so UI updates reactively when data changes.

### Gotchas

**Radix ScrollArea:** the viewport wraps its children in a div with an inline `display: table`, which sizes to max-content — `min-width: 100%` is only a floor. Anything inside then grows past the viewport instead of being clamped by it, so `truncate` never fires and content gets clipped at the edge. `src/components/ui/scroll-area.jsx` overrides it with `[&>div]:block!` (the `!important` is required to beat the inline style). This assumes vertical-only scrolling.

The scrollbar it draws is an overlay: `ScrollAreaScrollbar` sits absolutely positioned flush against the Root's own right edge, independent of the Viewport content's own padding — that's the deliberate choice for this app (touch-first, matches the auto-hiding indicator iOS/Android already use; a permanently reserved desktop-style gutter isn't the mobile pattern and just eats width). But a row with a right-edge floating element (the `FLOATING_MENU_BUTTON` pattern below) needs its own padding-right on the list content to clear the scrollbar's ~10-12px footprint, or the two overlap — see the `pr-3` on the laps list in `src/components/laps/Laps.jsx`. Any list inside a `ScrollArea` that also floats something at the trailing edge needs this.

**Truncating inside flex:** `truncate` is inert on a flex item without `min-w-0` — the item refuses to shrink past its longest word, pushing its siblings out of the row instead of ellipsising.

**Sonner toasts leak taps to whatever is under them.** A toast dismissed by swipe calls `deleteToast()` on `pointerup` — before the browser's synthetic `click`. The bar is `velocity > 0.11` px/ms (≈5px of finger drift in 40ms), and `touch-action: none` on the toast keeps the drift from becoming a scroll, so the click is never suppressed. The toast vanishes mid-gesture and the click lands on the element underneath. This shipped as a bug: the update prompt sat on top of `+ Novo projeto` on the home page and taps on it created projects. **Never place a toast over a tap target.** Persistent notices (`duration: Infinity`) belong in the document flow, not in a toast — see `UpdateBanner`.

**The timer page reserves a band for the toast; the list does not.** The `Toaster` is pinned flush under the `h-16` header, and the timer stages keep `TOAST_BAND` (`src/components/timer/stageLayout.js`) clear so a toast never covers the timer — there is no spare height there, and a tap that dismisses a toast falls through to whatever is beneath it. Three things are coupled and have to move together: the `Toaster` offset in `App.jsx`, the toast's size in `globals.css` (`.cn-toast` — the extra attribute selectors are needed to beat Sonner's runtime-injected rule), and the band itself. `TIMER_GAP` matches the band so the timer reads as evenly spaced.

The project list opts out: it scrolls, so covering a row costs nothing and reserving space at the top just looks like a hole. Its undos pass `UNDO_ON_LIST` (`src/lib/undoToast.js`) and land at the bottom instead. Deleting a project from the project page counts as one of these — that toast fires after `navigate("/")`, so it appears on the list.

The toast is 44px: 10px padding around a 24px `h-6` action button. `min-height` holds that floor for toasts without a button, which would otherwise be a text line tall and read as a different component. Don't shrink the toast to fit the band — the band exists to clear the toast, so it's the band that follows. The title is clamped to one line (`nowrap` + ellipsis, with `min-width: 0` on `[data-content]` so the text shrinks instead of shoving the action button out): a second line would outgrow the band and land back on top of content.

**Radix menus open on `pointerdown`, so a scroll gesture that starts on the trigger opens them.** On mobile, a finger landing on a `⋮` inside a scrolling list and dragging opens the menu mid-drag — and because `DropdownMenu` is modal by default, it mounts `RemoveScroll` and sets `pointer-events: none` on the body, so the row scrolls away and the list freezes with the menu stranded on it. `useTapOnlyDropdown` (`src/hooks/useTapOnlyDropdown.js`) moves the open to `click`: `preventDefault()` on the trigger's `pointerdown` suppresses Radix's own handler (its `composeEventHandlers` skips the internal handler once the event is prevented), and the `onClick` toggles instead. The browser never fires a `click` after a gesture turns into a scroll, so the accidental open stops existing rather than being undone. **Any dropdown inside a scroller needs this hook.**

Keep `modal` at its default. An earlier fix used `modal: false` plus `onPointerCancel` to close the menu back after the fact; it worked, but non-modal means a tap outside closes the menu _and_ lands on what's under it — tapping another `ProjectCard` navigated. That trade-off is unnecessary: once the menu only opens on a deliberate tap, the scroll lock never fires during a scroll, and modal buys back the outside-tap guard.

**`:active`/`:hover` hit-test geometrically and ignore `stopPropagation`.** `ProjectCard` used to wrap the whole row — including the menu button — in a `<Link>` carrying `hover:bg-accent active:bg-accent/80`. Any press inside that box put the anchor in `:active`, menu button included, since the browser matches the pseudo-class by pointer position, not by which JS handler ran. Deferring the open from `pointerdown` to `click` (above) made this worse, not better: the anchor now sits `:active` for the whole press-and-hold instead of for one frame, so the entire card visibly flashed on every menu tap.

The fix is structural, not another `stopPropagation`: the `Link` is a _stretched link_ — an `absolute inset-0` sibling of `CardContent`, not its wrapper, so the menu button is never a descendant of it and can never trigger its `:active`. `CardContent` carries `pointer-events-none` so a tap on empty row space (name, time, padding) falls through to the link underneath and still navigates; the trigger button opts back in with `pointer-events-auto` so it keeps intercepting its own taps. Because the link no longer wraps any text, it needs an explicit `aria-label={project.name}` — a `<Link>` with no accessible name is silent to a screen reader. Any card that mixes a full-row link with an interior interactive control should use this shape, not `Link` as the wrapper. `src/lib/floatingMenuLayout.js` holds the floating button's shared classes (`FLOATING_MENU_BUTTON`, `FLOATING_MENU_MIN_HEIGHT`, `CLEARS_FLOATING_MENU`) — `ProjectCard` and `LapCard` both consume it, so the button's reach and the row's clearance can't drift out of sync between the two.

**Content that swaps above the laps has to reserve the tallest state's footprint.** The timer stage swaps the plain timer for the adjuster in place; the adjuster is always taller (its steppers outgrow the digits), so the section grew on open and the laps below shifted down and lost height. The fix is a reservation, not a tweak: `AdjusterFrame` owns the arrangement, `TimerAdjuster` fills it with the steppers, and `TimerAdjustSlot` renders the same frame with the chrome veiled (`visibility: hidden` keeps the box while dropping it from the tab order and the a11y tree) around the plain timer. Because the real timer sits in the frame's own display slot, the digits land on the same pixel in both states — an `absolute`-centred overlay would have re-centred them.

Hand-sizing the reservation can't work, the same reason `TimerSlot` gives: the `row` layout's height rides the display's viewport clamp and the `flank` one rides the stepper metrics. Reserve by rendering the real thing invisibly. `MinimalStage` deliberately opts out — nothing sits below its timer to be pushed around, and a split-screen stage can't spare the height. The side controls follow the same rule from the other end — `AdjustActions` mirrors `TimerControls`' sizes, gaps and orientation so the column never resizes either.

**jsdom resolves no stylesheet.** `getComputedStyle(el).position` returns `static` for `class="fixed"`, so layout assertions written that way pass unconditionally. Assert on `className`, or test the behaviour some other way. Same trap for any Tailwind-driven computed style.

**`window.location` is `[Unforgeable]` in jsdom.** `vi.spyOn(window.location, "replace")` throws `Cannot redefine property`. Extract the URL logic into a pure helper in `src/lib/` and test that instead — `lib/updateSimulation.js` is the worked example.

### Key Patterns

**Stopwatch state** is stored as a plain object inside each project record:

```js
{ isRunning, startTimestamp, totalTime, laps: [] }
```

Time is computed on the fly from `startTimestamp` (no stored elapsed during running) — see `calculateTotalTime` / `calculateSplitTime` in `src/lib/stopwatch.js`.

**`useProject` hook** (`src/hooks/useProject.js`) drives the project detail page: subscribes to live DB data, runs a `requestAnimationFrame` loop to update display time while running, and exposes start/pause/reset/toggle/addLap/rename/deleteProject/renameLap/deleteLap.

**`useAutoPause`** auto-pauses on `pagehide` and on `visibilitychange` (mobile only), ensuring time isn't counted when the app is backgrounded.

**Routing:** Uses React Router v7. Navigation via `useNavigate()`, params via `useParams()`, links via `<Link to="...">`.

**Path Alias:** Use `@/` to import from `src/` (e.g., `import { useProject } from "@/hooks/useProject"`).

**Font:** IBM Plex Sans loaded via `@fontsource/ibm-plex-sans` (offline-first, no Google Fonts CDN).

**Update prompt:** `registerType: "prompt"`, so `UpdateBanner` is the only path to a new version. It renders above the `<Outlet />` in `App.jsx` and pushes the page down — the shell is `flex flex-col` with the outlet in `flex-1 min-h-0` so `PageContainer`'s `h-full` does not overflow. Append `?swupdate` to any route to force it on **in dev only** (`src/lib/updateSimulation.js`); it bypasses `useRegisterSW`, so it proves nothing about the real service-worker plumbing — verify that with `build` + `preview` + a rebuild.

**Web manifest** is the hand-written `apps/web/public/manifest.json`. `VitePWA` runs with `manifest: false`: left on, it emits a second `manifest.webmanifest` built from `package.json` defaults and links it next to the real one.

**Pairing flow** is the pure reducer in `src/lib/pairingFlow.js`; `usePairing` wraps it with the network calls and `SyncCard` picks one screen component per state. The device showing a code polls `/pair/status` and moves on by itself when the other one joins, so no screen asks the user to confirm the pairing. The issued code is stored under `PENDING_PAIRING_KEY`: a host that leaves Settings before the other device joins would otherwise never learn it was paired. `SyncStatusProvider` feeds that row back as the reducer's initial state.

**Paired is a local marker** (`SYNC_PAIRED_KEY` in the `internal` store), set when `/pair/join` succeeds or when `/pair/status` answers `joined`. It carries no authority: what the API checks is the device credential (see Device credential under apps/api). `deviceService.getDeviceCredential()` builds it from the device id and the device secret, both created on first use by `internalRepository.getOrCreate`. That runs in one Dexie transaction, so two callers racing on first load cannot mint two secrets.

The device secret MUST never be replaced or deleted, not even on unpair or when the pairing is revoked. The server keeps the first secret it sees for a device id and refuses any other, so a device that lost its secret could never use that id again. Backups export `projects` and `settings` only, so the secret never leaves the device.

A 401 from `/sync/*` drops the marker and sets `SYNC_REVOKED_KEY`. There is nothing to refresh and no retry.

Pairing and sync failures render inside the card. Toasts are kept for the two confirmations that have no other trace on screen ("Código copiado", "Pareado com sucesso").

The device count is refetched whenever `lastSyncedAt` changes. A device joining the group never flips `isPaired` on the others, so keying the fetch on `isPaired` alone left the old count on screen.

**Sync payload limits** live in `packages/shared/src/constants.js`. The push schema rejects anything above them, so the client MUST enforce the same numbers: a record over a limit fails every push and sync stalls for good. A new user-editable text field needs a `maxLength` from there, and a new list that grows without bound needs a cap in its repository. `syncManager` already splits pushes into batches of `MAX_PUSH_PROJECTS`.

Backup import is the other way a record enters IndexedDB without passing through a repository. `backupService.parseBackup` runs each record through `projectSchema` and `settingSchema` and hands on Zod's output, so the file is refused before anything is written and undeclared keys are dropped. A field added to the local record MUST be added to the shared schema too, or import silently loses it (the round-trip test in `backupService.test.js` catches that).

**Content-Security-Policy** is set in `apps/web/vercel.json` and only applies on Vercel. Dev and tests never see it, so a new external origin (API host, font, image) passes locally and gets blocked in production. Add it to the matching directive in the same change. `style-src` keeps `'unsafe-inline'` because Radix, Sonner and the PiP window inject `<style>` tags.

## apps/api

Hono API backing project sync/pairing: pairing codes, device credentials, sync endpoints, plus a `/health` check. Runs on port 3001 via `@hono/node-server`.

### Database (Postgres + Drizzle)

Schema lives in `src/db/schema.js`. The connection in `src/db/index.js` uses a **single `DATABASE_URL` env var** with the full connection string (don't split it into separate pieces like `PGHOST`/`PGUSER`/...). Reason: this is the Postgres ecosystem's standard (drivers, drizzle-kit, hosting), it avoids duplicating URL-assembly logic across the codebase, and keeps SSL/channel-binding embedded in the string itself.

In production (Vercel), `DATABASE_URL` is the Neon connection string (use the `-pooler` host variant — a pooled connection, recommended for serverless).

`src/lib/databaseTarget.js` refuses a loopback host under `NODE_ENV=production`: the dev user and password are versioned (`docker-compose.yml`, `.env.example`, `test/databaseUrl.js`), so production MUST NOT run on the database they open. Its messages name the host only, never the whole URL, which carries the password.

### Migrations (Drizzle)

Schema changes go through versioned migrations in `apps/api/drizzle/`, committed to git.

1. Edit `src/db/schema.js`.
2. Run `npm run db:generate --workspace=apps/api -- --name <what_changed>` and review the SQL.
3. Run `npm run db:migrate --workspace=apps/api` against the target `DATABASE_URL`.

Production runs `db:migrate` manually from local, pointed at Neon, **before** deploying the
API that needs it. Each migration MUST stay compatible with the API version already live.

`db:push` is gone on purpose: in production it can propose a `DROP` on a renamed column and
lose data. Never reintroduce it.

`0000_baseline` is the schema that existed before migrations. Databases created by the old
`push` MUST be marked as already holding it (one row in `drizzle.__drizzle_migrations` with
the file's SHA-256 and the journal's `when`) instead of running it.

Tests drop and recreate `cronoz_test` on every run and build it with the same migrator, so
a broken migration fails the suite.

**Neon branches:** a single `main` branch for production. Vercel Production points to it. No separate preview/staging branch for now — a personal project doesn't justify one.

### Tests

`npm test --workspace=apps/api` runs against a real Postgres. Its `pretest` runs
`docker compose up -d --wait`, so Docker MUST be running. Without it no API test runs,
including the pure `src/lib` ones: `pretest` fails before Vitest starts.

The test connection string lives only in `apps/api/test/databaseUrl.js`.
`vitest.config.js` and `test/globalSetup.js` import it.

Route tests share `apps/api/test/pairingFixtures.js` (device ids and secrets, `credentialOf`,
`post`, `initiate`, `join`, `pair`) and `test/projectFixtures.js` (`makeProject`). Import from
there instead of redefining them per file. Sync tests are split by endpoint (`syncPush`, `syncPull`,
`syncDevices`) to stay under the 500-line ceiling.

### Secret scan

The `secrets` job in `.github/workflows/ci.yml` runs gitleaks over the pushed commits.
`.gitleaks.toml` extends the default rules and allowlists the JWT-shaped test fixtures by
their exact shape. A new fixture that looks like a credential needs an entry there. Keep each
entry as narrow as the string itself: a path-wide exception would hide a real key committed
to the same file.

To scan the whole history locally:
`docker run --rm -v "$PWD":/repo:ro ghcr.io/gitleaks/gitleaks:v8.30.1 git /repo -c /repo/.gitleaks.toml --redact`

### CORS allowlist

`src/lib/corsOrigins.js` turns `CORS_ALLOWED_ORIGINS` into the array Hono's `cors` matches
against. Entries MUST be bare origins: a trailing slash or a path never matches the
browser's `Origin` header, so boot rejects them and names the corrected value.

An empty list aborts boot under `NODE_ENV=production` and falls back to
`http://localhost:5173` elsewhere. Vercel MUST have the variable set before a deploy.

### Device credential

Every request carries `Authorization: Bearer <deviceId>.<secret>`, the pairing routes
included (`packages/shared/src/deviceCredential.js`). The device generates the secret (32
random bytes, hex) and the server stores only its SHA-256 in `devices.secret_hash`
(`src/lib/deviceSecret.js`). Nothing is issued, refreshed or expired.

A device id alone proves nothing: only the secret a device registered speaks for it, on
`/sync/*` and `/pair/*` alike. A device id sent in a body is ignored.

- 401 `missing_device_credential`: no header, or a bearer that is not a credential.
- 401 `invalid_device_credential`: a known device with another secret and, on `/sync/*`, a
  device the server has never seen.

The pairing routes register an unknown device with the secret it presents, so a first
`/pair/initiate` or `/pair/join` needs no earlier step.

The secret MUST NOT appear in an exception message or a log line. This is the one exception
to the "include the offending value" rule in Code Style.

### Revocation

`authMiddleware` looks the device up on every authenticated request, so deleting a
`devices` row is the way to revoke access.

The web client needs no special case: the next sync gets 401, drops its paired marker and
sets `SYNC_REVOKED_KEY`, which the sync card turns into a notice until the device pairs
again or unpairs. It keeps its secret and presents the same one when it pairs again.

### Cross-group writes

Project ids come from the client, so two groups can present the same one. The group check
MUST sit in the write itself (`setWhere` in `src/lib/projectUpsert.js`). A SELECT before
the upsert misses a row another group commits in between, and the upsert then overwrites
it. `/sync/push` still answers 409 `project_belongs_to_other_group`, read after the write:
`ON CONFLICT DO UPDATE` locks the conflicting row even when its `WHERE` rejects the update.

A new synced table keyed by a client-generated id needs the same condition.

### Pairing brakes

`/pair/initiate` and `/pair/join` are anonymous and Vercel Hobby has no firewall rate limit,
so the brakes live in Postgres and are global: there is no caller identity to meter.

- **Wrong codes:** a failed `/join` adds 1 to `failed_joins` on every live code, and a code
  dies at `PAIRING_CODE_MAX_FAILED_JOINS`. The host generates a new one to recover.
- **New groups:** `/initiate` answers 429 `too_many_new_groups` once
  `MAX_NEW_GROUPS_PER_HOUR` groups exist from the last hour. A device that already has a
  group is never refused.
- **Cleanup:** every `/initiate` runs `purgeAbandonedGroups` (`src/lib/groupQuota.js`). It
  deletes groups older than 24h with at most one device, no projects, no settings and no live
  code. There is no cron. A table that hangs off `sync_groups` and holds user content MUST be
  added to that check, or the purge deletes it by cascade.
- **Rejoin:** a device that generated a code and then joins another group leaves its own
  behind. `/join` deletes it through `discardUnusedGroup` when it has no other device, no
  projects and no settings, and answers 409 `device_already_paired` otherwise. Same check
  as the purge, without the 24h wait.

### Pairing status

`POST /pair/status` tells the device that generated a code whether it is `waiting`,
`joined`, `expired` or `burned`. The lookup demands the code AND the device that generated
it: by code alone it would answer whether any code exists without tripping the wrong-code
brake. An unknown pair answers `expired`, same as a real expired code. The device proves
itself with its credential like on any other route.

## Project Vision

See `docs/IDEA.md` for the project's ideas, requirements, and direction. Consult it whenever needed to align decisions with the product vision. Whenever a decision in conversation changes something related to the product vision (scope, features, stack, priorities), ask the user whether `docs/IDEA.md` should be updated.

## Conventions

### Commit Convention

This project enforces Conventional Commits via commitlint (husky hook). Use `git commit` directly with a properly formatted message (feat:, fix:, refactor:, etc.). Commit messages are always in English, even when the conversation is in another language.

Most commits need only a subject line. Add a body only when it carries something the diff can't show — the why, a trade-off, a gotcha — and keep it as short as possible; never restate what changed. Same test as code comments (see Comments below): if the diff already shows it, don't write it.

### Code Style

- Functions: 4-20 lines. Split if longer.
- Files: under 500 lines as a hard ceiling. Components keep the tighter ~150-line rule from the apps/web Code Organization section above — split those earlier; hooks/services/lib files can run up to the 500-line ceiling.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`. Prefer names that return <5 grep hits in the codebase.
- Types: this codebase is plain JS (no TypeScript), so there's no compiler to enforce this — the equivalent is explicit, destructured signatures over vague `props`/`options` catch-alls; if TypeScript is ever adopted, no `any`, no untyped functions.
- No code duplication. Extract shared logic into a function/module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages must include the offending value and expected shape.
- Dependencies: inject through constructor/parameter, not global/import; wrap third-party libs behind a thin interface owned by this project.
- Structure: predictable paths (`pages/` `components/` `hooks/` `lib/` `services/` on the web, `src/db` + routes on the API) — see the apps/web and apps/api sections above for the actual layout.
- Formatting: use the project's formatter/linter (`npm run lint`, `npm run lint:check`). Don't discuss style beyond that.
- Logging: structured JSON for debugging/observability; plain text only for user-facing CLI output.

### Comments

Short sentences. RFC 2119 keywords for obligations. Commit = imperative subject; body only for a fact the diff cannot show. Comments only where code needs clarification — never narration; write WHY, not WHAT (skip `// increment counter` above `i++`). Keep existing comments on refactor — don't strip them, they carry intent and provenance the diff won't restate.

Comments are in English, like commit messages, even when the conversation is in another language. This covers `.env.example` and any other versioned config.

## Working Methodology (Senior Agile Vibe Coding)

This project follows the Senior Agile Vibe Coding methodology — software engineering applied to AI-assisted development, focused on building resilient production software.

### Pair Programming

Claude is the driver, the user is the navigator/architect. Before making large code changes:

1. Describe the plan clearly
2. Wait for user confirmation before proceeding
3. Small, localized changes can be made directly

**Never launch the dev server or verify a UI change yourself** (no autonomous browser/screenshot checks). The user runs the app and looks at it themselves. Ask them to check and send a screenshot when visual verification is needed.

### Test-Driven Development (TDD)

- Every new feature must ship with unit tests
- Every bug fix requires a regression test to prevent recurrence
- Write the test before the implementation when possible (red → green → refactor)
- Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs
- Tests must be F.I.R.S.T: fast, independent, repeatable, self-validating, timely

### Small Releases

- Work in independent, functional increments
- Every commit should be functional, pass CI, and be production-ready
- Avoid large commits that mix multiple responsibilities

### Continuous Refactoring

- If a file starts growing too large or accumulating responsibilities, suggest extracting components or hooks immediately
- Don't let technical debt accumulate — address it as soon as it's identified

## Living Document

This CLAUDE.md is a living document. Whenever we hit a recurring technical obstacle or settle on a new design pattern, document it here to preserve context for future sessions.
