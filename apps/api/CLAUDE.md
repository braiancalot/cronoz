# apps/api

Hono API for pairing and sync, on Postgres through Drizzle. Runs on port 3001 via
`@hono/node-server` in dev and as a Vercel function in production. Rules here apply on top of the
root `CLAUDE.md`.

## Structure

- `src/app.js`: the Hono app (CORS, routes, `/health`). `src/index.js` is the Vercel entry,
  `src/dev.js` the local server.
- `src/routes/`: `pairing.js` (`/pair/*`) and `sync.js` (`/sync/*`).
- `src/middleware/auth.js`: checks the device credential on every route.
- `src/lib/`: pure helpers and the Postgres brakes (`groupQuota.js`, `projectUpsert.js`, ...).
- `src/db/`: `schema.js`, the connection and the migrator. Migrations live in `drizzle/`.
- `test/`: global setup, the test connection string and shared fixtures.

## Database

- **One `DATABASE_URL`** with the full connection string. Don't split it into `PGHOST`/`PGUSER`:
  drivers, drizzle-kit and hosting all take the URL, and SSL options stay inside it. In production
  it is the Neon `-pooler` host.
- `src/lib/databaseTarget.js` refuses a loopback host under `NODE_ENV=production`, since the dev
  credentials are versioned. Its messages name the host only, never the URL, which carries the
  password.
- **Schema changes go through migrations**, never `db:push`: in production it can propose a `DROP`
  on a renamed column. The steps, the baseline marking and the Neon routine are in
  `docs/runbook-database-migrations.md`.
- Each migration MUST stay compatible with the API version already live, and runs against Neon
  **before** the deploy that needs it.

## Device Credential

Every request carries `Authorization: Bearer <deviceId>.<secret>`, pairing routes included
(`packages/shared/src/deviceCredential.js`). The device generates the secret; the server stores
only its SHA-256 in `devices.secret_hash` (`src/lib/deviceSecret.js`). Nothing is issued,
refreshed or expired.

- A device id alone proves nothing, and a device id sent in a body is ignored.
- 401 `missing_device_credential`: no header, or a bearer that is not a credential.
- 401 `invalid_device_credential`: a known device with another secret, or on `/sync/*` a device
  the server has never seen.
- The pairing routes register an unknown device with the secret it presents.
- **The secret MUST NOT appear in an exception message or a log line**, the one exception to the
  "include the offending value" rule.
- **Revocation** is deleting the `devices` row: `authMiddleware` looks the device up on every
  request.

## Cross-Group Writes

Project ids come from the client, so two groups can present the same one. The group check MUST sit
in the write itself (`setWhere` in `src/lib/projectUpsert.js`): a SELECT before the upsert misses
a row another group commits in between. `/sync/push` answers 409 `project_belongs_to_other_group`,
read after the write. A new synced table keyed by a client id needs the same condition.

## Pairing

The pairing routes are anonymous and Vercel Hobby has no firewall rate limit, so the brakes live in
Postgres and are global.

- **Wrong codes:** a failed `/join` adds 1 to `failed_joins` on every live code; a code dies at
  `PAIRING_CODE_MAX_FAILED_JOINS`.
- **New groups:** `/initiate` answers 429 `too_many_new_groups` past `MAX_NEW_GROUPS_PER_HOUR`. A
  device that already has a group is never refused.
- **Cleanup:** every `/initiate` runs `purgeAbandonedGroups` (`src/lib/groupQuota.js`): groups
  older than 24h with at most one device, no projects, no settings and no live code. No cron. **A
  table that hangs off `sync_groups` and holds user content MUST be added to that check**, or the
  purge deletes it by cascade.
- **Rejoin:** `/join` deletes the device's own unused group through `discardUnusedGroup`, and
  answers 409 `device_already_paired` when that group has content.
- **Status:** `POST /pair/status` answers `waiting`, `joined`, `expired` or `burned`. The lookup
  demands the code AND the device that generated it; an unknown pair answers `expired`, so it
  can't probe for codes without tripping the wrong-code brake.

## CORS

`src/lib/corsOrigins.js` turns `CORS_ALLOWED_ORIGINS` into Hono's allowlist. Entries MUST be bare
origins: boot rejects a trailing slash or a path and names the corrected value. An empty list
aborts boot in production and falls back to `http://localhost:5173` elsewhere.

## Tests

- `npm test --workspace=apps/api` runs on a real Postgres. `pretest` starts Docker
  (`services:up`), so without Docker no API test runs, the pure `src/lib` ones included.
- Tests drop and recreate `cronoz_test` on every run with the same migrator, so a broken migration
  fails the suite.
- The test connection string lives only in `test/databaseUrl.js`.
- Share `test/pairingFixtures.js` (device ids and secrets, `credentialOf`, `post`, `initiate`,
  `join`, `pair`) and `test/projectFixtures.js` (`makeProject`) instead of redefining them.
- Sync tests are split by endpoint (`syncPush`, `syncPull`, `syncDevices`).

## Secret Scan

The `secrets` job in `.github/workflows/ci.yml` runs gitleaks. `.gitleaks.toml` allowlists the
JWT-shaped test fixtures by their exact shape: a new fixture that looks like a credential needs an
entry as narrow as the string itself, never a path-wide exception. The local full-history command
is in `docs/runbook-secret-scan.md`.
