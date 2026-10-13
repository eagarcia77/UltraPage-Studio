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
    <div class="apa-workspace-summary">
      <strong>Document workspace</strong>
      <output id="apaWorkspaceStats" aria-live="off">0 words · 0 characters</output>
    </div>
    <div class="apa-workspace-actions">
      <label for="apaWorkspaceZoom">Zoom</label>
      <select id="apaWorkspaceZoom" aria-controls="preview" aria-label="Document zoom">
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

  const stats = bar.querySelector("#apaWorkspaceStats");
  const zoom = bar.querySelector("#apaWorkspaceZoom");
  const focus = bar.querySelector("#apaWorkspaceFocus");
  let scheduled = false;

  const refreshStats = () => {
    scheduled = false;
    const isPlaceholder = documentArea.querySelector(":scope > .placeholder") && documentArea.children.length === 1;
    const count = summarizeDocumentText(isPlaceholder ? "" : documentArea.innerText || documentArea.textContent);
    stats.textContent = `${count.words.toLocaleString()} words · ${count.characters.toLocaleString()} characters`;
  };
  const queueStats = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshStats);
  };

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
  new MutationObserver(queueStats).observe(documentArea, { subtree: true, characterData: true, childList: true });
  refreshStats();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeDocumentWorkspace);
  else initializeDocumentWorkspace();
}
