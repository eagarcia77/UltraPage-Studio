import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const htmlPath = new URL("../public/native-tools/qti-blackboard/index.html", import.meta.url);
const cssPath = new URL("../public/native-tools/qti-blackboard/qti-layout.css", import.meta.url);

test("QTI 2.1 keeps all five sample question formats in an accessible collapsible section", async () => {
  const html = await readFile(htmlPath, "utf8");
  const $ = load(html);
  assert.equal($('link[rel="stylesheet"][href="qti-layout.css"]').length, 1);
  assert.equal($('details.qti-example-details').length, 1);
  assert.equal($('details.qti-example-details summary').length, 1);
  assert.equal($('details.qti-example-details').attr("open"), undefined, "Examples should not overwhelm the initial phone screen");
  const examples = $('details.qti-example-details pre').text();
  for (const marker of ["MC 1.", "MA 2.", "TF 3.", "FIB 4.", "ESSAY 5."]) {
    assert.ok(examples.includes(marker), "Example was accidentally removed: " + marker);
  }
  assert.match(examples, /\*B\. Capacidad/);
  assert.match(examples, /\*personalizar/);
  assert.equal($("section.card.full").length, 3);
  assert.equal($("#inputText").length, 1);
  assert.equal($("#outputPreview").length, 1);
  assert.equal($("#btnDownloadZip, #btnDownloadTarget, #btnRunCheck").length, 3);
  assert.match($("footer").text(), /Eduardo Augusto García Rodríguez/);
});

test("QTI responsive styles contain every major grid, sample, input, and ribbon within phone width", async () => {
  const css = await readFile(cssPath, "utf8");
  assert.match(css, /main\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /main\s*>\s*\.card/);
  assert.match(css, /\.field-grid\s*\{[\s\S]*?minmax\(0,\s*2fr\)/);
  assert.match(css, /\.qti-example-details pre\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(css, /\.qti-example-details pre\s*\{[\s\S]*?white-space:\s*pre-wrap/);
  assert.match(css, /\.chip\s*\{[\s\S]*?max-width:\s*100%/);
  assert.match(css, /@media\s*\(max-width:\s*950px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /#inputText,[\s\S]*?#outputPreview\s*\{[\s\S]*?min-height:\s*12rem\s*!important/);
  assert.match(css, /\.native-action-ribbon\s*\{[\s\S]*?display:\s*grid\s*!important/);
  assert.match(css, /\.native-ribbon-actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /body\[data-native-draft-tool="qti-blackboard"\]/);
  assert.doesNotMatch(css, /body\[data-native-draft-tool="estiloapa"\]|body\[data-native-draft-tool="txt-test-generator"\]/);
});

test("offline cache includes the new QTI mobile stylesheet and unchanged LMS code references", async () => {
  const sw = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const html = await readFile(htmlPath, "utf8");
  assert.match(sw, /curralume-v72/);
  assert.ok(sw.includes("/native-tools/qti-blackboard/qti-layout.css"));
  assert.ok(sw.includes("/native-tools/qti-blackboard/index.html"));
  assert.match(html, /function buildPackage\(/);
  assert.match(html, /function createZipBlob\(/);
  assert.match(html, /function validatePackage\(/);
  assert.match(html, /function buildMoodleGift\(/);
  assert.match(html, /function toCanvasItems\(/);
});
