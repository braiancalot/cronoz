# Cronoz

PWA offline-first para gerenciar múltiplos cronômetros de projetos de crochê. Cada projeto tem seu próprio cronômetro independente com controle de etapas (voltas).

## Stack

- **Monorepo** — Turborepo + npm workspaces
- **Frontend** (`apps/web`) — Vite + React 19 + React Router + Tailwind CSS 4
- **API** (`apps/api`) — Hono (serverless, para futura sincronização)
- **Persistência** — Dexie (IndexedDB), offline-first
- **PWA** — vite-plugin-pwa (Workbox)

## Estrutura

```
cronoz/
├── apps/
│   ├── web/     — SPA PWA (Vite + React Router)
│   └── api/     — API Hono (health check, futuro sync)
├── packages/    — Pacotes compartilhados (futuro)
├── turbo.json
└── package.json
```

## Desenvolvimento

```bash
npm install
npm run dev
```

- Web: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001)

## Scripts

| Comando                 | Descrição                                |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Inicia todos os apps em modo dev         |
| `npm run build`         | Build de produção                        |
| `npm run lint`          | ESLint em todos os workspaces            |
| `npm run lint:check`    | Verifica formatação (Prettier)           |
| `npm run test`          | Roda todos os testes                     |
| `npm run test:coverage` | Testes com cobertura                     |
| `npm run commit`        | Commit interativo (Conventional Commits) |

## Commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/). Use `npm run commit` para criar commits padronizados.
