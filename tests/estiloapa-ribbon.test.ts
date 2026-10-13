import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ribbonGroupCategory } from "../public/native-tools/estiloapa/editor-ribbon.js";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");

test("ribbon groups keep core editor commands in the correct tabs", () => {
  assert.equal(ribbonGroupCategory("History"), "home");
  assert.equal(ribbonGroupCategory("Text formatting"), "home");
  assert.equal(ribbonGroupCategory("Alignment"), "home");
  assert.equal(ribbonGroupCategory("", true), "home");
  assert.equal(ribbonGroupCategory("Indentation and line spacing"), "layout");
  assert.equal(ribbonGroupCategory("APA 7 presets"), "layout");
  assert.equal(ribbonGroupCategory("Insert"), "insert");
  assert.equal(ribbonGroupCategory("", false, true), "review");
});

test("ribbon uses tabs, panes, keyboard navigation, and live APA formatting context", async () => {
  const ribbon = await read("public/native-tools/estiloapa/editor-ribbon.js");
  const styles = await read("public/native-tools/estiloapa/editor-ribbon.css");
  for (const tab of ["home", "layout", "insert", "review"]) assert.match(ribbon, new RegExp('id: "' + tab + '"'));
  assert.match(ribbon, /setAttribute\("role", "tablist"\)/);
  assert.match(ribbon, /setAttribute\("role", "tabpanel"\)/);
  assert.match(ribbon, /setAttribute\("aria-selected", String\(active\)\)/);
  assert.match(ribbon, /\["ArrowLeft", "ArrowRight", "Home", "End"\]/);
  assert.match(ribbon, /queryCommandState\(command\)/);
  assert.match(ribbon, /setAttribute\("aria-pressed", String\(pressed\)\)/);
  assert.match(ribbon, /shell\.dataset\.ribbonEnhanced === "true"/);
  assert.match(styles, /\.preview-panel \{ overflow: visible !important; \}/);
  assert.match(styles, /#apaEditorShell\.apa-modern-ribbon \{[\s\S]*position: sticky;/);
  assert.match(styles, /\.apa-ribbon-pane\[hidden\] \{ display: none !important; \}/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /@media print/);
});

test("ribbon moves original buttons without cloning or rewiring core events", async () => {
  const ribbon = await read("public/native-tools/estiloapa/editor-ribbon.js");
  const editor = await read("public/native-tools/estiloapa/apa-editor-v30.js");
  assert.match(ribbon, /panes\.get\(destination\)\.append\(group\)/);
  assert.match(ribbon, /toolbar\.replaceChildren\(\.\.\.RIBBON_TABS\.map/);
  assert.match(editor, /querySelectorAll\("button\[data-cmd\]"\)/);
  assert.match(editor, /querySelectorAll\("button\[data-align\]"\)/);
  assert.match(editor, /querySelectorAll\("button\[data-indent\]"\)/);
  assert.match(ribbon, /document\.querySelector\("#reauditBtn"\)/);
  assert.match(ribbon, /document\.querySelector\("#downloadAuditBtn"\)/);
  assert.match(ribbon, /auditGroup\.append\(runAudit, downloadReport, caption\)/);
  assert.match(ribbon, /redundantAuditToolbar\.remove\(\)/);
  assert.doesNotMatch(ribbon, /connectAuditShortcut/);
  assert.match(ribbon, /command\.button\.click\(\)/);
});

test("ribbon is part of the local-first cached EstiloAPA application", async () => {
  const index = await read("public/native-tools/estiloapa/index.html");
  const sw = await read("public/sw.js");
  assert.match(index, /<script type="module" src="editor-ribbon\.js"><\/script>/);
  assert.match(index, /<link rel="stylesheet" href="editor-ribbon\.css">/);
  assert.match(sw, /curralume-v56/);
  assert.match(sw, /\/native-tools\/estiloapa\/editor-ribbon\.js/);
  assert.match(sw, /\/native-tools\/estiloapa\/editor-ribbon\.css/);
});
