import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const read = (file: string) => readFile(new URL(file, root), "utf8");

test("QTI header relies on shared Curralume theme rather than duplicated legacy decoration", async () => {
  const html = await read("public/native-tools/qti-blackboard/index.html");
  const theme = await read("public/native-tools/ultrapage-native-theme.css");
  const $ = load(html);
  assert.equal($("header").length, 1);
  assert.equal($("header h1").text().trim(), "QTI 2.1 Blackboard");
  assert.match($("header p").text(), /Blackboard Ultra/);
  assert.equal($('link[data-ultrapage-native-theme]').attr("href"), "../ultrapage-native-theme.css");
  const localCSS = $("style").first().html() || "";
  assert.match(localCSS, /header\s*\{\s*padding:\s*34px 24px/);
  assert.match(localCSS, /header h1\s*\{\s*margin:\s*0/);
  assert.doesNotMatch(localCSS, /header::after/);
  assert.doesNotMatch(localCSS, /header\s*\{[^}]*background:/);
  assert.doesNotMatch(localCSS, /header\s*\{[^}]*border-bottom:/);
  assert.doesNotMatch(localCSS, /^\s*\*\s*\{\s*box-sizing:\s*border-box/m);
  assert.match(theme, /\*,\s*\*::before,\s*\*::after\s*\{\s*box-sizing:\s*border-box/);
  assert.match(theme, /header::after/);
  assert.match(theme, /header,\s*\.hero/);
});

test("editor, validation and LMS export features stay mounted after QTI style cleanup", async () => {
  const html = await read("public/native-tools/qti-blackboard/index.html");
  const $ = load(html);
  for (const id of [
    "inputText", "outputPreview", "targetLms", "btnDownloadZip",
    "btnDownloadTarget", "btnRunCheck", "btnCopyPreview", "btnLoadExample",
    "qtiExampleBank"
  ]) assert.equal($("#" + id).length, 1, "Missing QTI feature: " + id);
  for (const functionName of [
    "buildPackage", "validatePackage", "createZipBlob", "buildMoodleGift",
    "toCanvasItems", "loadExample", "buildValidationReport"
  ]) assert.ok(html.includes("function " + functionName + "("), "Missing generator: " + functionName);
  assert.match($("footer").text(), /© 2026 Eduardo Augusto García Rodríguez/);
  const sw = await read("public/sw.js");
  assert.match(sw, /curralume-v80/);
});
