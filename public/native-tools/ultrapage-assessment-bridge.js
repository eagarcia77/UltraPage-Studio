/* UltraPage Studio local workflow bridge for TXT and QTI assessment tools.
 * Transfers editable source text only; target validation remains authoritative.
 */
(function () {
  "use strict";

  const toolId = document.body.dataset.nativeDraftTool;
  const supported = new Set(["txt-test-generator", "qti-blackboard"]);
  if (!supported.has(toolId)) return;

  const TRANSFER_KEY = "ultrapage-assessment-transfer-v1";
  const TRANSFER_FORMAT = "ultrapage-assessment-transfer";
  const TRANSFER_VERSION = 1;
  const MAX_TRANSFER_CHARS = 1_000_000;
  const MAX_TRANSFER_AGE = 30 * 60 * 1000;
  const settings = toolId === "txt-test-generator"
    ? { content: "#quizContent", name: "#quizName", target: "qti-blackboard", targetHash: "qti", sendLabel: "Send to QTI", importLabel: "Import from QTI", validate: "#verifyBtn" }
    : { content: "#inputText", name: "#packageName", target: "txt-test-generator", targetHash: "txt", sendLabel: "Send to TXT", importLabel: "Import from TXT", validate: "#btnRunCheck" };

  function setStatus(message, tone = "ready") {
    const status = document.querySelector("#nativeBridgeStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function readTransfer() {
    try {
      const value = JSON.parse(localStorage.getItem(TRANSFER_KEY) || "null");
      if (!value || value.format !== TRANSFER_FORMAT || value.version !== TRANSFER_VERSION) return null;
      const age = Date.now() - value.createdAt;
      if (!Number.isFinite(value.createdAt) || age > MAX_TRANSFER_AGE || age < -5 * 60 * 1000) {
        localStorage.removeItem(TRANSFER_KEY);
        return null;
      }
      if (!supported.has(value.source) || !supported.has(value.target) || typeof value.content !== "string" || typeof value.name !== "string") return null;
      if (value.source === value.target) return null;
      if (value.content.length > MAX_TRANSFER_CHARS) return null;
      return value;
    } catch {
      localStorage.removeItem(TRANSFER_KEY);
      return null;
    }
  }

  function refreshImportButton() {
    const transfer = readTransfer();
    const button = document.querySelector("#nativeImportAssessment");
    const available = Boolean(transfer && transfer.target === toolId);
    if (button) button.disabled = !available;
    if (available) setStatus(`Editable bank received from ${transfer.source === "qti-blackboard" ? "QTI 2.1" : "TXT Test Generator"} · select Import to review it`, "saved");
  }

  function navigateToTarget() {
    const message = { type: "ultrapage:navigate-tool", tool: settings.targetHash };
    if (window.parent !== window) window.parent.postMessage(message, window.location.origin);
    else window.location.assign(`/tools#${settings.targetHash}`);
  }

  function sendAssessment() {
    const content = document.querySelector(settings.content)?.value?.trim() || "";
    const name = document.querySelector(settings.name)?.value?.trim() || "assessment-bank";
    if (!content) {
      setStatus("Add a question bank before sending it to the other tool", "error");
      return;
    }
    if (content.length > MAX_TRANSFER_CHARS) {
      setStatus("The question bank exceeds the 1,000,000-character transfer limit", "error");
      return;
    }
    const transfer = {
      format: TRANSFER_FORMAT,
      version: TRANSFER_VERSION,
      source: toolId,
      target: settings.target,
      createdAt: Date.now(),
      name,
      content
    };
    try {
      localStorage.setItem(TRANSFER_KEY, JSON.stringify(transfer));
      setStatus(`${content.length.toLocaleString()} characters prepared for ${settings.targetHash === "qti" ? "QTI 2.1" : "TXT Test Generator"}`, "saved");
      navigateToTarget();
    } catch (error) {
      console.error("UltraPage assessment transfer error", error);
      setStatus("The browser could not prepare this local transfer", "error");
    }
  }

  function importAssessment() {
    const transfer = readTransfer();
    if (!transfer || transfer.target !== toolId) {
      setStatus("No compatible assessment transfer is available", "error");
      refreshImportButton();
      return;
    }
    const content = document.querySelector(settings.content);
    const name = document.querySelector(settings.name);
    if (!content || !name) return;
    if (content.value.trim() && content.value.trim() !== transfer.content.trim() && !window.confirm("Replace the current question bank with the transferred editable bank? Your local AutoSave history remains available.")) {
      setStatus("Transfer import canceled; the current bank was preserved");
      return;
    }
    content.value = transfer.content;
    name.value = transfer.name;
    content.dispatchEvent(new Event("input", { bubbles: true }));
    name.dispatchEvent(new Event("input", { bubbles: true }));
    localStorage.removeItem(TRANSFER_KEY);
    refreshImportButton();
    setStatus("Editable bank imported · review the target validation before exporting", "saved");
    window.setTimeout(() => document.querySelector(settings.validate)?.click(), 80);
    content.focus();
  }

  function createWorkflowGroup() {
    const ribbon = document.querySelector("[data-native-ribbon]");
    if (!ribbon || document.querySelector("#nativeSendAssessment")) return;
    const group = document.createElement("div");
    group.className = "native-ribbon-group native-workflow-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Assessment workflow");
    group.innerHTML = `
      <div class="native-ribbon-actions">
        <button type="button" id="nativeSendAssessment">${settings.sendLabel}</button>
        <button type="button" id="nativeImportAssessment" disabled>${settings.importLabel}</button>
      </div>
      <span class="native-ribbon-label">Workflow</span>`;
    ribbon.appendChild(group);
    const status = document.createElement("p");
    status.id = "nativeBridgeStatus";
    status.className = "native-draft-status native-bridge-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Local tool-to-tool transfer ready";
    ribbon.insertAdjacentElement("afterend", status);
  }

  createWorkflowGroup();
  document.querySelector("#nativeSendAssessment")?.addEventListener("click", sendAssessment);
  document.querySelector("#nativeImportAssessment")?.addEventListener("click", importAssessment);
  window.addEventListener("storage", refreshImportButton);
  refreshImportButton();
}());
