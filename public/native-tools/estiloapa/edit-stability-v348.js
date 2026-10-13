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
// Keep a short-lived, per-deletion recovery point: third-party DOM observers
// may rewrite the editable document AFTER the browser has fired its input event.
let aesDeletionSnapshot = null;
let aesDeletionWatchTimer = null;

function aesCancelDeletionWatch() {
  aesNativeClearTimeout(aesDeletionWatchTimer);
  aesDeletionWatchTimer = null;
  aesDeletionSnapshot = null;
}

function aesWarnAboutDeletion() {
  const status = document.querySelector("#status");
  if (status) {
    status.textContent = "Large document deletion blocked to protect your text. Select a smaller passage, or use Clear to empty the document.";
    status.className = "status error";
  }
}

function aesCheckForDocumentWipe() {
  const previous = aesDeletionSnapshot;
  if (!previous) return false;
  const root = aesPreview();
  if (!root) return false;
  const remaining = root.textContent?.trim().length || 0;
  // A single deletion of one line cannot legitimately remove almost an entire
  // substantial academic document. Ordinary line and paragraph edits are kept.
  if (remaining > 0 && remaining >= previous.length * 0.05) return false;
  aesCancelDeletionWatch();
  root.innerHTML = previous.html;
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
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
  if (selectedLength >= Math.max(70, length * 0.8) && event.cancelable) {
    event.preventDefault();
    aesCancelDeletionWatch();
    aesWarnAboutDeletion();
    return;
  }
  aesDeletionSnapshot = { html: root.innerHTML, length };
  aesNativeClearTimeout(aesDeletionWatchTimer);
  // Keep the snapshot across the input event and asynchronous normalizers.
  // Clearing it immediately on input previously left a data-loss window.
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
