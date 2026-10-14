import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";

const sourceUrl = new URL("../public/native-tools/txt-test-generator/index.html", import.meta.url);

async function harness() {
  const html = await readFile(sourceUrl, "utf8");
  const $ = load(html);
  const script = $("script:not([src])").toArray()
    .map((element) => $(element).html() || "")
    .find((value) => value.includes("function processContent("));
  assert.ok(script, "Converter logic not found");
  const values = new Map<string, any>();
  $("[id]").each((_, element) => {
    const id = $(element).attr("id")!;
    values.set(id, {
      value: id === "targetFormat" ? "blackboard" : id === "defaultPoints" ? "1" : "",
      disabled: false, textContent: "", innerHTML: "", className: "preview",
      addEventListener(_event: string, _callback: Function) {},
      options: id === "templateType"
        ? [...$("#templateType option")].map((option) => ({ value: $(option).val(), disabled: false }))
        : []
    });
  });
  const downloads: { filename: string; blob: Blob }[] = [];
  const urls = new Map<string, Blob>();
  let sequence = 0;
  const document = {
    getElementById(id: string) {
      const element = values.get(id);
      assert.ok(element, "Missing #" + id);
      return element;
    },
    createElement(tag: string) {
      assert.equal(tag, "a", "Only text-download anchors should be created");
      return {
        href: "", download: "",
        click() {
          const blob = urls.get(this.href);
          assert.ok(blob, "Download URL was not registered");
          downloads.push({ filename: this.download, blob });
        },
        remove() {}
      };
    },
    body: { appendChild(_element: object) {} }
  };
  const urlMock = {
    createObjectURL(blob: Blob) {
      const id = "blob:txt-test-" + ++sequence;
      urls.set(id, blob);
      return id;
    },
    revokeObjectURL(id: string) { urls.delete(id); }
  };
  const canvasPackages: { name: string; points: number; count: number }[] = [];
  const canvasPreviews: { name: string; points: number; count: number }[] = [];
  const win: any = {
    setTimeout(_fn: Function, _delay: number) { return 1; },
    UltraPageCanvasQti: {
      buildPreview(questions: any[], name: string, points: number) {
        canvasPreviews.push({ name, points, count: questions.length });
        return "QTI 1.2 preview";
      },
      downloadPackage(questions: any[], name: string, points: number) {
        canvasPackages.push({ name, points, count: questions.length });
      }
    }
  };
  const code = script + `
    let __parseCalls = 0;
    const __originalProcessContent = processContent;
    processContent = function(...args) {
      __parseCalls += 1;
      return __originalProcessContent(...args);
    };
    window.__txtTest = {
      processContent, downloadTxt, downloadValidationReport,
      downloadLmsComparison, buildLmsComparison, compareLmsCompatibility,
      verifyContent, convertContent, parseCalls: () => __parseCalls
    };
  `;
  runInNewContext(code, { document, window: win, Blob, URL: urlMock, console });
  return { values, downloads, canvasPackages, canvasPreviews, api: win.__txtTest };
}

test("Blackboard TXT, Moodle GIFT, and validation report downloads use one safe helper", async () => {
  const h = await harness();
  const get = (id: string) => h.values.get(id);
  get("quizName").value = "Midterm Assessment";
  get("quizContent").value = "1. Which is prime?\na) 4\n*b) 5\nc) 6";

  h.api.downloadTxt();
  assert.equal(h.downloads.length, 1);
  assert.equal(h.downloads[0].filename, "Midterm_Assessment_blackboard_ultra.txt");
  assert.equal(await h.downloads[0].blob.text(), "MC\tWhich is prime?\t5\tcorrect\t4\tincorrect\t6\tincorrect");

  get("targetFormat").value = "moodle";
  h.api.downloadTxt();
  assert.equal(h.downloads[1].filename, "Midterm_Assessment_moodle_gift.txt");
  assert.match(await h.downloads[1].blob.text(), /::Question 1::Which is prime\?/);

  h.api.downloadValidationReport();
  assert.equal(h.downloads[2].filename, "Midterm_Assessment_validation_report.txt");
  assert.match(await h.downloads[2].blob.text(), /Questions detected: 1/);
  assert.match(await h.downloads[2].blob.text(), /Target: Moodle/);
});

test("Download parses once per target without changing output, including Canvas ZIP", async () => {
  const h = await harness();
  const get = (id: string) => h.values.get(id);
  get("quizName").value = "Unit Test";
  get("quizContent").value = "1. Which is prime?\na) 4\n*b) 5\nc) 6";
  assert.equal(h.api.parseCalls(), 0);
  h.api.downloadTxt();
  assert.equal(h.api.parseCalls(), 1, "Blackboard download must not reparse before converting");
  assert.match(await h.downloads[0].blob.text(), /^MC\t/);

  get("targetFormat").value = "moodle";
  h.api.downloadTxt();
  assert.equal(h.api.parseCalls(), 2, "Moodle download must not reparse before converting");
  assert.match(await h.downloads[1].blob.text(), /::Question 1::/);

  get("targetFormat").value = "canvas";
  h.api.downloadTxt();
  assert.equal(h.api.parseCalls(), 3, "Canvas ZIP must not run verification and a second parse");
  assert.equal(h.canvasPackages.length, 1);
  assert.deepEqual(h.canvasPackages[0], { name: "Unit Test", points: 1, count: 1 });
});

test("Verify and Convert still accept direct toolbar click events, with one parse and unchanged previews", async () => {
  const h = await harness();
  const get = (id: string) => h.values.get(id);
  get("quizContent").value = "1. Which is prime?\na) 4\n*b) 5\nc) 6";

  assert.equal(h.api.verifyContent({ type: "click" }), true);
  assert.equal(h.api.parseCalls(), 1);
  const output = h.api.convertContent({ type: "click" });
  assert.match(output, /^MC\t/);
  assert.equal(h.api.parseCalls(), 2, "Direct Convert event must trigger exactly one parse");

  get("targetFormat").value = "canvas";
  get("quizName").value = "Quiz";
  assert.equal(h.api.convertContent({ type: "click" }), "QTI 1.2 preview");
  assert.equal(h.api.parseCalls(), 3, "Canvas preview must reuse its original parsed result");
  assert.deepEqual(h.canvasPreviews[0], { name: "Quiz", points: 1, count: 1 });

  const validated = h.api.processContent("canvas");
  assert.equal(h.api.parseCalls(), 4);
  assert.equal(h.api.verifyContent(validated), true);
  assert.equal(h.api.convertContent(validated), "QTI 1.2 preview");
  assert.equal(h.api.parseCalls(), 4, "Already parsed data must never trigger an extra parse");
});

test("cross-LMS downloaded report always reflects the current bank, not a cached earlier result", async () => {
  const h = await harness();
  const get = (id: string) => h.values.get(id);
  get("quizName").value = "Final";
  get("quizContent").value = "1. Which is prime?\na) 4\n*b) 5\nc) 6";

  h.api.downloadLmsComparison();
  assert.equal(h.downloads[0].filename, "Final_cross_lms_report.txt");
  const first = await h.downloads[0].blob.text();
  assert.equal((first.match(/Questions: 1/g) || []).length, 3);

  get("quizContent").value += "\n\n2. One plus one equals two.\nTrue";
  h.api.downloadLmsComparison();
  const second = await h.downloads[1].blob.text();
  assert.equal((second.match(/Questions: 2/g) || []).length, 3);
  assert.equal((second.match(/Questions: 1/g) || []).length, 0);
  assert.match(second, /Status: READY/);
});

test("removes obsolete report state and duplicate text download implementations", async () => {
  const html = await readFile(sourceUrl, "utf8");
  assert.doesNotMatch(html, /lastLmsComparison/);
  assert.doesNotMatch(html, /\.navbar, \.footer/);
  assert.equal((html.match(/function downloadTextFile\(/g) || []).length, 1);
  assert.equal((html.match(/new Blob\(\[.*\], \{ type: 'text\/plain;charset=utf-8' \}\)/g) || []).length, 1);
  assert.equal((html.match(/URL\.createObjectURL\(blob\)/g) || []).length, 1);
  assert.match(html, /function downloadLmsComparison\(\)\s*\{\s*const comparison = buildLmsComparison\(\)/);
  const $ = load(html);
  assert.equal($(".section-title:contains('Accepted input')").length, 1);
  assert.equal($(".panel").parent().attr("class"), "card-body");
  assert.equal($("footer").text().includes("© 2026 Eduardo Augusto García Rodríguez"), true);
});
