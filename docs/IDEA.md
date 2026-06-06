# Cronoz - Ideias do Projeto

## O Problema

Minha esposa trabalha com crochê e lida com várias peças ao mesmo tempo. Para controlar o tempo de cada peça, ela precisa criar cronômetros em diferentes apps e lugares. O Cronoz centraliza tudo em uma aplicação só — simples, offline e instalável no celular.

## Requisitos Principais

- Múltiplos cronômetros independentes, um por projeto (peça)
- Voltas nomeadas dentro de cada projeto (base, corpo, alça, acabamento...), cada uma com seu próprio tempo
- Ao marcar volta: pausar cronômetro, abrir modal para nomear, retomar depois
- Deletar uma volta reduz o tempo total do projeto (voltas são a fonte de verdade)
- Projetos ativos separados dos concluídos na tela inicial
- Sincronização entre dispositivos sem login (código de pareamento)
- Cálculo de valor da peça por preço/hora
- Offline-first, PWA instalável

## Stack

- Monorepo com Turborepo + npm workspaces
  - `apps/web` — Vite + React 19 + React Router (SPA, PWA offline-first)
  - `apps/api` — Hono (API serverless)
  - `packages/shared` — constantes e schemas Zod compartilhados (sync)
- Tailwind CSS 4 + shadcn/ui — design system e componentes de UI
- Dexie (IndexedDB) — persistência local offline-first
- Drizzle ORM (adapter `drizzle-orm/neon-http`) + Neon (Postgres serverless) — banco remoto do sync
- vite-plugin-pwa (Workbox) — PWA / Service Worker
- Vercel — deploy (web e api)
- Node 24

Arquitetura de sync: Dexie continua como banco local offline-first, Neon como banco remoto, a API Hono faz a ponte. Acesso ao Postgres via Drizzle ORM. Estratégia de conflito: last-write-wins. Deploy na Vercel, mantendo tudo no free tier.

## Sincronização entre Dispositivos (entregue)

Sincroniza dados entre dispositivos sem login, via código de pareamento. Cada dispositivo tem um token único; um código temporário associa dispositivos a um grupo de sync; a autenticação na API Hono é via Bearer token. A troca é incremental (push/pull) com last-write-wins.

## Estado Atual

A versão 1.0 está entregue e em uso em produção.

**Core (escopo 1.0):**

- Criar, renomear, excluir, concluir e reabrir projetos
- Cronômetro com start/pause por projeto
- Voltas com modal + pausa automática ao marcar; renomear e excluir voltas
- Nomenclatura "Volta" (não "Lap")
- Cálculo de valor por hora
- Projetos ativos separados dos concluídos
- PWA offline instalável
- Design system com shadcn/ui + página demo (`/design`)
- Sincronização entre dispositivos (código de pareamento)

**Entregue além do escopo inicial:**

- Backup/export e import dos dados
- Undo (desfazer) para ações destrutivas
- Recuperação de cronômetro entre dispositivos + indicador de "ativo em outro dispositivo" (heartbeat)
- Preferência "ignorar milissegundos"
- Wake lock (mantém a tela acesa com o cronômetro rodando)
- Atalhos de teclado e auto-pause ao sair/minimizar o app

## Ideias Futuras

Coisas que podem ser úteis mas não são prioridade agora:

- Notas por projeto (tipo de linha, agulha, link de tutorial)
- Tags/categorias para organizar projetos
- Templates de voltas reutilizáveis
- Tempo do cronômetro no título da aba do browser
- Foto por volta para registrar progresso visual
- Estimativa de tempo por projeto (ex: "12h de 20h")
- Exportar resumo do projeto para compartilhar com clientes
- Estatísticas (tempo total no mês, médias, evolução)
