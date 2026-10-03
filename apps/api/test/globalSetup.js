import postgres from "postgres";

import { applyMigrations } from "../src/db/migrate.js";
import {
  ADMIN_DATABASE_URL,
  TEST_DATABASE_NAME,
  TEST_DATABASE_URL,
} from "./databaseUrl.js";

// Recreated on every run so the migrations, not a leftover schema, build it.
export async function setup() {
  const admin = postgres(ADMIN_DATABASE_URL, { onnotice: () => {} });
  try {
    await admin.unsafe(
      `DROP DATABASE IF EXISTS ${TEST_DATABASE_NAME} WITH (FORCE)`,
    );
    await admin.unsafe(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
  } finally {
    await admin.end();
  }

  await applyMigrations(TEST_DATABASE_URL);
}
