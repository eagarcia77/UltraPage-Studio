import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatedEditorLink } from "../public/native-tools/estiloapa/editor-link-validation.js";

const root = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, root), "utf8");

test("allows legitimate link schemes while rejecting unsafe or incomplete URLs", () => {
  assert.equal(validatedEditorLink(" https://example.org/recurso "), "https://example.org/recurso");
  assert.equal(validatedEditorLink("http://example.org"), "http://example.org/");
  assert.equal(validatedEditorLink("mailto:profesor@example.org"), "mailto:profesor@example.org");
  for (const url of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///private/file", "//example.org", "https://", "mailto:", ""]) {
    assert.equal(validatedEditorLink(url), "", `unsafe URL accepted: ${url}`);
  }
});

test("resets stale heading metadata before paragraph and reference preset application", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  assert.match(editor, /delete block\.dataset\.apaHeadingLevel/);
  assert.match(editor, /delete block\.dataset\.apaRunIn/);
  assert.match(editor, /"level-1", "level-2", "level-3", "level-4", "level-5"/);
  assert.match(editor, /function normalizeEditableBlockTag\(block\)/);
  assert.match(editor, /const block = normalizeEditableBlockTag\(original\);\s+lastBlock = block;\s+clearApaEditorClasses\(block\)/);
  assert.match(editor, /const keepRunIn = \["h4", "h5"\]\.includes\(styleName\)/);
});

test("preserves rich text and hyperlinks inside APA 7 level 4 and 5 headings", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  const formatter = await source("public/native-tools/estiloapa/app.js");
  for (const script of [editor, formatter]) {
    assert.match(script, /while \(paragraph\.firstChild\) label\.append\(paragraph\.firstChild\)/);
    assert.match(script, /label\.setAttribute\("aria-level", String\(level\)\)/);
  }
  assert.match(formatter, /paragraph\.append\(document\.createTextNode\(" "\), \.\.\.\[\.\.\.following\.childNodes\]\)/);
  assert.doesNotMatch(editor, /following\.remove\(\)|mergeFollowing/);
  assert.match(editor, /if \(label\) label\.replaceWith\(\.\.\.\[\.\.\.label\.childNodes\]\)/);
});

test("insert-link restores the selected range after the URL prompt", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  assert.match(editor, /const safeUrl = validatedEditorLink\(url\)/);
  assert.match(editor, /const selected = selectionInsidePreview\(\) \? window.getSelection\(\)\?\.getRangeAt\(0\)\.cloneRange\(\)/);
  assert.match(editor, /selection\.addRange\(selected\)/);
  assert.match(editor, /document\.execCommand\("insertHTML", false,/);
  assert.match(editor, /document\.execCommand\("createLink", false, safeUrl\)/);
});

test("workspace outline only moves the cursor inside the editable document", async () => {
  const workspace = await source("public/native-tools/estiloapa/editor-workspace.js");
  const css = await source("public/native-tools/estiloapa/editor-workspace.css");
  assert.match(workspace, /headingTargets = \[\.\.\.documentArea\.querySelectorAll\(headingSelector\)\]/);
  assert.match(workspace, /documentArea\.contains\(heading\)/);
  assert.match(workspace, /range\.selectNodeContents\(heading\)/);
  assert.match(css, /#apaWorkspaceOutline/);
});

test("changing an APA style clears stale module and thesis classes", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  const resetSection = editor.slice(editor.indexOf("function clearApaEditorClasses("), editor.indexOf("function normalizeEditableBlockTag("));
  for (const oldClass of [
    "thesis-table-label", "thesis-table-title", "thesis-figure-label",
    "thesis-figure-title", "module-table-label", "module-table-title",
    "module-figure-label", "module-figure-title", "thesis-note",
    "apa-title", "thesis-chapter-heading", "thesis-chapter-title"
  ]) {
    assert.ok(resetSection.includes(`"${oldClass}"`), `Stale APA class not cleared: ${oldClass}`);
  }
  assert.match(resetSection, /classes\.forEach\(\(name\) => block\.classList\.remove\(name\)\)/);
});

test("manually converting a heading to APA level 4 or 5 does not join the next paragraph", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  const exporter = await source("public/native-tools/estiloapa/apa-editor-export-v30.js");
  const headingSection = editor.slice(editor.indexOf("function normalizeEditorRunInHeading("), editor.indexOf("window.normalizeEditorRunInHeading ="));
  assert.match(headingSection, /function normalizeEditorRunInHeading\(block, level\)/);
  assert.doesNotMatch(headingSection, /nextElementSibling|following\.remove\(\)|mergeFollowing/);
  assert.match(editor, /lastBlock = normalizeEditorRunInHeading\(block, level\)/);
  for (const level of [4, 5]) {
    assert.ok(exporter.includes(`normalizeEditorRunInHeading(block, ${level})`));
  }
});
