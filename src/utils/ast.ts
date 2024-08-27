import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import tsPlugin from "acorn-typescript";
import type { AstroConfig } from "astro";

// Main function to remove console.log statements based on file type
export async function removeConsoleLogs(
  code: string,
  fileType: string,
  config: AstroConfig
): Promise<string> {
  switch (fileType) {
    case "vue":
      return await removeConsoleLogsVue(code, config);
    case "svelte":
      return await removeConsoleLogsSvelte(code, config);
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
  const frontmatterRegex = /^---\s*[\s\S]*?\s*---/;
  const frontmatterMatch = code.match(frontmatterRegex);

  if (frontmatterMatch) {
    const [frontmatter] = frontmatterMatch;
    const contentAfterFrontmatter = code.slice(frontmatter.length);

    const cleanedContent = removeConsoleLogsJS(contentAfterFrontmatter);

    return `${frontmatter}\n${cleanedContent}`;
  }

  // If no frontmatter is found, process the entire file
  return removeConsoleLogsJS(code);
}

// Remove console.log statements from Vue files
async function removeConsoleLogsVue(
  code: string,
  config: AstroConfig
): Promise<string> {
  const vueIntegration = config.integrations.find((integration) =>
    integration.name.includes("vue")
  );

  if (!vueIntegration) {
    console.warn(
      "Vue integration is not enabled in Astro config. Skipping Vue file processing."
    );
    return code;
  }

  try {
    const { parse, compileTemplate } = await import("@vue/compiler-sfc");
    const { descriptor } = parse(code);
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
  } catch (error) {
    console.error("Error processing Vue file:", error);
    return code;
  }
}

// Remove console.log statements from Svelte files
async function removeConsoleLogsSvelte(
  code: string,
  config: AstroConfig
): Promise<string> {
  const svelteIntegration = config.integrations.find((integration) =>
    integration.name.includes("svelte")
  );

  if (!svelteIntegration) {
    console.warn(
      "Svelte integration is not enabled in Astro config. Skipping Svelte file processing."
    );
    return code;
  }

  try {
    const { parse, walk } = await import("svelte/compiler");
    const ast = parse(code);

    let modifiedCode = code;

    walk(ast as any, {
      enter(node: any) {
        if (
          node.type === "CallExpression" &&
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
  } catch (error) {
    console.error("Error processing Svelte file:", error);
    return code;
  }
}
