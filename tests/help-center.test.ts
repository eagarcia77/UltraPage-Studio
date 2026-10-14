import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const read = (file: string) => readFile(new URL(file, root), "utf8");

test("Curralume provides a bilingual, searchable Help Center with all four guides", async () => {
  const page = await read("app/help/page.tsx");
  const css = await read("app/help/help.css");
  assert.match(page, /export default function HelpPage\(\)/);
  assert.match(page, /useMemo\(/);
  assert.match(page, /useState<Language>\("es"\)/);
  assert.match(page, /id="help-search"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /<details key=\{item.id\}>/);
  for (const id of ["studio", "estiloapa", "txt", "qti"]) {
    assert.ok(page.includes('id: "' + id + '"'), "Help guide missing: " + id);
  }
  for (const route of ["/", "/native-tools/estiloapa/index.html", "/native-tools/txt-test-generator/index.html", "/native-tools/qti-blackboard/index.html"]) {
    assert.ok(page.includes('href: "' + route + '"'), "Missing working launch route: " + route);
  }
  for (const term of ["Centro de ayuda", "Help Center", "Backspace", "iPhone", "404", "APA", "QTI", "GIFT", "offline"]) {
    assert.ok(page.includes(term), "Missing support term: " + term);
  }
  assert.match(page, /© 2026 Eduardo Augusto García Rodríguez\. All rights reserved\./);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.help-toc/);
  assert.match(css, /:focus-visible/);
});

test("editor and tool hub expose Help without unnecessary external standalone-version links", async () => {
  const editor = await read("app/page.tsx");
  const tools = await read("app/tools/page.tsx");
  const css = await read("app/globals.css");
  assert.match(editor, /className="studio-help-link" href="\/help"/);
  assert.match(tools, /className="native-tools-help"/);
  assert.ok(tools.includes('"/help#"'), "Context help should link to the selected tool guide");
  assert.doesNotMatch(tools, /Original standalone version/);
  assert.doesNotMatch(tools, /active\.original/);
  assert.doesNotMatch(css, /\.native-tools-original/);
  assert.match(css, /\.studio-help-link:focus-visible/);
  assert.match(css, /\.native-tools-help/);
});

test("each standalone native tool has a visible link to the relevant Help guide", async () => {
  const cases = [
    ["public/native-tools/estiloapa/index.html", "/help#estiloapa"],
    ["public/native-tools/txt-test-generator/index.html", "/help#txt"],
    ["public/native-tools/qti-blackboard/index.html", "/help#qti"],
  ] as const;
  for (const [path, href] of cases) {
    const html = await read(path);
    const $ = load(html);
    assert.equal($('a.native-help-link[href="' + href + '"]').length, 1, path);
    assert.equal($('a.native-help-link[href="' + href + '"]').text().trim(), "Help");
  }
  const theme = await read("public/native-tools/ultrapage-native-theme.css");
  assert.match(theme, /\.native-help-link:focus-visible/);
  const sw = await read("public/sw.js");
  assert.match(sw, /curralume-v78/);
  assert.ok(sw.includes('"/help"'), "Help page should be part of the offline shell");
});

test("Help page does not bypass core Curralume entry points", async () => {
  const page = await read("app/help/page.tsx");
  const main = await read("app/page.tsx");
  const tools = await read("app/tools/page.tsx");
  assert.match(page, /href="\/tools"/);
  assert.match(page, /href="\/"/);
  assert.match(main, /const starterHtml/);
  assert.match(tools, /id="native-tool-panel"/);
});
