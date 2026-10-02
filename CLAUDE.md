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
  sync/     SyncCard SyncIndicator SyncPairingCode SyncPairingStart SyncJoinForm SyncPairedPanel
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

**Sync payload limits** live in `packages/shared/src/constants.js`. The push schema rejects anything above them, so the client MUST enforce the same numbers: a record over a limit fails every push and sync stalls for good. A new user-editable text field needs a `maxLength` from there, and a new list that grows without bound needs a cap in its repository. `syncManager` already splits pushes into batches of `MAX_PUSH_PROJECTS`.

**Content-Security-Policy** is set in `apps/web/vercel.json` and only applies on Vercel. Dev and tests never see it, so a new external origin (API host, font, image) passes locally and gets blocked in production. Add it to the matching directive in the same change. `style-src` keeps `'unsafe-inline'` because Radix, Sonner and the PiP window inject `<style>` tags.

## apps/api

Hono API backing project sync/pairing: pairing codes, JWT auth, sync endpoints, plus a `/health` check. Runs on port 3001 via `@hono/node-server`.

### Database (Postgres + Drizzle)

Schema lives in `src/db/schema.js`. The connection in `src/db/index.js` uses a **single `DATABASE_URL` env var** with the full connection string (don't split it into separate pieces like `PGHOST`/`PGUSER`/...). Reason: this is the Postgres ecosystem's standard (drivers, drizzle-kit, hosting), it avoids duplicating URL-assembly logic across the codebase, and keeps SSL/channel-binding embedded in the string itself.

In production (Vercel), `DATABASE_URL` is the Neon connection string (use the `-pooler` host variant — a pooled connection, recommended for serverless).

### Migrations (Drizzle)

**Current state:** the project uses `drizzle-kit push` (syncs `schema.js` → database directly, no versioned migration files). The `apps/api/drizzle/` folder does not exist.

- **Local dev:** `npm run db:push --workspace=apps/api` applies the schema to the local Postgres.
- **First deploy (empty database):** run `db:push` pointed at the Neon production branch's `DATABASE_URL`. This works because there's no data or schema history yet.

**Next time the schema changes, switch to versioned migrations before applying it:**

1. Add a `db:migrate` script to `apps/api/package.json` that invokes `drizzle-orm/migrator` pointed at `./drizzle`.
2. Create `src/db/migrate.js` (a standalone script that reads `DATABASE_URL` and runs the migrator).
3. Run `npm run db:generate --workspace=apps/api` (generates SQL files in `apps/api/drizzle/`).
4. Commit the `drizzle/` folder to git.
5. In production, run `db:migrate` manually from local, pointed at Neon (personal project, small scale — doesn't justify migration CI).

**Rule:** once versioned migrations exist, **never use `db:push` in production again** — only `db:migrate`. Push is fine in local dev, but in production it can propose a `DROP` on renamed columns and lose data.

**Neon branches:** a single `main` branch for production. Vercel Production points to it. No separate preview/staging branch for now — a personal project doesn't justify one.

### Tests

`npm test --workspace=apps/api` runs against a real Postgres. Its `pretest` runs
`docker compose up -d --wait`, so Docker MUST be running. Without it no API test runs,
including the pure `src/lib` ones: `pretest` fails before Vitest starts.

The test connection string lives only in `apps/api/test/databaseUrl.js`.
`vitest.config.js`, `drizzle.test.config.js` and `test/globalSetup.js` import it.

Route tests share `apps/api/test/pairingFixtures.js` (device ids, `post`, `initiate`, `pair`,
`tokenFor`) and `test/projectFixtures.js` (`makeProject`). Import from there instead of
redefining them per file. Sync tests are split by endpoint (`syncPush`, `syncPull`,
`syncDevices`) to stay under the 500-line ceiling.

### CORS allowlist

`src/lib/corsOrigins.js` turns `CORS_ALLOWED_ORIGINS` into the array Hono's `cors` matches
against. Entries MUST be bare origins: a trailing slash or a path never matches the
browser's `Origin` header, so boot rejects them and names the corrected value.

An empty list aborts boot under `NODE_ENV=production` and falls back to
`http://localhost:5173` elsewhere. Vercel MUST have the variable set before a deploy.

### Token revocation

`authMiddleware` looks the device up on every authenticated request and answers 401 when
the row is gone or sits in another sync group than the token claims. Deleting a `devices`
row is therefore the way to revoke access; the JWT itself carries no revocation state.

The web client needs no special case: `callAuthed` retries through `/pair/token` on 401,
gets 404 for a removed device and drops its local token.

### JWT secret guard

`src/lib/jwtSecret.js` aborts boot when `JWT_SECRET` is missing, is a known placeholder
(`dev-secret-change-me`, `test-secret`, `changeme`), or is shorter than 32 characters
under `NODE_ENV=production`. Short secrets stay legal in dev.

Exception messages MUST NOT include the secret; the length error reports the length only.
This is the one exception to the "include the offending value" rule in Code Style.

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
