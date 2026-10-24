# apps/web

PWA built with Vite, React 19 and React Router v7. Rules here apply on top of the root `CLAUDE.md`.

## Structure

| Route          | Page                     | What it does                                                         |
| -------------- | ------------------------ | -------------------------------------------------------------------- |
| `/`            | `pages/Home.jsx`         | Lists projects, creates, completes, reopens, deletes, filters by tag |
| `/project/:id` | `pages/ProjectPage.jsx`  | Stopwatch, laps, adjust, discard, real time, PiP                     |
| `/settings`    | `pages/SettingsPage.jsx` | Preferences, sync pairing, backup                                    |
| `/design`      | `pages/DesignPage.jsx`   | Design system showcase                                               |

- `components/`: presentational components, grouped by family in subfolders (`laps/`, `timer/`,
  `pip/`, `project/`, `sync/`, `tag/`, `ui/` for shadcn primitives), each with its own
  `__tests__/`. Standalone components stay at the root. A family gets a folder once it has more
  than one file. Keep the name prefix inside the folder: `laps/LapItem.jsx`, not `laps/Item.jsx`.
- `hooks/`: `use*` hooks. `providers/`: React context (`SettingsProvider`, `SyncStatusProvider`).
- `lib/`: pure functions, the first place logic goes so it can be tested.
- `services/`: IndexedDB repositories and the sync client.
- Import from `src/` through `@/` (`@/hooks/useProject.js`).

A component past ~150 lines gets split: branches on mutually exclusive states become one file each,
state and handlers move to a hook, pure helpers move to `lib/`.

## Data Layer

Dexie in `services/db.js` with three stores: `projects`, `settings` (key/value) and `internal`
(device identity and sync bookkeeping, never synced or exported). All access goes through the
repositories in `services/`. Pages and hooks read with `useLiveQuery`.

**Every stopwatch change is a pure transition** in `lib/stopwatchTransitions.js`. The hook and the
repository only call them, through `projectRepository.updateStopwatch(id, transform)`, which runs
the transform on the stored record inside a Dexie transaction, so a write built from a stale render
cannot undo another one. A transform that returns the same object writes nothing and returns
`null`; otherwise it returns `{ previous, next }`. A new stopwatch operation MUST be a transition
and MUST go through `updateStopwatch`.

The stored shape is `{ isRunning, startTimestamp, lastActiveAt, currentLapTime, laps, realTime,
editedTime }`. Elapsed time is never stored while running: `lib/stopwatch.js` computes it from
`startTimestamp`.

**Real time** (`lib/realTime.js`): `realTime` is how long the clock actually ran and `editedTime`
the net time added or removed by adjusts, discards and lap deletions. Every transition keeps
`sum(non-deleted lapTime) + currentLapTime === realTime + editedTime`. `getRealTimeStatus` reports:

- `untracked`: neither field exists. The project predates the feature and MUST stay that way.
- `inconsistent`: a field is missing or not a number, or the sum is broken (a write from an older
  build, or a bug).
- `tracked`: the invariant holds.

A discard's undo adds the amount back (`restoreDiscarded`) instead of restoring a snapshot, so a
run made in between survives. `realTime.property.test.js` drives random sessions with fast-check;
a new transition MUST be added to its `opArb`.

**Optimistic display.** Awaiting a Dexie write does not mean the screen has it: `useLiveQuery`
re-emits on a later tick. Every write the user watches holds an optimistic value until the live
query catches up, and a newer live record always wins over it. Use the existing mechanisms:
`useInlineRename` for names, the overrides in `Home.jsx` for cards and tags, `holdStopwatch` and
`showStopwatch` in `useProject` for the timer and laps, `useSetSetting` for settings. See
`docs/postmortem-live-query-flash.md`.

**Backup import** is the other way a record enters IndexedDB without a repository.
`backupService.parseBackup` runs each record through the shared schemas and keeps Zod's output, so
a bad file is refused before anything is written. Backups export `projects` and `settings` only.

## Sync Client

- **Pairing** is the pure reducer in `lib/pairingFlow.js`; `usePairing` adds the network calls and
  `SyncCard` renders one screen per state. The device showing a code polls `/pair/status` and moves
  on when the other one joins, so no screen asks for confirmation. The issued code is stored under
  `PENDING_PAIRING_KEY`, so a host that leaves Settings still learns it was paired.
- **Paired** is a local marker (`SYNC_PAIRED_KEY`) with no authority. What the API checks is the
  device credential that `deviceService.getDeviceCredential()` builds from the device id and secret,
  created once by `internalRepository.getOrCreate` in one transaction.
- **The device secret MUST never be replaced or deleted**, not on unpair, not on revocation. The
  server keeps the first secret it sees for a device id, so a device that lost it could never use
  that id again.
- **A 401 from `/sync/*`** drops the marker and sets `SYNC_REVOKED_KEY`. No refresh, no retry.
- **Failures render inside the sync card.** Toasts are only for "Código copiado" and "Pareado com
  sucesso", which leave no other trace on screen.
- **The device count** refetches whenever `lastSyncedAt` changes: a device joining never flips
  `isPaired` on the others.
- `syncManager` splits pushes into batches of `MAX_PUSH_PROJECTS`.

## PWA

- `registerType: "prompt"`: `UpdateBanner` is the only path to a new version. It sits above the
  `<Outlet />` in the document flow; the shell is `flex flex-col` with the outlet in
  `flex-1 min-h-0`. `?swupdate` forces it on in dev only (`lib/updateSimulation.js`) and bypasses
  `useRegisterSW`, so verify the real service worker with `build` + `preview` + a rebuild.
- The manifest is the hand-written `public/manifest.json`; `VitePWA` runs with `manifest: false`
  so it doesn't emit a second one.
- **Content-Security-Policy** lives in `vercel.json` and only applies on Vercel. A new external
  origin (API host, font, image) MUST be added to it in the same change, or production blocks it.
  `style-src` keeps `'unsafe-inline'` for the `<style>` tags Radix, Sonner and the PiP window
  inject.
- **Permissions-Policy** in the same file disables browser features by default. A feature the app
  starts using (the microphone for voice commands) MUST be allowed there with `(self)`, or
  production denies it while localhost works.
- Font: IBM Plex Sans from `@fontsource/ibm-plex-sans`, bundled for offline use.

## UI Rules

- No `ring-*`, no `focus-visible:ring`, no decorative `border-input`/`border-border`: separation
  comes from luminance.
- No `dvh`/`svh`/`lvh`: they misbehave on a PWA refresh on mobile. Use flex, `min-h-full`, rem/px.
- Prefer a native primitive or an established library over a hand-rolled one, and justify the
  choice.

## Gotchas

- **Never place a toast over a tap target.** A swipe-dismissed Sonner toast vanishes before the
  `click` and the tap lands underneath. Persistent notices go in the document flow
  (`UpdateBanner`). See `docs/postmortem-toast-tap-leak.md`.
- **The timer page reserves `TOAST_BAND` for the toast; the list does not.** The `Toaster` offset
  in `App.jsx`, `.cn-toast` in `globals.css` and `TOAST_BAND` in `components/timer/stageLayout.js`
  move together. The toast is 44px with a one-line title; the band follows the toast, never the
  reverse. List undos pass `UNDO_ON_LIST` (`lib/undoToast.js`) and land at the bottom.
- **Any dropdown inside a scroller needs `useTapOnlyDropdown`.** Radix opens menus on
  `pointerdown`, so a scroll that starts on the trigger opens them. Keep `modal` at its default.
  See `docs/postmortem-menu-opens-on-scroll.md`.
- **A full-row link next to an interior control is a stretched link**, an `absolute inset-0`
  sibling with an `aria-label`, never a wrapper: `:active` matches by pointer position and ignores
  `stopPropagation`. Shared classes live in `lib/floatingMenuLayout.js`. See
  `docs/postmortem-card-active-flash.md`.
- **Content that swaps above the laps reserves the tallest state's footprint** by rendering it
  invisibly (`TimerAdjustSlot`, `AdjusterFrame`), never by hand-sizing. `MinimalStage` opts out.
  See `docs/postmortem-adjuster-layout-shift.md`.
- **Radix `ScrollArea`** wraps children in `display: table`, which defeats `truncate`.
  `ui/scroll-area.jsx` overrides it with `[&>div]:block!` (vertical scrolling only). Its scrollbar
  is an overlay, so a list that floats a button at the trailing edge needs `pr-3` to clear it, as
  in `laps/Laps.jsx`.
- **`truncate` inside flex** needs `min-w-0` on the item.
- **jsdom resolves no stylesheet.** `getComputedStyle` returns defaults for Tailwind classes, so
  assert on `className` or on behaviour.
- **`window.location` is `[Unforgeable]` in jsdom**, so `vi.spyOn` on it throws. Put the URL logic
  in a pure `lib/` helper and test that (`lib/updateSimulation.js`).
