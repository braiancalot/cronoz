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

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- Dexie (IndexedDB) — persistência local
- Serwist — PWA / Service Worker
- Node 24

**Planejado (migração):**

- Monorepo com Turborepo
  - `apps/web` — Vite + React Router (SPA, PWA offline-first)
  - `apps/api` — Hono (API serverless)
  - `packages/shared` — tipos, schemas Zod, constantes compartilhadas
- Drizzle ORM (adapter `drizzle-orm/neon-http`) — acesso type-safe ao banco
- Neon (Postgres serverless) — banco remoto para sincronização
- shadcn/ui — componentes de UI (após funcionalidades base prontas)
- Vercel — deploy (web e api)

A arquitetura de sync: Dexie continua como banco local offline-first, Neon como banco remoto, Hono API faz a ponte. Drizzle ORM para acesso type-safe ao Postgres. Estratégia de conflito: last-write-wins. Deploy na Vercel. Objetivo é manter tudo no free tier.

**Nota arquitetural:** O Next.js App Router causa latência na navegação (server roundtrips) incompatível com offline-first. A migração para Vite SPA resolve isso — navegação 100% client-side. A API Hono fica em projeto separado no monorepo, servindo apenas a sincronização.

## Pareamento entre Dispositivos

A ideia é sincronizar dados entre dispositivos através de um código simples, sem login. Estratégia provável: token único por dispositivo, associação via código de pareamento temporário, autenticação via JWT/Bearer no Hono. Detalhes de implementação ainda precisam ser definidos.

## Escopo 1.0

O que precisa estar pronto antes de considerar "versão 1.0":

- Criar, renomear, excluir, concluir e reabrir projetos
- Cronômetro com start/pause/reset
- Etapas com modal + pausa automática ao marcar
- Renomear e excluir etapas
- Nomenclatura "Etapa" (não "Lap")
- Cálculo de valor por hora
- PWA offline instalável
- Sincronização entre dispositivos
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
