import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://nashthecoder.github.io",
  base: process.env.PUBLIC_BASE_PATH || "/ai-democracy-map-dev",
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["sharp"],
    },
  },
});
