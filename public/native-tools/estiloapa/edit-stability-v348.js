// Protect the editable document from background normalizers while the user types.

const APA_EDIT_STABILITY_VERSION = "3.4.8";
const aesNativeSetTimeout = window.setTimeout.bind(window);
const aesNativeClearTimeout = window.clearTimeout.bind(window);
let apaEditForceDepth = 0;
let apaEditIdleTimer = null;
let apaEditComposing = false;
let aesPendingNormalizationId = 0;
const aesPendingNormalizations = new Map();

function aesPreview() {
  return document.querySelector("#preview");
}

function aesToolbar() {
  return document.querySelector("#apaEditorShell");
}

function aesSelectionInsidePreview() {
  const root = aesPreview();
  const selection = window.getSelection();
  if (!root || !selection || !selection.rangeCount) return false;
  const node = selection.anchorNode;
  const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  return Boolean(element && root.contains(element));
}

function aesSetEditing(active) {
  const root = aesPreview();
  if (!root) return;
  root.dataset.apaUserEditing = active ? "true" : "false";
  root.classList.toggle("apa-user-editing", Boolean(active));
}

function apaShouldDeferNormalization() {
  if (apaEditForceDepth > 0) return false;
  const root = aesPreview();
  if (!root) return false;
  if (apaEditComposing) return true;
  if (root.dataset.apaUserEditing === "true") return true;
  if (root.contains(document.activeElement)) return true;
  return aesSelectionInsidePreview();
}

function aesLooksLikeNormalization(callback) {
  if (typeof callback !== "function") return false;
  let source = "";
  try { source = Function.prototype.toString.call(callback); } catch { return false; }
  return /(applyModuleProfile|markModuleSemantics|normalizeMedia|normalizeApaMedia|normalizeFigures|normalizeTableCaptions|normalizeApaTables|runApaTableNormalization|applyThesisProfile|markThesisStructure|normalizeNumberedLists|recoverParagraphNumberRuns|applyApaFigureFormatting|classifyEmbeddedImages|repairMediaRoles|preserveOriginalPdfMedia|recoverPdfFiguresV34\d|formatReferencesApa7|scheduleSourceImages|scheduleApaFigureFormatting|scheduleListNormalization|scheduleMediaNormalization)/.test(source);
}

function aesQueueNormalization(callback, args) {
  const id = ++aesPendingNormalizationId;
  aesPendingNormalizations.set(id, { callback, args });
  return id;
}

function aesFlushPendingNormalizations() {
  if (apaShouldDeferNormalization() || !aesPendingNormalizations.size) return;
  const tasks = [...aesPendingNormalizations.values()];
  aesPendingNormalizations.clear();
  apaWithForcedNormalization(() => {
    for (const task of tasks) {
      try { task.callback(...task.args); }
      catch (error) { console.error("APA v3.4.8 normalización diferida", error); }
    }
  });
}

// Existing modules use short setTimeout calls after every DOM/input mutation.
// Intercept only callbacks that are clearly document normalizers. Other timers,
// including typing audit debounce and UI feedback, keep their normal behavior.
window.setTimeout = function(callback, delay = 0, ...args) {
  if (!aesLooksLikeNormalization(callback)) {
    return aesNativeSetTimeout(callback, delay, ...args);
  }
  return aesNativeSetTimeout(() => {
    if (apaShouldDeferNormalization()) {
      aesQueueNormalization(callback, args);
      return;
    }
    callback(...args);
  }, delay);
};
// A short-lived safety checkpoint handles unexpectedly destructive DOM rewrites.
// Native line/paragraph deletions remain the browser's responsibility.
let aesDeletionSnapshot = null;
let aesDeletionWatchTimer = null;

function aesCancelDeletionWatch() {
  aesNativeClearTimeout(aesDeletionWatchTimer);
  aesDeletionWatchTimer = null;
  aesDeletionSnapshot = null;
}

// Preserve the editor caret across an emergency DOM restoration. A Range cannot
// be reused after assigning innerHTML; its text nodes are no longer in the DOM.
function aesNodePath(root, node) {
  const path = [];
  while (node && node !== root) {
    const parent = node.parentNode;
    if (!parent) return null;
    const index = Array.prototype.indexOf.call(parent.childNodes, node);
    if (index < 0) return null;
    path.unshift(index);
    node = parent;
  }
  return node === root ? path : null;
}

function aesCaptureDeleteRange(root, event, selection) {
  let nativeRange = null;
  try {
    const targets = typeof event.getTargetRanges === "function" ? event.getTargetRanges() : [];
    nativeRange = targets?.[0] || (selection?.rangeCount && typeof selection.getRangeAt === "function"
      ? selection.getRangeAt(0) : null);
  } catch {
    return null;
  }
  if (!nativeRange || !root.contains(nativeRange.startContainer) || !root.contains(nativeRange.endContainer)) return null;
  const start = aesNodePath(root, nativeRange.startContainer);
  const end = aesNodePath(root, nativeRange.endContainer);
  if (!start || !end) return null;
  return {
    start, end,
    startOffset: nativeRange.startOffset,
    endOffset: nativeRange.endOffset,
    selected: nativeRange.startContainer !== nativeRange.endContainer
      || nativeRange.startOffset !== nativeRange.endOffset
  };
}

function aesRestoreDeleteRange(root, saved) {
  if (!saved) return null;
  const locate = (path) => path.reduce((node, index) => node?.childNodes?.[index], root);
  const start = locate(saved.start);
  const end = locate(saved.end);
  if (!start || !end) return null;
  const limit = (node) => node.nodeType === Node.TEXT_NODE
    ? node.nodeValue.length : node.childNodes.length;
  try {
    const range = document.createRange();
    range.setStart(start, Math.min(saved.startOffset, limit(start)));
    range.setEnd(end, Math.min(saved.endOffset, limit(end)));
    return range;
  } catch {
    return null;
  }
}

function aesWarnAboutDeletion() {
  const status = document.querySelector("#status");
  if (status) {
    status.textContent = "An unexpected document-wide deletion was recovered. Review the affected line before continuing.";
    status.className = "status error";
  }
}

function aesCheckForDocumentWipe() {
  const previous = aesDeletionSnapshot;
  if (!previous) return false;
  const root = aesPreview();
  if (!root) return false;
  const remaining = root.textContent?.trim().length || 0;
  if (remaining > 0 && remaining >= previous.length * 0.05) return false;
  // Selecting and deleting nearly the entire document is intentional editing,
  // particularly when a short document consists of just one long line.
  if (previous.selectedLength >= previous.length * 0.8) {
    aesCancelDeletionWatch();
    return false;
  }
  aesCancelDeletionWatch();
  root.innerHTML = previous.html;
  const selection = window.getSelection();
  if (selection) {
    let range = aesRestoreDeleteRange(root, previous.range);
    if (!range) {
      range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(true);
    } else if (previous.range?.selected) {
      // Apply the originally requested deletion after recovering the document,
      // rather than silently undoing it and moving the caret to the last page.
      range.deleteContents();
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  window.apaSaveEditorSelection?.();
  aesWarnAboutDeletion();
  root.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

function aesBeforeDeletion(event) {
  if (!String(event.inputType || "").startsWith("delete")) {
    aesCancelDeletionWatch();
    return;
  }
  const root = aesPreview();
  const length = root?.textContent?.trim().length || 0;
  if (!root || length < 80) {
    aesCancelDeletionWatch();
    return;
  }
  const selection = window.getSelection();
  const selectedLength = selection?.anchorNode && selection?.focusNode
    && root.contains(selection.anchorNode) && root.contains(selection.focusNode)
    ? selection.toString().length : 0;
  // Do not preventDefault(): browsers must be able to delete a complete line,
  // including the last line of a document, with normal Backspace/Delete.
  if (selectedLength >= length * 0.8) {
    aesCancelDeletionWatch();
    return;
  }
  aesDeletionSnapshot = {
    html: root.innerHTML,
    length,
    selectedLength,
    range: aesCaptureDeleteRange(root, event, selection)
  };
  aesNativeClearTimeout(aesDeletionWatchTimer);
  // Keep the checkpoint across asynchronous normalizers, not just input.
  aesDeletionWatchTimer = aesNativeSetTimeout(aesCancelDeletionWatch, 3000);
}

function aesAfterDeletion() {
  aesCheckForDocumentWipe();
}

function aesMarkEditing() {
  aesNativeClearTimeout(apaEditIdleTimer);
  aesSetEditing(true);
}

function aesFinishEditing({ dispatch = true } = {}) {
  aesNativeClearTimeout(apaEditIdleTimer);
  apaEditComposing = false;
  aesSetEditing(false);
  if (dispatch) {
    aesPreview()?.dispatchEvent(new CustomEvent("apa-editor-idle", {
      bubbles: false,
      detail: { version: APA_EDIT_STABILITY_VERSION }
    }));
  }
  aesNativeSetTimeout(aesFlushPendingNormalizations, 20);
}

function aesScheduleFinish(delay = 320) {
  aesNativeClearTimeout(apaEditIdleTimer);
  apaEditIdleTimer = aesNativeSetTimeout(() => {
    const root = aesPreview();
    const toolbar = aesToolbar();
    const active = document.activeElement;
    if (root?.contains(active) || toolbar?.contains(active) || aesSelectionInsidePreview()) return;
    aesFinishEditing();
  }, delay);
}

function apaWithForcedNormalization(callback) {
  apaEditForceDepth += 1;
  let result;
  try {
    result = callback();
  } catch (error) {
    apaEditForceDepth = Math.max(0, apaEditForceDepth - 1);
    throw error;
  }

  if (result && typeof result.then === "function") {
    return Promise.resolve(result).finally(() => {
      apaEditForceDepth = Math.max(0, apaEditForceDepth - 1);
    });
  }

  apaEditForceDepth = Math.max(0, apaEditForceDepth - 1);
  return result;
}

function aesInitialize() {
  const root = aesPreview();
  if (!root) return;

  for (const eventName of ["focusin", "beforeinput", "input", "keydown", "paste", "cut"]) {
    root.addEventListener(eventName, aesMarkEditing, true);
  }

  root.addEventListener("beforeinput", aesBeforeDeletion, true);
  root.addEventListener("input", aesAfterDeletion, true);
  // Detect data loss caused by delayed MutationObserver-driven normalizers.
  // This observer never changes the document unless a recent deletion wiped it.
  new MutationObserver(aesCheckForDocumentWipe).observe(root, {
    childList: true, characterData: true, subtree: true
  });

  root.addEventListener("compositionstart", () => {
    apaEditComposing = true;
    aesMarkEditing();
  }, true);

  root.addEventListener("compositionend", () => {
    apaEditComposing = false;
    aesMarkEditing();
  }, true);

  root.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    if (next && (root.contains(next) || aesToolbar()?.contains(next))) return;
    aesScheduleFinish();
  }, true);

  // Keyboard activation of toolbar buttons should also cancel the watch:
  // only an actual user delete operation is eligible for automatic recovery.
  document.addEventListener("click", (event) => {
    if (event.target?.closest?.("#formatBtn,#demoBtn,#clearBtn")) aesCancelDeletionWatch();
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const action = event.target?.closest?.(
      "#formatBtn,#demoBtn,#clearBtn,#reauditBtn,#downloadDocxBtn,#downloadHtmlBtn,#downloadPdfBtn,#downloadAuditBtn,#formatReferenceList,#auditReferencesNow"
    );
    if (!action) return;
    aesCancelDeletionWatch();
    aesFinishEditing({ dispatch: false });
  }, true);

  root.addEventListener("apa-editor-idle", aesFlushPendingNormalizations);
}

window.apaShouldDeferNormalization = apaShouldDeferNormalization;
window.apaWithForcedNormalization = apaWithForcedNormalization;
window.apaFinishProtectedEditing = aesFinishEditing;
window.apaFlushPendingNormalizations = aesFlushPendingNormalizations;
window.APA_EDIT_STABILITY_VERSION = APA_EDIT_STABILITY_VERSION;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", aesInitialize, { once: true });
} else {
  aesInitialize();
}
