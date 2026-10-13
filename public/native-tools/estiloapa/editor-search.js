const MAX_RESULTS = 400;

export function findOccurrences(documentText, searchText, limit = MAX_RESULTS) {
  const haystack = String(documentText || "").toLocaleLowerCase("es-PR");
  const needle = String(searchText || "").trim().toLocaleLowerCase("es-PR");
  if (!needle) return [];
  const matches = [];
  let position = 0;
  while (position < haystack.length && matches.length < limit) {
    const start = haystack.indexOf(needle, position);
    if (start === -1) break;
    matches.push({ start, end: start + needle.length });
    position = start + Math.max(needle.length, 1);
  }
  return matches;
}

function collectText(root) {
  const segments = [];
  const iterator = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text = "";
  let previousBlock = null;
  while (iterator.nextNode()) {
    const node = iterator.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest('[contenteditable="false"],script,style')) continue;
    const value = node.nodeValue || "";
    if (!value) continue;
    const block = parent.closest("p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,figcaption") || parent;
    if (previousBlock && previousBlock !== block) text += "\n";
    const start = text.length;
    text += value;
    segments.push({ node, start, end: text.length });
    previousBlock = block;
  }
  return { text, segments };
}

export function setupDocumentFind(root, controls) {
  const input = controls.querySelector("#apaWorkspaceFind");
  const previous = controls.querySelector("#apaFindPrevious");
  const next = controls.querySelector("#apaFindNext");
  const counter = controls.querySelector("#apaFindCounter");
  if (!root || !input || !previous || !next || !counter) return () => {};

  let current = -1;
  let locations = [];
  let segments = [];
  function refresh() {
    if (!input.value.trim()) {
      current = -1;
      locations = [];
      segments = [];
      previous.disabled = true;
      next.disabled = true;
      counter.textContent = "";
      return;
    }
    const scan = collectText(root);
    segments = scan.segments;
    locations = findOccurrences(scan.text, input.value);
    current = -1;
    previous.disabled = !locations.length;
    next.disabled = !locations.length;
    counter.textContent = input.value.trim() ? `0 of ${locations.length}` : "";
  }

  function jump(direction) {
    if (!locations.length) return;
    current = current < 0 ? (direction > 0 ? 0 : locations.length - 1) : (current + direction + locations.length) % locations.length;
    const hit = locations[current];
    const first = segments.find((segment) => hit.start >= segment.start && hit.start < segment.end);
    const last = segments.find((segment) => hit.end > segment.start && hit.end <= segment.end);
    if (!first || !last || !root.contains(first.node) || !root.contains(last.node)) {
      refresh();
      return;
    }
    const range = document.createRange();
    range.setStart(first.node, hit.start - first.start);
    range.setEnd(last.node, hit.end - last.start);
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
    first.node.parentElement?.scrollIntoView({ block: "center", behavior: "auto" });
    counter.textContent = `${current + 1} of ${locations.length}`;
    window.apaSaveEditorSelection?.();
  }
  const previousClick = () => jump(-1);
  const nextClick = () => jump(1);
  const onKeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      jump(event.shiftKey ? -1 : 1);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      input.value = "";
      refresh();
    }
  };
  input.addEventListener("input", refresh);
  input.addEventListener("keydown", onKeydown);
  previous.addEventListener("click", previousClick);
  next.addEventListener("click", nextClick);
  refresh();
  return refresh;
}
