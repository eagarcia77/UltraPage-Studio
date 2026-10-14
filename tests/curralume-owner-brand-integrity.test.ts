import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const retiredNames = [
  ["Ultra", "Page Studio"].join(""),
  ["UC", "AN"].join(""),
  ["Inter", "americana"].join(""),
  ["Inter American", " University"].join(""),
];
const extensions = new Set([".md", ".mjs", ".ts", ".tsx", ".js", ".json", ".css", ".html", ".svg", ".webmanifest", ".yml"]);
const excluded = new Set(["node_modules", ".git", ".next", "public/vendor"]);
async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const relative = path.posix.join(dir, entry.name);
    if (excluded.has(relative)) continue;
    if (entry.isDirectory()) result.push(...await sourceFiles(relative));
    else if (entry.isFile() && extensions.has(path.extname(entry.name))) result.push(relative);
  }
  return result;
}

test("first-party project sources contain no retired product or institution names", async () => {
  const files = await sourceFiles(".");
  const failures: string[] = [];
  for (const file of files) {
    const source = await readFile(path.join(root, file), "utf8");
    if (retiredNames.some((name) => source.toLowerCase().includes(name.toLowerCase()))) failures.push(file);
  }
  assert.deepEqual(failures, [], "Unexpected retired branding in: " + failures.join(", "));
});

test("product metadata and copyright identify the independent owner", async () => {
  const read = (p: string) => readFile(path.join(root, p), "utf8");
  const [readme, copyright, layout, pkg, manifest, audit] = await Promise.all([
    read("README.md"), read("COPYRIGHT.md"), read("app/layout.tsx"), read("package.json"),
    read("public/manifest.webmanifest"), read("docs/CREVELIO_BRAND_2026-10-14.md"),
  ]);
  for (const body of [readme, copyright, layout, pkg, audit]) {
    assert.ok(body.includes("Eduardo Augusto García Rodríguez"));
  }
  assert.match(layout, /applicationName: "CREVELIO"/);
  assert.equal(JSON.parse(manifest).name, "CREVELIO");
  assert.equal(JSON.parse(pkg).author, "Eduardo Augusto García Rodríguez");
  assert.match(copyright, /All rights reserved/);
});
