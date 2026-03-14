# Cronoz - Ideias do Projeto

## O Problema

Minha esposa trabalha com crochê e lida com várias peças ao mesmo tempo. Para controlar o tempo de cada peça, ela precisa criar cronômetros em diferentes apps e lugares. O Cronoz centraliza tudo em uma aplicação só — simples, offline e instalável no celular.

## Requisitos Principais

- Múltiplos cronômetros independentes, um por projeto (peça)
- Etapas nomeadas dentro de cada projeto (base, corpo, alça, acabamento...)
- Ao marcar etapa: pausar cronômetro, abrir modal para nomear, retomar depois
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

**Planejado:**

- shadcn/ui — componentes de UI (após funcionalidades base prontas)
- Neon (Postgres serverless) — banco remoto para sincronização
- Vercel — deploy

A arquitetura de sync: Dexie continua como banco local offline-first, Neon como banco remoto, Next.js API Routes fazem a ponte. Estratégia de conflito: last-write-wins. Deploy na Vercel. Objetivo é manter tudo no free tier.

## Pareamento entre Dispositivos

A ideia é sincronizar dados entre dispositivos através de um código simples, sem login. A estratégia exata de pareamento ainda precisa ser pesquisada — como gerar o código, como associar dispositivos, como lidar com reconexão.

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

- Foto por etapa para registrar progresso visual
- Estimativa de tempo por projeto (ex: "12h de 20h")
- Exportar resumo do projeto para compartilhar com clientes
- Estatísticas (tempo total no mês, médias, evolução)
