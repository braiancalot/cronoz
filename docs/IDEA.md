# Cronoz - Ideias do Projeto

## O Problema

Minha esposa trabalha com crochê e lida com várias peças ao mesmo tempo. Para controlar o tempo de cada peça, ela precisa criar cronômetros em diferentes apps e lugares. O Cronoz centraliza tudo em uma aplicação só — simples, offline e instalável no celular.

## Requisitos Principais

- Múltiplos cronômetros independentes, um por projeto (peça)
- Etapas nomeadas dentro de cada projeto (base, corpo, alça, acabamento...), cada uma com seu próprio tempo
- Ao marcar etapa: pausar cronômetro, abrir modal para nomear, retomar depois
- Deletar uma etapa reduz o tempo total do projeto (etapas são a fonte de verdade)
- Projetos ativos separados dos concluídos na tela inicial
- Sincronização entre dispositivos sem login (código de pareamento)
- Cálculo de valor da peça por preço/hora
- Offline-first, PWA instalável

## Stack

**Em uso:**

- Monorepo com Turborepo + npm workspaces
  - `apps/web` — Vite + React 19 + React Router (SPA, PWA offline-first)
  - `apps/api` — Hono (API serverless)
- Tailwind CSS 4
- Dexie (IndexedDB) — persistência local
- vite-plugin-pwa (Workbox) — PWA / Service Worker
- Vercel — deploy (web e api)
- Node 24

**Planejado:**

- `packages/shared` — tipos, schemas Zod, constantes compartilhadas (quando iniciar sync)
- shadcn/ui — design system e componentes de UI
- Drizzle ORM (adapter `drizzle-orm/neon-http`) — acesso type-safe ao banco
- Neon (Postgres serverless) — banco remoto para sincronização

A arquitetura de sync: Dexie continua como banco local offline-first, Neon como banco remoto, Hono API faz a ponte. Drizzle ORM para acesso type-safe ao Postgres. Estratégia de conflito: last-write-wins. Deploy na Vercel. Objetivo é manter tudo no free tier.

## Pareamento entre Dispositivos

A ideia é sincronizar dados entre dispositivos através de um código simples, sem login. Estratégia provável: token único por dispositivo, associação via código de pareamento temporário, autenticação via JWT/Bearer no Hono. Detalhes de implementação ainda precisam ser definidos.

## Escopo 1.0

O que precisa estar pronto antes de considerar "versão 1.0":

- Criar, renomear, excluir, concluir e reabrir projetos
- Cronômetro com start/pause
- Etapas com modal + pausa automática ao marcar
- Renomear e excluir etapas
- Nomenclatura "Etapa" (não "Lap")
- Design system com shadcn/ui + página demo (`/design`)
  - Configurar shadcn/ui (tema, tokens de cor, tipografia)
  - Migrar componentes existentes para shadcn
  - Página `/design` com catálogo dos componentes usados no app
- Sincronização entre dispositivos (prioridade alta — bloqueio principal para uso real)
- Cálculo de valor por hora
- PWA offline instalável
- Notas por projeto (tipo de linha, agulha, link de tutorial)
- Tags/categorias para organizar projetos
- Templates de etapas reutilizáveis

## Ideias Futuras

Coisas que podem ser úteis mas não são prioridade agora:

- Tempo do cronômetro no título da aba do browser
- Foto por etapa para registrar progresso visual
- Estimativa de tempo por projeto (ex: "12h de 20h")
- Exportar resumo do projeto para compartilhar com clientes
- Estatísticas (tempo total no mês, médias, evolução)
