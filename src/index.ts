import type { AstroIntegration, AstroConfig } from "astro";
import { removeConsoleLogs } from "./utils/ast.js";
import { ignoreConstants, matchConstants } from "./utils/constants.js";
import path from "path";

let config: AstroConfig;

export default function astroConsoleCleaner(): AstroIntegration {
  return {
    name: "console-cleaner",
    hooks: {
      "astro:config:setup": ({ config: _config }) => {
        config = _config;
      },
      "astro:build:setup": ({ vite, logger }) => {
        if (!config) {
          throw new Error("Astro config is not available");
        }
        vite.plugins = vite.plugins || [];
        vite.plugins.push({
          name: "remove-console-logs",
          async transform(code: string, id: string) {
            if (
              matchConstants.some((ext) => id.includes(ext)) &&
              !ignoreConstants.some((ext) => id.includes(ext))
            ) {
              logger.info(
                `Removing console statements from ${path.basename(id)}`
              );
              return await removeConsoleLogs(
                code,
                path.extname(id).slice(1),
                config
              );
            }
            return code;
          },
        });
      },
    },
  };
}
