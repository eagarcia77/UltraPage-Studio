/* Curralume Studio · © 2026 Eduardo Augusto García Rodríguez · Original contributions and integrations; third-party licenses preserved. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");

test("EstiloAPA uses one accessible editing instruction without rewriting the DOM", async () => {
  const html = await read("public/native-tools/estiloapa/index.html");
  const guard = await read("public/native-tools/estiloapa/edit-stability-v348.js");
  const $ = load(html);
  assert.equal($("#previewHelp").length, 1);
  assert.equal($("#preview").attr("aria-describedby"), "previewHelp");
  assert.match($("#previewHelp").text(), /Edit the preview directly/);
  assert.doesNotMatch(guard, /aesUpdateUi|#previewHelp|setTimeout\(aesUpdateUi/);
});

test("protected editing focus styles are maintained in CSS instead of injected on load", async () => {
  const guard = await read("public/native-tools/estiloapa/edit-stability-v348.js");
  const css = await read("public/native-tools/estiloapa/editor-workspace.css");
  const page = await read("public/native-tools/estiloapa/index.html");
  assert.match(page, /href="editor-workspace\.css"/);
  assert.match(css, /#preview\.apa-user-editing:focus/);
  assert.doesNotMatch(guard, /aesInstallStyles|createElement\("style"\)|apa-edit-stability-v348-style/);
  assert.match(guard, /root\.classList\.toggle\("apa-user-editing"/);
});

test("editing guard retains deferred normalization but avoids distracting passive status updates", async () => {
  const guard = await read("public/native-tools/estiloapa/edit-stability-v348.js");
  assert.match(guard, /function apaShouldDeferNormalization\(/);
  assert.match(guard, /aesQueueNormalization\(callback, args\)/);
  assert.match(guard, /root\.addEventListener\("apa-editor-idle", aesFlushPendingNormalizations\)/);
  assert.match(guard, /window\.apaWithForcedNormalization = apaWithForcedNormalization/);
  assert.doesNotMatch(guard, /apaEditStatus|Text changes preserved/);
});

test("editing guard preserves the browser's original clearTimeout function", async () => {
  const guard = await read("public/native-tools/estiloapa/edit-stability-v348.js");
  const clearTimeout = () => {};
  const setTimeout = (..._args: unknown[]) => 42;
  const listeners = new Map<string, Function>();
  const win = { setTimeout, clearTimeout };
  runInNewContext(guard, {
    window: win,
    document: {
      readyState: "loading",
      addEventListener(name: string, callback: Function) { listeners.set(name, callback); }
    },
    console
  });
  assert.equal(win.clearTimeout, clearTimeout);
  assert.equal(win.setTimeout(() => {}, 0), 42);
  assert.equal(listeners.has("DOMContentLoaded"), true);
});
