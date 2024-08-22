import type { AstroIntegration } from "astro";
import { processDirectory } from "./utils/ast.js";
import path from "path";
import { fileURLToPath } from "url";

export default function astroConsoleCleaner(): AstroIntegration {
  return {
    name: "console-cleaner",
    hooks: {
      "astro:config:setup": ({ config, command, logger }) => {
        if (command === "build") {
          const srcDir = config.srcDir
            ? fileURLToPath(config.srcDir)
            : path.join(process.cwd(), "src");

          logger.info(
            "Removing console statements from project files in " + srcDir
          );

          processDirectory(srcDir, logger)
            .then(() => {
              logger.info("Console statements removed successfully.");
            })
            .catch((error: any) => {
              logger.error(
                `Error removing console statements: ${error.message}`
              );
            });
        } else {
          logger.info(
            "Console statements will not be removed during development."
          );
        }
      },
    },
  };
}
