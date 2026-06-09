import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://nashthecoder.github.io",
  base: "/ai-democracy-map-dev",
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["sharp"],
    },
  },
});
