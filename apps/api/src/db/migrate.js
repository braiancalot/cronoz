import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const MIGRATIONS_FOLDER = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

export async function applyMigrations(connectionString) {
  const client = postgres(connectionString, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await client.end();
  }
}

async function runFromCli() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set; expected a Postgres URL");
  }
  await applyMigrations(connectionString);
  console.log("Migrations applied.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await import("dotenv/config");
  await runFromCli();
}
