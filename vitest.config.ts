/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@astrojs/react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode === "test" ? "test" : mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
      exclude: ["node_modules/**/*", "e2e/**/*"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}",
          "**/*.config.{ts,js}",
          "e2e/**/*",
        ],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
      watch: true,
      reporters: ["verbose"],
      ui: {
        open: !process.env.CI,
      },
      env: {
        ...env,
        VITE_TEST: "true",
        NODE_ENV: "test",
      },
    },
  };
});
