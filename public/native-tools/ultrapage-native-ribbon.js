/* UltraPage Studio native Ribbon keyboard behavior.
 * This integration file is not part of the original tool repositories.
 */
(function () {
  "use strict";

  const SEARCH_SHORTCUT = "Alt+Q";

  function enabledCommands(toolbar) {
    return [...toolbar.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)")]
      .filter((control) => control.getClientRects().length > 0);
  }

  function commandName(control) {
    return control.getAttribute("aria-label") || control.getAttribute("title") || control.textContent?.trim() || "Command";
  }

  function commandGroup(control) {
    const group = control.closest(".native-ribbon-group");
    return group?.getAttribute("aria-label") || group?.querySelector(".native-ribbon-label")?.textContent?.trim() || "Ribbon";
  }

  function availableCommands() {
    return [...document.querySelectorAll("[data-native-ribbon] button:not(:disabled), [data-native-ribbon] a[href]")]
      .filter((control) => !control.matches("[data-native-search-trigger]") && control.getClientRects().length > 0)
      .map((control) => ({ control, name: commandName(control), group: commandGroup(control) }));
  }

  function createCommandSearch() {
    const ribbon = document.querySelector("[data-native-ribbon]");
    if (!ribbon || document.querySelector("#nativeCommandSearch")) return;

    const group = document.createElement("div");
    group.className = "native-ribbon-group native-command-search-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Command search");
    group.innerHTML = `
      <div class="native-ribbon-actions">
        <button type="button" id="nativeCommandSearch" data-native-search-trigger title="Search commands (${SEARCH_SHORTCUT})">Search commands</button>
      </div>
      <span class="native-ribbon-label">Find</span>`;
    ribbon.prepend(group);

    const dialog = document.createElement("dialog");
    dialog.id = "nativeCommandSearchDialog";
    dialog.className = "native-command-dialog";
    dialog.setAttribute("aria-labelledby", "nativeCommandSearchTitle");
    dialog.innerHTML = `
      <div class="native-command-dialog-head">
        <div><span class="native-ribbon-label">${SEARCH_SHORTCUT}</span><h2 id="nativeCommandSearchTitle">Search commands</h2></div>
        <button type="button" id="nativeCommandSearchClose" aria-label="Close command search">×</button>
      </div>
      <div class="native-command-search-field">
        <label for="nativeCommandSearchInput">What do you want to do?</label>
        <input id="nativeCommandSearchInput" type="search" autocomplete="off" placeholder="Examples: audit, export, restore, open…" aria-describedby="nativeCommandSearchStatus">
      </div>
      <p id="nativeCommandSearchStatus" class="native-command-search-status" role="status" aria-live="polite"></p>
      <div id="nativeCommandSearchResults" class="native-command-results" aria-label="Matching commands"></div>`;
    document.body.appendChild(dialog);

    const input = dialog.querySelector("#nativeCommandSearchInput");
    const results = dialog.querySelector("#nativeCommandSearchResults");
    const status = dialog.querySelector("#nativeCommandSearchStatus");

    function closeDialog() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }

    function runCommand(command) {
      closeDialog();
      window.setTimeout(() => {
        command.control.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        command.control.focus({ preventScroll: true });
        command.control.click();
      }, 60);
    }

    function renderResults() {
      const query = input.value.trim().toLocaleLowerCase();
      const commands = availableCommands().filter((command) => `${command.name} ${command.group}`.toLocaleLowerCase().includes(query));
      results.replaceChildren();
      for (const command of commands) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "native-command-result";
        const name = document.createElement("span");
        const groupName = document.createElement("small");
        name.textContent = command.name;
        groupName.textContent = command.group;
        button.append(name, groupName);
        button.addEventListener("click", () => runCommand(command));
        results.appendChild(button);
      }
      status.textContent = commands.length ? `${commands.length} command${commands.length === 1 ? "" : "s"} available` : "No matching commands";
    }

    function openDialog() {
      renderResults();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      window.setTimeout(() => { input.focus(); input.select(); }, 0);
    }

    group.querySelector("#nativeCommandSearch").addEventListener("click", openDialog);
    dialog.querySelector("#nativeCommandSearchClose").addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener("close", () => group.querySelector("#nativeCommandSearch")?.focus());
    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        results.querySelector("button")?.focus();
      } else if (event.key === "Enter") {
        const first = results.querySelector("button");
        if (first) { event.preventDefault(); first.click(); }
      }
    });
    results.addEventListener("keydown", (event) => {
      const buttons = [...results.querySelectorAll("button")];
      const index = buttons.indexOf(event.target);
      if (index < 0) return;
      if (event.key === "ArrowDown") { event.preventDefault(); buttons[(index + 1) % buttons.length]?.focus(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); (index === 0 ? input : buttons[index - 1])?.focus(); }
      else if (event.key === "Home") { event.preventDefault(); buttons[0]?.focus(); }
      else if (event.key === "End") { event.preventDefault(); buttons.at(-1)?.focus(); }
    });

    document.addEventListener("keydown", (event) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLocaleLowerCase() === "q") {
        event.preventDefault();
        openDialog();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    const toolbar = event.target?.closest?.("[data-native-ribbon]");
    if (!toolbar) return;
    const commands = enabledCommands(toolbar);
    const index = commands.indexOf(event.target);
    if (index < 0 || !commands.length) return;

    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % commands.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + commands.length) % commands.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = commands.length - 1;
    else return;

    event.preventDefault();
    commands[nextIndex].focus();
  });

  createCommandSearch();
}());
