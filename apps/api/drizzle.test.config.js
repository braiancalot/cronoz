import { TEST_DATABASE_URL } from "./test/databaseUrl.js";

export default {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: TEST_DATABASE_URL,
  },
};
