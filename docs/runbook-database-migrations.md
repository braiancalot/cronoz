# Runbook: database migrations

Schema changes go through versioned Drizzle migrations in `apps/api/drizzle/`, committed to git.
`db:push` is gone on purpose: in production it can propose a `DROP` on a renamed column and lose
data. Never reintroduce it.

## Making a change

1. Edit `apps/api/src/db/schema.js`.
2. `npm run db:generate --workspace=apps/api -- --name <what_changed>`, then review the SQL.
3. `npm run db:migrate --workspace=apps/api` against the target `DATABASE_URL`.
4. Run the API suite: it recreates `cronoz_test` with the same migrator, so a broken migration
   fails it.

## Production (Neon)

- One `main` branch on Neon, which Vercel Production points to. No preview or staging branch: a
  personal project doesn't justify one.
- Run `db:migrate` manually from local, with `DATABASE_URL` set to the Neon `-pooler` string,
  **before** pushing the API that needs it.
- Each migration MUST stay compatible with the API version already live. The web and the API
  deploy from the same push, so a change that crosses them only has to survive the minutes when
  one build is live and the other isn't.

## The baseline

`0000_baseline` is the schema that existed before migrations. A database created by the old
`push` already holds it and MUST be marked instead of migrated: insert one row in
`drizzle.__drizzle_migrations` with the SHA-256 of `0000_baseline.sql` as `hash` and the
journal's `when` for that entry (`drizzle/meta/_journal.json`) as `created_at`. Then
`db:migrate` applies only what comes after.
