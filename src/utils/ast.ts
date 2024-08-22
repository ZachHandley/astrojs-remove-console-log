import fs from "node:fs/promises";
import path from "node:path";
import * as acorn from "acorn";
import * as acornWalk from "acorn-walk";
import tsPlugin from "acorn-typescript";

function removeConsoleLogs(code: string): string {
  // Parse the code into an AST with TypeScript support
  // @ts-expect-error
  const ast = acorn.Parser.extend(tsPlugin()).parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    locations: true,
  });

  // Collect nodes to remove
  const nodesToRemove: any[] = [];

  acornWalk.simple(ast, {
    ExpressionStatement(node) {
      if (
        node.expression.type === "CallExpression" &&
        node.expression.callee.type === "MemberExpression" &&
        node.expression.callee.object.type === "Identifier" &&
        node.expression.callee.object.name === "console" &&
        ["log", "warn", "error", "info"].includes(
          // @ts-expect-error
          node.expression.callee.property.name
        )
      ) {
        nodesToRemove.push(node);
      }
    },
  });

  // Remove the nodes
  nodesToRemove.reverse().forEach((node) => {
    const start = node.start;
    const end = node.end;
    code = code.slice(0, start) + code.slice(end);
  });

  return code;
}

async function processFile(filePath: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const updatedContent = removeConsoleLogs(content);
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent);
      console.log(`Updated file: ${filePath}`);
    } else {
      console.log(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

export async function processDirectory(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (
        entry.isDirectory() &&
        !entry.name.startsWith("node_modules") &&
        !fullPath.includes("node_modules")
      ) {
        console.log("Processing directory: " + fullPath);
        await processDirectory(fullPath);
      } else if (
        entry.isFile() &&
        /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx|astro)$/.test(entry.name)
      ) {
        await processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}
