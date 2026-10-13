import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { summarizeDocumentText } from "../public/native-tools/estiloapa/editor-workspace.js";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("counts Spanish academic text and ignores empty document content", () => {
  assert.equal(summarizeDocumentText("Estrategia de aprendizaje con APA 7.").words, 6);
  assert.deepEqual(summarizeDocumentText("  \n  "), { words: 0, characters: 0 });
  assert.equal(summarizeDocumentText("diseño, evaluación y accesibilidad").words, 4);
});

test("isolates zoom and focus controls from the exportable document", async () => {
  const index = await source("public/native-tools/estiloapa/index.html");
  const script = await source("public/native-tools/estiloapa/editor-workspace.js");
  const styles = await source("public/native-tools/estiloapa/editor-workspace.css");
  const worker = await source("public/sw.js");
  assert.match(index, /src="editor-workspace\.js"/);
  assert.match(index, /href="editor-workspace\.css"/);
  assert.match(script, /scrollArea\.style\.setProperty\("--apa-workspace-zoom"/);
  assert.match(script, /new MutationObserver\(queueStats\)/);
  assert.match(script, /setAttribute\("aria-pressed"/);
  const ribbonCss = await source("public/native-tools/estiloapa/editor-ribbon.css");
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  assert.doesNotMatch(styles, /#apaEditorShell \{ display: contents; \}/);
  assert.doesNotMatch(styles, /#apaEditorToolbar \{[\s\S]*?position: sticky;/);
  assert.match(ribbonCss, /#apaEditorShell\.apa-modern-ribbon \{[\s\S]*position: sticky;/);
  assert.match(editor, /\.apa-editor-toolbar \{[\s\S]*position:sticky;/);
  assert.match(styles, /@media print/);
  assert.match(worker, /\/native-tools\/estiloapa\/editor-workspace\.js/);
  assert.match(worker, /\/native-tools\/estiloapa\/editor-workspace\.css/);
});
