import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const read = (path: string) => readFile(new URL("../" + path, import.meta.url), "utf8");
const operator = "ZENQAVIO Technologies";
const creator = "Eduardo Augusto García Rodríguez";

test("project documentation distinguishes operator, creator and copyright holder", async () => {
  const paths = ["README.md", "COPYRIGHT.md", "docs/CREVELIO_BRAND_2026-10-14.md"];
  for (const path of paths) {
    const source = await read(path);
    assert.ok(source.includes(operator), path + " should identify responsible company");
    assert.ok(source.includes(creator), path + " should preserve creator attribution");
    assert.ok(source.includes("© 2026 " + creator), path + " should preserve the rights notice");
  }
  const copyright = await read("COPYRIGHT.md");
  assert.match(copyright, /does not, by itself, transfer copyright/);
  assert.match(copyright, /third-party/i);
});

test("application metadata names company as publisher without replacing individual author", async () => {
  const layout = await read("app/layout.tsx");
  const pkg = JSON.parse(await read("package.json"));
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const toolsManifest = JSON.parse(await read("public/native-tools/manifest.json"));
  const health = await read("app/api/health/route.ts");

  assert.ok(layout.includes('creator: "' + creator + '"'));
  assert.ok(layout.includes('publisher: "' + operator + '"'));
  assert.ok(layout.includes('operator: "' + operator + '"'));
  assert.ok(layout.includes('copyright: "© 2026 ' + creator));
  assert.equal(pkg.author, creator);
  assert.equal(pkg.organization, operator);
  assert.equal(manifest.name, "CREVELIO");
  assert.ok(manifest.description.includes(operator));
  assert.equal(toolsManifest.operator, operator);
  assert.equal(toolsManifest.creator, creator);
  assert.ok(health.includes('operator: "' + operator + '"'));
  assert.ok(health.includes('creator: "' + creator + '"'));
});

test("visible About, Help and native tool headers credit the responsible company", async () => {
  const editor = await read("app/page.tsx");
  const help = await read("app/help/page.tsx");
  const tools = await read("app/tools/page.tsx");

  assert.match(editor, /<dt>Responsible company<\/dt><dd>ZENQAVIO Technologies<\/dd>/);
  assert.match(editor, /<small>Creator and copyright holder<\/small>/);
  assert.ok(editor.includes("ZENQAVIO Technologies · Multi-LMS editor"));
  assert.ok(help.includes("Operado por ZENQAVIO Technologies"));
  assert.ok(help.includes("Operated by ZENQAVIO Technologies"));
  assert.ok(tools.includes("ZENQAVIO Technologies · Native Tools"));
});

test("APA, TXT and QTI native tools show company credit while preserving author rights", async () => {
  for (const path of [
    "public/native-tools/estiloapa/index.html",
    "public/native-tools/txt-test-generator/index.html",
    "public/native-tools/qti-blackboard/index.html",
  ]) {
    const html = await read(path);
    assert.ok(html.includes(operator), path);
    assert.ok(html.includes(creator), path);
    const $ = load(html);
    if (path.includes("estiloapa")) {
      assert.equal($(".site-header h1").text().trim(), "APA7 Academic Formatter");
      assert.equal($(".curralume-company-credit").text().trim(), operator);
    } else {
      assert.ok($("footer").text().includes(operator));
      assert.ok($("footer").text().includes("© 2026 " + creator));
    }
  }
});
