import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import postgres from "postgres";

const ADMIN_URL = "postgresql://cronoz:cronoz@localhost:5432/postgres";
const TEST_DB = "cronoz_test";
const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export async function setup() {
  const admin = postgres(ADMIN_URL);
  try {
    await admin.unsafe(`CREATE DATABASE ${TEST_DB}`);
  } catch (err) {
    if (err.code !== "42P04") throw err;
  } finally {
    await admin.end();
  }

  execSync("npx drizzle-kit push --config=drizzle.test.config.js --force", {
    cwd: apiRoot,
    stdio: "pipe",
  });
}
