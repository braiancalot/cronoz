import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/pages/**",
        "src/main.jsx",
        "src/App.jsx",
        // shadcn primitives — copy-pasted, no app logic worth testing
        "src/components/ui/**",
        // layout/presentational components excluded until UI redesign settles
        "src/components/AppHeader.jsx",
        "src/components/EmptyState.jsx",
        "src/components/PageContainer.jsx",
        "src/components/ProjectCard.jsx",
        "src/components/ProjectHeader.jsx",
        "src/components/LapModal.jsx",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
