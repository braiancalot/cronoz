import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./test/databaseUrl.js";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: "vitest-only-nCq7xWm2Rt9bZk4vLp8sHy3dFg6jAe5U",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173,https://cronoz.teshi.com.br",
    },
    globalSetup: ["./test/globalSetup.js"],
    setupFiles: ["./test/setup.js"],
    fileParallelism: false,
  },
});
