import type { AstroIntegration } from "astro";
import { processDirectory } from "./utils/ast.js";

export default function astroConsoleCleaner(): AstroIntegration {
  return {
    name: "console-cleaner",
    hooks: {
      "astro:build:setup": async ({ logger, vite, pages }) => {
        const pathsToProcess = new Set<string>();

        logger.info(`Processing ${Object.keys(pages).length} pages...`);
        // Collect paths from pages
        for (const [, pageData] of Object.entries(pages)) {
          if (pageData.component) {
            pathsToProcess.add(pageData.component);
          }
        }

        // Add Vite root if available
        if (vite.root) {
          logger.info(`Processing base directory ${vite.root}...`);
          pathsToProcess.add(vite.root);
        }

        // Process all collected paths
        for (const path of pathsToProcess) {
          await processDirectory(path);
        }
      },
    },
  };
}
