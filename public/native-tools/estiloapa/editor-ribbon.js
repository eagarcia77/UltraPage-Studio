/* CREVELIO — © 2026 Eduardo Augusto García Rodríguez. All rights reserved. */
const RIBBON_TABS = [
  { id: "home", label: "Home", description: "Text and styles" },
  { id: "layout", label: "APA Layout", description: "Spacing and indents" },
  { id: "insert", label: "Insert", description: "Academic elements" },
  { id: "review", label: "Review", description: "APA rules and audit" }
];

export function ribbonGroupCategory(label, hasBlockStyles = false, hasRules = false) {
  if (hasBlockStyles) return "home";
  if (hasRules) return "review";
  if (label === "History" || label === "Text formatting" || label === "Alignment") return "home";
  if (label === "Indentation and line spacing" || label === "APA 7 presets") return "layout";
  if (label === "Insert") return "insert";
  return "review";
}

function editingContext(root) {
  const selection = window.getSelection();
  if (!root || !selection?.rangeCount || !root.contains(selection.anchorNode)) return null;
  const anchor = selection.anchorNode.nodeType === Node.ELEMENT_NODE
    ? selection.anchorNode : selection.anchorNode.parentElement;
  const block = anchor?.closest?.("p,h1,h2,h3,h4,h5,h6,li");
  if (!block || !root.contains(block)) return "Editing document";
  const level = Number(block.dataset.apaHeadingLevel || (/^H[1-5]$/.test(block.tagName) ? block.tagName.slice(1) : "0"));
  const preset = block.dataset.apaEditorStyle;
  let label = "APA paragraph";
  if (level >= 1 && level <= 5) label = `Heading ${level}`;
  else if (preset === "title" || block.classList.contains("apa-editor-title")) label = "Paper title";
  else if (preset === "reference" || block.classList.contains("apa-reference")) label = "APA reference";
  else if (preset === "note" || block.classList.contains("apa-note")) label = "Table / figure note";
  else if (preset === "table-label" || block.classList.contains("apa-table-label")) label = "Table number";
  else if (preset === "figure-label" || block.classList.contains("apa-figure-label")) label = "Figure number";
  return label;
}

function enhanceRibbon() {
  const shell = document.querySelector("#apaEditorShell");
  const toolbar = shell?.querySelector("#apaEditorToolbar");
  const preview = document.querySelector("#preview");
  if (!shell || !toolbar || !preview || shell.dataset.ribbonEnhanced === "true") return;
  const groups = [...toolbar.querySelectorAll(":scope > .tool-group")];
  if (groups.length < 7) return;
  shell.dataset.ribbonEnhanced = "true";
  shell.classList.add("apa-modern-ribbon");

  const tabList = document.createElement("div");
  tabList.id = "apaRibbonTabs";
  tabList.className = "apa-ribbon-tabs";
  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Document editing Ribbon");

  const tabs = new Map();
  const panes = new Map();
  for (const tab of RIBBON_TABS) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = `apaRibbonTab-${tab.id}`;
    button.className = "apa-ribbon-tab";
    button.textContent = tab.label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", `apaRibbonPane-${tab.id}`);
    button.setAttribute("aria-selected", "false");
    button.setAttribute("title", tab.description);
    button.tabIndex = -1;
    tabList.append(button);
    tabs.set(tab.id, button);

    const pane = document.createElement("div");
    pane.id = `apaRibbonPane-${tab.id}`;
    pane.className = "apa-ribbon-pane";
    pane.setAttribute("role", "tabpanel");
    pane.setAttribute("aria-labelledby", button.id);
    pane.hidden = true;
    panes.set(tab.id, pane);
  }

  for (const group of groups) {
    const blockStyle = Boolean(group.querySelector("#apaBlockStyle"));
    const rules = Boolean(group.querySelector("#toggleApaRules"));
    const groupLabel = group.getAttribute("aria-label")
      || (blockStyle ? "Block style" : rules ? "APA guidance" : "Tools");
    const destination = ribbonGroupCategory(group.getAttribute("aria-label") || "", blockStyle, rules);
    group.classList.add("apa-ribbon-tool-group");
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", groupLabel);
    const caption = document.createElement("span");
    caption.className = "apa-ribbon-group-caption";
    caption.textContent = groupLabel;
    caption.setAttribute("aria-hidden", "true");
    group.append(caption);
    panes.get(destination).append(group);
  }

  const runAudit = document.querySelector("#reauditBtn");
  const downloadReport = document.querySelector("#downloadAuditBtn");
  if (runAudit && downloadReport) {
    const auditGroup = document.createElement("div");
    auditGroup.className = "tool-group apa-ribbon-tool-group apa-ribbon-review-shortcuts";
    auditGroup.setAttribute("role", "group");
    auditGroup.setAttribute("aria-label", "Document audit");
    runAudit.title = "Check document against APA 7 requirements";
    downloadReport.title = "Download APA 7 audit report";
    const caption = document.createElement("span");
    caption.className = "apa-ribbon-group-caption";
    caption.textContent = "Quality";
    caption.setAttribute("aria-hidden", "true");
    auditGroup.append(runAudit, downloadReport, caption);
    panes.get("review").append(auditGroup);
    const redundantAuditToolbar = document.querySelector(".audit .native-action-ribbon");
    if (redundantAuditToolbar && !redundantAuditToolbar.querySelector("button, input, select, a[href]")) {
      redundantAuditToolbar.remove();
    }
  }

  toolbar.removeAttribute("role");
  toolbar.setAttribute("aria-label", "APA document editing commands");
  toolbar.replaceChildren(...RIBBON_TABS.map((tab) => panes.get(tab.id)));

  // Keep one set of commands in the four Ribbon tabs.
  shell.insertBefore(tabList, toolbar);

  const context = document.createElement("div");
  context.className = "apa-ribbon-context";
  const contextText = document.createElement("span");
  contextText.id = "apaRibbonContextText";
  contextText.textContent = "Select text to format";
  contextText.setAttribute("aria-live", "off");
  context.append(contextText);
  toolbar.after(context);

  function activate(id, focus = false) {
    if (!panes.has(id)) return;
    for (const [key, button] of tabs) {
      const active = key === id;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      panes.get(key).hidden = !active;
      if (active && focus) button.focus();
    }
  }
  for (const [id, button] of tabs) button.addEventListener("click", () => activate(id));
  tabList.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const active = RIBBON_TABS.findIndex((tab) => tabs.get(tab.id) === document.activeElement);
    if (active < 0) return;
    event.preventDefault();
    const count = RIBBON_TABS.length;
    const index = event.key === "Home" ? 0 : event.key === "End" ? count - 1
      : (active + (event.key === "ArrowRight" ? 1 : -1) + count) % count;
    activate(RIBBON_TABS[index].id, true);
  });
  activate("home");

  const stateButtons = new Map([
    ["bold", toolbar.querySelector('[data-cmd="bold"]')],
    ["italic", toolbar.querySelector('[data-cmd="italic"]')],
    ["underline", toolbar.querySelector('[data-cmd="underline"]')]
  ]);
  for (const button of stateButtons.values()) if (button) button.setAttribute("aria-pressed", "false");
  let pending = false;
  function synchronizeContext() {
    pending = false;
    const state = editingContext(preview);
    if (!state) return;
    contextText.textContent = state;
    for (const [command, button] of stateButtons) {
      if (!button) continue;
      let pressed = false;
      try { pressed = Boolean(document.queryCommandState(command)); } catch {}
      button.setAttribute("aria-pressed", String(pressed));
    }
  }
  function queueSync() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(synchronizeContext);
  }
  document.addEventListener("selectionchange", queueSync);
  for (const name of ["input", "keyup", "mouseup", "touchend"]) preview.addEventListener(name, queueSync);
  queueSync();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceRibbon);
  else enhanceRibbon();
}
