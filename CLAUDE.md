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
    api/     — Hono API (minimal skeleton, for future sync)
  packages/  — Shared packages (created when needed)
```

## apps/web

PWA multi-project stopwatch built with Vite, React 19, and React Router. Users can create named projects, each with its own independent stopwatch and lap tracking.

### Routes

- `/` (`src/pages/Home.jsx`) — Lists all projects (active and completed). Handles project creation, completion, and reopening.
- `/project/:id` (`src/pages/ProjectPage.jsx`) — Individual project view with stopwatch controls, lap tracking, and rename/delete.

### Code Organization

- `src/pages/` — Route components (Home, ProjectPage)
- `src/components/` — Presentational React components
- `src/hooks/` — Custom React hooks (`useProject`, `useAutoPause`, `useKeyboardShortcuts`, `useInstallPrompt`)
- `src/lib/` — Pure utility functions (`stopwatch.js`: time calculation and formatting)
- `src/services/` — Data access layer (Dexie/IndexedDB wrappers)
- `src/main.jsx` — Entry point with React Router setup
- `src/App.jsx` — Root layout with `<Outlet />`

Components are grouped by family in subfolders, each with its own `__tests__/`:

```
components/
  laps/     Laps LapItem LapCard LapName LapNameForm LapTime LapMenu
  timer/    TimerStage {Minimal,Inline,Stacked}Stage TimerDisplay TimerMeta
            RunningIndicator TimerControls TimerAdjuster StepGroup AdjustActions
  pip/      PiPContent PiPTimer PiPIdleView PiPLapView PiPDiscardView PiPPlaceholder
  project/  ProjectCard ProjectHeader ProjectTitle ProjectMenu ProjectRenameActions
  sync/     SyncCard SyncPairingCode SyncPairingStart SyncJoinForm SyncPairedPanel
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

**Truncating inside flex:** `truncate` is inert on a flex item without `min-w-0` — the item refuses to shrink past its longest word, pushing its siblings out of the row instead of ellipsising.

**Sonner toasts leak taps to whatever is under them.** A toast dismissed by swipe calls `deleteToast()` on `pointerup` — before the browser's synthetic `click`. The bar is `velocity > 0.11` px/ms (≈5px of finger drift in 40ms), and `touch-action: none` on the toast keeps the drift from becoming a scroll, so the click is never suppressed. The toast vanishes mid-gesture and the click lands on the element underneath. This shipped as a bug: the update prompt sat on top of `+ Novo projeto` on the home page and taps on it created projects. **Never place a toast over a tap target.** Persistent notices (`duration: Infinity`) belong in the document flow, not in a toast — see `UpdateBanner`.

**Toasts land in a reserved band, not over content.** The `Toaster` is pinned flush under the `h-16` header, and every page keeps `TOAST_BAND` (`src/lib/toastBand.js`) clear below its own header so nothing sits under a toast. Three things are coupled and have to move together: the `Toaster` offset in `App.jsx`, the toast's size in `globals.css` (`.cn-toast` — the extra attribute selectors are needed to beat Sonner's runtime-injected rule), and the band itself. The timer stages also match `TIMER_GAP` to the band so the timer reads as evenly spaced.

The toast is 56px: Sonner's 16px padding around a 24px `h-6` action button. `min-height` holds that floor for toasts without a button, which would otherwise be a 20px text line tall and read as a different component. Don't shrink the toast to fit the band — the band exists to clear the toast, so it's the band that follows. The title is clamped to one line (`nowrap` + ellipsis, with `min-width: 0` on `[data-content]` so the text shrinks instead of shoving the action button out): a second line would outgrow the band and land back on top of content.

**Radix menus open on `pointerdown`, so a scroll gesture that starts on the trigger opens them.** On mobile, a finger landing on a `⋮` inside a scrolling list and dragging opens the menu mid-drag — and because `DropdownMenu` is modal by default, it mounts `RemoveScroll` and sets `pointer-events: none` on the body, so the row scrolls away and the list freezes with the menu stranded on it. `useScrollSafeDropdown` (`src/hooks/useScrollSafeDropdown.js`) is the fix, and both halves are load-bearing: `modal: false` so nothing locks the scroll, and `onPointerCancel` on the trigger to close the menu back. The browser fires `pointercancel` on the element that got the `pointerdown` the moment the scroller claims that touch, and a real tap never fires it. The order matters — while the menu was modal, `RemoveScroll` blocked the `touchmove`, the gesture never became a scroll, and `pointercancel` never fired at all. **Any dropdown inside a scroller needs this hook.** Trade-off: without modal, a tap outside closes the menu _and_ reaches what's under it — on the home page that means tapping another `ProjectCard` also navigates.

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

## apps/api

Minimal Hono API with a `/health` endpoint. Runs on port 3001 via `@hono/node-server`. Will be expanded when sync/pairing feature is implemented.

### Database (Postgres + Drizzle)

Schema fica em `src/db/schema.js`. Conexão em `src/db/index.js` usa **uma única env var `DATABASE_URL`** com a connection string completa (não quebrar em peças separadas tipo `PGHOST/PGUSER/...`). Motivo: é o padrão do ecossistema Postgres (drivers, drizzle-kit, hosting), evita duplicação na hora de montar URL em vários lugares e mantém SSL/channel-binding embutidos na própria string.

Em produção (Vercel), o `DATABASE_URL` é o connection string do Neon (use a variante com `-pooler` no host — pooled connection, recomendada para serverless).

### Migrations (Drizzle)

**Estado atual:** o projeto usa `drizzle-kit push` (sincroniza `schema.js` → banco direto, sem arquivos versionados). A pasta `apps/api/drizzle/` não existe.

- **Pra dev local:** `npm run db:push --workspace=apps/api` aplica o schema no Postgres local.
- **Pra primeiro deploy (banco vazio):** rodar `db:push` apontando o `DATABASE_URL` pra branch de produção do Neon. Funciona porque não há dados nem histórico de schema.

**Quando mudar schema novamente, migrar pra migrations versionadas antes de aplicar:**

1. Adicionar script `db:migrate` em `apps/api/package.json` que invoca `drizzle-orm/migrator` apontando pra `./drizzle`.
2. Criar `src/db/migrate.js` (script standalone que lê `DATABASE_URL` e roda o migrator).
3. Rodar `npm run db:generate --workspace=apps/api` (gera SQL files em `apps/api/drizzle/`).
4. Versionar a pasta `drizzle/` no git.
5. Em prod, rodar `db:migrate` manualmente do local apontado pro Neon (uso pessoal, projeto pequeno — não justifica CI de migrations).

**Regra:** depois que houver migrations versionadas, **nunca mais usar `db:push` em produção** — só `db:migrate`. Push é OK em dev local, mas em prod ele pode propor `DROP` em colunas renomeadas e perder dados.

**Branches do Neon:** uma branch só (`main`) para produção. Vercel Production aponta pra ela. Sem branch separada de preview/staging por enquanto — projeto pessoal não justifica.

## Project Vision

Consulte `docs/IDEA.md` para entender as ideias, requisitos e direção do projeto. Esse documento deve ser consultado sempre que necessário para alinhar decisões com a visão do produto. Sempre que uma decisão na conversa alterar algo relacionado à visão do produto (escopo, funcionalidades, stack, prioridades), pergunte ao usuário se deve atualizar o `docs/IDEA.md`.

## Commit Convention

This project enforces Conventional Commits via commitlint (husky hook). Use `git commit` directly with a properly formatted message (feat:, fix:, refactor:, etc.).

## Metodologia de Trabalho (Senior Agile Vibe Coding)

Este projeto segue a metodologia Senior Agile Vibe Coding — Engenharia de Software aplicada à IA, com foco em construir software de produção resiliente.

### Pair Programming

Claude é o piloto, o usuário é o navegador/arquiteto. Antes de executar mudanças grandes no código:

1. Descrever o plano de ação com clareza
2. Aguardar confirmação do usuário antes de prosseguir
3. Mudanças pequenas e localizadas podem ser feitas diretamente

### Test-Driven Development (TDD)

- Toda nova funcionalidade deve vir acompanhada de testes unitários
- Toda correção de bug exige um teste de regressão para evitar reincidência
- Escrever o teste antes da implementação quando possível (red → green → refactor)

### Small Releases (Commits Curtos)

- Trabalhar em incrementos funcionais e independentes
- Cada commit deve ser funcional, passar no CI e ser production-ready
- Evitar commits grandes que misturam múltiplas responsabilidades

### Refactoring Contínuo

- Se um arquivo começar a crescer demais ou acumular responsabilidades, sugerir extração de componentes ou hooks imediatamente
- Não deixar dívida técnica se acumular — tratar no momento em que for identificada

## Living Document

Este CLAUDE.md é um documento vivo. Sempre que encontrarmos um obstáculo técnico recorrente ou definirmos um novo padrão de design, ele deve ser documentado aqui para preservar o contexto em sessões futuras.
