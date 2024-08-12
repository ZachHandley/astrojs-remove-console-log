import type { AstroIntegration } from "astro";
import { processDirectory } from "./utils/ast.js";

export default function consoleCleanerIntegration(): AstroIntegration {
  return {
    name: "console-cleaner",
    hooks: {
      "astro:build:setup": async ({ logger, vite }) => {
        if (vite.root) {
          await processDirectory(vite.root);
        }
      },
    },
  };
}
