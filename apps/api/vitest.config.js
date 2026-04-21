import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://cronoz:cronoz@localhost:5432/cronoz_test",
      JWT_SECRET: "test-secret",
    },
    globalSetup: ["./test/globalSetup.js"],
    setupFiles: ["./test/setup.js"],
  },
});
