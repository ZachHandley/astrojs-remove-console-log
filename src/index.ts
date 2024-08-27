import type { AstroIntegration } from "astro";
import { type PluginOption } from "vite";
import { removeConsoleLogs } from "./utils/ast.js";
import { matchConstants } from "./utils/constants.js";
import path from "path";

export default function astroConsoleCleaner(): AstroIntegration {
  return {
    name: "console-cleaner",
    hooks: {
      "astro:build:setup": ({ vite, logger }) => {
        vite.plugins = vite.plugins || [];
        vite.plugins.push({
          name: "remove-console-logs",
          transform(code: string, id: string) {
            if (matchConstants.some((ext) => id.endsWith(ext))) {
              logger.info(
                `Removing console statements from ${path.basename(id)}`
              );
              return removeConsoleLogs(code, path.extname(id).slice(1));
            }
            return code;
          },
        } satisfies PluginOption);
      },
    },
  };
}
