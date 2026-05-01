export default {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://cronoz:cronoz@localhost:5432/cronoz_test",
  },
};
