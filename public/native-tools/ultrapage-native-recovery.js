/* UltraPage Studio local draft recovery for integrated native tools.
 * Integration-only code: the original source repositories remain unchanged.
 */
(function () {
  "use strict";

  const toolId = document.body.dataset.nativeDraftTool;
  if (!toolId || !window.indexedDB) return;

  const DB_NAME = "ultrapage-native-drafts";
  const STORE_NAME = "snapshots";
  const MAX_VERSIONS = 5;
  const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
  const BACKUP_FORMAT = "ultrapage-native-workspace";
  const BACKUP_VERSION = 1;
  const AUTOSAVE_DELAY = 1200;
  let restoring = false;
  let saveTimer = 0;
  let lastSerialized = "";
  const replayingActions = new WeakSet();

  const definitions = {
    estiloapa: {
      fields: [
        ["#formatProfile", "value"], ["#fontFamily", "value"],
        ["#firstLineIndent", "checked"], ["#hangingReferences", "checked"],
        ["#sortReferences", "checked"], ["#pageNumbers", "checked"],
        ["#preview", "html"]
      ],
      destructiveClicks: ["#clearBtn", "#demoBtn"],
      destructiveChanges: [],
      meaningful(data) {
        return Boolean(data["#preview"] && !data["#preview"].includes('class="placeholder"'));
      },
      afterRestore() {
        ["#downloadDocxBtn", "#downloadHtmlBtn", "#downloadPdfBtn", "#downloadAuditBtn", "#reauditBtn"]
          .forEach((selector) => { const item = document.querySelector(selector); if (item) item.disabled = false; });
        window.setTimeout(() => document.querySelector("#reauditBtn")?.click(), 80);
      }
    },
    "txt-test-generator": {
      fields: [
        ["#quizName", "value"], ["#targetFormat", "value"],
        ["#templateType", "value"], ["#quizContent", "value"]
      ],
      destructiveClicks: ["#clearBtn"],
      destructiveChanges: ["#questionFileInput"],
      meaningful(data) { return Boolean(data["#quizContent"]?.trim()); },
      afterRestore() { window.setTimeout(() => document.querySelector("#verifyBtn")?.click(), 80); }
    },
    "qti-blackboard": {
      fields: [["#packageName", "value"], ["#inputText", "value"]],
      destructiveClicks: ["#btnClear", "#btnLoadExample"],
      destructiveChanges: ["#qtiFileInput"],
      meaningful(data) { return Boolean(data["#inputText"]?.trim()); },
      afterRestore() { window.setTimeout(() => document.querySelector("#btnRunCheck")?.click(), 80); }
    }
  };

  const definition = definitions[toolId];
  if (!definition) return;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("toolId", "toolId", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function transaction(mode, operation) {
    const database = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const result = operation(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      database.close();
    }
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function capture() {
    const data = {};
    for (const [selector, type] of definition.fields) {
      const element = document.querySelector(selector);
      if (!element) continue;
      if (type === "html") data[selector] = element.innerHTML;
      else if (type === "checked") data[selector] = Boolean(element.checked);
      else data[selector] = element.value;
    }
    return data;
  }

  async function snapshots() {
    const all = await transaction("readonly", (store) => requestResult(store.index("toolId").getAll(toolId)));
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat(document.documentElement.lang || "en-US", {
      dateStyle: "medium", timeStyle: "short"
    }).format(new Date(timestamp));
  }

  function setStatus(message, tone = "ready") {
    const status = document.querySelector("#nativeDraftStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  async function refreshAvailability() {
    const versions = await snapshots();
    const restoreButton = document.querySelector("#nativeRestoreDraft");
    const versionsButton = document.querySelector("#nativeDraftVersions");
    if (restoreButton) restoreButton.disabled = !versions.length;
    if (versionsButton) versionsButton.disabled = !versions.length;
    if (versions.length) setStatus(`Recovered versions: ${versions.length} · Latest ${formatTime(versions[0].createdAt)}`);
    return versions;
  }

  async function trimVersions() {
    const versions = await snapshots();
    if (versions.length <= MAX_VERSIONS) return;
    await transaction("readwrite", (store) => versions.slice(MAX_VERSIONS).forEach((item) => store.delete(item.id)));
  }

  async function saveSnapshot(reason = "AutoSave") {
    if (restoring) return;
    const data = capture();
    if (!definition.meaningful(data)) return;
    const serialized = JSON.stringify(data);
    if (reason === "AutoSave" && serialized === lastSerialized) return;
    setStatus("Saving locally…", "working");
    const record = {
      toolId,
      createdAt: Date.now(),
      reason,
      data,
      size: new Blob([serialized]).size
    };
    await transaction("readwrite", (store) => store.add(record));
    lastSerialized = serialized;
    await trimVersions();
    setStatus(`${reason} saved locally · ${formatTime(record.createdAt)}`, "saved");
    await refreshAvailability();
  }

  function scheduleSave() {
    if (restoring) return;
    if (!definition.meaningful(capture())) return;
    window.clearTimeout(saveTimer);
    setStatus("Changes pending…", "working");
    saveTimer = window.setTimeout(() => saveSnapshot().catch(handleStorageError), AUTOSAVE_DELAY);
  }

  function applySnapshot(record) {
    restoring = true;
    try {
      for (const [selector, type] of definition.fields) {
        const element = document.querySelector(selector);
        if (!element || !(selector in record.data)) continue;
        if (type === "html") element.innerHTML = record.data[selector];
        else if (type === "checked") element.checked = Boolean(record.data[selector]);
        else element.value = record.data[selector];
        element.dispatchEvent(new Event(type === "checked" || element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
      }
      lastSerialized = JSON.stringify(capture());
      definition.afterRestore?.();
      setStatus(`Version restored · ${formatTime(record.createdAt)}`, "saved");
    } finally {
      window.setTimeout(() => { restoring = false; }, 150);
    }
  }

  async function restoreLatest() {
    const versions = await snapshots();
    if (versions[0]) applySnapshot(versions[0]);
  }

  function backupFileName() {
    const date = new Date().toISOString().slice(0, 10);
    return `${toolId}-${date}.ultrapage-workspace.json`;
  }

  function downloadWorkspace() {
    const data = capture();
    if (!definition.meaningful(data)) {
      setStatus("Add content before downloading a workspace backup", "error");
      return;
    }
    const workspace = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      product: "UltraPage Studio",
      toolId,
      exportedAt: new Date().toISOString(),
      data
    };
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json;charset=utf-8" });
    if (blob.size > MAX_BACKUP_BYTES) {
      setStatus("Workspace is larger than the 25 MB portable-backup safety limit", "error");
      return;
    }
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = backupFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Workspace backup downloaded · ${Math.max(1, Math.round(blob.size / 1024))} KB`, "saved");
  }

  function validateWorkspace(workspace) {
    if (!workspace || typeof workspace !== "object") throw new Error("The selected file is not a valid workspace backup.");
    if (workspace.format !== BACKUP_FORMAT || workspace.version !== BACKUP_VERSION) throw new Error("This workspace format or version is not supported.");
    if (workspace.toolId !== toolId) throw new Error(`This backup belongs to ${workspace.toolId || "another tool"}, not ${toolId}.`);
    if (!workspace.data || typeof workspace.data !== "object" || Array.isArray(workspace.data)) throw new Error("The workspace does not contain valid tool data.");
    const allowed = new Set(definition.fields.map(([selector]) => selector));
    const sanitized = {};
    for (const [selector, value] of Object.entries(workspace.data)) {
      if (!allowed.has(selector)) continue;
      if (typeof value !== "string" && typeof value !== "boolean") throw new Error(`The workspace field ${selector} has an invalid value.`);
      sanitized[selector] = selector === "#preview" && typeof value === "string" ? sanitizeImportedHtml(value) : value;
    }
    if (!definition.meaningful(sanitized)) throw new Error("The workspace does not contain restorable content.");
    return sanitized;
  }

  function sanitizeImportedHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll("script,iframe,object,embed,form,input,button,link,meta,base,foreignObject")
      .forEach((element) => element.remove());
    template.content.querySelectorAll("*").forEach((element) => {
      for (const attribute of [...element.attributes]) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();
        if (name.startsWith("on") || ((name === "href" || name === "src" || name === "xlink:href") && /^(javascript|vbscript|data:text\/html)/.test(value))) {
          element.removeAttribute(attribute.name);
        }
      }
    });
    return template.innerHTML;
  }

  async function openWorkspaceFile(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setStatus("Workspace backup is larger than the 25 MB safety limit", "error");
      return;
    }
    try {
      const workspace = JSON.parse(await file.text());
      const data = validateWorkspace(workspace);
      const createdAt = Number.isFinite(Date.parse(workspace.exportedAt)) ? Date.parse(workspace.exportedAt) : Date.now();
      applySnapshot({ data, createdAt });
      window.setTimeout(() => saveSnapshot("Imported backup").catch(handleStorageError), 220);
      setStatus(`Workspace restored from ${file.name}`, "saved");
    } catch (error) {
      console.error("UltraPage workspace import error", error);
      setStatus(error?.message || "The workspace backup could not be opened", "error");
    }
  }

  function handleStorageError(error) {
    console.error("UltraPage local recovery error", error);
    setStatus("Local recovery unavailable in this browser", "error");
  }

  function replayAction(target, eventType) {
    replayingActions.add(target);
    if (eventType === "click") target.click();
    else target.dispatchEvent(new Event(eventType, { bubbles: true }));
  }

  function protectReplacement(event, selectors, eventType) {
    if (!selectors?.length) return;
    const target = eventType === "click" ? event.target?.closest?.(selectors.join(",")) : event.target;
    if (!target || (eventType !== "click" && !target.matches(selectors.join(",")))) return;
    if (replayingActions.has(target)) {
      replayingActions.delete(target);
      return;
    }
    if (!definition.meaningful(capture())) return;
    const actionName = eventType === "change" ? "open the selected file" : (target.textContent?.trim() || "continue");
    if (!window.confirm(`This action will replace or clear the current work: ${actionName}. Create a recovery version and continue?`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (eventType === "change") target.value = "";
      setStatus("Action canceled; current work was preserved");
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus("Creating a recovery version before replacement…", "working");
    saveSnapshot("Before replace")
      .then(() => replayAction(target, eventType))
      .catch((error) => {
        console.error("UltraPage pre-replacement recovery error", error);
        setStatus("The recovery version could not be created", "error");
        if (window.confirm("The safety copy could not be created. Continue and replace the current work anyway?")) replayAction(target, eventType);
        else if (eventType === "change") target.value = "";
      });
  }

  function createRecoveryRibbon() {
    const ribbon = document.querySelector("[data-native-ribbon]");
    if (!ribbon || document.querySelector("#nativeSaveDraft")) return;
    const group = document.createElement("div");
    group.className = "native-ribbon-group native-recovery-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "AutoSave and recovery");
    group.innerHTML = `
      <div class="native-ribbon-actions">
        <button type="button" id="nativeSaveDraft" class="native-draft-command" title="Save draft (Ctrl+S or Command+S)">Save draft</button>
        <button type="button" id="nativeRestoreDraft" class="native-draft-command" disabled>Restore</button>
        <button type="button" id="nativeDraftVersions" class="native-draft-command" disabled>Versions</button>
        <button type="button" id="nativeDownloadWorkspace" class="native-draft-command">Download backup</button>
        <button type="button" id="nativeOpenWorkspace" class="native-draft-command">Open backup</button>
      </div>
      <span class="native-ribbon-label">Recovery</span>`;
    ribbon.appendChild(group);
    const fileInput = document.createElement("input");
    fileInput.id = "nativeWorkspaceFile";
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.className = "native-workspace-file";
    fileInput.setAttribute("aria-label", "Open an UltraPage workspace backup");
    group.appendChild(fileInput);
    const status = document.createElement("p");
    status.id = "nativeDraftStatus";
    status.className = "native-draft-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = "AutoSave ready · stored only in this browser";
    ribbon.insertAdjacentElement("afterend", status);
  }

  function createVersionDialog() {
    const dialog = document.createElement("dialog");
    dialog.id = "nativeDraftDialog";
    dialog.className = "native-draft-dialog";
    dialog.setAttribute("aria-labelledby", "nativeDraftDialogTitle");
    dialog.innerHTML = `
      <div class="native-draft-dialog-head">
        <div><span class="native-ribbon-label">Local recovery</span><h2 id="nativeDraftDialogTitle">Version history</h2></div>
        <button type="button" id="nativeDraftDialogClose" aria-label="Close version history">×</button>
      </div>
      <p>Up to five recent versions are stored privately in this browser. They are not uploaded to UltraPage Studio.</p>
      <div id="nativeDraftList" class="native-draft-list"></div>
      <div class="native-draft-dialog-actions"><button type="button" id="nativeDeleteDrafts">Delete local versions</button></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => document.querySelector("#nativeDraftVersions")?.focus());
    document.querySelector("#nativeDraftDialogClose")?.addEventListener("click", () => dialog.close());
    document.querySelector("#nativeDeleteDrafts")?.addEventListener("click", async () => {
      const versions = await snapshots();
      await transaction("readwrite", (store) => versions.forEach((item) => store.delete(item.id)));
      dialog.close();
      setStatus("Local version history deleted");
      await refreshAvailability();
    });
  }

  async function showVersions() {
    const versions = await snapshots();
    const list = document.querySelector("#nativeDraftList");
    if (!list) return;
    list.replaceChildren();
    for (const version of versions) {
      const row = document.createElement("div");
      row.className = "native-draft-version";
      const details = document.createElement("div");
      details.innerHTML = `<strong>${version.reason}</strong><span>${formatTime(version.createdAt)} · ${Math.max(1, Math.round(version.size / 1024))} KB</span>`;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "Restore this version";
      button.addEventListener("click", () => { applySnapshot(version); document.querySelector("#nativeDraftDialog")?.close(); });
      row.append(details, button);
      list.appendChild(row);
    }
    document.querySelector("#nativeDraftDialog")?.showModal();
  }

  function installListeners() {
    document.querySelector("#nativeSaveDraft")?.addEventListener("click", () => saveSnapshot("Manual save").catch(handleStorageError));
    document.querySelector("#nativeRestoreDraft")?.addEventListener("click", () => restoreLatest().catch(handleStorageError));
    document.querySelector("#nativeDraftVersions")?.addEventListener("click", () => showVersions().catch(handleStorageError));
    document.querySelector("#nativeDownloadWorkspace")?.addEventListener("click", downloadWorkspace);
    document.querySelector("#nativeOpenWorkspace")?.addEventListener("click", () => document.querySelector("#nativeWorkspaceFile")?.click());
    document.querySelector("#nativeWorkspaceFile")?.addEventListener("change", openWorkspaceFile);
    document.addEventListener("click", (event) => protectReplacement(event, definition.destructiveClicks, "click"), true);
    document.addEventListener("change", (event) => protectReplacement(event, definition.destructiveChanges, "change"), true);
    document.addEventListener("input", scheduleSave);
    document.addEventListener("change", scheduleSave);
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveSnapshot("Manual save").catch(handleStorageError);
      }
    });
    document.addEventListener("click", (event) => {
      if (event.target?.closest?.("button") && !event.target.closest(".native-recovery-group, .native-draft-dialog")) {
        window.setTimeout(scheduleSave, 250);
      }
    });
    const htmlField = definition.fields.find(([, type]) => type === "html");
    const htmlRoot = htmlField && document.querySelector(htmlField[0]);
    if (htmlRoot) new MutationObserver(scheduleSave).observe(htmlRoot, { childList: true, subtree: true, characterData: true, attributes: true });
  }

  createRecoveryRibbon();
  createVersionDialog();
  installListeners();
  refreshAvailability().catch(handleStorageError);
}());
