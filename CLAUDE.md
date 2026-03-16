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
npm run commit       # Create commit using Conventional Commits (use this instead of git commit)
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
- `src/components/` — Presentational React components (`TimerDisplay`, `TimerControls`, `Laps`, `FormattedTime`, `InstallBanner`)
- `src/hooks/` — Custom React hooks (`useProject`, `useAutoPause`, `useKeyboardShortcuts`, `useInstallPrompt`)
- `src/lib/` — Pure utility functions (`stopwatch.js`: time calculation and formatting)
- `src/services/` — Data access layer (Dexie/IndexedDB wrappers)
- `src/main.jsx` — Entry point with React Router setup
- `src/App.jsx` — Root layout with `<Outlet />`

### Data Layer

Persistence uses **Dexie** (IndexedDB wrapper) via `src/services/db.js`. There are two stores:

- `projects` — indexed by `id`, `completedAt`, `createdAt`
- `settings` — key/value store (e.g. `hourlyPrice`)

Repository modules wrap all DB access:

- `src/services/projectRepository.js` — CRUD, lap management, complete/reopen
- `src/services/settingsRepository.js` — get/set with defaults

Pages and hooks subscribe to live DB queries using `useLiveQuery` from `dexie-react-hooks`, so UI updates reactively when data changes.

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

## apps/api

Minimal Hono API with a `/health` endpoint. Runs on port 3001 via `@hono/node-server`. Will be expanded when sync/pairing feature is implemented.

## Project Vision

Consulte `docs/IDEA.md` para entender as ideias, requisitos e direção do projeto. Esse documento deve ser consultado sempre que necessário para alinhar decisões com a visão do produto. Sempre que uma decisão na conversa alterar algo relacionado à visão do produto (escopo, funcionalidades, stack, prioridades), pergunte ao usuário se deve atualizar o `docs/IDEA.md`.

## Commit Convention

This project enforces Conventional Commits via commitlint. Always use `npm run commit` for interactive commit creation with proper format (feat:, fix:, refactor:, etc.).

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
