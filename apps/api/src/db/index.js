import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
import { resolveDatabaseUrl } from "../lib/databaseTarget.js";

const connectionString = resolveDatabaseUrl(process.env.DATABASE_URL, {
  nodeEnv: process.env.NODE_ENV,
});

export const client = postgres(connectionString, { onnotice: () => {} });

export const db = drizzle(client, { schema });
