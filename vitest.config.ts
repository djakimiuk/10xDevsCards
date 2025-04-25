/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@astrojs/react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", ".astro", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,ts,jsx,tsx}"],
      exclude: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}", "src/**/*.d.ts", "src/types.ts"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
    setupFiles: ["./src/test/setup.ts"],
  },
});
