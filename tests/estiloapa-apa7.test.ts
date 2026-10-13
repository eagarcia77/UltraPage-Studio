import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path: string) {
  return readFile(new URL(path, root), "utf8");
}

test("maps imported headings to all five APA 7 levels", async () => {
  const app = await source("public/native-tools/estiloapa/app.js");
  assert.match(app, /\["H4", "level-4"\]/);
  assert.match(app, /\["H5", "level-5"\]/);
  assert.match(app, /normalizeRunInHeadings\(root\)/);
  assert.match(app, /normalizePaperTitles\(root\)/);
  assert.match(app, /dataset\.apaRunIn = "true"/);
});

test("keeps level 4 and 5 body text separate from the bold run-in label", async () => {
  const app = await source("public/native-tools/estiloapa/app.js");
  const docx = await source("public/native-tools/estiloapa/docx-enhance.js");
  const editor = await source("public/native-tools/estiloapa/apa-editor-v30.js");
  for (const file of [app, docx, editor]) assert.match(file, /apa-run-in-heading/);
  assert.match(docx, /\[4, 5\]\.includes\(headingLevel\)/);
  assert.match(docx, /options\.indent = \{ firstLine: 720 \}/);
  assert.match(editor, /aria-level/);
});

test("uses APA 7 heading rules for HTML and accessible PDF exports", async () => {
  const app = await source("public/native-tools/estiloapa/app.js");
  const route = await source("app/api/export/route.ts");
  assert.match(app, /styleProfile: "apa7"/);
  assert.match(app, /\.apa-heading-level-5 \.apa-run-in-heading/);
  assert.match(route, /styleProfile\?: "apa7"/);
  assert.match(route, /AccessibleSansBoldItalic/);
  assert.match(route, /apaHeadingLevel === 1 \? "center" : "left"/);
  assert.match(route, /classes\.has\("apa-body-title"\).*pdf\.addPage\(\)/);
});

test("audits hierarchy jumps and malformed run-in headings", async () => {
  const app = await source("public/native-tools/estiloapa/app.js");
  assert.match(app, /function auditApaHeadings/);
  assert.match(app, /jumps from level/);
  assert.match(app, /has no paragraph text continuing on the same line/);
  assert.match(app, /headingProblems/);
});

test("builds a standard APA student paper and semantic Word outline", async () => {
  const app = await source("public/native-tools/estiloapa/app.js");
  const docx = await source("public/native-tools/estiloapa/docx-enhance.js");
  assert.match(app, /function normalizeStandardStudentPaper/);
  assert.match(app, /apa-cover-line/);
  assert.match(app, /apa-body-title/);
  assert.match(app, /\^parte\\s\+\\d\+\\s\*:/);
  assert.match(app, /\^\(pregunta\|problema\)\\s\+\\d\+/);
  assert.match(docx, /HeadingLevel\[`HEADING_\$\{headingLevel\}`\]/);
  assert.match(docx, /options\.pageBreakBefore = true/);
  assert.doesNotMatch(docx, /if \(!institutional && !hasFigures\) return false/);
});

test("uses APA minimal table rules and removes duplicate table labels", async () => {
  const docx = await source("public/native-tools/estiloapa/docx-enhance.js");
  const media = await source("public/native-tools/estiloapa/table-figure-v32.js");
  assert.match(docx, /insideVertical: none/);
  assert.match(docx, /bottom: \(isHeader \|\| isLast\) \? single : none/);
  assert.match(media, /duplicateLabel\.remove\(\)/);
});

test("enforces APA double spacing without blank lines around headings", async () => {
  const css = await source("public/native-tools/estiloapa/styles.css");
  const docx = await source("public/native-tools/estiloapa/docx-enhance.js");
  const html = await source("public/native-tools/estiloapa/html-enhance.js");
  const lms = await source("public/native-tools/estiloapa/lms-export.js");
  const route = await source("app/api/export/route.ts");
  assert.match(css, /\.apa-heading \{ font: inherit; line-height: 2; margin: 0; \}/);
  assert.match(docx, /spacing: \{ line: 480, after: 0, before: 0 \}/);
  assert.match(html, /\.module-heading \{[^}]*margin: 0;/);
  assert.match(lms, /heading: "margin:0;/);
  assert.match(route, /styleProfile === "apa7" \? format\.fontSize : format\.lineGap/);
  assert.match(route, /styleProfile === "apa7" \? 0 : 8/);
});

test("keeps the formatter interface concise without stale release commentary", async () => {
  const index = await source("public/native-tools/estiloapa/index.html");
  const html = await source("public/native-tools/estiloapa/html-enhance.js");
  assert.doesNotMatch(index, /Version 3\.4 restored|The score is heuristic|Protected editing v3\.4\.9/);
  assert.doesNotMatch(index, /<footer>/);
  assert.match(index, /class="sr-only">Creates a tagged, accessible PDF/);
  assert.doesNotMatch(html, /function updateV347Ui/);
});

