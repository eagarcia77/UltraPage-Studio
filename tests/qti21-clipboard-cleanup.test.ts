import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";

const path = new URL("../public/native-tools/qti-blackboard/index.html", import.meta.url);
const source = () => readFile(path, "utf8");

async function harness(mode: "modern" | "fallback" | "denied" = "modern") {
  const html = await source();
  const $ = load(html);
  const script = $("script:not([src])").toArray().map((item) => $(item).html() || "")
    .find((s) => s.includes("function buildPackage("));
  assert.ok(script, "QTI 2.1 generator not found");
  const core = script.slice(0, script.indexOf("    let validationTimer = null;"));
  assert.ok(core.length > 10000, "Cannot isolate QTI generator without button listeners");
  const elements = new Map<string, any>();
  let currentFocus: any = null;
  let activeFocusRestored = false;
  let clipboardText = "";
  let clipboardCalls = 0;
  let fallbackCalls = 0;
  let appended = 0;
  const node = (tag = "div"): any => ({
    tag, value: "", textContent: "", children: [] as any[], className: "", style: {},
    appendChild(child: any) { this.children.push(child); return child; },
    removeChild(child: any) { this.children = this.children.filter((item: any) => item !== child); },
    remove() {},
    setAttribute(_name: string, _value: string) {},
    focus() { currentFocus = this; },
    select() {}
  });
  $("*[id]").each((_, element) => {
    const id = $(element).attr("id")!;
    elements.set(id, node($(element).prop("tagName")?.toLowerCase() || "div"));
  });
  elements.get("inputText").value = "MC 1. Select the correct answer\nA. Wrong\n*B. Correct";
  elements.get("packageName").value = "Assessment_QTI21_Blackboard";
  elements.get("defaultPoints").value = "1";
  elements.get("targetLms").selectedOptions = [{ textContent: "Blackboard Ultra" }];
  const previousFocus = {
    focus() { activeFocusRestored = true; currentFocus = this; }
  };
  currentFocus = previousFocus;
  const document = {
    get activeElement() { return currentFocus; },
    getElementById(id: string) { const result = elements.get(id); assert.ok(result, "Missing #" + id); return result; },
    createElement(tag: string) { return node(tag); },
    querySelectorAll(selector: string) {
      if (selector === "#postImportChecklist li") return [{ textContent: "Review questions" }, { textContent: "Test in Student Preview" }];
      return [];
    },
    execCommand(command: string) {
      assert.equal(command, "copy");
      fallbackCalls++;
      if (mode === "denied") return false;
      return true;
    },
    body: {
      appendChild(element: any) { appended++; element.remove = () => { appended--; }; return element; }
    }
  };
  const navigator = mode === "fallback"
    ? { clipboard: undefined }
    : { clipboard: { async writeText(text: string) {
      clipboardCalls++;
      if (mode === "denied") throw new Error("Permission denied");
      clipboardText = text;
    } } };
  const win: any = {};
  // Clipboard tests isolate copy behavior; package generation is exercised
  // with the real parser in qti21-fresh-export.test.ts.
  const stubGeneration = `\n    generatePackage = function() {
      if (!document.getElementById('inputText').value.trim()) {
        setMessage('error', 'The ZIP was not generated because the question bank is empty.');
        return null;
      }
      document.getElementById('outputPreview').value = 'QTI 2.1 PACKAGE GENERATED';
      return { files: {}, items: [] };
    };\n`;
  runInNewContext(core + stubGeneration + "\nwindow.__qtiClipboardTest = { copyTextSafely, copyValidationReport, copyImportChecklist, copyPreview, buildValidationReport };",
    { document, navigator, window: win, console, Blob, TextEncoder, Uint8Array, Uint32Array, DataView, Date });
  return {
    $, html, api: win.__qtiClipboardTest, elements,
    getCopiedText: () => clipboardText,
    clipboardCalls: () => clipboardCalls, fallbackCalls: () => fallbackCalls,
    focusRestored: () => activeFocusRestored, appended: () => appended,
    message: () => elements.get("message").children.at(-1)
  };
}

test("QTI 2.1 clipboard logic uses one path rather than duplicated fallback code", async () => {
  const html = await source();
  assert.equal((html.match(/async function copyTextSafely\(/g) || []).length, 1);
  assert.equal((html.match(/document\.execCommand\('copy'\)/g) || []).length, 1);
  assert.equal((html.match(/document\.createElement\('textarea'\)/g) || []).length, 1);
  assert.doesNotMatch(html, /\.header-logo\s*\{/);
  assert.doesNotMatch(html, /\.chip\.yellow\s*\{/);
  assert.match(html, /© 2026 Eduardo Augusto García Rodríguez\. All rights reserved\./);
  assert.equal(load(html)("#btnCopyPreview, #btnCopyReport, #btnCopyImportChecklist").length, 3);
  assert.match(await readFile(new URL("../public/sw.js", import.meta.url), "utf8"), /curralume-v75/);
});

test("modern clipboard copies the preflight report, checklist, and QTI preview", async () => {
  const h = await harness();
  await h.api.copyValidationReport();
  assert.match(h.getCopiedText(), /ASSESSMENT EXCHANGE PREFLIGHT REPORT/);
  assert.match(h.getCopiedText(), /Questions detected: 1/);
  assert.equal(h.message().className, "success");
  await h.api.copyImportChecklist();
  assert.match(h.getCopiedText(), /POST-IMPORT VERIFICATION — Blackboard Ultra/);
  assert.match(h.getCopiedText(), /1\. Review questions/);
  assert.equal(h.message().className, "success");
  h.elements.get("outputPreview").value = "QTI 2.1 PACKAGE GENERATED";
  await h.api.copyPreview();
  assert.equal(h.getCopiedText(), "QTI 2.1 PACKAGE GENERATED");
  assert.equal(h.clipboardCalls(), 3);
  assert.equal(h.fallbackCalls(), 0);
  assert.equal(h.appended(), 0);
});

test("Safari without modern clipboard uses one fallback and restores focus", async () => {
  const h = await harness("fallback");
  await h.api.copyImportChecklist();
  assert.equal(h.fallbackCalls(), 1);
  assert.equal(h.clipboardCalls(), 0);
  assert.equal(h.appended(), 0, "Temporary copy field must be removed");
  assert.equal(h.focusRestored(), true, "Original focus must be restored");
  assert.equal(h.message().className, "success");
});

test("blocked clipboard operations never produce a misleading success message", async () => {
  const h = await harness("denied");
  await h.api.copyValidationReport();
  assert.equal(h.clipboardCalls(), 1);
  assert.equal(h.fallbackCalls(), 1);
  assert.equal(h.appended(), 0);
  assert.equal(h.message().className, "error");
  assert.match(h.message().textContent, /Could not copy/);
});

test("empty preview and invalid bank must not claim a successful copy", async () => {
  const h = await harness();
  h.elements.get("inputText").value = "";
  h.elements.get("outputPreview").value = "";
  await h.api.copyPreview();
  assert.equal(h.clipboardCalls(), 0);
  assert.notEqual(h.message().className, "success");
  assert.match(h.message().textContent, /ZIP was not generated/);
});
