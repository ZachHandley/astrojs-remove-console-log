import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { processDirectory } from "../src/utils/ast.ts";

const testDir = path.join(__dirname, "testFiles");

describe("Astro Console Cleaner", () => {
  beforeEach(async () => {
    // Create test directory and files
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(
      path.join(testDir, "test1.js"),
      `
      console.log('This should be removed');
      const a = 5;
      console.warn(
        'This warning should be removed'
      );
      function test() {
        console.error('This error should be removed');
        return a * 2;
      }
    `
    );
    await fs.writeFile(
      path.join(testDir, "test2.ts"),
      `
      const b = 10;
      console.log('Remove me');
      export const multiply = (x: number, y: number) => {
        console.log('Calculating...');
        return x * y;
      }
    `
    );
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("should remove console.log, console.warn, and console.error statements", async () => {
    await processDirectory(testDir);

    const test1Content = await fs.readFile(
      path.join(testDir, "test1.js"),
      "utf-8"
    );
    const test2Content = await fs.readFile(
      path.join(testDir, "test2.ts"),
      "utf-8"
    );

    expect(test1Content).not.toContain("console.log");
    expect(test1Content).not.toContain("console.warn");
    expect(test1Content).not.toContain("console.error");
    expect(test1Content).toContain("const a = 5;");
    expect(test1Content).toContain("function test() {");
    expect(test1Content).toContain("return a * 2;");

    expect(test2Content).not.toContain("console.log");
    expect(test2Content).toContain("const b = 10;");
    expect(test2Content).toContain(
      "export const multiply = (x: number, y: number) => {"
    );
    expect(test2Content).toContain("return x * y;");
  });

  it("should not modify files that do not contain console statements", async () => {
    await fs.writeFile(
      path.join(testDir, "noConsole.js"),
      `
      const c = 15;
      function add(x, y) {
        return x + y;
      }
    `
    );

    const originalContent = await fs.readFile(
      path.join(testDir, "noConsole.js"),
      "utf-8"
    );
    await processDirectory(testDir);
    const processedContent = await fs.readFile(
      path.join(testDir, "noConsole.js"),
      "utf-8"
    );

    expect(processedContent).toBe(originalContent);
  });

  it("should process nested directories", async () => {
    await fs.mkdir(path.join(testDir, "nested"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "nested", "nested.ts"),
      `
      console.log('Nested console.log');
      const d = 20;
    `
    );

    await processDirectory(testDir);

    const nestedContent = await fs.readFile(
      path.join(testDir, "nested", "nested.ts"),
      "utf-8"
    );

    expect(nestedContent).not.toContain("console.log");
    expect(nestedContent).toContain("const d = 20;");
  });

  it("should not process files in node_modules", async () => {
    await fs.mkdir(path.join(testDir, "node_modules"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "node_modules", "module.js"),
      `
      console.log('This should not be removed');
    `
    );

    await processDirectory(testDir);

    const moduleContent = await fs.readFile(
      path.join(testDir, "node_modules", "module.js"),
      "utf-8"
    );

    expect(moduleContent).toContain("console.log");
  });
});
