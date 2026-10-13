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
  assert.match(editor, /const block = normalizeEditableBlockTag\(original\);\s+clearApaEditorClasses\(block\)/);
  assert.match(editor, /const keepRunIn = \["h4", "h5"\]\.includes\(styleName\)/);
});

test("preserves rich text and hyperlinks inside APA 7 level 4 and 5 headings", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  const formatter = await source("public/native-tools/estiloapa/app.js");
  for (const script of [editor, formatter]) {
    assert.match(script, /while \(paragraph\.firstChild\) label\.append\(paragraph\.firstChild\)/);
    assert.match(script, /label\.setAttribute\("aria-level", String\(level\)\)/);
    assert.match(script, /paragraph\.append\(document\.createTextNode\(" "\), \.\.\.\[\.\.\.following\.childNodes\]\)/);
  }
  assert.match(editor, /if \(label\) label\.replaceWith\(\.\.\.\[\.\.\.label\.childNodes\]\)/);
});

test("insert-link restores the selected range after the URL prompt", async () => {
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  assert.match(editor, /const safeUrl = validatedEditorLink\(url\)/);
  assert.match(editor, /if \(!restoreEditorSelection\(\) && !selectionInsidePreview\(\)\) return;/);
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
