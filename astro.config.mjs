import { defineConfig } from "astro/config";
import astroConsoleCleaner from "./src/index.ts";

// https://astro.build/config
export default defineConfig({
  integrations: [astroConsoleCleaner()],
  vite: {
    test: {
      globals: true,
      environment: "node",
    },
  },
});
