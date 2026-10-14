import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";

const sourcePath = new URL("../public/native-tools/qti-blackboard/index.html", import.meta.url);
const source = () => readFile(sourcePath, "utf8");

async function harness() {
  const $ = load(await source());
  const script = $("script:not([src])").toArray().map(el => $(el).html() || "")
    .find(text => text.includes("function buildPackage("));
  assert.ok(script, "QTI generator script missing");
  const core = script.slice(0, script.indexOf("    let validationTimer = null;"));
  assert.ok(core.includes("function downloadZipPackage()"));
  const elements = new Map<string, any>();
  for (const id of ["inputText", "outputPreview", "packageName", "defaultPoints", "message",
    "countQuestions", "countMC", "countMA", "countTF", "countFIB", "countESSAY"]) {
    elements.set(id, { value: "", textContent: "", children: [] as any[],
      appendChild(child: any) { this.children.push(child); } });
  }
  elements.get("packageName").value = "Initial Bank";
  elements.get("defaultPoints").value = "1";
  elements.get("inputText").value = "MC 1. First version?\n*A. Yes\nB. No";
  const document = {
    getElementById(id: string) { const item = elements.get(id); assert.ok(item, "Missing #" + id); return item; },
    createElement(_tag: string) { return { className: "", textContent: "" }; }
  };
  const copied: string[] = [];
  const win: any = { __downloads: [] as any[], __lastFiles: null };
  const navigator = { clipboard: { async writeText(value: string) { copied.push(value); } } };
  const runner = core + [
    "runValidationReport = function() { return { errors: [] }; };",
    "validatePackage = function(files, items) { return { resources: items.length, files: Object.keys(files).length }; };",
    "createZipBlob = function(files) { window.__lastFiles = files; return new Blob(['mock zipped files'], {type: 'application/zip'}); };",
    "downloadBlob = function(filename, blob) { window.__downloads.push({filename, blob, files: window.__lastFiles}); };",
    "window.__qti = { downloadZipPackage, copyPreview, generatePackage };"
  ].join("\n");
  runInNewContext(runner, { document, window: win, navigator, Blob, console, TextEncoder,
    Uint8Array, Uint32Array, DataView, Date, URL });
  return { elements, downloads: win.__downloads, copied, api: win.__qti };
}

test("Blackboard ZIP always contains current edited questions and filename, without a package cache", async () => {
  const h = await harness();
  h.api.downloadZipPackage();
  assert.equal(h.downloads.length, 1);
  assert.equal(h.downloads[0].filename, "Initial_Bank.zip");
  assert.equal(Object.keys(h.downloads[0].files).length, 2);
  assert.match(h.downloads[0].files["items/item1.xml"], /First version\?/);
  assert.equal(h.elements.get("countQuestions").textContent, 1);

  h.elements.get("inputText").value = "MC 1. Revised question?\n*A. Good\nB. Bad\n\nTF 2. Second question?\n*A. True\nB. False";
  h.elements.get("packageName").value = "Updated Bank";
  h.api.downloadZipPackage();
  assert.equal(h.downloads.length, 2);
  assert.equal(h.downloads[1].filename, "Updated_Bank.zip");
  assert.equal(Object.keys(h.downloads[1].files).length, 3);
  assert.match(h.downloads[1].files["items/item1.xml"], /Revised question\?/);
  assert.match(h.downloads[1].files["items/item2.xml"], /Second question\?/);
  assert.doesNotMatch(h.downloads[1].files["items/item1.xml"], /First version\?/);
  assert.equal(h.elements.get("countQuestions").textContent, 2);
  assert.equal(h.downloads[1].blob.type, "application/zip");
});

test("Copy preview regenerates after edits instead of copying stale text", async () => {
  const h = await harness();
  h.api.downloadZipPackage();
  const oldPreview = h.elements.get("outputPreview").value;
  assert.match(oldPreview, /First version\?/);
  h.elements.get("inputText").value = "MC 1. Updated preview?\n*A. Correct\nB. Incorrect";
  await h.api.copyPreview();
  assert.equal(h.copied.length, 1);
  assert.match(h.copied[0], /Updated preview\?/);
  assert.doesNotMatch(h.copied[0], /First version\?/);
  assert.equal(h.copied[0], h.elements.get("outputPreview").value);
});

test("QTI fresh export removes cached package state without changing ZIP/XML functions", async () => {
  const html = await source();
  assert.doesNotMatch(html, /\bcurrentPackage\b/);
  assert.match(html, /function downloadZipPackage\(\)\s*\{\s*\/\/[^\n]*\n\s*const pkg = generatePackage\(\)/);
  assert.match(html, /async function copyPreview\(\)[\s\S]*?if \(!generatePackage\(\)\) return;/);
  assert.match(html, /function createZipBlob\(/);
  assert.match(html, /function validatePackage\(/);
  assert.match(html, /function buildManifest\(/);
  assert.match(html, /function buildMoodleGift\(/);
  assert.match(html, /function toCanvasItems\(/);
  const sw = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(sw, /curralume-v80/);
});
