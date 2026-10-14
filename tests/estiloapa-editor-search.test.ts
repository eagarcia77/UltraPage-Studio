import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findOccurrences } from "../public/native-tools/estiloapa/editor-search.js";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("document search finds mixed-case Spanish text without changing the source", () => {
  const paragraph = "Educación en línea. La EDUCACIÓN es accesible.";
  const original = paragraph;
  const hits = findOccurrences(paragraph, "educación");
  assert.equal(hits.length, 2);
  assert.equal(paragraph, original);
  assert.equal(findOccurrences(paragraph, "").length, 0);
  assert.deepEqual(findOccurrences("A B A", "a"), [{ start: 0, end: 1 }, { start: 4, end: 5 }]);
  assert.deepEqual(findOccurrences("aaaa", "aa"), [{ start: 0, end: 2 }, { start: 2, end: 4 }]);
  assert.equal(findOccurrences("a a a", "a", 2).length, 2);
});

test("search does not rewrite academic markup and supports both directions", async () => {
  const search = await source("public/native-tools/estiloapa/editor-search.js");
  const workspace = await source("public/native-tools/estiloapa/editor-workspace.js");
  const css = await source("public/native-tools/estiloapa/editor-workspace.css");
  assert.match(search, /document\.createTreeWalker\(root, NodeFilter\.SHOW_TEXT\)/);
  assert.match(search, /range\.setStart\(first\.node/);
  assert.match(search, /range\.setEnd\(last\.node/);
  assert.match(search, /current < 0 \? \(direction > 0 \? 0 : locations\.length - 1\)/);
  assert.match(search, /window\.apaSaveEditorSelection\?\.\(\)/);
  assert.match(workspace, /setupDocumentFind\(documentArea, bar\)/);
  assert.match(workspace, /id="apaWorkspaceFind"/);
  assert.match(css, /#apaWorkspaceFind/);
});

test("APA style changes preserve an editable caret and independent paragraphs", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  const exporter = await source("public/native-tools/estiloapa/apa-editor-export-v30.js");
  assert.match(editor, /function placeEditorCaret\(block\)/);
  assert.match(editor, /savedRange = range\.cloneRange\(\)/);
  assert.match(editor, /if \(!restoreEditorSelection\(\)\) return \[\];/);
  assert.match(editor, /lastBlock = normalizeEditorRunInHeading\(block, level\);/);
  assert.doesNotMatch(editor, /mergeFollowing|following\.remove\(\)/);
  assert.match(editor, /if \(!preview\(\)\?\.contains\(original\)\) continue;/);
  assert.match(exporter, /normalizeEditorRunInHeading\(block, 4\)/);
  assert.match(exporter, /normalizeEditorRunInHeading\(block, 5\)/);
});

test("service worker includes updated search module", async () => {
  const worker = await source("public/sw.js");
  assert.match(worker, /curralume-v64/);
  assert.match(worker, /\/native-tools\/estiloapa\/editor-search\.js/);
});
