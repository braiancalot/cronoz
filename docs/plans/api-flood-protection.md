# Proteger API de flood + cleanup de grupos inativos

## Context

A API do Cronoz roda em Vercel serverless contra Neon Postgres free tier. O endpoint `POST /api/pair/initiate` (em `apps/api/src/routes/pairing.js`) cria uma linha em `sync_groups` + `devices` + `pairing_codes` **sem autenticação**. Se alguém descobrir o domínio, dá pra rodar um loop e estourar o free tier do Neon. Os dados da esposa do usuário continuam isolados por `syncGroupId` (não tem vazamento), mas o banco enche.

Restrição de produto: a app vai pra portfolio. **Não** pode ter senha secreta no device principal — isso quebra a demo. Solução tem que ser invisível pra usuário legítimo e barrar abuso automatizado.

Resultado esperado:

1. Rate limit nos endpoints públicos que criam linhas.
2. Cleanup automático de grupos inativos pra que, mesmo se algo escapar, o banco se recupera sozinho.
3. Mínimo de infra nova (sem Redis/KV) — usar o Postgres existente.

## Abordagem

### 1. Rate limit Postgres-backed nos endpoints de pareamento

Vercel serverless é stateless ⇒ in-memory limiter não funciona entre invocações. Usar o próprio Neon como state store (1 leitura + 1 upsert por requisição protegida — custo trivial e cabe no free tier que estamos protegendo).

Aplicar **só** em:

- `POST /api/pair/initiate` (vetor principal de flood — cria 3 linhas sem auth)
- `POST /api/pair/join` (não cria linhas, mas é um endpoint público que mexe em estado — boa higiene)

Não aplicar em `/api/sync/*` — já é protegido por JWT, e quem abusa precisa primeiro estourar o limite do `/initiate`.

**Limites propostos** (ajustáveis):

- `/api/pair/initiate`: 5 requisições / IP / hora, 10 / IP / dia
- `/api/pair/join`: 20 / IP / hora

Resposta `429 Too Many Requests` com header `Retry-After`. IP vem de `c.req.header('x-forwarded-for')?.split(',')[0]` (Vercel popula).

### 2. Tracking de atividade + cleanup via Vercel Cron

`syncGroups` hoje só tem `createdAt`. Adicionar `lastActivityAt` (default `now()`) e atualizá-lo em:

- `POST /api/sync/push` (escrita real)
- `POST /api/sync/pull` (mantém grupo "vivo" mesmo só lendo)
- `POST /api/pair/join` (acabou de parear, está vivo)

Cleanup endpoint `POST /api/admin/cleanup`:

- Autentica via header `Authorization: Bearer ${CRON_SECRET}` (env var).
- Deleta `syncGroups` com `lastActivityAt < now() - 30 days`. Cascade já está nas FKs (`devices`, `projects`, `settings`, `pairing_codes`, `sync_cursors`) — verificar `apps/api/src/db/schema.js` antes de implementar; se faltar `onDelete: 'cascade'` em alguma FK, adicionar.

Vercel Cron via `apps/api/vercel.json` rodando `/api/admin/cleanup` 1x/dia. Cron Hobby tier suporta isso.

### 3. Migrar pra Drizzle migrations versionadas

CLAUDE.md já manda: "Quando mudar schema novamente, migrar pra migrations versionadas antes de aplicar." Esta é a próxima mudança de schema (nova tabela `rate_limits` + nova coluna `last_activity_at`), então fazemos a migração de workflow agora.

Setup mínimo:

- Adicionar script `db:migrate` em `apps/api/package.json`
- Criar `apps/api/src/db/migrate.js` (runner standalone usando `drizzle-orm/migrator`)
- `npm run db:generate` gera SQL files em `apps/api/drizzle/`
- Versionar `apps/api/drizzle/` no git
- Aplicar em prod manualmente: `DATABASE_URL=<neon-prod> npm run db:migrate --workspace=apps/api`
- A partir daqui, **nunca mais `db:push` em produção** (já está documentado no CLAUDE.md).

## Arquivos a modificar / criar

**Schema & migrations**

- `apps/api/src/db/schema.js` — add `rateLimits` table (`key text PK, windowStart timestamp, count int`); add `lastActivityAt` em `syncGroups`; revisar `onDelete: 'cascade'` nas FKs.
- `apps/api/drizzle/` (nova pasta) — SQL gerado por `drizzle-kit generate`.
- `apps/api/src/db/migrate.js` (novo) — runner.
- `apps/api/package.json` — script `db:migrate`.

**Rate limit**

- `apps/api/src/middleware/rateLimit.js` (novo) — factory `rateLimit({ key, limit, windowSec })`. Usa upsert atômico em `rate_limits` (INSERT ... ON CONFLICT DO UPDATE com `count = count + 1` e reset se `window_start` expirou).
- `apps/api/src/routes/pairing.js` — aplicar middleware nos handlers `initiate` e `join`.

**Activity tracking**

- `apps/api/src/routes/sync.js` — atualizar `lastActivityAt` no push, pull. Reusar a sessão Drizzle já presente.
- `apps/api/src/routes/pairing.js` — atualizar `lastActivityAt` no `join`.

**Cleanup**

- `apps/api/src/routes/admin.js` (novo) — `POST /admin/cleanup`. Verifica `Authorization` contra `process.env.CRON_SECRET`. Deleta `syncGroups` com `lastActivityAt < now() - interval '30 days'`. Retorna `{ deletedGroups: N }`.
- `apps/api/src/app.js` — mount `admin` route.
- `apps/api/vercel.json` (novo) — `{ "crons": [{ "path": "/api/admin/cleanup", "schedule": "0 4 * * *" }] }` (4 UTC = 1 BRT, baixo tráfego).

**Env vars (Vercel)**

- `CRON_SECRET` — gerar valor aleatório, adicionar em Vercel Production.

## Reuso

- Padrão de teste já existe em `apps/api/src/routes/__tests__/pairing.test.js` — usar `app.request()` + Drizzle pra assertions.
- Middleware de auth JWT em `apps/api/src/middleware/auth.js` é o template do estilo de middleware do projeto.
- Conexão Drizzle compartilhada em `apps/api/src/db/index.js`.

## Tests (TDD: red → green)

1. **Rate limit middleware** (`__tests__/rateLimit.test.js`)
   - Permite N requisições dentro da janela.
   - Bloqueia (429) na N+1.
   - Reseta após `windowSec` (mockar `Date.now` ou avançar `window_start` direto na DB).
   - Chaves diferentes (IP1 vs IP2) não interferem.

2. **Pairing routes** (atualizar `pairing.test.js`)
   - Após 5 `initiate` do mesmo IP, 6º retorna 429 com `Retry-After`.
   - IP diferente continua passando.
   - `join` bem-sucedido atualiza `lastActivityAt` no grupo.

3. **Sync routes** (atualizar `sync.test.js`)
   - Push e pull atualizam `lastActivityAt` do grupo.

4. **Cleanup endpoint** (`__tests__/admin.test.js`)
   - Sem `Authorization` → 401.
   - Com secret errado → 401.
   - Com secret correto: grupo com `lastActivityAt = now() - 31 days` é deletado, grupo recente preservado.
   - Cascade: devices/projects/settings do grupo deletado também somem.

## Verificação end-to-end

Antes de cada fase, reler esta seção e cortar o que ficou obsoleto (CLAUDE.md regra de revalidar plano).

**Local:**

```bash
# 1. migrar schema local
npm run db:generate --workspace=apps/api
npm run db:migrate --workspace=apps/api

# 2. testes
npm run test --workspace=apps/api

# 3. smoke do rate limit
for i in $(seq 1 6); do curl -X POST http://localhost:3001/api/pair/initiate -H 'Content-Type: application/json' -d '{"deviceName":"t"}'; echo; done
# esperar 5x 200 + 1x 429

# 4. smoke do cleanup
# inserir grupo com lastActivityAt antigo via psql, depois:
curl -X POST http://localhost:3001/api/admin/cleanup -H "Authorization: Bearer $CRON_SECRET"
# esperar { deletedGroups: 1 }
```

**Produção (Vercel):**

1. Setar `CRON_SECRET` em Vercel env vars (Production).
2. Rodar migration manual: `DATABASE_URL=<neon-prod> npm run db:migrate --workspace=apps/api`.
3. Deploy.
4. Verificar Vercel → Crons → cleanup agendado pra 04:00 UTC.
5. Disparar cron manualmente uma vez no dashboard pra confirmar 200.
6. Esperar 24h e checar log da execução real.

## Fora de escopo (intencional)

- Captcha (Cloudflare Turnstile etc.) — adiciona fricção desnecessária pra demo de portfolio. Reavaliar se rate limit não for suficiente.
- Caps de tamanho/quantidade no `/sync/push` — risco menor (já requer JWT). Adicionar só se observarmos abuso real.
- Vercel WAF / Bot Protection — Hobby tier limitado; rate limit aplicacional é suficiente.
- Branches Neon de staging — projeto pessoal, CLAUDE.md já decidiu contra.
