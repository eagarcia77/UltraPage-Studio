// UltraPage Studio integration layer. The upstream EstiloAPA repository remains unchanged.
const PROFILE = {
  blackboard: {
    name: "Blackboard Ultra",
    slug: "blackboard-ultra",
    guidance: "Use Document > HTML block only when your institution has configured an alternate domain and your course role has permission. Blackboard Ultra's standard content editor does not support HTML code editing. Otherwise, use the downloaded file through your institution's approved course-file workflow.",
    copied: "HTML copied. Paste it into a Blackboard Ultra Document HTML block only if that feature is enabled; then verify the block in Student Preview.",
    downloaded: "Blackboard Ultra HTML downloaded. Use it through your institution's approved course-file workflow and verify learner access."
  },
  moodle: {
    name: "Moodle",
    slug: "moodle",
    guidance: "Paste the fragment in Moodle's source-code view if your site grants the TinyMCE HTML capability. Site filters may rewrite links or embedded images, so preview once in the course.",
    copied: "HTML copied. Paste it into Moodle's source-code view, save, and run Moodle's accessibility checker.",
    downloaded: "Moodle HTML downloaded. Add it through the approved course workflow and preview it with a learner role."
  },
  canvas: {
    name: "Canvas",
    slug: "canvas",
    guidance: "Paste the fragment in Canvas's HTML Editor. Confirm that linked course files are published and accessible to students.",
    copied: "HTML copied. Paste it into Canvas HTML Editor, save, and run the Rich Content Editor accessibility checker.",
    downloaded: "Canvas HTML downloaded. Add it through the approved course workflow and verify all course-file links."
  },
  universal: {
    name: "Universal LMS",
    slug: "universal-lms",
    guidance: "Uses conservative semantic HTML and inline formatting. Preview it in the destination LMS before publishing.",
    copied: "HTML copied. Paste it into the destination LMS source editor and preview it before publishing.",
    downloaded: "Universal LMS HTML downloaded. Preview it in the destination LMS before publishing."
  }
};

const BLOCKED_ELEMENTS = "script,style,link,meta,base,iframe,object,embed,form,input,button,textarea,select,video,audio,canvas,svg,foreignObject";
const ALLOWED_ELEMENTS = new Set(["article", "section", "div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "strong", "b", "em", "i", "u", "s", "sup", "sub", "br", "hr", "a", "img", "figure", "figcaption", "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "span", "code", "pre", "abbr"]);
const SAFE_ATTRIBUTES = new Set(["href", "src", "alt", "title", "scope", "colspan", "rowspan", "lang", "dir"]);
const URL_ATTRIBUTES = new Set(["href", "src"]);
const exportedStyle = {
  root: "font-family:Arial,Helvetica,sans-serif;font-size:12pt;line-height:2;color:#000;max-width:100%;overflow-wrap:anywhere;",
  paragraph: "margin:0;text-align:left;",
  indent: "text-indent:.5in;",
  noIndent: "text-indent:0;",
  reference: "margin:0;padding-left:.5in;text-indent:-.5in;text-align:left;",
  heading: "margin:1em 0 0;text-indent:0;font-size:12pt;font-weight:700;line-height:2;",
  heading1: "text-align:center;",
  heading2: "text-align:left;",
  heading3: "text-align:left;font-style:italic;",
  figureLabel: "margin:.85em 0 0;text-indent:0;text-align:left;font-weight:700;",
  figureTitle: "margin:0 0 .35em;text-indent:0;text-align:left;font-style:italic;",
  note: "margin:.15em 0 .7em;text-indent:0;text-align:left;",
  image: "display:block;max-width:100%;width:auto;height:auto;margin:.35em auto;",
  table: "width:100%;max-width:100%;border-collapse:collapse;border-top:1px solid #000;border-bottom:1px solid #000;margin:.35em 0 .55em;",
  cell: "padding:.25em .4em;text-align:left;vertical-align:top;",
  headerCell: "padding:.25em .4em;text-align:left;vertical-align:top;font-weight:700;border-bottom:1px solid #000;",
  link: "color:#075985;text-decoration:underline;",
  list: "margin:.25em 0 .5em;padding-left:.5in;",
  quote: "margin:.5em 0 .5em .5in;padding-left:.25in;border-left:3px solid #64748b;",
  pre: "white-space:pre-wrap;overflow-wrap:anywhere;"
};

const el = {
  preview: document.querySelector("#preview"),
  profile: document.querySelector("#lmsExportProfile"),
  check: document.querySelector("#checkLmsBtn"),
  copy: document.querySelector("#copyLmsHtmlBtn"),
  download: document.querySelector("#downloadLmsHtmlBtn"),
  report: document.querySelector("#downloadLmsReportBtn"),
  status: document.querySelector("#lmsExportStatus"),
  dialog: document.querySelector("#lmsAuditDialog"),
  summary: document.querySelector("#lmsAuditSummary"),
  findings: document.querySelector("#lmsAuditFindings"),
  close: document.querySelector("#closeLmsAuditBtn"),
  closeFooter: document.querySelector("#closeLmsAuditFooterBtn"),
  firstLineIndent: document.querySelector("#firstLineIndent"),
  hangingReferences: document.querySelector("#hangingReferences")
};

let lastResult = null;

function meaningfulContent() {
  return Boolean(el.preview && !el.preview.querySelector(".placeholder") && el.preview.textContent.trim());
}

function describe(node) {
  const tag = node.tagName?.toLowerCase() || "content";
  const text = (node.getAttribute?.("alt") || node.textContent || "").trim().replace(/\s+/g, " ");
  return `${tag}${text ? ` “${text.slice(0, 72)}${text.length > 72 ? "…" : ""}”` : ""}`;
}

function safeUrl(value, attribute) {
  const url = (value || "").trim();
  if (!url) return false;
  if (/^(javascript|vbscript|file):/i.test(url) || /^data:text\/html/i.test(url)) return false;
  if (url.startsWith("#") && attribute === "href") return true;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return true;
  if (attribute === "src" && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(url)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(url);
}

function inspect(profile) {
  const findings = [];
  const root = el.preview;
  const add = (level, message, location = "") => findings.push({ level, message, location });
  if (!meaningfulContent()) add("error", "No formatted document is available to export.", "Editable preview");
  if (profile === PROFILE.blackboard) add("warning", "Blackboard Ultra accepts this code in a Document HTML block, not the standard content editor. The HTML block requires institutional alternate-domain configuration and course-role permission.", "Blackboard setup");
  if (profile === PROFILE.moodle) add("warning", "Moodle source-code access can depend on the site's TinyMCE HTML capability and editor configuration.", "Moodle setup");

  root.querySelectorAll("img").forEach((image, index) => {
    const alt = image.getAttribute("alt");
    if (alt === null || !alt.trim()) add("error", "Image alternative text is missing. Add a meaningful description before export.", `Image ${index + 1}`);
    const source = image.getAttribute("src") || "";
    if (/^blob:/i.test(source)) add("error", "This temporary image URL will stop working outside this browser session.", `Image ${index + 1}`);
    else if (/^data:image/i.test(source)) add("warning", `${profile.name} may filter a large embedded data image; confirm it after pasting.`, `Image ${index + 1}`);
    else if (/^https?:/i.test(source)) add("warning", "Confirm that learners can access this external or course-hosted image without staff permissions.", `Image ${index + 1}`);
  });

  root.querySelectorAll("a[href],img[src]").forEach((node) => {
    const attribute = node.tagName === "A" ? "href" : "src";
    if (!safeUrl(node.getAttribute(attribute), attribute)) add("fixed", `Unsafe or unsupported ${attribute} will be removed from the LMS copy.`, describe(node));
  });

  root.querySelectorAll(BLOCKED_ELEMENTS).forEach((node) => add("fixed", `${node.tagName.toLowerCase()} is not portable and will be removed.`, describe(node)));

  const idCounts = new Map();
  root.querySelectorAll("[id]").forEach((node) => idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1));
  const duplicateIds = [...idCounts.values()].filter((count) => count > 1).length;
  if (duplicateIds) add("fixed", `${duplicateIds} duplicate identifier(s) will be removed to prevent conflicts with the LMS page.`, "Document identifiers");

  let previousHeading = 0;
  root.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((heading) => {
    const level = Number(heading.tagName.slice(1));
    if (previousHeading && level > previousHeading + 1) add("warning", `Heading level jumps from H${previousHeading} to H${level}.`, describe(heading));
    previousHeading = level;
  });

  root.querySelectorAll("table").forEach((table, index) => {
    if (!table.querySelector("th")) add("error", "Table has no header cells. Mark row or column headers before LMS export.", `Table ${index + 1}`);
    if (!table.querySelector("caption") && !table.previousElementSibling?.matches(".apa-table-title,.module-table-title,.thesis-table-title")) add("warning", "Table has no programmatically associated caption or detected adjacent title.", `Table ${index + 1}`);
    if (table.querySelector("[rowspan]:not([rowspan='1']),[colspan]:not([colspan='1'])")) add("warning", "Table contains merged cells, which are harder to navigate with assistive technology.", `Table ${index + 1}`);
  });

  root.querySelectorAll("[style]").forEach((node) => {
    if (/(?:width|min-width):\s*\d+(?:px|in|cm|mm)/i.test(node.getAttribute("style") || "")) add("fixed", "A fixed-width style will be replaced with responsive formatting.", describe(node));
  });

  if (!findings.some((item) => item.level === "error")) add("pass", "No blocking accessibility or portability errors were detected.", profile.name);
  add("pass", "Scripts, event handlers, editor-only metadata, conflicting IDs, and external stylesheets are excluded from the LMS output.", "Safe HTML policy");
  return findings;
}

function replaceElement(node, tagName) {
  const replacement = document.createElement(tagName);
  while (node.firstChild) replacement.append(node.firstChild);
  node.replaceWith(replacement);
  return replacement;
}

function sanitize(profile) {
  const clone = el.preview.cloneNode(true);
  clone.removeAttribute("id");
  clone.removeAttribute("class");
  clone.removeAttribute("contenteditable");
  clone.querySelectorAll('img[data-apa-media-role="module-banner"],img[data-apa-exclude-export="true"],.apa-start-banner-excluded,.placeholder').forEach((node) => node.remove());
  clone.querySelectorAll(BLOCKED_ELEMENTS).forEach((node) => node.remove());
  clone.querySelectorAll("section").forEach((node) => replaceElement(node, "div"));
  clone.querySelectorAll("*").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_ELEMENTS.has(tag)) {
      node.replaceWith(...node.childNodes);
      return;
    }
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith("on") || !SAFE_ATTRIBUTES.has(attribute.name.toLowerCase())) node.removeAttribute(attribute.name);
    });
    URL_ATTRIBUTES.forEach((attribute) => {
      if (node.hasAttribute(attribute) && !safeUrl(node.getAttribute(attribute), attribute)) node.removeAttribute(attribute);
    });
  });

  clone.setAttribute("lang", el.preview.getAttribute("lang") || document.documentElement.lang || "en");
  clone.setAttribute("aria-label", `${profile.name} APA document`);
  clone.setAttribute("style", exportedStyle.root);
  clone.querySelectorAll("p").forEach((node) => {
    const noIndent = node.matches(".apa-reference,.apa-title,.apa-heading,.apa-figure-label,.apa-figure-title,.apa-note,.no-indent,[data-apa-editor-style]");
    const reference = node.matches(".apa-reference,.thesis-reference") && el.hangingReferences?.checked;
    node.setAttribute("style", exportedStyle.paragraph + (reference ? exportedStyle.reference : noIndent || !el.firstLineIndent?.checked ? exportedStyle.noIndent : exportedStyle.indent));
  });
  clone.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((node) => {
    const level = Number(node.tagName.slice(1));
    node.setAttribute("style", exportedStyle.heading + (level === 1 ? exportedStyle.heading1 : level === 3 ? exportedStyle.heading3 : exportedStyle.heading2));
  });
  clone.querySelectorAll(".apa-figure-label,.module-table-label,.apa-table-label").forEach((node) => node.setAttribute("style", exportedStyle.figureLabel));
  clone.querySelectorAll(".apa-figure-title,.module-table-title,.apa-table-title").forEach((node) => node.setAttribute("style", exportedStyle.figureTitle));
  clone.querySelectorAll(".apa-note,.apa-figure-note").forEach((node) => node.setAttribute("style", exportedStyle.note));
  clone.querySelectorAll("img").forEach((node) => node.setAttribute("style", exportedStyle.image));
  clone.querySelectorAll("table").forEach((node) => node.setAttribute("style", exportedStyle.table));
  clone.querySelectorAll("td").forEach((node) => node.setAttribute("style", exportedStyle.cell));
  clone.querySelectorAll("th").forEach((node) => {
    node.setAttribute("style", exportedStyle.headerCell);
    if (!node.hasAttribute("scope")) node.setAttribute("scope", node.parentElement === node.closest("table")?.querySelector("tr") ? "col" : "row");
  });
  clone.querySelectorAll("a").forEach((node) => {
    node.setAttribute("style", exportedStyle.link);
    if (/^https?:/i.test(node.getAttribute("href") || "")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  clone.querySelectorAll("ul,ol").forEach((node) => node.setAttribute("style", exportedStyle.list));
  clone.querySelectorAll("blockquote").forEach((node) => node.setAttribute("style", exportedStyle.quote));
  clone.querySelectorAll("pre").forEach((node) => node.setAttribute("style", exportedStyle.pre));
  clone.querySelectorAll("*").forEach((node) => {
    node.removeAttribute("class");
    node.removeAttribute("id");
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.startsWith("data-") || attribute.name === "contenteditable") node.removeAttribute(attribute.name);
    });
  });
  return clone.outerHTML;
}

function createResult(openDialog = false) {
  el.preview.blur();
  const profile = PROFILE[el.profile.value] || PROFILE.universal;
  const findings = inspect(profile);
  const errors = findings.filter((item) => item.level === "error").length;
  const warnings = findings.filter((item) => item.level === "warning").length;
  const fixed = findings.filter((item) => item.level === "fixed").length;
  lastResult = { profile, findings, errors, warnings, fixed, fragment: errors ? "" : sanitize(profile), checkedAt: new Date() };
  el.copy.disabled = errors > 0;
  el.download.disabled = errors > 0;
  el.report.disabled = false;
  el.status.dataset.tone = errors ? "blocked" : "ready";
  el.status.textContent = errors
    ? `${profile.name}: ${errors} blocking error(s), ${warnings} warning(s), ${fixed} automatic repair(s). Open the report for exact locations.`
    : `${profile.name}: ready to export with ${warnings} warning(s) and ${fixed} automatic repair(s). Preview once in the destination LMS.`;
  renderReport(lastResult);
  if (openDialog) el.dialog.showModal();
  return lastResult;
}

function renderReport(result) {
  const generated = result.checkedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  el.summary.innerHTML = `<p><strong>${result.profile.name}</strong> · ${result.errors} blocking · ${result.warnings} warning · ${result.fixed} repaired</p><p>${result.profile.guidance}</p><p><small>Checked ${generated}. This automated review supports—but does not replace—a final LMS preview.</small></p>`;
  el.findings.replaceChildren(...result.findings.map((finding) => {
    const item = document.createElement("li");
    item.dataset.level = finding.level;
    const label = finding.level === "fixed" ? "Auto-repair" : finding.level.charAt(0).toUpperCase() + finding.level.slice(1);
    item.textContent = `${label}: ${finding.message}${finding.location ? ` Location: ${finding.location}.` : ""}`;
    return item;
  }));
}

function reportText(result) {
  const lines = [
    "EstiloAPA LMS Compatibility Report",
    `Profile: ${result.profile.name}`,
    `Checked: ${result.checkedAt.toISOString()}`,
    `Blocking errors: ${result.errors}`,
    `Warnings: ${result.warnings}`,
    `Automatic repairs: ${result.fixed}`,
    "",
    result.profile.guidance,
    "",
    ...result.findings.map((finding, index) => `${index + 1}. [${finding.level.toUpperCase()}] ${finding.message}${finding.location ? ` Location: ${finding.location}.` : ""}`),
    "",
    "Automated checks do not replace a final preview in the destination LMS."
  ];
  return lines.join("\n");
}

function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyFragment() {
  const result = createResult(false);
  if (result.errors) return;
  try {
    if (navigator.clipboard?.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([result.fragment], { type: "text/html" }),
        "text/plain": new Blob([el.preview.innerText], { type: "text/plain" })
      })]);
    } else {
      await navigator.clipboard.writeText(result.fragment);
    }
    el.status.dataset.tone = "ready";
    el.status.textContent = result.profile.copied;
  } catch {
    el.status.dataset.tone = "blocked";
    el.status.textContent = "The browser blocked clipboard access. Use Download LMS HTML instead.";
  }
}

function downloadHtml() {
  const result = createResult(false);
  if (result.errors) return;
  const title = (el.preview.querySelector("h1")?.textContent || "APA 7 document").trim();
  const html = `<!doctype html>\n<html lang="${el.preview.getAttribute("lang") || "en"}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${title.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character])}</title>\n</head>\n<body>\n${result.fragment}\n</body>\n</html>\n`;
  download(html, "text/html;charset=utf-8", `estiloapa-${result.profile.slug}.html`);
  el.status.textContent = result.profile.downloaded;
}

function markStale() {
  if (!lastResult) return;
  lastResult = null;
  el.copy.disabled = true;
  el.download.disabled = true;
  el.report.disabled = true;
  el.status.dataset.tone = "stale";
  el.status.textContent = "The document or LMS profile changed. Run the compatibility check again.";
}

el.check?.addEventListener("click", () => createResult(true));
el.copy?.addEventListener("click", copyFragment);
el.download?.addEventListener("click", downloadHtml);
el.report?.addEventListener("click", () => {
  if (!lastResult) return;
  download(reportText(lastResult), "text/plain;charset=utf-8", `estiloapa-${lastResult.profile.slug}-compatibility.txt`);
});
el.close?.addEventListener("click", () => el.dialog.close());
el.closeFooter?.addEventListener("click", () => el.dialog.close());
el.dialog?.addEventListener("click", (event) => {
  if (event.target === el.dialog) el.dialog.close();
});
el.profile?.addEventListener("change", markStale);
el.firstLineIndent?.addEventListener("change", markStale);
el.hangingReferences?.addEventListener("change", markStale);
el.preview?.addEventListener("input", markStale);
new MutationObserver(() => {
  el.check.disabled = !meaningfulContent();
  if (!meaningfulContent()) markStale();
}).observe(el.preview, { childList: true, subtree: true });
el.check.disabled = !meaningfulContent();
