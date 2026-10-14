import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const read = (path: string) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("EstiloAPA preserves accessible upload and full formatting controls", async () => {
  const html = await read("public/native-tools/estiloapa/index.html");
  const $ = load(html);
  assert.equal($('meta[name="viewport"]').attr("content"), "width=device-width, initial-scale=1");
  assert.equal($("#files[type=file][multiple]").length, 1);
  assert.equal($('label.drop-zone[for="files"]').length, 1);
  assert.equal($("#fileList[aria-live]").length, 1);
  assert.equal($("#formatProfile option").length, 4);
  assert.equal($("#fontFamily option").length, 4);
  for (const id of ["firstLineIndent", "hangingReferences", "sortReferences", "pageNumbers"]) {
    assert.equal($("#" + id + "[type=checkbox]").length, 1, id + " must remain editable");
  }
  for (const id of ["formatBtn", "downloadDocxBtn", "downloadPdfBtn", "downloadHtmlBtn", "checkLmsBtn", "preview"]) {
    assert.equal($("#" + id).length, 1, id + " is an essential editor action");
  }
});

test("mobile grid and controls cannot force the editor card wider than the viewport", async () => {
  const base = await read("public/native-tools/estiloapa/styles.css");
  const theme = await read("public/native-tools/estiloapa/ultrapage-theme.css");
  assert.match(base, /@media\s*\(max-width:\s*820px\)\s*\{\s*\.layout\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(theme, /@media\s*\(max-width:\s*820px\)/);
  assert.match(theme, /\.layout\s*>\s*\.panel,[\s\S]*?\.controls\s+\.file-item\s*\{\s*min-width:\s*0;\s*max-width:\s*100%/);
  assert.match(theme, /\.controls\s+\.drop-zone\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(theme, /\.controls\s+\.drop-zone\s+input\[type="file"\]\s*\{[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%/);
  assert.match(theme, /\.controls\s+fieldset\s*\{[\s\S]*?width:\s*100%;[\s\S]*?padding:\s*12px\s*!important/);
  assert.match(theme, /\.controls\s+fieldset\s+select\s*\{[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%/);
  assert.match(theme, /\.controls\s+\.file-item\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(theme, /\.controls\s+\.file-item\s*>\s*\*\s*\{[\s\S]*?min-width:\s*0/);
});

test("remove obsolete subtitle and eyebrow selectors absent from the header", async () => {
  const html = await read("public/native-tools/estiloapa/index.html");
  const $ = load(html);
  assert.equal($(".site-header .subtitle, .site-header .eyebrow").length, 0);
  const theme = await read("public/native-tools/estiloapa/ultrapage-theme.css");
  assert.doesNotMatch(theme, /\.site-header\s+\.subtitle\s*\{/);
  assert.doesNotMatch(theme, /\.site-header\s+\.eyebrow\s*\{/);
  assert.equal($(".site-header h1").text().trim(), "APA7 Academic Formatter");
});

test("mobile fix preserves APA paper and offline essentials", async () => {
  const html = await read("public/native-tools/estiloapa/index.html");
  const base = await read("public/native-tools/estiloapa/styles.css");
  const workspace = await read("public/native-tools/estiloapa/editor-workspace.css");
  const sw = await read("public/sw.js");
  assert.match(base, /@media print/);
  assert.match(base, /\.apa-paper\s*\{[^}]*width:\s*8\.5in/);
  assert.match(base, /\.apa-paper\s+\.apa-reference/);
  assert.match(workspace, /#apaWorkspaceBar/);
  assert.match(html, /contenteditable="true"/);
  assert.match(sw, /crevelio-v84/);
  assert.ok(sw.includes("/native-tools/estiloapa/styles.css"));
  assert.ok(sw.includes("/native-tools/estiloapa/ultrapage-theme.css"));
});
