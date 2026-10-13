import { setupDocumentFind } from "./editor-search.js";

const ALLOWED_ZOOMS = new Set(["75", "90", "100", "110", "125"]);

export function summarizeDocumentText(input) {
  const normalized = String(input || "").replace(/\s+/gu, " ").trim();
  const words = normalized.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  return { words: words.length, characters: [...normalized].length };
}

function initializeDocumentWorkspace() {
  const panel = document.querySelector(".preview-panel");
  const documentArea = document.querySelector("#preview");
  const scrollArea = panel?.querySelector(".paper-wrap");
  if (!panel || !documentArea || !scrollArea || document.querySelector("#apaWorkspaceBar")) return;

  const bar = document.createElement("div");
  bar.id = "apaWorkspaceBar";
  bar.className = "apa-workspace-bar";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Document workspace controls");
  bar.innerHTML = `
    <output id="apaWorkspaceStats" aria-live="off">0 words · 0 characters</output>
    <div class="apa-workspace-find" role="search" aria-label="Find text in document">
      <label for="apaWorkspaceFind">Find</label>
      <input type="search" id="apaWorkspaceFind" placeholder="Search document" autocomplete="off">
      <button type="button" id="apaFindPrevious" aria-label="Previous match" title="Previous match" disabled>↑</button>
      <button type="button" id="apaFindNext" aria-label="Next match" title="Next match" disabled>↓</button>
      <output id="apaFindCounter" aria-live="polite"></output>
    </div>
    <div class="apa-workspace-actions">
      <label for="apaWorkspaceOutline">Outline</label>
      <select id="apaWorkspaceOutline">
        <option value="">Jump to heading…</option>
      </select>
      <label for="apaWorkspaceZoom">Zoom</label>
      <select id="apaWorkspaceZoom" aria-controls="preview">
        <option value="75">75%</option>
        <option value="90">90%</option>
        <option value="100" selected>100%</option>
        <option value="110">110%</option>
        <option value="125">125%</option>
      </select>
      <button id="apaWorkspaceFocus" type="button" aria-controls="preview" aria-pressed="false" title="Hide side panels and focus on the document (Esc to exit)">Focus mode</button>
    </div>`;

  const editorShell = panel.querySelector("#apaEditorShell");
  if (editorShell) editorShell.before(bar);
  else scrollArea.before(bar);

  const refreshFind = setupDocumentFind(documentArea, bar);
  const stats = bar.querySelector("#apaWorkspaceStats");
  const outline = bar.querySelector("#apaWorkspaceOutline");
  let headingTargets = [];
  const zoom = bar.querySelector("#apaWorkspaceZoom");
  const focus = bar.querySelector("#apaWorkspaceFocus");
  let scheduled = false;

  const refreshStats = () => {
    scheduled = false;
    const isPlaceholder = documentArea.querySelector(":scope > .placeholder") && documentArea.children.length === 1;
    const count = summarizeDocumentText(isPlaceholder ? "" : documentArea.innerText || documentArea.textContent);
    stats.textContent = `${count.words.toLocaleString()} words · ${count.characters.toLocaleString()} characters`;
    refreshFind();
    const headingSelector = "h1,h2,h3,h4,h5,[data-apa-heading-level],.apa-references-heading";
    headingTargets = [...documentArea.querySelectorAll(headingSelector)].filter((node) => node.textContent.trim());
    outline.replaceChildren(new Option("Jump to heading…", ""));
    headingTargets.forEach((node, index) => {
      const level = Number(node.dataset.apaHeadingLevel || (/^H[1-5]$/.test(node.tagName) ? node.tagName.slice(1) : "1"));
      const label = node.querySelector(":scope > .apa-run-in-heading")?.textContent || node.textContent;
      const trimmed = label.replace(/\s+/g, " ").trim().slice(0, 92);
      outline.append(new Option(`L${Math.min(5, Math.max(1, level || 1))} · ${trimmed}`, String(index)));
    });
    outline.disabled = !headingTargets.length;
  };
  const queueStats = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshStats);
  };

  outline.addEventListener("change", () => {
    if (outline.value === "") return;
    const heading = headingTargets[Number(outline.value)];
    if (!heading || !documentArea.contains(heading)) return;
    heading.scrollIntoView({ block: "center", behavior: "smooth" });
    // Move the caret without inserting tracking markers into the exported content.
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(heading);
    range.collapse(true);
    documentArea.focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.addRange(range);
    window.apaSaveEditorSelection?.();
    outline.value = "";
  });

  zoom.addEventListener("change", () => {
    if (!ALLOWED_ZOOMS.has(zoom.value)) return;
    scrollArea.style.setProperty("--apa-workspace-zoom", String(Number(zoom.value) / 100));
  });
  const setFocus = (enabled) => {
    document.body.classList.toggle("apa-workspace-focus", enabled);
    focus.setAttribute("aria-pressed", String(enabled));
    focus.textContent = enabled ? "Exit focus" : "Focus mode";
  };
  focus.addEventListener("click", () => setFocus(!document.body.classList.contains("apa-workspace-focus")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("apa-workspace-focus") && !document.querySelector("dialog[open]")) {
      setFocus(false);
      focus.focus();
    }
  });
  documentArea.addEventListener("input", queueStats);
  new MutationObserver(queueStats).observe(documentArea, { subtree: true, characterData: true, childList: true, attributes: true, attributeFilter: ["class", "data-apa-heading-level"] });
  refreshStats();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeDocumentWorkspace);
  else initializeDocumentWorkspace();
}
