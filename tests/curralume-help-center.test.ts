import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const source = (path: string) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Curralume Help covers the editor, three native tools, mobile and recovery in both languages", async () => {
  const help = await source("app/help/page.tsx");
  const expected = ["studio", "webdav", "apa", "txt", "qti", "mobile", "recovery", "exports"];
  for (const id of expected) {
    assert.match(help, new RegExp('id: "' + id + '"'));
  }
  for (const phrase of [
    "Centro de ayuda", "Help Center", "Guías paso a paso",
    "Step-by-step guides", "AutoSave", "Preflight",
    "Target LMS", "Question bank content", "Load and process", "Content Collection", "Connect to Blackboard",
    "Curralume Studio", "Eduardo Augusto García Rodríguez",
  ]) {
    assert.ok(help.includes(phrase), "Help copy missing: " + phrase);
  }
  assert.match(help, /type Language = "es" \| "en"/);
  assert.match(help, /type="search"/);
  assert.match(help, /aria-pressed=\{category === item\.id\}/);
  assert.match(help, /aria-live="polite"/);
  assert.match(help, /help-skip/);
  assert.match(help, /lang=\{spanish \? "es-PR" : "en-US"\}/);
  assert.match(help, /normalizeHelpQuery\(value\)\.includes\(normalizeHelpQuery\(query\)\)/);
  assert.match(help, /topic\.es\.tip/);
  assert.match(help, /topic\.href === "\/tools"/);
  assert.match(help, /\[\\u0300-\\u036f\]/);
  assert.match(help, /filtered\.length === 0/);
});

test("Help navigation is available from Studio, the tools hub and all standalone editors", async () => {
  const main = await source("app/page.tsx");
  const tools = await source("app/tools/page.tsx");
  assert.match(main, /href="\/help" className="studio-help-link"/);
  assert.match(tools, /href=\{\`\/help#\$\{selected\}\`\} className="native-tools-help"/);
  assert.match(tools, /href=\{\`\/help#\$\{selected\}\`\}/);
  assert.doesNotMatch(tools, /active\.original|Original standalone version/);
  const pages: Array<[string, string]> = [
    ["estiloapa", "apa"], ["txt-test-generator", "txt"], ["qti-blackboard", "qti"],
  ];
  for (const [folder, topic] of pages) {
    const html = await source("public/native-tools/" + folder + "/index.html");
    const $ = load(html);
    assert.equal($('a.curralume-native-help[href="/help#' + topic + '"]').length, 1,
      folder + ": contextual Help link missing");
    assert.ok($("main").length > 0, folder + ": main editing UI must remain available");
  }
});

test("responsive Help styles and owner attribution are scoped to Help Center", async () => {
  const page = await source("app/help/page.tsx");
  const css = await source("app/help/help.css");
  const global = await source("app/globals.css");
  const native = await source("public/native-tools/ultrapage-native-theme.css");
  const apa = await source("public/native-tools/estiloapa/ultrapage-theme.css");
  assert.match(css, /\.curralume-help/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /\.help-grid \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.help-search input \{ min-width: 0/);
  assert.match(global, /\.studio-help-link/);
  assert.match(global, /\.native-tools-help/);
  assert.match(native, /\.curralume-native-help/);
  assert.match(apa, /\.curralume-native-help/);
  assert.match(page, /© 2026 Eduardo Augusto García Rodríguez/);
  const metadata = await source("app/help/layout.tsx");
  assert.match(metadata, /Help Center \| Curralume Studio/);
});

test("the Help route is pre-cached and covered by production HTTP smoke tests", async () => {
  const worker = await source("public/sw.js");
  const smoke = await source("scripts/smoke-native-routes.mjs");
  assert.match(worker, /curralume-v79/);
  assert.match(worker, /"\/help"/);
  assert.match(smoke, /origin \+ "\/help"/);
  assert.match(smoke, /help-search-input/);
  assert.ok(worker.includes("/native-tools/estiloapa/index.html"));
  assert.ok(worker.includes("/native-tools/txt-test-generator/index.html"));
  assert.ok(worker.includes("/native-tools/qti-blackboard/index.html"));
});
