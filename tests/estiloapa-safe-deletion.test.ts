import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const rootUrl = new URL("../", import.meta.url);
const source = (path: string) => readFile(new URL(path, rootUrl), "utf8");

type Handler = (event: any) => void;

async function deletionHarness() {
  const sourceCode = await source("public/native-tools/estiloapa/edit-stability-v348.js");
  const handlers = new Map<string, Handler[]>();
  const documentListeners = new Map<string, Handler[]>();
  let mutationCallback: Handler | null = null;
  class FakeMutationObserver {
    constructor(callback: Handler) { mutationCallback = callback; }
    observe(_root: any, _options: any) {}
  }
  const root = {
    dataset: { apaUserEditing: "false" },
    classList: { toggle(_name: string, _value: boolean) {} },
    innerHTML: "<section><p>" + "A".repeat(300) + "</p><p>" + "B".repeat(300) + "</p></section>",
    textContent: "A".repeat(300) + "B".repeat(300),
    addEventListener(name: string, listener: Handler) {
      handlers.set(name, [...(handlers.get(name) || []), listener]);
    },
    contains(node: any) { return node === root || node?.inEditor === true; },
    dispatchEvent(event: any) {
      for (const handler of handlers.get(event.type) || []) handler(event);
      return true;
    }
  };
  const status = { textContent: "", className: "" };
  let lastCaretCollapse: boolean | null = null;
  const doc = {
    readyState: "loading",
    activeElement: null,
    querySelector(selector: string) {
      if (selector === "#preview") return root;
      if (selector === "#status") return status;
      return null;
    },
    addEventListener(name: string, listener: Handler) {
      documentListeners.set(name, [...(documentListeners.get(name) || []), listener]);
    },
    createRange() { return { selectNodeContents(_el: any) {}, collapse(toStart: boolean) { lastCaretCollapse = toStart; } }; }
  };
  let selectedLength = 0;
  const selectionNode = { inEditor: true };
  const selection = {
    anchorNode: selectionNode,
    focusNode: selectionNode,
    rangeCount: 1,
    toString() { return "X".repeat(selectedLength); },
    removeAllRanges() {},
    addRange(_range: any) {}
  };
  const windowMock = {
    setTimeout(_callback: Handler, _delay: number) { return 4; },
    clearTimeout(_timer: any) {},
    getSelection() { return selection; },
    apaSaveEditorSelection() {}
  };
  class LocalEvent {
    type: string;
    constructor(name: string, _options: object) { this.type = name; }
  }
  runInNewContext(sourceCode, {
    document: doc,
    window: windowMock,
    Node: { ELEMENT_NODE: 1 },
    MutationObserver: FakeMutationObserver,
    Event: LocalEvent,
    console
  });
  documentListeners.get("DOMContentLoaded")?.[0]({});
  const deletion = () => {
    let prevented = false;
    const event = {
      inputType: "deleteContentBackward",
      cancelable: true,
      preventDefault() { prevented = true; },
      get prevented() { return prevented; }
    };
    return event;
  };
  const before = (event: any) => handlers.get("beforeinput")?.forEach((fn) => fn(event));
  const after = (event: any) => handlers.get("input")?.forEach((fn) => fn(event));
  return {
    root, status, before, after, deletion, caretCollapsedToStart() { return lastCaretCollapse; }, select(n: number) { selectedLength = n; },
    notifyMutation() { mutationCallback?.([]); },
    clickClear() {
      for (const handler of documentListeners.get("click") || []) {
        handler({ target: { closest(selector: string) { return selector.includes("#clearBtn") ? {} : null; } } });
      }
    }
  };
}

test("normal deletion of a line does not block editing or restore old text", async () => {
  const h = await deletionHarness();
  h.select(20);
  const e = h.deletion();
  h.before(e);
  assert.equal(e.prevented, false);
  h.root.textContent = "A".repeat(290) + "B".repeat(300);
  h.root.innerHTML = "<section><p>" + "A".repeat(290) + "</p><p>" + "B".repeat(300) + "</p></section>";
  h.after(e);
  assert.equal(h.root.textContent.length, 590);
  assert.equal(h.status.textContent, "");
});

test("a user may delete nearly all or all of a short document without being blocked", async () => {
  const h = await deletionHarness();
  h.select(590);
  const e = h.deletion();
  const oldMarkup = h.root.innerHTML;
  h.before(e);
  assert.equal(e.prevented, false);
  h.root.textContent = "";
  h.root.innerHTML = "";
  h.after(e);
  h.notifyMutation();
  assert.equal(h.root.innerHTML, "");
  assert.notEqual(h.root.innerHTML, oldMarkup);
  assert.equal(h.status.textContent, "");
  assert.equal(h.caretCollapsedToStart(), null);
});

test("when a delete unexpectedly clears a whole document, its prior markup is restored", async () => {
  const h = await deletionHarness();
  h.select(10);
  const originalMarkup = h.root.innerHTML;
  const e = h.deletion();
  h.before(e);
  h.root.textContent = "";
  h.root.innerHTML = "";
  h.after(e);
  assert.equal(h.root.innerHTML, originalMarkup);
  assert.equal(h.caretCollapsedToStart(), true, "Recovery must not send the caret to the end of the document");
  assert.match(h.status.textContent, /unexpected document-wide deletion was recovered/);
});

test("a delayed document-wide DOM rewrite after deleting a line restores the original paper", async () => {
  const h = await deletionHarness();
  h.select(12);
  const e = h.deletion();
  const originalMarkup = h.root.innerHTML;
  h.before(e);
  h.root.textContent = "A".repeat(285) + "B".repeat(300);
  h.root.innerHTML = "<section><p>" + "A".repeat(285) + "</p><p>" + "B".repeat(300) + "</p></section>";
  h.after(e);
  assert.equal(h.status.textContent, "");
  // Reproduce a background DOM normalizer running after the browser's input.
  h.root.textContent = "";
  h.root.innerHTML = "";
  h.notifyMutation();
  assert.equal(h.root.innerHTML, originalMarkup);
  assert.match(h.status.textContent, /unexpected document-wide deletion was recovered/);
});

test("asynchronous harmless formatting never reverts a legitimate line edit", async () => {
  const h = await deletionHarness();
  h.select(12);
  const e = h.deletion();
  h.before(e);
  h.root.textContent = "A".repeat(285) + "B".repeat(300);
  h.root.innerHTML = "<section><p>" + "A".repeat(285) + "</p><p>" + "B".repeat(300) + "</p></section>";
  h.after(e);
  h.notifyMutation();
  assert.equal(h.root.textContent.length, 585);
  assert.equal(h.status.textContent, "");
});

test("the Clear command is exempt from the deletion recovery watch", async () => {
  const h = await deletionHarness();
  const e = h.deletion();
  h.before(e);
  h.after(e);
  h.clickClear();
  h.root.textContent = "";
  h.root.innerHTML = "";
  h.notifyMutation();
  assert.equal(h.root.innerHTML, "");
  assert.equal(h.status.textContent, "");
});

test("unrelated editing input does not roll back a document", async () => {
  const h = await deletionHarness();
  const e = h.deletion();
  h.before(e);
  h.root.textContent = "A".repeat(550);
  h.root.innerHTML = "<p>" + "A".repeat(550) + "</p>";
  h.after({ inputType: "insertText" });
  assert.equal(h.root.textContent.length, 550);
  assert.equal(h.status.textContent, "");
});

test("a restored selection path deletes only the originally selected text and retains its caret", async () => {
  const code = await source("public/native-tools/estiloapa/edit-stability-v348.js");
  const root = { childNodes: [] as any[], contains(_node: any) { return true; } };
  const oldParagraph = { parentNode: root, childNodes: [] as any[] };
  const originalText = { parentNode: oldParagraph, nodeType: 3, nodeValue: "Primera línea. Segunda línea. Tercera línea." };
  oldParagraph.childNodes = [originalText];
  root.childNodes = [oldParagraph];
  let restoredCaret = -1;
  const windowMock: any = { setTimeout: () => 1, clearTimeout: () => {} };
  const doc = {
    readyState: "loading",
    addEventListener() {},
    createRange() {
      let node: any, start = 0, end = 0;
      return {
        setStart(value: any, offset: number) { node = value; start = offset; },
        setEnd(_value: any, offset: number) { end = offset; },
        deleteContents() { node.nodeValue = node.nodeValue.slice(0, start) + node.nodeValue.slice(end); },
        collapse(toStart: boolean) { if (toStart) restoredCaret = start; }
      };
    }
  };
  runInNewContext(code + "\nwindow.captureRangeForTest = aesCaptureDeleteRange; window.restoreRangeForTest = aesRestoreDeleteRange;", {
    window: windowMock, document: doc, Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 }, console
  });
  const selection = { rangeCount: 1, getRangeAt() {
    return { startContainer: originalText, endContainer: originalText, startOffset: 15, endOffset: 30 };
  }};
  const saved = windowMock.captureRangeForTest(root, {}, selection);
  assert.ok(saved?.selected);
  // Simulate rehydrating the HTML following an unexpected full-document wipe.
  const newParagraph = { parentNode: root, childNodes: [] as any[] };
  const newText = { parentNode: newParagraph, nodeType: 3, nodeValue: originalText.nodeValue };
  newParagraph.childNodes = [newText];
  root.childNodes = [newParagraph];
  const restored = windowMock.restoreRangeForTest(root, saved);
  assert.ok(restored);
  restored.deleteContents();
  restored.collapse(true);
  assert.equal(newText.nodeValue, originalText.nodeValue.slice(0, 15) + originalText.nodeValue.slice(30));
  assert.equal(restoredCaret, 15);
});

test("dangerous normalizers are deferred during editing, not executed on delete", async () => {
  const guard = await source("public/native-tools/estiloapa/edit-stability-v348.js");
  for (const method of ["applyModuleProfile", "applyThesisProfile", "markThesisStructure", "normalizeApaTables", "runApaTableNormalization", "normalizeMedia", "normalizeNumberedLists"]) {
    assert.match(guard, new RegExp(method));
  }
  assert.match(guard, /root\.addEventListener\("beforeinput", aesBeforeDeletion, true\)/);
  assert.match(guard, /root\.addEventListener\("input", aesAfterDeletion, true\)/);
  const sw = await source("public/sw.js");
  assert.match(sw, /curralume-v63/);
  assert.match(guard, /range\\.deleteContents\\(\\)/);
  assert.match(guard, /range\\.collapse\\(true\\)/);
  assert.doesNotMatch(guard, /range\\.collapse\\(false\\)/);
  assert.doesNotMatch(guard, /event\\.preventDefault\\(\\)/);
  assert.match(sw, /url\.pathname\.startsWith\("\/native-tools\/estiloapa\/"\)/);
  const html = await source("public/native-tools/estiloapa/index.html");
  assert.match(html, /src="edit-stability-v348\.js\?v=62"/);
  assert.match(sw, /edit-stability-v348\.js\?v=62/);
});
