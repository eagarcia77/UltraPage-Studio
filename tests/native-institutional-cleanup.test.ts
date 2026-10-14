import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");
const owner = "© 2026 Eduardo Augusto García Rodríguez. All rights reserved.";
const retiredAssetDirectories = [
  "public/native-tools/txt-test-generator/img/",
  "public/native-tools/qti-blackboard/img/",
];
const forbidden = /(?:PPOHA|P031M230038|CETL|postbacc|institutional\s+grant\s+branding)/i;

test("TXT Generator displays the independent author's rights notice and excludes retired assets", async () => {
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

test("QTI 2.1 uses independent identifiers in the screen and exported packages", async () => {
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

test("retired third-party institutional image directories are absent", async () => {
  for (const path of retiredAssetDirectories) {
    await assert.rejects(access(new URL(path, root)), { code: "ENOENT" });
  }
});

test("offline cache and native manifest exclude unrelated institutional assets", async () => {
  const sw = await read("public/sw.js");
  const manifestSource = await read("public/native-tools/manifest.json");
  const manifest = JSON.parse(manifestSource);
  assert.match(sw, /crevelio-v84/);
  assert.doesNotMatch(sw, forbidden);
  assert.doesNotMatch(manifestSource, forbidden);
  assert.equal(manifest.tools.length, 3);
  assert.ok(sw.includes("/native-tools/txt-test-generator/index.html"));
  assert.ok(sw.includes("/native-tools/qti-blackboard/index.html"));
  assert.ok(sw.includes("/native-tools/txt-test-generator/canvas-qti.js"));
  assert.ok(sw.includes("/native-tools/txt-test-generator/txt-layout.css"));
  for (const path of retiredAssetDirectories) {
    assert.ok(!sw.includes(path.replace(/^public/, "")));
    assert.ok(!manifestSource.includes(path));
  }
});
