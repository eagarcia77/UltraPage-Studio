/* Curralume Studio · © 2026 Eduardo Augusto García Rodríguez · Original contributions; third-party licenses preserved. */
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const base = new URL("../", import.meta.url);
const owner = "Eduardo Augusto García Rodríguez";
const copyright = "© 2026 Eduardo Augusto García Rodríguez";
const read = (path: string) => readFile(new URL(path, base), "utf8");

async function listSources(relativePath: string): Promise<string[]> {
  const entries = await readdir(new URL(relativePath || "./", base), { withFileTypes: true });
  const nested = await Promise.all(entries.flatMap((entry) => {
    const path = relativePath ? relativePath + "/" + entry.name : entry.name;
    if (entry.isDirectory() && !["node_modules", ".git", ".next", "vendor", "build"].includes(entry.name)) {
      return [listSources(path)];
    }
    return entry.isFile() && /\.(tsx?|mjs|js|css|html|yml)$/i.test(entry.name) && path !== "next-env.d.ts"
      ? [Promise.resolve([path])] : [];
  }));
  return nested.flat();
}

test("the owner is credited in every first-party source file and integration", async () => {
  const sources = await listSources("");
  assert.ok(sources.length >= 100, "Expected the complete first-party source set");
  for (const file of sources) {
    const content = await read(file);
    assert.ok(content.includes(owner), "Missing creator attribution: " + file);
  }
});

test("all three native tools and app metadata use consistent Curralume attribution", async () => {
  const files = [
    "public/native-tools/estiloapa/index.html",
    "public/native-tools/txt-test-generator/index.html",
    "public/native-tools/qti-blackboard/index.html",
  ];
  for (const file of files) {
    const $ = load(await read(file));
    assert.equal($('meta[name="author"]').attr("content"), owner, "Author metadata: " + file);
    assert.match($('meta[name="copyright"]').attr("content") || "", /© 2026 Eduardo Augusto García Rodríguez/);
    assert.ok($("footer").text().includes(copyright), "Visible rights notice missing: " + file);
  }
  const app = await read("app/layout.tsx");
  const about = await read("app/page.tsx");
  const help = await read("app/help/page.tsx");
  assert.ok(app.includes(owner));
  assert.ok(about.includes(owner));
  assert.ok(help.includes(owner));
  assert.equal(JSON.parse(await read("public/manifest.webmanifest")).author, owner);
  assert.equal(JSON.parse(await read("public/native-tools/manifest.json")).author, owner);
  assert.equal(JSON.parse(await read("package.json")).author, owner);
  assert.ok((await read("LICENSE")).includes(copyright));
});

test("retired identity and institutional affiliations are absent from the source text", async () => {
  const sources = await listSources("");
  const oldProductName = /UltraPage\s+Studio/i;
  const formerInstitution = /(?:universidad|university)\s+interamericana/i;
  const formerAcronym = new RegExp(["\\bU", "CAN\\b"].join(""), "i");
  const docs = [
    "README.md",
    "docs/BRAND_AUDIT_2026-10-09.md",
    "docs/NATIVE_TOOLS_AUDIT_2026-10-02.md",
  ];
  for (const file of [...sources, ...docs]) {
    const content = await read(file);
    assert.doesNotMatch(content, oldProductName, "Retired product branding: " + file);
    assert.doesNotMatch(content, formerInstitution, "Retired institutional name: " + file);
    assert.doesNotMatch(content, formerAcronym, "Retired institutional acronym: " + file);
  }
});

test("unused legacy brand images are removed without losing current PWA graphics", async () => {
  for (const file of [
    "public/brand/ultrapage-mark.svg",
    "public/brand/ultrapage-icon-192.png",
    "public/brand/ultrapage-icon-512.png",
  ]) {
    await assert.rejects(access(new URL(file, base)), { code: "ENOENT" });
  }
  const art = await read("public/brand/curralume-mark.svg");
  assert.match(art, /Eduardo Augusto García Rodríguez/);
  assert.match(await read("public/favicon.svg"), /Eduardo Augusto García Rodríguez/);
  assert.match(await read("public/sw.js"), /curralume-v80/);
  assert.match(await read("app/layout.tsx"), /curralume-mark/);
});
