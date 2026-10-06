import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./test/databaseUrl.js";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      CORS_ALLOWED_ORIGINS: "http://localhost:5173,https://cronoz.example",
    },
    globalSetup: ["./test/globalSetup.js"],
    setupFiles: ["./test/setup.js"],
    fileParallelism: false,
  },
});
