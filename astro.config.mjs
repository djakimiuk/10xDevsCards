// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["react", "react-dom"],
      target: "webworker",
    },
    define: {
      "globalThis.MessageChannel": "undefined",
    },
  },
  adapter: cloudflare({
    mode: "directory",
    runtime: {
      mode: "off",
    },
    imageService: "compile",
  }),
  build: {
    assets: "_assets",
  },
});
