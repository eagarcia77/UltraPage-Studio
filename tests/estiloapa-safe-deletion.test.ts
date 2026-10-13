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
    createRange() { return { selectNodeContents(_el: any) {}, collapse(_end: boolean) {} }; }
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
  return { root, status, before, after, deletion, select(n: number) { selectedLength = n; } };
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

test("selecting nearly the whole document cannot delete it accidentally", async () => {
  const h = await deletionHarness();
  h.select(590);
  const e = h.deletion();
  h.before(e);
  assert.equal(e.prevented, true);
  assert.match(h.status.textContent, /Large document deletion blocked/);
  assert.equal(h.root.textContent.length, 600);
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
  assert.match(h.status.textContent, /Large document deletion blocked/);
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

test("dangerous normalizers are deferred during editing, not executed on delete", async () => {
  const guard = await source("public/native-tools/estiloapa/edit-stability-v348.js");
  for (const method of ["applyModuleProfile", "applyThesisProfile", "markThesisStructure", "normalizeApaTables", "runApaTableNormalization", "normalizeMedia", "normalizeNumberedLists"]) {
    assert.match(guard, new RegExp(method));
  }
  assert.match(guard, /root\.addEventListener\("beforeinput", aesBeforeDeletion, true\)/);
  assert.match(guard, /root\.addEventListener\("input", aesAfterDeletion, true\)/);
  const sw = await source("public/sw.js");
  assert.match(sw, /curralume-v62/);
});
