import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");
const owner = "© 2026 Eduardo Augusto García Rodríguez. All rights reserved.";
const retiredFiles = [
  "public/native-tools/txt-test-generator/img/LOGO-INTER-SG-HORIZONTAL_sticker.png",
  "public/native-tools/txt-test-generator/img/ucan-logo.png",
  "public/native-tools/txt-test-generator/Guía_Generador_Exámenes_Blackboard_Ultra_Simplificada.pdf",
  "public/native-tools/qti-blackboard/img/LOGO-INTER-SG-HORIZONTAL_sticker.png"
];
const forbidden = /(?:\bUCAN\b|(?:universidad|university)\s+interamericana|interamerican\s+university|PPOHA|P031M230038|CETL|postbacc|LOGO-INTER|ucan-logo|Guía_Generador_Exámenes_Blackboard_Ultra_Simplificada|San Germán)/i;

test("TXT Generator displays only its author's rights notice, without institutional credits or PDF", async () => {
  const html = await read("public/native-tools/txt-test-generator/index.html");
  const $ = load(html);
  assert.equal($("footer").length, 1);
  assert.ok($("footer").text().includes(owner));
  assert.equal($('a[href$=".pdf"]').length, 0);
  assert.equal($('img[src^="img/"]').length, 0);
  assert.doesNotMatch(html, forbidden);
  assert.equal($("#quizContent").length, 1);
  assert.equal($("#targetFormat option").length, 3);
  assert.equal($("#openExamplesBtn").length, 1);
});

test("QTI 2.1 removes UCAN branding from displayed, default and exported package identifiers", async () => {
  const html = await read("public/native-tools/qti-blackboard/index.html");
  const $ = load(html);
  assert.ok($("footer").text().includes(owner));
  assert.equal($("#packageName").attr("value"), "Assessment_QTI21_Blackboard");
  assert.equal($('img[src^="img/"]').length, 0);
  assert.match(html, /identifier="ASSESSMENT_QTI21_BLACKBOARD"/);
  assert.ok(html.includes("String(name || 'Assessment_QTI21_Blackboard')"));
  assert.ok(html.includes("packageName.value === 'Assessment_QTI21_Blackboard'"));
  assert.doesNotMatch(html, forbidden);
  assert.equal($("#targetLms option").length, 3);
});

test("no retired institution-branded assets remain in the deployed public directories", async () => {
  for (const path of retiredFiles) {
    await assert.rejects(access(new URL(path, root)), { code: "ENOENT" });
  }
});

test("offline cache and native manifest contain no retired institutional media references", async () => {
  const sw = await read("public/sw.js");
  const manifestSource = await read("public/native-tools/manifest.json");
  const manifest = JSON.parse(manifestSource);
  assert.match(sw, /curralume-v69/);
  assert.doesNotMatch(sw, forbidden);
  assert.doesNotMatch(manifestSource, forbidden);
  assert.equal(manifest.tools.length, 3);
  assert.ok(sw.includes("/native-tools/txt-test-generator/index.html"));
  assert.ok(sw.includes("/native-tools/qti-blackboard/index.html"));
  assert.ok(sw.includes("/native-tools/txt-test-generator/canvas-qti.js"));
  assert.ok(sw.includes("/native-tools/txt-test-generator/txt-layout.css"));
  for (const path of retiredFiles) {
    assert.ok(!sw.includes(path.replace(/^public/, "")), "Old file still in service-worker cache: " + path);
    assert.ok(!manifestSource.includes(path), "Old file still in current asset inventory: " + path);
  }
});
