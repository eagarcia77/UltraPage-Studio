import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";

const file = new URL("../public/native-tools/qti-blackboard/index.html", import.meta.url);

async function harness() {
  const html = await readFile(file, "utf8");
  const $ = load(html);
  const example = $("#qtiExampleBank");
  assert.equal(example.length, 1, "Visible question bank should have a unique source element");
  const sample = { textContent: example.text(), value: "" };
  const input = { value: "" };
  const points = { value: "1" };
  const ids: Record<string, any> = { qtiExampleBank: sample, inputText: input, defaultPoints: points };
  const document = { getElementById(id: string) {
    assert.ok(ids[id], "Unexpected document input: " + id);
    return ids[id];
  } };
  const script = $("script:not([src])").toArray().map(el => $(el).html() || "")
    .find(text => text.includes("function loadExample()"));
  assert.ok(script, "QTI generator script missing");
  const parserStart = script.indexOf("    const SUPPORTED_TYPES =");
  const parserEnd = script.indexOf("    function choiceIdentifier(", parserStart);
  const loadStart = script.indexOf("    function loadExample()");
  const loadEnd = script.indexOf("    function clearAll()", loadStart);
  assert.ok(parserStart >= 0 && parserEnd > parserStart && loadStart > parserEnd && loadEnd > loadStart);
  const win: any = {};
  const code = script.slice(parserStart, parserEnd)
    + "\nfunction generatePackage() { window.__generated = getItems(); return window.__generated; }\n"
    + script.slice(loadStart, loadEnd)
    + "\nwindow.__sampleTest = { loadExample, getItems };\n";
  runInNewContext(code, { window: win, document, console });
  return { html, $, sample, input, points, api: win.__sampleTest,
    getGenerated: () => win.__generated };
}

test("QTI examples and Load example button share one bank of five valid question types", async () => {
  const h = await harness();
  assert.equal(h.$("details.qti-example-details pre#qtiExampleBank").length, 1);
  assert.equal((h.html.match(/MC 1\. ¿Cuál es la mejor definición/g) || []).length, 1,
    "The same MC example must not be hardcoded twice");
  h.api.loadExample();
  assert.equal(h.input.value, h.sample.textContent.trim(),
    "Loaded example must exactly match the visible examples");
  const items = h.getGenerated();
  assert.equal(items.length, 5);
  assert.deepEqual(Array.from(items, (item: any) => item.type), ["MC", "MA", "TF", "FIB", "ESSAY"]);
  assert.equal(items[0].options.find((answer: any) => answer.isCorrect)?.ident, "B");
  assert.equal(items[1].options.filter((answer: any) => answer.isCorrect).length, 2);
  assert.deepEqual(Array.from(items[3].answers), ["personalizar", "adaptar"]);
});

test("editing only the example source changes the loaded bank without modifying script", async () => {
  const h = await harness();
  h.sample.textContent = "MC 1. Updated question?\n*A. Correct answer\nB. Other answer";
  h.api.loadExample();
  assert.equal(h.input.value, h.sample.textContent);
  assert.equal(h.getGenerated().length, 1);
  assert.equal(h.getGenerated()[0].question, "Updated question?");
  assert.equal(h.getGenerated()[0].options.find((item: any) => item.isCorrect)?.ident, "A");
});

test("single example source keeps owner attribution, five types, and export code intact", async () => {
  const h = await harness();
  assert.equal(h.$("footer").text().includes("© 2026 Eduardo Augusto García Rodríguez"), true);
  assert.equal(h.$("#btnLoadExample").length, 1);
  assert.equal(h.$("details.qti-example-details").attr("open"), undefined);
  for (const name of ["MC 1.", "MA 2.", "TF 3.", "FIB 4.", "ESSAY 5."]) {
    assert.ok(h.sample.textContent.includes(name), "Sample type missing: " + name);
  }
  assert.match(h.html, /function buildPackage\(/);
  assert.match(h.html, /function createZipBlob\(/);
  assert.match(h.html, /function validatePackage\(/);
  assert.match(h.html, /function buildMoodleGift\(/);
  assert.match(h.html, /function toCanvasItems\(/);
  assert.equal(h.html.includes("value = " + String.fromCharCode(96) + "MC 1."), false);
  const sw = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(sw, /crevelio-v84/);
});
