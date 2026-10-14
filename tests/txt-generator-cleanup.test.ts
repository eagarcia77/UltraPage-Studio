import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";

const sourceUrl = new URL("../public/native-tools/txt-test-generator/index.html", import.meta.url);
const source = () => readFile(sourceUrl, "utf8");

async function toolHarness() {
  const html = await source();
  const $ = load(html);
  const script = $("script:not([src])").toArray()
    .map((element) => $(element).html() || "")
    .find((value) => value.includes("function processContent("));
  assert.ok(script, "The TXT converter's parsing logic must remain available");
  const elements = new Map<string, any>();
  const listeners = new Map<string, Function>();
  $("[id]").each((_, element) => {
    const id = $(element).attr("id")!;
    elements.set(id, {
      value: id === "targetFormat" ? "blackboard" : id === "defaultPoints" ? "1" : "",
      disabled: false,
      textContent: "",
      innerHTML: "",
      className: "preview",
      open: false,
      showModal() { this.open = true; },
      close() { this.open = false; },
      addEventListener(event: string, callback: Function) { listeners.set(id + ":" + event, callback); },
      options: id === "templateType"
        ? [...$("#templateType option")].map((option) => ({ value: $(option).val(), disabled: false }))
        : []
    });
  });
  const document = {
    getElementById(id: string) {
      const element = elements.get(id);
      assert.ok(element, "An essential HTML control is missing: #" + id);
      return element;
    }
  };
  const global: any = { window: {}, document };
  runInNewContext(script + "\nwindow.__testConverter = { clearAll, updateTargetUi, processContent, verifyContent };", global);
  return {
    $, elements, api: global.window.__testConverter,
    fire(id: string, event: string, payload: object = {}) {
      const callback = listeners.get(id + ":" + event);
      assert.ok(callback, "Missing handler for " + id + ":" + event);
      callback(payload);
    }
  };
}

test("TXT Generator keeps one concise accepted-format summary and its detailed examples", async () => {
  const h = await toolHarness();
  assert.equal(h.$('[data-bs-target="#helpModal"]').length, 0);
  assert.equal(h.$("#openExamplesBtn").length, 1);
  assert.equal(h.$("#closeExamplesBtn").length, 1);
  assert.equal(h.$("dialog#helpModal.native-lms-dialog").length, 1);
  assert.match(h.$("#helpModal").text(), /Which of the following is a prime number/);
  assert.equal(h.$('.section-title:contains("Accepted input")').length, 1);
  assert.equal(h.$(".panel").length, 1, "The duplicate inline example should not be displayed twice");
  assert.equal(h.$(".panel").parent().attr("class"), "col-12");
  assert.match(h.$(".panel").text(), /Blackboard Ultra TXT/);
  assert.match(h.$(".panel").text(), /Moodle GIFT/);
  assert.match(h.$(".panel").text(), /Canvas QTI/);
  assert.equal(h.$('a[href$="Guía_Generador_Exámenes_Blackboard_Ultra_Simplificada.pdf"]').length, 1);
  for (const id of ["openFileBtn","clearBtn","sampleBtn","verifyBtn","convertBtn","compareLmsBtn","downloadBtn","copyBtn","downloadReportBtn","lmsComparisonDialog","quizContent"]) {
    assert.equal(h.$("#" + id).length, 1, "Required TXT Generator control missing: " + id);
  }
});

test("Examples use the existing native dialog without fetching Bootstrap JavaScript", async () => {
  const { $, elements, fire } = await toolHarness();
  const html = await source();
  assert.equal($('script[src*="bootstrap.bundle"]').length, 0);
  assert.equal($('[data-bs-toggle], [data-bs-dismiss]').length, 0);
  assert.equal($('link[href*="bootstrap.min.css"]').length, 1, "Bootstrap layout CSS remains in use");
  const policy = $('meta[http-equiv="Content-Security-Policy"]').attr("content") || "";
  const jsPolicy = policy.match(/script-src[^;]*;/)?.[0] || "";
  assert.match(jsPolicy, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(jsPolicy, /cdn\.jsdelivr/);
  assert.match(html, /native-lms-dialog-head/);
  assert.match(html, /aria-labelledby="helpModalLabel"/);
  const modal = elements.get("helpModal");
  assert.equal(modal.open, false);
  fire("openExamplesBtn", "click");
  assert.equal(modal.open, true);
  fire("helpModal", "click", { target: elements.get("closeExamplesBtn") });
  assert.equal(modal.open, true, "Clicking example content must not dismiss the dialog");
  fire("closeExamplesBtn", "click");
  assert.equal(modal.open, false);
  fire("openExamplesBtn", "click");
  fire("helpModal", "click", { target: modal });
  assert.equal(modal.open, false, "Clicking the backdrop should dismiss the dialog");
});

test("TXT Generator removes obsolete comments and unused CSS without affecting its design tokens", async () => {
  const html = await source();
  assert.doesNotMatch(html, /<!--\s*<p>Creado por/);
  assert.doesNotMatch(html, /--amarillo\s*:/);
  assert.doesNotMatch(html, /--info\s*:/);
  assert.doesNotMatch(html, /\.inf\s*\{/);
  assert.match(html, /\.ok\s*\{\s*color:\s*var\(--ok\)/);
  assert.match(html, /\.err\s*\{\s*color:\s*var\(--error\)/);
  assert.equal((html.match(/function resetResultPanels\(\)/g) || []).length, 1);
  assert.equal((html.match(/resultBoxEl\.textContent = 'No content has been processed yet\.'/g) || []).length, 1);
});

test("switching target LMS resets only outputs while keeping the question bank and file name", async () => {
  const { api, elements } = await toolHarness();
  const get = (id: string) => elements.get(id);
  get("quizContent").value = "1. An example\n*a) Correct\nb) Incorrect";
  get("quizName").value = "Midterm";
  get("resultBox").textContent = "Previous warnings";
  get("previewBox").textContent = "Old output";
  get("questionCount").textContent = "5";
  get("errorCount").textContent = "1";
  get("targetFormat").value = "canvas";
  api.updateTargetUi();
  assert.equal(get("quizContent").value, "1. An example\n*a) Correct\nb) Incorrect");
  assert.equal(get("quizName").value, "Midterm");
  assert.equal(get("resultBox").textContent, "No content has been processed yet.");
  assert.equal(get("previewBox").textContent, "Converted content will appear here.");
  assert.equal(get("questionCount").textContent, "0");
  assert.equal(get("errorCount").textContent, "0");
  assert.equal(get("statusLabel").textContent, "Ready");
  assert.equal(get("defaultPoints").disabled, false);
  assert.equal(get("downloadBtn").textContent, "Download QTI ZIP");
  assert.equal(get("templateType").options.find((option: any) => option.value === "MAT").disabled, true);
  api.clearAll();
  assert.equal(get("quizContent").value, "");
  assert.equal(get("resultBox").textContent, "No content has been processed yet.");
  assert.equal(get("previewBox").textContent, "Converted content will appear here.");
  assert.equal(get("questionCount").textContent, "0");
  assert.equal(get("quizName").value, "Midterm");
});

test("Blackboard, Moodle and Canvas question validation remains intact", async () => {
  const { api, elements } = await toolHarness();
  elements.get("quizContent").value = "1. Which is prime?\na) 4\n*b) 5\nc) 6";
  const blackboard = api.processContent("blackboard");
  assert.equal(blackboard.errors.length, 0);
  assert.equal(blackboard.blocks.length, 1);
  assert.equal(blackboard.lines.length, 1);
  assert.match(blackboard.lines[0], /^MC\t/);
  const moodle = api.processContent("moodle");
  assert.equal(moodle.errors.length, 0);
  assert.match(moodle.lines[0], /::Question 1::/);
  const canvas = api.processContent("canvas");
  assert.equal(canvas.errors.length, 0);
  assert.equal(canvas.parsed[0].type, "MC");
  assert.equal(api.verifyContent(), true);
});
