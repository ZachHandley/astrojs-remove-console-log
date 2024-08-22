import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import tsPlugin from "acorn-typescript";
import { parse as parseVue, compileTemplate } from "@vue/compiler-sfc";
import { parse as parseSvelte, walk as walkSvelte } from "svelte/compiler";
import fs from "fs/promises";
import path from "path";
import { ignoreConstants, matchConstants } from "./constants.js";
import type { AstroIntegrationLogger } from "astro";

// Main function to remove console.log statements based on file type
function removeConsoleLogs(code: string, fileType: string): string {
  switch (fileType) {
    case "vue":
      return removeConsoleLogsVue(code);
    case "svelte":
      return removeConsoleLogsSvelte(code);
    case "astro":
      return removeAstroConsoleLogs(code);
    default:
      return removeConsoleLogsJS(code);
  }
}

// Remove console.log statements from JavaScript/TypeScript code
function removeConsoleLogsJS(code: string): string {
  // @ts-expect-error
  const ast = acorn.Parser.extend(tsPlugin()).parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    locations: true,
  });

  let modifiedCode = code;

  acornWalk.simple(ast, {
    CallExpression(node: any) {
      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.name === "console"
      ) {
        const { start, end } = node;
        modifiedCode =
          modifiedCode.substring(0, start) + modifiedCode.substring(end);
      }
    },
  });

  return modifiedCode;
}

// Remove console.log statements from Astro files
function removeAstroConsoleLogs(code: string): string {
  console.log("Astro code: ", code);
  const codeFirstBlockRemoved = code.substring(3);
  const tempCodeBlock = codeFirstBlockRemoved.substring(
    0,
    codeFirstBlockRemoved.indexOf("---")
  );
  console.log(tempCodeBlock);
  const output = `---
${removeConsoleLogsJS(tempCodeBlock)}
---`;
  console.log(output);
  return output;
}

// Remove console.log statements from Vue files
function removeConsoleLogsVue(code: string): string {
  const descriptor = parseVue(code).descriptor;
  let scriptContent = descriptor.script?.content || "";
  let templateContent = descriptor.template?.content || "";

  if (scriptContent) {
    scriptContent = removeConsoleLogsJS(scriptContent);
  }

  if (templateContent) {
    const { code: compiledTemplate } = compileTemplate({
      filename: "template.vue",
      id: "template",
      source: templateContent,
    });
    templateContent = compiledTemplate;
  }

  return `
<template>
${templateContent.trim()}
</template>

<script>
${scriptContent.trim()}
</script>
  `;
}

// Remove console.log statements from Svelte files
function removeConsoleLogsSvelte(code: string): string {
  const ast = parseSvelte(code);

  // A naive approach to reconstruct the code from the AST
  let modifiedCode = code;

  walkSvelte(ast as any, {
    enter(node) {
      if (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        // @ts-expect-error
        node.callee.object.name === "console"
      ) {
        // @ts-expect-error
        const { start, end } = node;
        modifiedCode =
          modifiedCode.substring(0, start) + modifiedCode.substring(end);
      }
    },
  });

  return modifiedCode;
}

// Function to process a single file
async function processFile(filePath: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const fileType = path.extname(filePath).slice(1);
    const updatedContent = removeConsoleLogs(content, fileType);
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

export async function processDirectory(
  dir: string,
  logger?: AstroIntegrationLogger
): Promise<void> {
  try {
    if (logger) logger.debug(`Processing ${dir}`);
    console.log(`Processing ${dir}`);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.relative(dir, path.join(dir, entry.name));
      const fullPath = path.join(dir, entry.name);

      // Skip the entry if it matches any of the ignore patterns
      if (ignoreConstants.some((ignore) => relativePath.includes(ignore))) {
        continue;
      }

      // Process only if it matches one of the patterns in matchConstants
      if (
        (entry.isFile() &&
          matchConstants.some((match) =>
            relativePath.toLowerCase().includes(match.toLowerCase())
          )) ||
        entry.isDirectory()
      ) {
        console.log(`Processing ${relativePath}`);
        if (logger) logger.debug(`Processing ${relativePath}`);

        if (entry.isDirectory()) {
          await processDirectory(fullPath, logger);
        } else if (
          entry.isFile() &&
          /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx|astro)$/.test(entry.name)
        ) {
          await processFile(fullPath);
        }
      } else {
        console.log(`Skipping ${relativePath}`);
      }
    }
  } catch (error: any) {
    console.error(error);
    if (logger) logger.error(error);
  }
}
