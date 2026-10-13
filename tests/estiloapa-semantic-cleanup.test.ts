import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("header and document toolbar have direct semantic headings without single-child wrappers", async () => {
  const html = await source("public/native-tools/estiloapa/index.html");
  const $ = load(html);
  assert.equal($(".site-header .header-inner > h1").length, 1);
  assert.equal($(".site-header .header-inner > div").length, 0);
  assert.equal($(".preview-toolbar > h2#preview-title").length, 1);
  assert.equal($(".preview-toolbar > div:not(.button-row)").length, 0);
  assert.equal($("#preview").attr("contenteditable"), "true");
  for (const id of ["formatBtn", "reauditBtn", "downloadAuditBtn", "downloadDocxBtn", "downloadPdfBtn", "checkLmsBtn"]) {
    assert.equal($(`#${id}`).length, 1, `Missing editor command ${id}`);
  }
});

test("workspace removes unused wrapper while preserving named search, outline and zoom controls", async () => {
  const workspace = await source("public/native-tools/estiloapa/editor-workspace.js");
  const styles = await source("public/native-tools/estiloapa/editor-workspace.css");
  assert.match(workspace, /<output id="apaWorkspaceStats" aria-live="off">/);
  assert.doesNotMatch(workspace, /class="apa-workspace-summary"/);
  assert.doesNotMatch(styles, /apa-workspace-summary/);
  assert.match(workspace, /<label for="apaWorkspaceZoom">Zoom<\/label>/);
  assert.match(workspace, /<select id="apaWorkspaceZoom" aria-controls="preview">/);
  assert.doesNotMatch(workspace, /<select id="apaWorkspaceZoom"[^>]*aria-label=/);
  assert.match(workspace, /<label for="apaWorkspaceOutline">Outline<\/label>/);
  assert.match(workspace, /setupDocumentFind\(documentArea, bar\)/);
  assert.match(styles, /#apaWorkspaceStats/);
});

test("Ribbon tabpanels are named by their controlling tab rather than competing aria-labels", async () => {
  const ribbon = await source("public/native-tools/estiloapa/editor-ribbon.js");
  const css = await source("public/native-tools/estiloapa/editor-ribbon.css");
  assert.match(ribbon, /pane\.setAttribute\("role", "tabpanel"\)/);
  assert.match(ribbon, /pane\.setAttribute\("aria-labelledby", button\.id\)/);
  assert.doesNotMatch(ribbon, /pane\.setAttribute\("aria-label"/);
  assert.match(ribbon, /button\.setAttribute\("aria-controls", `apaRibbonPane-\$\{tab\.id\}`\)/);
  assert.match(ribbon, /tabList\.addEventListener\("keydown"/);
  assert.match(css, /#apaEditorShell\.apa-modern-ribbon/);
});

test("new semantic markup ships in the current offline cache", async () => {
  const sw = await source("public/sw.js");
  assert.match(sw, /curralume-v60/);
  for (const path of ["index.html", "editor-workspace.js", "editor-workspace.css", "editor-ribbon.js", "editor-ribbon.css"]) {
    assert.ok(sw.includes(`/native-tools/estiloapa/${path}`), `Uncached essential asset: ${path}`);
  }
});
