import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const page = await readFile(path.join(root, "app/page.tsx"), "utf8");
const styles = await readFile(path.join(root, "app/globals.css"), "utf8");
const findings = [];

const requireSource = (needle, capability) => {
  if (!page.includes(needle)) findings.push(`Missing ${capability}`);
};
const requireStyle = (needle, capability) => {
  if (!styles.includes(needle)) findings.push(`Missing ${capability}`);
};

requireSource("event.clipboardData.items", "clipboard item image capture");
requireSource("item.getAsFile()", "clipboard Blob conversion");
requireSource("blobToDataUrl(file)", "portable embedded image conversion");
requireSource('data-ultrapage-alt-status="pending"', "pending alternative-text state");
requireSource("selectedImageRef", "persistent selected-image reference");
requireSource("Picture Accessibility & Properties", "Picture accessibility dialog");
requireSource("selectNextImageIssue", "next image issue navigation");
requireSource("Image alternatives", "Design Preview alternative-text audit");
requireSource("Decorative image semantics", "Design Preview decorative-image audit");
requireSource("Image rendering", "failed image rendering audit");
requireSource("LMS image accessibility parity", "LMS image accessibility parity audit");
requireSource("markup hygiene", "LMS markup hygiene audit");
requireSource("runBlackboardPreviewAudit", "Blackboard-specific quality gate");
requireSource("navigatePreviewIssue", "Preview issue navigation");
requireSource("findOpeningTagByOrdinal", "Live element-to-source mapping");
requireSource("findTextWithinElement", "exact Live text-to-source mapping");
requireSource("connectLiveSelection", "Live Preview selection bridge");
requireSource('document.addEventListener("mouseup"', "Live text-selection event bridge");
requireSource('document.addEventListener("selectionchange"', "keyboard and extended Live selection bridge");
requireSource('document.addEventListener("click"', "Live element-click event bridge");
requireSource('document.addEventListener("focusin"', "Live keyboard-focus event bridge");
requireSource("commonAncestorContainer", "multi-element Live text selection mapping");
requireSource("if (attempt < 3) reveal(attempt + 1)", "deferred Split editor mounting recovery");
requireSource("target.setSelectionRange(offset, offset + length)", "exact HTML editor range selection");
requireSource('element.setAttribute("data-ultrapage-live-selected", "true")', "Live visual selection marking");
requireSource("Live → HTML", "visible Live-to-source match strip");
requireSource("data-ultrapage-live-selected", "visible Live Preview match marker");
requireSource("Live Sync", "HTML Ribbon Live synchronization group");
requireSource("Live selection synchronization enabled", "Live synchronization status announcement");
requireSource("inspectDesignSelectionInHtml", "Design Preview selection-to-HTML mapping");
requireSource("Inspect HTML", "Design-to-Code Ribbon command");
requireSource("Open Split", "direct Split workspace command");
requireSource("Design selection located in HTML", "Design-to-HTML location announcement");
requireSource("current.selectedText ? findTextWithinElement", "selection remapping after source reformatting");
requireSource("PREVIEW_AUDIT_CHECK_COUNT = 23", "current Preview Audit check count");
requireSource("Keyboard-scrollable tables", "keyboard-scrollable table audit");
requireSource("applyPreviewKeyboardSemantics", "keyboard table semantics normalization");
requireSource('role="presentation" aria-hidden="true"', "explicit decorative semantics");
requireSource("data-ultrapage-image-id", "pasted-image reconciliation");
requireSource("Nothing portable could be pasted", "exact non-portable image feedback");
requireStyle('img[data-ultrapage-alt-status="pending"]', "visible pending-image indicator");
requireStyle('img[data-ultrapage-selected="true"]', "visible selected-image indicator");
requireStyle(".picture-access-status", "Picture Ribbon accessibility status");
requireStyle(".preview-issue-navigation", "Preview issue navigator styling");

const extractFunction = (name) => {
  const functionStart = page.indexOf(`function ${name}`);
  if (functionStart < 0) return null;
  const parametersStart = page.indexOf("(", functionStart);
  let parameterDepth = 0;
  let parametersEnd = -1;
  for (let index = parametersStart; index < page.length; index += 1) {
    if (page[index] === "(") parameterDepth += 1;
    if (page[index] === ")") parameterDepth -= 1;
    if (parameterDepth === 0) { parametersEnd = index + 1; break; }
  }
  if (parametersEnd < 0) return null;
  const bodyStart = page.indexOf("{", parametersEnd);
  let depth = 0;
  let functionEnd = -1;
  for (let index = bodyStart; index < page.length; index += 1) {
    if (page[index] === "{") depth += 1;
    if (page[index] === "}") depth -= 1;
    if (depth === 0) { functionEnd = index + 1; break; }
  }
  return functionEnd < 0 ? null : page.slice(functionStart, functionEnd);
};

const openingFunction = extractFunction("findOpeningTagByOrdinal");
const textFunction = extractFunction("findTextWithinElement");
if (!openingFunction || !textFunction) findings.push("Live selection mappers could not be extracted for behavior testing");
else {
    const executable = ts.transpileModule(`const HTML_VOID_ELEMENTS = new Set(["IMG","HR","BR"]);\n${openingFunction}\n${textFunction}\nglobalThis.__findOpeningTagByOrdinal = findOpeningTagByOrdinal;\nglobalThis.__findTextWithinElement = findTextWithinElement;`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText;
    const sandbox = {};
    vm.createContext(sandbox);
    const runtime = vm.runInContext(`${executable}\n({ locate: globalThis.__findOpeningTagByOrdinal, locateText: globalThis.__findTextWithinElement })`, sandbox);
    const locate = runtime.locate;
    const locateText = runtime.locateText;
    const sample = `<!-- <p>ignored</p> -->\n<p>First   paragraph</p>\n<section><p class="second">Second <strong>nested text</strong></p><img src="data:image/png;base64,AA" alt="Example"><p>Fish &amp; Chips</p></section>`;
    const cases = [
      ["p", 0, "<p>"],
      ["p", 1, '<p class="second">'],
      ["strong", 0, "<strong>"],
      ["img", 0, '<img src="data:image/png;base64,AA" alt="Example">'],
    ];
    cases.forEach(([tag, ordinal, expected]) => {
      const match = locate(sample, tag, ordinal);
      if (!match || sample.slice(match.offset, match.offset + match.length) !== expected) findings.push(`Live selection mapper failed ${tag} occurrence ${Number(ordinal) + 1}`);
    });
    const firstParagraph = locate(sample, "p", 0);
    const whitespaceText = locateText(sample, firstParagraph, "p", "First paragraph");
    if (!whitespaceText || sample.slice(whitespaceText.offset, whitespaceText.offset + whitespaceText.length) !== "First   paragraph") findings.push("Live text mapper failed flexible whitespace selection");
    const encodedParagraph = locate(sample, "p", 2);
    const encodedText = locateText(sample, encodedParagraph, "p", "Fish & Chips");
    if (!encodedText || sample.slice(encodedText.offset, encodedText.offset + encodedText.length) !== "Fish &amp; Chips") findings.push("Live text mapper failed encoded character selection");
    const image = locate(sample, "img", 0);
    if (locateText(sample, image, "img", "Example") !== null) findings.push("Live text mapper attempted to map text inside a void image element");
    if (locate(sample, "p", 3) !== null) findings.push("Live selection mapper counted a tag inside an HTML comment");
}

if (findings.length) {
  console.error(`Design Preview audit failed with ${findings.length} finding(s):`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log("✓ Design Preview audit passed: 23-point quality gate, clipboard images, Blackboard output, keyboard tables, issue navigation, persistent selection, behavior-tested Live/Design-to-HTML mapping, and exact accessibility checks");
