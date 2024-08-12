import fs from "node:fs/promises";
import path from "node:path";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import * as escodegen from "escodegen";

function removeConsoleLogs(code: string): string {
  // Parse the code into an AST
  const ast = acorn.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
  });

  // Walk the AST and remove console.log calls
  walk.full(ast, (node: any) => {
    if (
      node.type === "ExpressionStatement" &&
      node.expression.type === "CallExpression" &&
      node.expression.callee.type === "MemberExpression" &&
      node.expression.callee.object.name === "console" &&
      ["log", "warn", "error"].includes(node.expression.callee.property.name)
    ) {
      return null;
    }
  });

  // Generate code from the modified AST
  return escodegen.generate(ast);
}

async function processFile(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, "utf-8");
  const updatedContent = removeConsoleLogs(content);
  if (content !== updatedContent) {
    await fs.writeFile(filePath, updatedContent);
  }
}

export async function processDirectory(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith("node_modules")) {
      await processDirectory(fullPath);
    } else if (
      entry.isFile() &&
      /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx|astro)$/.test(entry.name)
    ) {
      await processFile(fullPath);
    }
  }
}
