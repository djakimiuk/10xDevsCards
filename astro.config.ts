// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server" as const,
  integrations: [
    react({
      include: ["**/*.{jsx,tsx}"],
      experimentalDisableStreaming: true,
    }),
    sitemap(),
  ],
  server: {
    port: 3000,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@supabase/ssr", "react-hook-form", "@hookform/resolvers", "sonner"],
      optimizeDeps: {
        include: ["react", "react-dom", "react-hook-form", "@hookform/resolvers", "sonner"],
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
  build: {
    assets: "_assets",
    inlineStylesheets: "auto" as const,
  },
});
