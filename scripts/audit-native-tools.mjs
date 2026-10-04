import { readFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, "public/native-tools/manifest.json"), "utf8"));
const recoverySource = await readFile(path.join(root, "public/native-tools/ultrapage-native-recovery.js"), "utf8");
const ribbonSource = await readFile(path.join(root, "public/native-tools/ultrapage-native-ribbon.js"), "utf8");
const bridgeSource = await readFile(path.join(root, "public/native-tools/ultrapage-assessment-bridge.js"), "utf8");
const lmsExportSource = await readFile(path.join(root, "public/native-tools/estiloapa/lms-export.js"), "utf8");
const canvasQtiSource = await readFile(path.join(root, "public/native-tools/txt-test-generator/canvas-qti.js"), "utf8");
const serviceWorker = await readFile(path.join(root, "public/sw.js"), "utf8");
const errors = [];

function fail(tool, message) {
  errors.push(`${tool}: ${message}`);
}

function entryFile(tool) {
  return path.join(root, "public/native-tools", tool.id, "index.html");
}

if (manifest.tools.length !== 3) fail("manifest", `expected 3 tools, found ${manifest.tools.length}`);
if (!serviceWorker.includes("/native-tools/ultrapage-native-recovery.js")) fail("service worker", "recovery asset is not cached");
if (!serviceWorker.includes("/native-tools/estiloapa/lms-export.js")) fail("service worker", "EstiloAPA LMS export asset is not cached");
if (!serviceWorker.includes("/native-tools/txt-test-generator/canvas-qti.js")) fail("service worker", "TXT Generator Canvas QTI asset is not cached");

for (const tool of manifest.tools) {
  const html = await readFile(entryFile(tool), "utf8");
  const $ = cheerio.load(html);
  const ids = new Set();

  $("[id]").each((_, element) => {
    const id = $(element).attr("id");
    if (ids.has(id)) fail(tool.id, `duplicate id #${id}`);
    ids.add(id);
  });

  if ($(`body[data-native-draft-tool="${tool.id}"]`).length !== 1) fail(tool.id, "missing or incorrect draft tool identity");
  if ($('script[data-ultrapage-native-ribbon]').length !== 1) fail(tool.id, "shared Ribbon controller missing");
  if ($('script[data-ultrapage-native-recovery]').length !== 1) fail(tool.id, "shared recovery controller missing");
  if (!$('[data-native-ribbon]').length) fail(tool.id, "no Ribbon toolbar found");
  if (!recoverySource.includes(`"${tool.id}"`) && !recoverySource.includes(`${tool.id}:`)) fail(tool.id, "recovery field map missing");
  if (!tool.nativeAssets?.includes("../ultrapage-native-recovery.js")) fail(tool.id, "recovery asset absent from manifest");
  if (["txt-test-generator", "qti-blackboard"].includes(tool.id)) {
    if ($('script[data-ultrapage-assessment-bridge]').length !== 1) fail(tool.id, "assessment workflow bridge missing");
    if (!tool.nativeAssets?.includes("../ultrapage-assessment-bridge.js")) fail(tool.id, "assessment workflow bridge absent from manifest");
  }
  if (tool.id === "txt-test-generator") {
    if ($('script[data-ultrapage-canvas-qti]').length !== 1) fail(tool.id, "Canvas QTI package controller missing");
    if (!tool.nativeAssets?.includes("canvas-qti.js")) fail(tool.id, "Canvas QTI asset absent from manifest");
    if ($('#targetFormat option[value="canvas"]').length !== 1) fail(tool.id, "Canvas target option missing");
    for (const id of ["defaultPoints", "compareLmsBtn", "lmsComparisonDialog", "lmsComparisonTable", "downloadLmsComparisonBtn"]) {
      if ($(`#${id}`).length !== 1) fail(tool.id, `multi-LMS control #${id} missing`);
    }
    const securityPolicy = $('meta[http-equiv="Content-Security-Policy"]').attr("content") || "";
    for (const directive of ["connect-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) {
      if (!securityPolicy.includes(directive)) fail(tool.id, `security policy missing: ${directive}`);
    }
    if ($('meta[name="referrer"][content="no-referrer"]').length !== 1) fail(tool.id, "no-referrer policy missing");
    if ($('meta[http-equiv="Permissions-Policy"]').length !== 1) fail(tool.id, "permissions policy missing");
  }
  if (tool.id === "estiloapa") {
    if ($('script[data-ultrapage-lms-export]').length !== 1) fail(tool.id, "multi-LMS export controller missing");
    if (!tool.nativeAssets?.includes("lms-export.js")) fail(tool.id, "multi-LMS export asset absent from manifest");
    for (const id of ["lmsExportProfile", "checkLmsBtn", "copyLmsHtmlBtn", "downloadLmsHtmlBtn", "downloadLmsReportBtn", "lmsExportStatus", "lmsAuditDialog"]) {
      if ($(`#${id}`).length !== 1) fail(tool.id, `LMS export control #${id} missing`);
    }
  }
  if (tool.id === "qti-blackboard") {
    if ($('script[data-ultrapage-canvas-qti]').length !== 1) fail(tool.id, "Canvas QTI 1.2 converter missing");
    if (!tool.nativeAssets?.includes("../txt-test-generator/canvas-qti.js")) fail(tool.id, "Canvas QTI asset absent from manifest");
    for (const id of ["targetLms", "defaultPoints", "btnDownloadTarget", "btnCompareLms", "btnCopyImportChecklist", "lmsCompatibilityTable", "postImportChecklist", "countMA"]) {
      if ($(`#${id}`).length !== 1) fail(tool.id, `multi-LMS QTI control #${id} missing`);
    }
    const qtiSource = $("script:not([src])").map((_, element) => $(element).html() || "").get().join("\n");
    for (const required of ["SUPPORTED_TYPES = ['MC', 'MA', 'TF', 'FIB', 'ESSAY']", "cardinality=\"${multiple ? 'multiple' : 'single'}\"", "validatePackage", "parseXmlOrThrow", "Blackboard-safe items must omit optional QTI responseProcessing", "buildMoodleGift", "toCanvasItems", "downloadTargetPackage", "copyImportChecklist", "normalMaximum", "Package integrity"]) {
      if (!qtiSource.includes(required)) fail(tool.id, `required modern QTI capability missing: ${required}`);
    }
    if (qtiSource.includes('<responseProcessing template=')) fail(tool.id, "Blackboard profile includes optional responseProcessing and may be skipped during import");
    const securityPolicy = $('meta[http-equiv="Content-Security-Policy"]').attr("content") || "";
    for (const directive of ["connect-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"]) {
      if (!securityPolicy.includes(directive)) fail(tool.id, `security policy missing: ${directive}`);
    }
  }

  $("button").each((_, element) => {
    const accessibleName = $(element).text().trim() || $(element).attr("aria-label") || $(element).attr("title");
    if (!accessibleName) fail(tool.id, `button ${$(element).attr("id") || "without id"} has no accessible name`);
  });

  $("img").each((_, element) => {
    if ($(element).attr("alt") === undefined) fail(tool.id, `image ${$(element).attr("src") || "without src"} has no alt attribute`);
  });

  $("input:not([type=hidden]), select, textarea").each((_, element) => {
    const control = $(element);
    const id = control.attr("id");
    const labeled = control.attr("aria-label") || control.attr("aria-labelledby") || control.attr("title") ||
      control.closest("label").length || (id && $(`label[for="${id}"]`).length);
    if (!labeled) fail(tool.id, `${element.tagName} ${id ? `#${id}` : "without id"} has no label`);
  });

  $('a[target="_blank"]').each((_, element) => {
    const rel = new Set(($(element).attr("rel") || "").split(/\s+/));
    if (!rel.has("noopener") || !rel.has("noreferrer")) fail(tool.id, `external link lacks noopener noreferrer: ${$(element).attr("href")}`);
  });

  $("script:not([src])").each((_, element) => {
    try { new Function($(element).html() || ""); }
    catch (error) { fail(tool.id, `inline JavaScript syntax error: ${error.message}`); }
  });

  console.log(`✓ ${tool.name}: Ribbon, recovery, accessibility, links, IDs, and inline syntax`);
}

try { new Function(recoverySource); }
catch (error) { fail("recovery", `JavaScript syntax error: ${error.message}`); }
try { new Function(ribbonSource); }
catch (error) { fail("Ribbon", `JavaScript syntax error: ${error.message}`); }
try { new Function(bridgeSource); }
catch (error) { fail("assessment bridge", `JavaScript syntax error: ${error.message}`); }
try { new Function(lmsExportSource); }
catch (error) { fail("EstiloAPA LMS export", `JavaScript syntax error: ${error.message}`); }
try { new Function(canvasQtiSource); }
catch (error) { fail("Canvas QTI", `JavaScript syntax error: ${error.message}`); }

for (const required of ["indexedDB", "MAX_VERSIONS = 5", "showModal", "aria-live", "event.metaKey", "event.ctrlKey",
  "ultrapage-native-workspace", "Download backup", "Open backup", "MAX_BACKUP_BYTES", "validateWorkspace", "sanitizeImportedHtml", "URL.revokeObjectURL"]) {
  if (!recoverySource.includes(required)) fail("recovery", `required capability missing: ${required}`);
}

for (const required of ["destructiveClicks", "destructiveChanges", "Before replace", "stopImmediatePropagation", "replayingActions",
  "The safety copy could not be created"]) {
  if (!recoverySource.includes(required)) fail("recovery", `safe replacement capability missing: ${required}`);
}

for (const required of ["Search commands", "Alt+Q", "aria-live", "ArrowDown", "availableCommands", "showModal"]) {
  if (!ribbonSource.includes(required)) fail("Ribbon", `command search capability missing: ${required}`);
}

for (const required of ["ultrapage-assessment-transfer", "Send to QTI", "Send to TXT", "MAX_TRANSFER_CHARS", "MAX_TRANSFER_AGE",
  "postMessage", "window.location.origin", "Import from QTI", "Import from TXT", "window.confirm"]) {
  if (!bridgeSource.includes(required)) fail("assessment bridge", `workflow capability missing: ${required}`);
}

for (const required of ["Blackboard Ultra", "Moodle", "Canvas", "Universal LMS", "createResult", "navigator.clipboard",
  "standard content editor", "alternate domain", "merged cells", "noopener noreferrer", "scope", "BLOCKED_ELEMENTS", "SAFE_ATTRIBUTES",
  "data:image", "Download LMS HTML", "LMS Compatibility Report"]) {
  if (!lmsExportSource.includes(required)) fail("EstiloAPA LMS export", `required capability missing: ${required}`);
}

for (const required of ["QTI 1.2", "imsmanifest.xml", "assessment_qti.xml", "imsqti_xmlv1p2", "multiple_choice_question",
  "multiple_answers_question", "true_false_question", "essay_question", "short_answer_question",
  "createZipBlob", "buildTextBatchFiles", "downloadTextBatchZip", "IMPORT_ORDER.txt", "TextEncoder", "application/zip"]) {
  if (!canvasQtiSource.includes(required)) fail("Canvas QTI", `required capability missing: ${required}`);
}

try {
  const canvasWindow = {};
  new Function("window", canvasQtiSource)(canvasWindow);
  const canvasApi = canvasWindow.UltraPageCanvasQti;
  const sampleItems = [
    { type: "MC", question: "Choose one", data: { options: [{ text: "Correct", correct: true }, { text: "Wrong", correct: false }] } },
    { type: "MA", question: "Choose two", data: { options: [{ text: "A", correct: true }, { text: "B", correct: true }, { text: "C", correct: false }] } },
    { type: "TF", question: "True statement", data: { value: "true" } },
    { type: "ESS", question: "Explain", data: {} },
    { type: "FIB", question: "Complete", data: { answers: ["answer"] } }
  ];
  const files = canvasApi.buildPackage(sampleItems, "Audit Package", 2);
  if (!files["imsmanifest.xml"]?.includes("imsqti_xmlv1p2")) fail("Canvas QTI", "generated manifest is invalid");
  if (!files["assessment_qti.xml"]?.includes('rcardinality="Multiple"')) fail("Canvas QTI", "multiple-answer cardinality missing");
  if (!files["assessment_qti.xml"]?.includes("points_possible")) fail("Canvas QTI", "points metadata missing");
  const zipBytes = new Uint8Array(await canvasApi.createZipBlob(files).arrayBuffer());
  if (zipBytes[0] !== 0x50 || zipBytes[1] !== 0x4b) fail("Canvas QTI", "generated package is not a ZIP");
  const batchFiles = canvasApi.buildTextBatchFiles(Array.from({ length: 501 }, (_, index) => `MC\tQuestion ${index + 1}\tYes\tcorrect\tNo\tincorrect`), "Audit Bank", 250);
  const txtBatches = Object.keys(batchFiles).filter((name) => name.endsWith(".txt") && name !== "IMPORT_ORDER.txt");
  if (txtBatches.length !== 3) fail("Blackboard batches", `expected 3 TXT batches, found ${txtBatches.length}`);
  if (!batchFiles["IMPORT_ORDER.txt"]?.includes("Questions: 501")) fail("Blackboard batches", "import order metadata missing");
} catch (error) {
  fail("Canvas QTI", `behavior test failed: ${error.message}`);
}

if (errors.length) {
  console.error(`\nNative tool audit failed with ${errors.length} finding(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("\n✓ Native tool audit passed: 3/3 tools, command search, recovery, safe replacement, portable backup, assessment workflow bridge, multi-LMS EstiloAPA export, and audited Blackboard QTI 2.1, Moodle GIFT, and Canvas QTI 1.2 assessment exports");
