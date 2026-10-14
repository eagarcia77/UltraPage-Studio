import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = () => readFile(new URL("../public/native-tools/estiloapa/edit-stability-v348.js", import.meta.url), "utf8");

async function paragraphHarness({ previousTag = "P", insideTable = false } = {}) {
  const content = await source();
  const fullText = "Segunda línea del documento.";
  const above = { tagName: previousTag, textContent: "Primera línea intacta.", matches(selector: string) {
    return selector === "p" && previousTag === "P";
  } };
  const below = { tagName: "P", textContent: "Tercera línea intacta." };
  const typed = { nodeType: 3, nodeValue: fullText, parentElement: null as any };
  let removed = false;
  const paragraph = {
    tagName: "P", textContent: fullText, previousElementSibling: above,
    className: "", matches(_selector: string) { return false; },
    contains(node: any) { return node === typed; },
    closest(_selector: string) { return insideTable ? {} : null; },
    querySelector(_selector: string) { return null; },
    remove() { removed = true; }
  };
  typed.parentElement = { closest(selector: string) { return selector === "p" ? paragraph : null; } };
  let collapsed: boolean | null = null;
  let caretNode: any = null;
  let savedSelection = 0;
  const range = { startContainer: typed, endContainer: typed, startOffset: 0, endOffset: fullText.length };
  const selection = {
    rangeCount: 1, anchorNode: typed, focusNode: typed,
    toString() { return fullText; },
    getRangeAt(_index: number) { return range; },
    removeAllRanges() {},
    addRange(result: any) { caretNode = result.node; }
  };
  const root = { contains(node: any) { return node === paragraph && !removed || node === above || node === below; } };
  const windowMock: any = {
    clearTimeout(_timer: any) {}, setTimeout(_cb: Function, _delay?: number) { return 1; },
    getSelection() { return selection; }, apaSaveEditorSelection() { savedSelection++; }
  };
  const doc = {
    readyState: "loading", addEventListener(_event: string, _handler: Function) {},
    querySelector(selector: string) { return selector === "#preview" ? root : null; },
    createRange() {
      return {
        node: null as any,
        selectNodeContents(node: any) { this.node = node; },
        collapse(toStart: boolean) { collapsed = toStart; }
      };
    }
  };
  runInNewContext(content + "\nwindow.testCaret = { find: aesSelectedBodyParagraph, finish: aesFinishDeletedParagraph, set(candidate) { aesParagraphDeleteCandidate = candidate; } };", {
    document: doc, window: windowMock, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 }, console
  });
  return {
    above, paragraph, below, range, selection, root, windowMock,
    removed: () => removed, collapse: () => collapsed, caret: () => caretNode,
    saved: () => savedSelection
  };
}

for (const inputType of ["deleteContentBackward", "deleteContentForward"]) {
  test("deleting every word in a paragraph with " + inputType + " removes only the empty block and moves caret above", async () => {
    const h = await paragraphHarness();
    const candidate = h.windowMock.testCaret.find(h.root, { inputType }, h.selection);
    assert.ok(candidate);
    h.windowMock.testCaret.set(candidate);
    h.paragraph.textContent = ""; // Browser performed the native deletion; <p><br></p> remains.
    h.windowMock.testCaret.finish();
    assert.equal(h.removed(), true);
    assert.equal(h.caret(), h.above, "Caret must be inside the previous paragraph");
    assert.equal(h.collapse(), false, "Caret must be at the END of the previous paragraph");
    assert.equal(h.above.textContent, "Primera línea intacta.");
    assert.equal(h.below.textContent, "Tercera línea intacta.");
    assert.equal(h.saved(), 1);
  });
}

test("deleting part of a paragraph must not remove the paragraph or reposition the caret", async () => {
  const h = await paragraphHarness();
  h.selection.toString = () => "Segunda";
  assert.equal(h.windowMock.testCaret.find(h.root, { inputType: "deleteContentForward" }, h.selection), null);
  h.windowMock.testCaret.set(null);
  h.paragraph.textContent = " línea del documento.";
  h.windowMock.testCaret.finish();
  assert.equal(h.removed(), false);
  assert.equal(h.caret(), null);
});

test("do not remove a paragraph if some characters remain after deletion", async () => {
  const h = await paragraphHarness();
  const candidate = h.windowMock.testCaret.find(h.root, {}, h.selection);
  h.windowMock.testCaret.set(candidate);
  h.paragraph.textContent = "x";
  h.windowMock.testCaret.finish();
  assert.equal(h.removed(), false);
  assert.equal(h.caret(), null);
});

test("do not implicitly edit across a heading or inside a table", async () => {
  const heading = await paragraphHarness({ previousTag: "H2" });
  const table = await paragraphHarness({ insideTable: true });
  assert.equal(heading.windowMock.testCaret.find(heading.root, {}, heading.selection), null);
  assert.equal(table.windowMock.testCaret.find(table.root, {}, table.selection), null);
});

test("ordinary text deletion runs paragraph cleanup after the catastrophic-wipe guard", async () => {
  const js = await source();
  assert.match(js, /function aesAfterDeletion\(\)\s*\{[\s\S]*?if \(aesCheckForDocumentWipe\(\)\)[\s\S]*?aesFinishDeletedParagraph\(\)/);
  assert.match(js, /root\.addEventListener\("beforeinput", aesBeforeDeletion, true\)/);
  assert.match(js, /root\.addEventListener\("input", aesAfterDeletion, true\)/);
  const sw = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(sw, /curralume-v77/);
});
