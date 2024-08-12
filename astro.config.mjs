import { defineConfig } from "astro/config";
import consoleCleanerIntegration from "./src/index.ts";

// https://astro.build/config
export default defineConfig({
  integrations: [consoleCleanerIntegration()],
});
