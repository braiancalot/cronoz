import { beforeEach, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db, client } from "../src/db/index.js";

beforeEach(async () => {
  await db.execute(sql`TRUNCATE sync_groups CASCADE`);
});

afterAll(async () => {
  await client.end();
});
