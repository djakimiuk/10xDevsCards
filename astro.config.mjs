// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// MessageChannel polyfill for Cloudflare Workers
const messageChannelPolyfill = {
  name: "message-channel-polyfill",
  enforce: "pre",
  transform(code, id) {
    if (id.includes("@astro-renderers") || id.includes("react-dom/server")) {
      const polyfill = `
        if (typeof MessageChannel === 'undefined') {
          globalThis.MessageChannel = function MessageChannel() {
            this.port1 = { postMessage: () => {}, onmessage: null };
            this.port2 = { postMessage: () => {}, onmessage: null };
          };
        }
      `;
      return { code: polyfill + code };
    }
  },
};

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss(), messageChannelPolyfill],
    ssr: {
      noExternal: ["react", "react-dom"],
      target: "webworker",
    },
    resolve: {
      alias: {
        MessageChannel: "./src/utils/message-channel.js",
      },
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
