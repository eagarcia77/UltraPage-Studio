import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("audit controls have exactly one authoritative source in the EstiloAPA markup", async () => {
  const html = await source("public/native-tools/estiloapa/index.html");
  const $ = load(html);
  for (const id of ["reauditBtn", "downloadAuditBtn", "formatBtn", "downloadDocxBtn", "downloadHtmlBtn", "downloadPdfBtn"]) {
    assert.equal($(`#${id}`).length, 1, `Control ${id} must be unique`);
  }
  assert.equal($("#reauditBtn").prop("disabled"), true);
  assert.equal($("#downloadAuditBtn").prop("disabled"), true);
  assert.equal($(".audit .native-action-ribbon").length, 1, "Original controls must remain accessible as fallback");
  assert.match(html, /<h2 id="preview-title">3\. Editable document<\/h2>/);
  assert.doesNotMatch(html, /Select a document or choose <strong>Try sample<\/strong>/);
});

test("ribbon reuses audit controls and avoids creating duplicate proxy actions", async () => {
  const ribbon = await source("public/native-tools/estiloapa/editor-ribbon.js");
  const app = await source("public/native-tools/estiloapa/app.js");
  assert.match(ribbon, /const runAudit = document\.querySelector\("#reauditBtn"\)/);
  assert.match(ribbon, /const downloadReport = document\.querySelector\("#downloadAuditBtn"\)/);
  assert.match(ribbon, /auditGroup\.append\(runAudit, downloadReport, caption\)/);
  assert.match(ribbon, /redundantAuditToolbar\.remove\(\)/);
  assert.doesNotMatch(ribbon, /connectAuditShortcut|apaRibbonRunAudit|apaRibbonAuditReport|apa-ribbon-context-hint/);
  assert.match(app, /els\.reauditBtn\.addEventListener\("click", runAudit\)/);
  assert.match(app, /els\.downloadAuditBtn\.addEventListener\("click", downloadAudit\)/);
});

test("legacy unused utilities and stale presentation copy are absent", async () => {
  const formatter = await source("public/native-tools/estiloapa/app.js");
  const exporter = await source("public/native-tools/estiloapa/apa-editor-export-v30.js");
  const css = await source("public/native-tools/estiloapa/editor-ribbon.css");
  const sw = await source("public/sw.js");
  assert.doesNotMatch(formatter, /function ensureTerminalPeriod\(/);
  assert.doesNotMatch(exporter, /APA_EDITOR_EXPORT_VERSION/);
  assert.doesNotMatch(css, /apa-ribbon-context-hint/);
  const workspaceCss = await source("public/native-tools/estiloapa/editor-workspace.css");
  const page = await source("public/native-tools/estiloapa/index.html");
  const ribbon = await source("public/native-tools/estiloapa/editor-ribbon.js");
  assert.doesNotMatch(workspaceCss, /#apaEditorShell \{ display: contents; \}/);
  assert.doesNotMatch(workspaceCss, /#apaEditorToolbar \{/);
  assert.doesNotMatch(page, /id="lmsExportHelp"/);
  assert.doesNotMatch(ribbon, /return \{ label, block \}/);
  const headingJs = await source("public/native-tools/estiloapa/editor-workspace.js");
  const ribbonStyles = await source("public/native-tools/estiloapa/editor-ribbon.css");
  const thesisStyles = await source("public/native-tools/estiloapa/thesis-alignment.js");
  assert.equal(headingJs.includes("<strong>Document workspace</strong>"), false);
  assert.doesNotMatch(ribbon, /apaRibbonCommandPicker|quickCommands/);
  assert.doesNotMatch(ribbonStyles, /apa-ribbon-head|apa-ribbon-quick-actions|apaRibbonCommandPicker/);
  assert.doesNotMatch(thesisStyles, /THESIS_ALIGNMENT_VERSION/);
  assert.match(sw, /curralume-v64/);
});
