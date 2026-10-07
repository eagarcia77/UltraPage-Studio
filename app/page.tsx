"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { Accessibility, AlertTriangle, AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, BookOpen, CalendarDays, Check, ChevronDown, ClipboardPaste, Cloud, Code2, Columns3, Copy, Download, Eraser, Eye, FileImage, FilePlus2, FileText, Folder, Heading2, Highlighter, History, ImagePlus, Italic, Keyboard, Link2, List, ListOrdered, Loader2, LockKeyhole, Maximize2, Minus, Monitor, MoreHorizontal, Orbit, Palette, PanelRight, Pilcrow, PlugZap, Plus, Printer, Quote, Redo2, Rows3, Save, Scissors, Search, Settings2, Sigma, Smartphone, Sparkles, Stamp, Strikethrough, Subscript, Superscript, Table2, Tablet, Trash2, Underline, Undo2, Unlink, Upload, Video, Volume2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";
import { createCourseDigitalTwin, type CourseDigitalTwinResult, type TwinPerspective } from "@/lib/course-digital-twin";

const starterHtml = "";
const exportedPageStyles = `
:root{color-scheme:light}html{-webkit-text-size-adjust:100%;text-size-adjust:100%}*{box-sizing:border-box}body{margin:0;background:#f0f2f6;color:#242a36;font-family:Arial,"Segoe UI",sans-serif;font-size:16px;line-height:1.7;overflow-wrap:break-word}.ultra-page{width:min(100% - 32px,860px);min-height:100vh;margin:24px auto;background:#fff;border:1px solid #dce1e9;border-radius:5px;padding:54px clamp(30px,8vw,92px)}h1{font-size:clamp(27px,5vw,34px);line-height:1.16;letter-spacing:-.035em;margin:10px 0 18px;color:#242439}h2{font-size:clamp(21px,3.6vw,23px);line-height:1.3;margin:32px 0 10px;color:#302254}h3{font-size:clamp(18px,3vw,19px);line-height:1.4;margin:26px 0 8px;color:#302254}h4{font-size:clamp(16px,2.7vw,17px);line-height:1.4;margin:22px 0 7px;color:#302254}p{margin:0 0 16px}.eyebrow{color:#6b38d1;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.lead{font-size:18px;color:#555e70}.callout{border-left:5px solid #6b38d1;background:#f3effc;padding:18px 20px;margin:28px 0;border-radius:0 8px 8px 0}.callout strong{color:#5124a9}.callout p{margin:5px 0 0}ul,ol{margin:12px 0 20px;padding-left:28px}li{margin:4px 0}a{color:#2457a6;text-decoration:underline;text-underline-offset:2px;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #6b38d1;outline-offset:3px}blockquote{border-left:5px solid #6b38d1;margin:24px 0;padding:10px 20px;color:#555e70;background:#faf8ff}figure{margin:28px 0}img,svg,video,canvas{display:block;max-width:100%;height:auto}img{border-radius:7px}.responsive-media{margin:28px 0}.media-frame{position:relative;width:100%;aspect-ratio:16/9;background:#111;overflow:hidden;border-radius:7px}.media-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.media-fallback{font-size:13px;margin:8px 0}figcaption{font-size:13px;color:#6f788a;margin-top:8px}.apa-reference{padding-left:2rem;text-indent:-2rem;margin-bottom:.75rem}table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-collapse:collapse;margin:10px 0}caption{text-align:left;font-weight:700;margin-bottom:8px}th{text-align:left;padding:8px;background:#f3effc}td{padding:8px}table[data-table-style="grid"],table[data-table-style="grid"] th,table[data-table-style="grid"] td{border:1px solid #555}table[data-table-style="apa7"]{border:0}.apa-table th,table[data-table-style="apa7"] th{border-top:2px solid #222;border-bottom:1px solid #555;border-left:0;border-right:0}.apa-table td,table[data-table-style="apa7"] td{border:0}.apa-table tbody tr:last-child td,table[data-table-style="apa7"] tbody tr:last-child td{border-bottom:2px solid #222}.figure-placeholder{min-height:160px;border:2px dashed #c7cdd8;background:#f6f7f9;display:grid;place-items:center;color:#737d90;text-align:center;padding:20px}.ultrapage-toc{border:1px solid #ddd5ee;background:#faf8ff;border-radius:8px;padding:18px 20px;margin:24px 0}.ultrapage-toc-title{font-weight:700;color:#302254;margin:0 0 8px}.ultrapage-toc ol{margin:0;padding-left:22px}.ultrapage-toc li{margin:4px 0}@media(max-width:600px){body{background:#fff}.ultra-page{width:100%;margin:0;border:0;border-radius:0;padding:max(26px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(26px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left))}.lead{font-size:17px}.callout,blockquote{padding:14px 16px}table{font-size:14px}th,td{min-width:110px;padding:7px}ul,ol{padding-left:24px}}@media print{body{background:#fff}.ultra-page{width:100%;margin:0;border:0;padding:0}}
.ultra-page{position:relative}.ultra-page>:not(.ultrapage-watermark){position:relative;z-index:1}
`;
const demoFiles = [
  { name: "Banner_Modulo_4.jpg", type: "Imagen", size: "418 KB", icon: FileImage },
  { name: "Guia_de_estudio.pdf", type: "Documento", size: "1.2 MB", icon: FileText },
  { name: "Lecturas", type: "Carpeta", size: "6 archivos", icon: Folder },
  { name: "Recursos_visuales", type: "Carpeta", size: "12 archivos", icon: Folder },
];
const DRAFT_KEY = "ultrapage-studio-draft-v1";
const HISTORY_KEY = "ultrapage-studio-history-v1";
const PREVIEW_AUDIT_CHECK_COUNT = 23;
type DocumentLanguage = "es-PR" | "en-US";
type LmsProfile = "universal" | "blackboard" | "canvas" | "moodle" | "brightspace";
type PageSize = "letter" | "a4";
type PageOrientation = "portrait" | "landscape";
type PageMargin = "normal" | "narrow" | "wide";
type RibbonTab = "file" | "home" | "insert" | "layout" | "references" | "review" | "view" | "tools" | "table" | "picture" | "link";
type PageSetup = { size: PageSize; orientation: PageOrientation; margin: PageMargin };
type DraftSnapshot = { id: string; html: string; title: string; fileName: string; language?: DocumentLanguage; lmsProfile?: LmsProfile; author?: string; description?: string; pageSetup?: PageSetup; savedAt: string };
type CapturedFormat = { fontFamily: string; fontSize: string; fontWeight: string; fontStyle: string; textDecorationLine: string; color: string; backgroundColor: string; lineHeight: string; textAlign: string };
type SelectedImageData = { alt: string; caption: string; decorative: boolean; width: number };
type SelectedImageSummary = { index: number; total: number; status: "described" | "decorative" | "needs-alt" };
type SelectedLinkData = { text: string; url: string; newTab: boolean };
type PreviewAuditLocation = { selector: string; index: number; label: string };
type PreviewAuditCheck = { ok: boolean; label: string; detail: string; location?: PreviewAuditLocation };
type PreviewDeviceResult = { device: "desktop" | "tablet" | "mobile"; label: string; width: number; ok: boolean; detail: string };
type LmsPreflightResult = { profile: LmsProfile; score: number; ready: boolean; outputBytes: number; checks: Array<{ label: string; ok: boolean; detail: string }> };
type LearningExperienceMetric = { id: "structure" | "objectives" | "guidance" | "alignment" | "support" | "cognitive-load"; label: string; score: number; detail: string; recommendation: string };
type LearningExperienceResult = { score: number; wordCount: number; readingMinutes: number; metrics: LearningExperienceMetric[] };
type SemanticChangeItem = { label: string; before: number; after: number; delta: number; sensitive?: boolean };
type SemanticChangeResult = { baselineTitle: string; baselineSavedAt: string; risk: "low" | "medium" | "high"; wordsAdded: number; wordsRemoved: number; accessibilityBefore: number; accessibilityAfter: number; sensitiveChanges: string[]; items: SemanticChangeItem[] };
type LearnerJourneyPersonaId = "keyboard" | "screen-reader" | "low-vision" | "cognitive" | "mobile";
type LearnerJourneyStop = { order: number; role: string; label: string };
type LearnerJourneyPersona = { id: LearnerJourneyPersonaId; label: string; score: number; status: "ready" | "review" | "blocked"; evidence: string; recommendation: string };
type LearnerJourneyResult = { score: number; language: DocumentLanguage; sourceHtml: string; focusStops: LearnerJourneyStop[]; readingStops: LearnerJourneyStop[]; personas: LearnerJourneyPersona[]; frictionPoints: string[] };
type ConstellationNodeKind = "course" | "objective" | "section" | "activity" | "assessment" | "resource";
type ConstellationNode = { id: string; kind: ConstellationNodeKind; label: string; x: number; y: number; weight: number; parentId?: string; evidence: string };
type ConstellationEdge = { source: string; target: string; relation: "contains" | "supports" | "assesses" | "extends" };
type ConstellationTrajectory = { id: "first-contact" | "warp-sprint" | "mastery-orbit"; label: string; score: number; status: "stable" | "turbulent" | "lost"; path: string[]; signal: string };
type LearningConstellationResult = { score: number; status: "ready" | "review" | "blocked"; nodes: ConstellationNode[]; edges: ConstellationEdge[]; orphanIds: string[]; metrics: Array<{ label: string; value: string; detail: string }>; trajectories: ConstellationTrajectory[]; gaps: string[]; generatedAt: string };
type ReadinessPillarId = "accessibility" | "design" | "lms" | "learning" | "change" | "journey" | "constellation" | "digital-twin";
type ReadinessPillar = { id: ReadinessPillarId; label: string; score: number; status: "ready" | "review" | "blocked"; evidence: string; recommendation: string };
type PublicationReadinessResult = { status: "READY" | "REVIEW" | "BLOCKED"; score: number; generatedAt: string; fingerprint: string; profile: LmsProfile; owner: string; pillars: ReadinessPillar[]; blockers: string[]; recommendations: string[] };
type HtmlDiagnostic = { severity: "error" | "warning"; message: string; line: number; column: number; offset: number; length: number };
type HtmlTagCrumb = { name: string; offset: number };
type HtmlLiveSelection = { tag: string; ordinal: number; offset: number; length: number; line: number; column: number; label: string; selectedText?: string };
type HtmlPackageResult = { bundledAssets: number; externalAssets: number; fileName: string };

const pageSizes: Record<PageSize, { label: string; width: number; height: number }> = {
  letter: { label: "Letter", width: 8.5, height: 11 },
  a4: { label: "A4", width: 8.27, height: 11.69 },
};
const pageMargins: Record<PageMargin, { label: string; horizontal: number; vertical: number }> = {
  normal: { label: "Normal", horizontal: 0.75, vertical: 0.75 },
  narrow: { label: "Narrow", horizontal: 0.5, vertical: 0.5 },
  wide: { label: "Wide", horizontal: 1, vertical: 1 },
};

function isPageSetup(value: unknown): value is PageSetup {
  if (!value || typeof value !== "object") return false;
  const setup = value as Partial<PageSetup>;
  return (setup.size === "letter" || setup.size === "a4") && (setup.orientation === "portrait" || setup.orientation === "landscape") && (setup.margin === "normal" || setup.margin === "narrow" || setup.margin === "wide");
}

function pageDimensions(setup: PageSetup) {
  const paper = pageSizes[setup.size];
  return setup.orientation === "landscape" ? { width: paper.height, height: paper.width } : { width: paper.width, height: paper.height };
}

function pagePrintCss(setup: PageSetup) {
  const margin = pageMargins[setup.margin];
  return `@page{size:${setup.size === "a4" ? "A4" : "Letter"} ${setup.orientation};margin:${margin.vertical}in ${margin.horizontal}in}@media print{.page-canvas{padding:0!important}}`;
}

function parseComputedColor(value: string): [number, number, number, number] | null {
  const match = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
}

function relativeLuminance([red, green, blue]: [number, number, number]) {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function computedContrastRatio(element: HTMLElement, boundary: HTMLElement) {
  const foreground = parseComputedColor(getComputedStyle(element).color);
  if (!foreground) return 21;
  let background: [number, number, number] = [255, 255, 255];
  let current: HTMLElement | null = element;
  while (current) {
    const parsed = parseComputedColor(getComputedStyle(current).backgroundColor);
    if (parsed && parsed[3] > 0) {
      const alpha = parsed[3];
      background = [
        parsed[0] * alpha + 255 * (1 - alpha),
        parsed[1] * alpha + 255 * (1 - alpha),
        parsed[2] * alpha + 255 * (1 - alpha),
      ];
      break;
    }
    if (current === boundary) break;
    current = current.parentElement;
  }
  const textLuminance = relativeLuminance([foreground[0], foreground[1], foreground[2]]);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(textLuminance, backgroundLuminance) + 0.05) / (Math.min(textLuminance, backgroundLuminance) + 0.05);
}
const languageLabels: Record<DocumentLanguage, string> = { "es-PR": "Español (Puerto Rico)", "en-US": "English (United States)" };
const lmsProfiles: Record<LmsProfile, { label: string; shortLabel: string; guidance: string }> = {
  universal: { label: "Universal LMS", shortLabel: "Universal", guidance: "Conservative semantic HTML for standards-based LMS editors." },
  blackboard: { label: "Blackboard Ultra", shortLabel: "Blackboard", guidance: "Includes legacy visual fallbacks used by Blackboard Ultra." },
  canvas: { label: "Canvas", shortLabel: "Canvas", guidance: "Uses semantic HTML and inline styles compatible with the Canvas allowlist." },
  moodle: { label: "Moodle", shortLabel: "Moodle", guidance: "Uses portable semantic HTML for Moodle text editors and pages." },
  brightspace: { label: "D2L Brightspace", shortLabel: "Brightspace", guidance: "Uses body content and inline styles because the editor removes style blocks." },
};

function isLmsProfile(value: unknown): value is LmsProfile {
  return typeof value === "string" && value in lmsProfiles;
}

const AUTO_INDENT_ATTRIBUTE = "data-ultrapage-auto-indent";

function countSentences(text: string, language: DocumentLanguage = "es-PR") {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return 0;
  const protectedText = normalized
    .replace(/\b(?:Dr|Dra|Sr|Sra|Srta|Prof|Profa|Lic|Ing|Arq|Dept|Núm|No|pág|pp|vol|ed|aprox|etc|Mr|Mrs|Ms|St|vs|Ph\.D|e\.g|i\.e)\./giu, (abbreviation) => abbreviation.replaceAll(".", "·"))
    .replace(/\b(?:[A-ZÁÉÍÓÚÜÑ]{1,3}\.\s*){2,}/gu, (initials) => initials.replace(/\.(?=[\s\S]*\.)/g, "·"));
  try {
    const segmenter = new Intl.Segmenter(language, { granularity: "sentence" });
    return Array.from(segmenter.segment(protectedText)).filter(({ segment }) => /[\p{L}\p{N}]/u.test(segment)).length;
  } catch {
    return protectedText.split(/(?<=[.!?¡¿])\s+(?=[A-ZÁÉÍÓÚÜÑ0-9¡¿])/u).filter((sentence) => /[\p{L}\p{N}]/u.test(sentence)).length;
  }
}

function applyAutomaticFirstLineIndentation(root: ParentNode, language: DocumentLanguage = "es-PR") {
  root.querySelectorAll<HTMLElement>(`[${AUTO_INDENT_ATTRIBUTE}="true"]:not(p)`).forEach((element) => {
    element.style.removeProperty("text-indent");
    element.removeAttribute(AUTO_INDENT_ATTRIBUTE);
  });
  root.querySelectorAll<HTMLParagraphElement>("p").forEach((paragraph) => {
    const mode = paragraph.getAttribute(AUTO_INDENT_ATTRIBUTE);
    const excluded = paragraph.matches(".eyebrow,.lead,.apa-reference,.ultrapage-toc-title") || Boolean(paragraph.closest("li,td,th,figcaption,blockquote,figure,.callout,.ultrapage-toc"));
    const qualifies = !excluded && countSentences(paragraph.textContent || "", language) > 3;
    if (mode === "true" && !qualifies) {
      paragraph.style.removeProperty("text-indent");
      paragraph.removeAttribute(AUTO_INDENT_ATTRIBUTE);
      if (!paragraph.getAttribute("style")) paragraph.removeAttribute("style");
      return;
    }
    const hasManualIndent = Boolean(paragraph.style.textIndent) && mode !== "true";
    if (qualifies && mode !== "off" && !hasManualIndent) {
      paragraph.style.textIndent = "48px";
      paragraph.setAttribute(AUTO_INDENT_ATTRIBUTE, "true");
    }
  });
}

function applyPreviewKeyboardSemantics(root: ParentNode) {
  root.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    if (!table.hasAttribute("tabindex")) table.tabIndex = 0;
    if (!table.hasAttribute("aria-label")) {
      const caption = table.querySelector("caption")?.textContent?.trim();
      if (caption) table.setAttribute("aria-label", caption);
    }
  });
}

function normalizeAutomaticIndentationHtml(sourceHtml: string, language: DocumentLanguage = "es-PR") {
  if (typeof DOMParser === "undefined") return sourceHtml;
  const parsed = new DOMParser().parseFromString(`<div id="ultrapage-auto-indent-root">${sourceHtml}</div>`, "text/html");
  const root = parsed.querySelector<HTMLElement>("#ultrapage-auto-indent-root");
  if (!root) return sourceHtml;
  applyAutomaticFirstLineIndentation(root, language);
  root.querySelectorAll("[data-ultrapage-selected],[data-ultrapage-live-selected]").forEach((element) => {
    element.removeAttribute("data-ultrapage-selected");
    element.removeAttribute("data-ultrapage-live-selected");
  });
  return root.innerHTML;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

const HTML_FORMAT_BLOCKS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "CAPTION", "DD", "DIV", "DL", "DT", "FIGCAPTION", "FIGURE", "FOOTER",
  "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "LI", "MAIN", "NAV", "OL", "P", "SECTION", "TABLE",
  "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL",
]);
const HTML_VOID_ELEMENTS = new Set(["AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"]);

function formatHtmlFragment(source: string) {
  if (!source.trim() || typeof DOMParser === "undefined") return source;
  const parsed = new DOMParser().parseFromString(`<div id="ultrapage-format-root">${source}</div>`, "text/html");
  const root = parsed.querySelector<HTMLElement>("#ultrapage-format-root");
  if (!root) return source;

  const serialize = (node: Node, depth: number): string[] => {
    const indentation = "  ".repeat(depth);
    if (node.nodeType === Node.COMMENT_NODE) return [`${indentation}<!--${node.nodeValue || ""}-->`];
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || "";
      return text.trim() ? [`${indentation}${escapeHtml(text.trim())}`] : [];
    }
    if (!(node instanceof HTMLElement)) return [];

    const hasBlockChild = Array.from(node.children).some((child) => HTML_FORMAT_BLOCKS.has(child.tagName));
    if (!hasBlockChild || HTML_VOID_ELEMENTS.has(node.tagName)) return [`${indentation}${node.outerHTML}`];

    const shallow = node.cloneNode(false) as HTMLElement;
    const openingTag = HTML_VOID_ELEMENTS.has(node.tagName)
      ? shallow.outerHTML
      : shallow.outerHTML.replace(new RegExp(`</${node.tagName.toLowerCase()}>$`, "i"), "");
    const lines = [`${indentation}${openingTag}`];
    node.childNodes.forEach((child) => lines.push(...serialize(child, depth + 1)));
    lines.push(`${indentation}</${node.tagName.toLowerCase()}>`);
    return lines;
  };

  return Array.from(root.childNodes).flatMap((node) => serialize(node, 0)).join("\n");
}

function highlightHtmlSyntax(source: string) {
  const tokens = source.split(/(<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>)/g).filter((token) => token !== "");
  return tokens.map((token, tokenIndex) => {
    if (token.startsWith("<!--")) return <span className="syntax-comment" key={`comment-${tokenIndex}`}>{token}</span>;
    if (token.startsWith("<!")) return <span className="syntax-doctype" key={`doctype-${tokenIndex}`}>{token}</span>;
    if (!token.startsWith("<")) return <span className="syntax-text" key={`text-${tokenIndex}`}>{token}</span>;

    const tag = token.match(/^(<\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?>)$/);
    if (!tag) return <span className="syntax-text" key={`fallback-${tokenIndex}`}>{token}</span>;
    const [, opening, name, attributes, closing] = tag;
    const attributeNodes: React.ReactNode[] = [];
    const attributePattern = /(\s+)|([^\s=/>]+)(?:(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = attributePattern.exec(attributes)) !== null) {
      if (match.index > cursor) attributeNodes.push(<span key={`raw-${tokenIndex}-${cursor}`}>{attributes.slice(cursor, match.index)}</span>);
      if (match[1]) attributeNodes.push(<span key={`space-${tokenIndex}-${match.index}`}>{match[1]}</span>);
      else {
        attributeNodes.push(<span className="syntax-attribute" key={`attribute-${tokenIndex}-${match.index}`}>{match[2]}</span>);
        if (match[3]) attributeNodes.push(<span className="syntax-punctuation" key={`equals-${tokenIndex}-${match.index}`}>{match[3]}</span>);
        if (match[4]) attributeNodes.push(<span className="syntax-value" key={`value-${tokenIndex}-${match.index}`}>{match[4]}</span>);
      }
      cursor = attributePattern.lastIndex;
    }
    if (cursor < attributes.length) attributeNodes.push(<span key={`tail-${tokenIndex}`}>{attributes.slice(cursor)}</span>);
    return <span className="syntax-tag" key={`tag-${tokenIndex}`}><span className="syntax-punctuation">{opening}</span><span className="syntax-tag-name">{name}</span>{attributeNodes}<span className="syntax-punctuation">{closing}</span></span>;
  });
}

function sourcePosition(source: string, offset: number) {
  const before = source.slice(0, offset);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: (lines.at(-1)?.length || 0) + 1 };
}

function findOpeningTagByOrdinal(source: string, tagName: string, ordinal: number) {
  const tagPattern = /<!--[\s\S]*?-->|<![^>]*>|<\/?([A-Za-z][\w:-]*)(?:\s[^>]*)?>/g;
  let match: RegExpExecArray | null;
  let current = 0;
  while ((match = tagPattern.exec(source)) !== null) {
    if (match[0].startsWith("<!--") || match[0].startsWith("<!") || match[0].startsWith("</")) continue;
    if ((match[1] || "").toLowerCase() !== tagName.toLowerCase()) continue;
    if (current === ordinal) return { offset: match.index, length: match[0].length };
    current += 1;
  }
  return null;
}

function findTextWithinElement(source: string, opening: { offset: number; length: number }, tagName: string, selectedText: string) {
  const normalized = selectedText.replace(/\s+/g, " ").trim().slice(0, 512);
  if (!normalized || HTML_VOID_ELEMENTS.has(tagName.toUpperCase())) return null;
  const start = opening.offset + opening.length;
  const closingOffset = source.toLowerCase().indexOf(`</${tagName.toLowerCase()}>`, start);
  const end = closingOffset >= 0 ? closingOffset : Math.min(source.length, start + 12000);
  const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const encoded = normalized.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
  const candidates = [normalized, encoded].filter((value, index, values) => values.indexOf(value) === index);
  for (const candidate of candidates) {
    const flexibleWhitespace = candidate.split(/\s+/).map(escapePattern).join("\\s+");
    const match = source.slice(start, end).match(new RegExp(flexibleWhitespace));
    if (match?.index !== undefined) return { offset: start + match.index, length: match[0].length };
  }
  return null;
}

function analyzeHtmlSource(source: string): HtmlDiagnostic[] {
  const diagnostics: HtmlDiagnostic[] = [];
  const stack: Array<{ name: string; offset: number; length: number }> = [];
  const ids = new Map<string, number>();
  const tagPattern = /<!--[\s\S]*?-->|<![^>]*>|<\/?([A-Za-z][\w:-]*)([^>]*)>/g;
  let match: RegExpExecArray | null;
  const add = (severity: HtmlDiagnostic["severity"], message: string, offset: number, length: number) => {
    const position = sourcePosition(source, offset);
    diagnostics.push({ severity, message, line: position.line, column: position.column, offset, length: Math.max(1, length) });
  };
  while ((match = tagPattern.exec(source)) !== null) {
    const token = match[0];
    if (token.startsWith("<!--") || token.startsWith("<!")) continue;
    const name = (match[1] || "").toLowerCase();
    const attributes = match[2] || "";
    const closing = token.startsWith("</");
    const selfClosing = /\/\s*>$/.test(token) || HTML_VOID_ELEMENTS.has(name.toUpperCase());
    if (closing) {
      const matchingIndex = stack.map((item) => item.name).lastIndexOf(name);
      if (matchingIndex < 0) add("error", `Closing tag </${name}> has no matching opening tag.`, match.index, token.length);
      else {
        const top = stack.at(-1);
        if (top?.name !== name) add("error", `Closing tag </${name}> appears before <${top?.name}> is closed.`, match.index, token.length);
        stack.splice(matchingIndex);
      }
      continue;
    }
    if (/^(script|object|embed|form)$/i.test(name) || /\son[a-z]+\s*=|(?:href|src)\s*=\s*["']javascript:/i.test(attributes)) {
      add("error", `<${name}> contains executable or unsafe markup that an LMS may remove.`, match.index, token.length);
    }
    const id = attributes.match(/\sid\s*=\s*["']([^"']+)["']/i)?.[1];
    if (id) {
      if (ids.has(id)) add("error", `Duplicate id “${id}” breaks reliable navigation.`, match.index, token.length);
      else ids.set(id, match.index);
    }
    if (name === "img") {
      const altMatch = attributes.match(/\salt\s*=\s*["']([^"']*)["']/i);
      const explicitlyDecorative = /\srole\s*=\s*["']presentation["']/i.test(attributes) || /\saria-hidden\s*=\s*["']true["']/i.test(attributes);
      if (!altMatch) add("error", "Image is missing an alt attribute.", match.index, token.length);
      else if (!altMatch[1].trim() && !explicitlyDecorative) add("warning", "Image has empty alt text but is not explicitly marked decorative.", match.index, token.length);
      else if (altMatch[1].trim() && explicitlyDecorative) add("warning", "Decorative image should use empty alt text.", match.index, token.length);
    }
    if (name === "a" && !/\shref\s*=\s*["'][^"']+["']/i.test(attributes)) add("warning", "Link is missing a usable href destination.", match.index, token.length);
    if (/\sstyle\s*=\s*["'][^"']*(?:min-width|width)\s*:\s*(?:[4-9]\d{2,}|\d{4,})px/i.test(attributes)) add("warning", "A fixed width may overflow on mobile devices.", match.index, token.length);
    if (!selfClosing) stack.push({ name, offset: match.index, length: token.length });
  }
  stack.forEach((item) => add("error", `Opening tag <${item.name}> is not closed.`, item.offset, item.length));
  return diagnostics.sort((a, b) => a.offset - b.offset || (a.severity === "error" ? -1 : 1));
}

function getHtmlTagPath(source: string, caret: number): HtmlTagCrumb[] {
  const stack: HtmlTagCrumb[] = [];
  const tagPattern = /<!--[\s\S]*?-->|<![^>]*>|<\/?([A-Za-z][\w:-]*)([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(source)) !== null && match.index < caret) {
    const token = match[0];
    if (token.startsWith("<!--") || token.startsWith("<!")) continue;
    const name = (match[1] || "").toLowerCase();
    if (token.startsWith("</")) {
      const matchingIndex = stack.map((item) => item.name).lastIndexOf(name);
      if (matchingIndex >= 0) stack.splice(matchingIndex);
    } else if (!/\/\s*>$/.test(token) && !HTML_VOID_ELEMENTS.has(name.toUpperCase())) stack.push({ name, offset: match.index });
  }
  return stack;
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The image could not be read."));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function blobToDataUrl(blob: Blob) {
  if (/^image\/(png|jpeg)$/i.test(blob.type)) return readBlobAsDataUrl(blob);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error("The image dimensions are too large to process safely.");
    }
    const scale = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not prepare the image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const normalized = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The image could not be converted.")), "image/png"));
    return readBlobAsDataUrl(normalized);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normalizeMediaEmbed(source: string) {
  try {
    const url = new URL(source.trim());
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1).split("/")[0]}`;
    if (host === "youtube.com" || host === "www.youtube.com") {
      const id = url.searchParams.get("v") || url.pathname.match(/\/embed\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    if (host === "www.youtube-nocookie.com" && url.pathname.startsWith("/embed/")) return url.toString();
    if (host === "vimeo.com" || host === "www.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return /^\d+$/.test(id || "") ? `https://player.vimeo.com/video/${id}` : "";
    }
    if (host === "player.vimeo.com" && url.pathname.startsWith("/video/")) return url.toString();
    if (host === "kaltura.com" || host.endsWith(".kaltura.com")) return url.toString();
    return "";
  } catch { return ""; }
}

function sanitizePastedHtml(source: string) {
  const parsed = new DOMParser().parseFromString(source, "text/html");
  const allowedTags = new Set(["P","DIV","NAV","SECTION","BR","H1","H2","H3","H4","UL","OL","LI","STRONG","B","EM","I","U","S","SUB","SUP","BLOCKQUOTE","A","TABLE","CAPTION","THEAD","TBODY","TR","TH","TD","FIGURE","FIGCAPTION","IMG","IFRAME"]);
  const removeEntirely = new Set(["SCRIPT","STYLE","META","LINK","OBJECT","EMBED","FORM","INPUT","BUTTON"]);
  Array.from(parsed.body.querySelectorAll<HTMLElement>("*")).forEach((element) => {
    if (removeEntirely.has(element.tagName)) { element.remove(); return; }
    if (!allowedTags.has(element.tagName)) { element.replaceWith(...Array.from(element.childNodes)); return; }
    const safeAttributes = new Set(["href","src","alt","title","scope","colspan","rowspan","class","role","aria-label","aria-hidden","tabindex","width","height","loading","id","data-table-style","data-ultrapage-toc","data-accessible-media","data-captions","data-ultrapage-webdav-src","data-ultrapage-auto-indent","data-ultrapage-image-id","data-ultrapage-alt-status","data-ultrapage-decorative","allow","allowfullscreen","referrerpolicy","frameborder"]);
    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name === "style") return;
      if (!safeAttributes.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name);
    });
    const safeStyles = ["text-align","line-height","margin-left","padding-left","text-indent","font-family","font-size","color","background-color"];
    const styleValues = safeStyles.map((property) => {
      const value = element.style.getPropertyValue(property);
      return value ? `${property}:${value}` : "";
    }).filter(Boolean);
    if (styleValues.length) element.setAttribute("style", styleValues.join(";"));
    else element.removeAttribute("style");
    if (element.tagName === "A") {
      const href = element.getAttribute("href") || "";
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) element.removeAttribute("href");
      else { element.setAttribute("rel", "noopener noreferrer"); }
    }
    if (element.tagName === "IMG") {
      const source = element.getAttribute("src") || "";
      const safeHostedImage = /^(https?:\/\/|\/)/i.test(source);
      const safeEmbeddedImage = /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(source) && source.length <= 14 * 1024 * 1024;
      if (!safeHostedImage && !safeEmbeddedImage) { element.remove(); return; }
      element.setAttribute("loading", "lazy");
      const explicitlyDecorative = element.getAttribute("role") === "presentation" || element.getAttribute("aria-hidden") === "true" || element.getAttribute("data-ultrapage-decorative") === "true";
      const alternativeText = element.getAttribute("alt")?.trim() || "";
      if (explicitlyDecorative) {
        element.setAttribute("alt", "");
        element.setAttribute("role", "presentation");
        element.setAttribute("aria-hidden", "true");
        element.setAttribute("data-ultrapage-decorative", "true");
        element.setAttribute("data-ultrapage-alt-status", "decorative");
      } else if (alternativeText) {
        element.setAttribute("alt", alternativeText);
        element.setAttribute("data-ultrapage-alt-status", "described");
      } else {
        element.setAttribute("alt", "");
        element.setAttribute("data-ultrapage-alt-status", "pending");
      }
    }
    if (element.tagName === "TABLE" && !element.hasAttribute("tabindex")) element.setAttribute("tabindex", "0");
    if (element.tagName === "IFRAME") {
      const safeSource = normalizeMediaEmbed(element.getAttribute("src") || "");
      if (!safeSource) element.remove();
      else { element.setAttribute("src", safeSource); element.setAttribute("loading", "lazy"); }
    }
  });
  return parsed.body.innerHTML;
}

function buildLmsHtml(sourceHtml: string, language: DocumentLanguage = "es-PR", profile: LmsProfile = "universal") {
  const parsed = new DOMParser().parseFromString(`<div id="ultrapage-export">${sourceHtml}</div>`, "text/html");
  const root = parsed.querySelector<HTMLElement>("#ultrapage-export");
  if (!root) return sourceHtml;
  applyAutomaticFirstLineIndentation(root, language);
  root.setAttribute("lang", language);
  root.querySelectorAll("script,style,object,embed,form,input,button").forEach((element) => element.remove());
  root.querySelectorAll<HTMLImageElement>("img[data-ultrapage-webdav-src]").forEach((image) => {
    const remoteSource = image.getAttribute("data-ultrapage-webdav-src") || "";
    if (profile === "blackboard" && /^https:\/\//i.test(remoteSource)) image.src = remoteSource;
    image.removeAttribute("data-ultrapage-webdav-src");
  });
  root.querySelectorAll<HTMLIFrameElement>("iframe").forEach((frame) => { const safeSource = normalizeMediaEmbed(frame.src); if (!safeSource) frame.remove(); else frame.src = safeSource; });
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      if ((attribute.name === "href" || attribute.name === "src") && /^javascript:/i.test(attribute.value.trim())) element.removeAttribute(attribute.name);
    });
  });
  const style = (element: Element, defaults: string) => {
    const current = element.getAttribute("style") || "";
    element.setAttribute("style", `${defaults}${current ? `;${current}` : ""}`);
  };
  style(root, "position:relative;max-width:100%;font-family:Arial,'Segoe UI',sans-serif;color:#242a36;font-size:16px;line-height:1.7;overflow-wrap:break-word");
  root.querySelectorAll<HTMLElement>(":scope > :not(.ultrapage-watermark)").forEach((element) => {
    element.style.position = "relative"; element.style.zIndex = "1";
  });
  root.querySelectorAll("h1").forEach((element) => style(element, "font-family:Arial,'Segoe UI',sans-serif;font-size:34px;line-height:1.16;font-weight:700;letter-spacing:-0.03em;margin:10px 0 18px;color:#242439"));
  root.querySelectorAll("h2").forEach((element) => style(element, "font-family:Arial,'Segoe UI',sans-serif;font-size:23px;line-height:1.3;font-weight:700;margin:32px 0 10px;color:#302254"));
  root.querySelectorAll("h3").forEach((element) => style(element, "font-family:Arial,'Segoe UI',sans-serif;font-size:19px;line-height:1.4;font-weight:700;margin:26px 0 8px;color:#302254"));
  root.querySelectorAll("h4").forEach((element) => style(element, "font-family:Arial,'Segoe UI',sans-serif;font-size:17px;line-height:1.4;font-weight:700;margin:22px 0 7px;color:#302254"));
  root.querySelectorAll("p").forEach((element) => style(element, "margin:0 0 16px"));
  root.querySelectorAll(".eyebrow").forEach((element) => style(element, "color:#6b38d1;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px"));
  root.querySelectorAll(".lead").forEach((element) => style(element, "font-size:18px;color:#555e70;margin:0 0 20px"));
  root.querySelectorAll(".callout").forEach((element) => {
    style(element, "border-left:5px solid #6b38d1;background:#f3effc;padding:18px 20px;margin:28px 0;border-radius:0 8px 8px 0");
    element.querySelectorAll(":scope > strong,:scope > b").forEach((child) => style(child, "color:#5124a9;font-weight:700"));
    element.querySelectorAll(":scope > p").forEach((child) => style(child, "margin:5px 0 0"));
  });
  root.querySelectorAll("ul").forEach((element) => style(element, "display:block;list-style-type:disc;list-style-position:outside;margin:12px 0 20px;padding-left:28px"));
  root.querySelectorAll("ol").forEach((element) => style(element, "display:block;list-style-type:decimal;list-style-position:outside;margin:12px 0 20px;padding-left:32px"));
  root.querySelectorAll("li").forEach((element) => style(element, "display:list-item;margin:4px 0;padding-left:2px"));
  root.querySelectorAll("a").forEach((element) => style(element, "color:#2457a6;text-decoration:underline"));
  root.querySelectorAll("blockquote").forEach((element) => style(element, "border-left:5px solid #6b38d1;margin:24px 0;padding:10px 20px;color:#555e70;background:#faf8ff"));
  root.querySelectorAll(".ultrapage-toc").forEach((element) => style(element, "border:1px solid #ddd5ee;background:#faf8ff;border-radius:8px;padding:18px 20px;margin:24px 0"));
  root.querySelectorAll(".ultrapage-toc-title").forEach((element) => style(element, "font-weight:700;color:#302254;margin:0 0 8px"));
  root.querySelectorAll("figure").forEach((element) => style(element, "display:block;margin:28px 0"));
  root.querySelectorAll(".responsive-media").forEach((element) => style(element, "display:block;margin:28px 0;max-width:100%"));
  root.querySelectorAll(".media-frame").forEach((element) => style(element, "display:block;position:relative;width:100%;height:0;padding-top:56.25%;background:#111;overflow:hidden;border-radius:7px"));
  root.querySelectorAll(".media-frame iframe").forEach((element) => style(element, "display:block;position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;border:0"));
  root.querySelectorAll(".media-fallback").forEach((element) => style(element, "font-size:13px;margin:8px 0"));
  root.querySelectorAll("img").forEach((element) => style(element, "display:block;max-width:100%;height:auto;border-radius:7px"));
  root.querySelectorAll("figcaption").forEach((element) => style(element, "display:block;font-size:13px;color:#6f788a;margin-top:8px"));
  root.querySelectorAll(".apa-reference").forEach((element) => style(element, "padding-left:32px;text-indent:-32px;margin-bottom:12px"));
  root.querySelectorAll("table").forEach((element) => style(element, "display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-collapse:collapse;margin:10px 0"));
  root.querySelectorAll("caption").forEach((element) => style(element, "text-align:left;font-weight:700;margin-bottom:8px"));
  root.querySelectorAll("th").forEach((element) => style(element, "border-top:2px solid #222;border-bottom:1px solid #555;text-align:left;padding:8px;background:#f3effc;font-weight:700"));
  root.querySelectorAll("td").forEach((element) => style(element, "border-bottom:1px solid #aaa;text-align:left;padding:8px"));
  root.querySelectorAll("tbody tr:last-child td").forEach((element) => style(element, "border-bottom:2px solid #222"));
  root.querySelectorAll<HTMLTableElement>('table[data-table-style="grid"]').forEach((table) => {
    table.style.borderCollapse = "collapse";
    table.style.border = "1px solid #555";
    table.setAttribute("border", "1");
    table.querySelectorAll<HTMLElement>("th,td").forEach((cell) => {
      cell.style.border = "1px solid #555";
      cell.style.padding = "8px";
    });
  });
  root.querySelectorAll<HTMLTableElement>('table[data-table-style="apa7"]').forEach((table) => {
    table.style.borderCollapse = "collapse";
    table.style.border = "0";
    table.setAttribute("border", "0");
    table.querySelectorAll<HTMLElement>("th").forEach((cell) => {
      cell.style.borderLeft = "0"; cell.style.borderRight = "0";
      cell.style.borderTop = "2px solid #222"; cell.style.borderBottom = "1px solid #555";
    });
    table.querySelectorAll<HTMLElement>("td").forEach((cell) => {
      cell.style.border = "0"; cell.style.padding = "8px";
    });
    table.querySelectorAll<HTMLElement>("tbody tr:last-child td").forEach((cell) => { cell.style.borderBottom = "2px solid #222"; });
  });
  root.querySelectorAll(".figure-placeholder").forEach((element) => style(element, "min-height:160px;border:2px dashed #c7cdd8;background:#f6f7f9;color:#737d90;text-align:center;padding:40px 20px"));
  const fontify = (element: Element, color: string, size: string, bold = false) => {
    const font = parsed.createElement("font");
    font.setAttribute("face", "Arial, Helvetica, sans-serif");
    font.setAttribute("color", color);
    font.setAttribute("size", size);
    while (element.firstChild) font.appendChild(element.firstChild);
    if (bold) {
      const strong = parsed.createElement("strong");
      strong.appendChild(font);
      element.appendChild(strong);
    } else element.appendChild(font);
  };
  if (profile === "blackboard") {
    root.querySelectorAll("h1").forEach((element) => fontify(element, "#242439", "6"));
    root.querySelectorAll("h2").forEach((element) => fontify(element, "#302254", "5"));
    root.querySelectorAll("h3").forEach((element) => fontify(element, "#302254", "4"));
    root.querySelectorAll("h4").forEach((element) => fontify(element, "#302254", "4"));
    root.querySelectorAll("p").forEach((element) => {
      if (element.classList.contains("eyebrow")) fontify(element, "#6b38d1", "2", true);
      else if (element.classList.contains("lead")) fontify(element, "#555e70", "4");
      else fontify(element, "#242a36", "3");
    });
    root.querySelectorAll("li").forEach((element) => fontify(element, "#242a36", "3"));
    root.querySelectorAll("figcaption").forEach((element) => fontify(element, "#6f788a", "2"));
    root.querySelectorAll("caption").forEach((element) => fontify(element, "#242a36", "3", true));
    root.querySelectorAll("th").forEach((element) => fontify(element, "#242a36", "3", true));
    root.querySelectorAll("td").forEach((element) => fontify(element, "#242a36", "3"));
    root.querySelectorAll(".callout > strong,.callout > b").forEach((element) => fontify(element, "#5124a9", "3"));
  }
  root.querySelectorAll("ul").forEach((element) => element.setAttribute("type", "disc"));
  root.querySelectorAll("ol").forEach((element) => element.setAttribute("type", "1"));
  root.querySelectorAll("table").forEach((element) => {
    element.setAttribute("width", "100%"); element.setAttribute("border", "0"); element.setAttribute("cellspacing", "0"); element.setAttribute("cellpadding", "8"); element.setAttribute("tabindex", "0");
  });
  root.querySelectorAll('table[data-table-style="grid"]').forEach((element) => element.setAttribute("border", "1"));
  root.querySelectorAll("th").forEach((element) => element.setAttribute("bgcolor", "#f3effc"));
  if (profile === "blackboard") root.querySelectorAll<HTMLElement>(".callout").forEach((callout) => {
    const table = parsed.createElement("table");
    table.setAttribute("role", "presentation"); table.setAttribute("width", "100%"); table.setAttribute("border", "0"); table.setAttribute("cellspacing", "0"); table.setAttribute("cellpadding", "0"); table.setAttribute("bgcolor", "#f3effc");
    style(table, "width:100%;border-collapse:collapse;background:#f3effc;margin:28px 0");
    const body = parsed.createElement("tbody"); const row = parsed.createElement("tr");
    const accent = parsed.createElement("td"); accent.setAttribute("width", "5"); accent.setAttribute("bgcolor", "#6b38d1"); accent.setAttribute("aria-hidden", "true"); accent.innerHTML = "&nbsp;";
    const content = parsed.createElement("td"); content.setAttribute("bgcolor", "#f3effc"); content.setAttribute("valign", "top"); style(content, "background:#f3effc;padding:18px 20px");
    while (callout.firstChild) content.appendChild(callout.firstChild);
    row.append(accent, content); body.appendChild(row); table.appendChild(body); callout.replaceWith(table);
  });
  root.querySelectorAll("[data-ultrapage-size]").forEach((element) => element.removeAttribute("data-ultrapage-size"));
  root.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,td,th").forEach((element) => {
    const alignment = element.style.textAlign;
    if (["left", "center", "right", "justify"].includes(alignment)) element.setAttribute("align", alignment);
  });
  root.querySelectorAll(`[${AUTO_INDENT_ATTRIBUTE}]`).forEach((element) => element.removeAttribute(AUTO_INDENT_ATTRIBUTE));
  root.querySelectorAll("[data-ultrapage-image-id],[data-ultrapage-alt-status],[data-ultrapage-selected],[data-ultrapage-decorative]").forEach((element) => {
    element.removeAttribute("data-ultrapage-image-id");
    element.removeAttribute("data-ultrapage-alt-status");
    element.removeAttribute("data-ultrapage-selected");
    element.removeAttribute("data-ultrapage-decorative");
  });
  return root.outerHTML;
}

function createUniversalLmsPreflight(sourceHtml: string, language: DocumentLanguage): LmsPreflightResult[] {
  const sourceDocument = new DOMParser().parseFromString(`<div id="ultrapage-preflight-source">${sourceHtml}</div>`, "text/html");
  const source = sourceDocument.querySelector<HTMLElement>("#ultrapage-preflight-source");
  if (!source) return [];
  const normalizeText = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim();
  const semanticSelectors = ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "a", "img", "figure", "figcaption", "table", "caption", "thead", "tbody", "tr", "th", "td", "blockquote"];
  const sourceImages = Array.from(source.querySelectorAll<HTMLImageElement>("img"));
  const sourceLinks = Array.from(source.querySelectorAll<HTMLAnchorElement>("a[href]"), (link) => link.getAttribute("href") || "");

  return (Object.keys(lmsProfiles) as LmsProfile[]).map((profile) => {
    const outputHtml = buildLmsHtml(sourceHtml, language, profile);
    const outputDocument = new DOMParser().parseFromString(outputHtml, "text/html");
    const outputRoot = outputDocument.querySelector<HTMLElement>("#ultrapage-export");
    const outputImages = Array.from(outputDocument.querySelectorAll<HTMLImageElement>("img"));
    const outputLinks = Array.from(outputDocument.querySelectorAll<HTMLAnchorElement>("a[href]"), (link) => link.getAttribute("href") || "");
    const contentParity = Boolean(outputRoot) && normalizeText(outputRoot?.textContent) === normalizeText(source.textContent);
    const structureParity = Boolean(outputRoot) && semanticSelectors.every((selector) => (outputRoot?.querySelectorAll(selector).length ?? -1) >= source.querySelectorAll(selector).length);
    const imageParity = outputImages.length === sourceImages.length && outputImages.every((image) => {
      const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true";
      return decorative ? image.getAttribute("alt") === "" : Boolean(image.getAttribute("alt")?.trim());
    });
    const linkParity = sourceLinks.length === outputLinks.length && sourceLinks.every((href, index) => href === outputLinks[index]);
    const cleanMarkup = !outputDocument.querySelector("script,style,object,embed,form,input,button,[data-ultrapage-image-id],[data-ultrapage-alt-status],[data-ultrapage-selected],[data-ultrapage-live-selected],[data-ultrapage-decorative]");
    const checks = [
      { label: "Content", ok: contentParity, detail: contentParity ? "Visible text is preserved." : "Visible text changes during conversion." },
      { label: "Structure", ok: structureParity, detail: structureParity ? "Semantic elements remain available." : "A semantic element is removed or transformed." },
      { label: "Images", ok: imageParity, detail: imageParity ? "Image alternatives survive conversion." : "Review image count or alternative text." },
      { label: "Links", ok: linkParity, detail: linkParity ? "Link destinations are preserved." : "A link destination changes or is removed." },
      { label: "Hygiene", ok: cleanMarkup, detail: cleanMarkup ? "Unsafe and editor-only markup is absent." : "Generated markup contains a blocked element or editor marker." },
    ];
    const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);
    return { profile, score, ready: score === 100, outputBytes: new Blob([outputHtml]).size, checks };
  });
}

function createLearningExperiencePulse(sourceHtml: string, language: DocumentLanguage): LearningExperienceResult {
  const parsed = new DOMParser().parseFromString(`<main id="learning-experience-source">${sourceHtml}</main>`, "text/html");
  const root = parsed.querySelector<HTMLElement>("#learning-experience-source");
  const text = (root?.textContent || "").replace(/\s+/g, " ").trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const headings = Array.from(root?.querySelectorAll<HTMLElement>("h1,h2,h3,h4") || []);
  const headingLevels = headings.map((heading) => Number(heading.tagName.slice(1)));
  const hierarchyReady = headingLevels.every((level, index) => index === 0 || level <= headingLevels[index - 1] + 1);
  const h1Count = headings.filter((heading) => heading.tagName === "H1").length;
  const paragraphs = Array.from(root?.querySelectorAll<HTMLParagraphElement>("p") || []);
  const longestParagraph = paragraphs.reduce((longest, paragraph) => Math.max(longest, (paragraph.textContent || "").trim().split(/\s+/).filter(Boolean).length), 0);
  const lists = root?.querySelectorAll("ul,ol").length || 0;
  const lowerText = text.toLocaleLowerCase(language);
  const spanish = language === "es-PR";
  const hasObjectives = spanish ? /objetiv(?:o|os)|resultados? de aprendizaje/.test(lowerText) : /learning objectives?|learning outcomes?/.test(lowerText);
  const hasMeasurableVerb = spanish
    ? /\b(analizar|aplicar|comparar|crear|describir|diseñar|evaluar|explicar|identificar|implementar|demostrar)\b/.test(lowerText)
    : /\b(analyze|apply|compare|create|describe|design|evaluate|explain|identify|implement|demonstrate)\b/.test(lowerText);
  const hasGuidance = spanish ? /instrucciones|pasos|actividades?|complete|revise|participe/.test(lowerText) : /instructions?|steps?|activities|complete|review|participate/.test(lowerText);
  const hasAssessment = spanish ? /evaluaci[oó]n|evidencia|r[uú]brica|asignaci[oó]n|entrega/.test(lowerText) : /assessment|evidence|rubric|assignment|submission/.test(lowerText);
  const hasSupport = spanish ? /apoyo|ayuda|contacte|asistencia|pr[oó]ximos pasos/.test(lowerText) : /support|help|contact|assistance|next steps/.test(lowerText);
  const structureScore = Math.max(0, 100 - (h1Count === 1 ? 0 : 35) - (hierarchyReady ? 0 : 35) - (headings.length >= 3 ? 0 : 30));
  const objectiveScore = hasObjectives ? (hasMeasurableVerb ? 100 : 65) : 0;
  const guidanceScore = hasGuidance ? (lists ? 100 : 70) : lists ? 40 : 0;
  const alignmentScore = hasObjectives && hasAssessment ? 100 : hasObjectives || hasAssessment ? 50 : 0;
  const supportScore = hasSupport ? 100 : 0;
  const cognitiveScore = words.length === 0 ? 0 : Math.max(0, 100 - (longestParagraph > 150 ? 45 : longestParagraph > 100 ? 20 : 0) - (headings.length && words.length / headings.length <= 300 ? 0 : 25) - (words.length > 2500 ? 20 : 0));
  const metrics: LearningExperienceMetric[] = [
    { id: "structure", label: "Learning structure", score: structureScore, detail: `${headings.length} headings · ${h1Count} H1 · ${hierarchyReady ? "continuous hierarchy" : "skipped level"}`, recommendation: h1Count === 1 && hierarchyReady && headings.length >= 3 ? "The page has a navigable learning structure." : "Use one H1 and organize major sections with sequential H2–H4 headings." },
    { id: "objectives", label: "Measurable objectives", score: objectiveScore, detail: hasObjectives ? (hasMeasurableVerb ? "Objectives and measurable verbs detected." : "Objectives detected; measurable action verbs need review.") : "No learning-objective section detected.", recommendation: hasObjectives && hasMeasurableVerb ? "Objectives provide an observable learning direction." : "State measurable objectives with verbs such as analyze, apply, create, or evaluate." },
    { id: "guidance", label: "Learner guidance", score: guidanceScore, detail: hasGuidance ? `${lists ? "Sequenced" : "Narrative"} instructions detected.` : "No explicit instructions or activity guidance detected.", recommendation: hasGuidance && lists ? "Learners receive sequenced directions." : "Add concise instructions and use a numbered list when order matters." },
    { id: "alignment", label: "Assessment alignment", score: alignmentScore, detail: hasObjectives && hasAssessment ? "Objectives and assessment evidence are both present." : "Objectives and assessment evidence are not both visible.", recommendation: hasObjectives && hasAssessment ? "The page exposes both intended learning and evidence of achievement." : "Connect each objective to an activity, deliverable, rubric, or other evidence." },
    { id: "support", label: "Learner support", score: supportScore, detail: hasSupport ? "Help or next-step language detected." : "No support or next-step guidance detected.", recommendation: hasSupport ? "The page provides a path forward when learners need help." : "Add support contact information and a clear next step." },
    { id: "cognitive-load", label: "Cognitive load", score: cognitiveScore, detail: `${words.length} words · longest paragraph ${longestParagraph} words · ${headings.length ? Math.round(words.length / headings.length) : words.length} words per heading`, recommendation: cognitiveScore >= 80 ? "Content is appropriately chunked for scanning and study." : "Break long paragraphs into focused sections, lists, callouts, or progressive activities." },
  ];
  return { score: Math.round(metrics.reduce((total, metric) => total + metric.score, 0) / metrics.length), wordCount: words.length, readingMinutes: words.length ? Math.max(1, Math.ceil(words.length / 200)) : 0, metrics };
}

function createSemanticChangeImpact(currentHtml: string, baseline: DraftSnapshot, currentTitle: string, language: DocumentLanguage): SemanticChangeResult {
  const parse = (markup: string) => new DOMParser().parseFromString(`<main id="semantic-change-root">${markup}</main>`, "text/html").querySelector<HTMLElement>("#semantic-change-root");
  const before = parse(baseline.html);
  const after = parse(currentHtml);
  const count = (root: HTMLElement | null, selector: string) => root?.querySelectorAll(selector).length || 0;
  const item = (label: string, selector: string, sensitive = false): SemanticChangeItem => {
    const previous = count(before, selector);
    const current = count(after, selector);
    return { label, before: previous, after: current, delta: current - previous, sensitive };
  };
  const tokenize = (root: HTMLElement | null) => (root?.textContent || "").toLocaleLowerCase(language).match(/[\p{L}\p{N}]+/gu) || [];
  const frequencies = (tokens: string[]) => tokens.reduce((map, token) => map.set(token, (map.get(token) || 0) + 1), new Map<string, number>());
  const beforeWords = frequencies(tokenize(before));
  const afterWords = frequencies(tokenize(after));
  const vocabulary = new Set([...beforeWords.keys(), ...afterWords.keys()]);
  let wordsAdded = 0;
  let wordsRemoved = 0;
  vocabulary.forEach((word) => {
    const delta = (afterWords.get(word) || 0) - (beforeWords.get(word) || 0);
    if (delta > 0) wordsAdded += delta;
    else wordsRemoved += Math.abs(delta);
  });
  const items = [
    item("Headings", "h1,h2,h3,h4", true),
    item("Paragraphs", "p"),
    item("Lists", "ul,ol"),
    item("Links", "a[href]", true),
    item("Images", "img", true),
    item("Tables", "table", true),
    item("Videos", "iframe", true),
  ];
  const beforeLinks = Array.from(before?.querySelectorAll<HTMLAnchorElement>("a[href]") || [], (link) => link.getAttribute("href") || "");
  const afterLinks = Array.from(after?.querySelectorAll<HTMLAnchorElement>("a[href]") || [], (link) => link.getAttribute("href") || "");
  const beforeAlts = Array.from(before?.querySelectorAll<HTMLImageElement>("img") || [], (image) => `${image.getAttribute("alt") || ""}|${image.getAttribute("role") || ""}|${image.getAttribute("aria-hidden") || ""}`);
  const afterAlts = Array.from(after?.querySelectorAll<HTMLImageElement>("img") || [], (image) => `${image.getAttribute("alt") || ""}|${image.getAttribute("role") || ""}|${image.getAttribute("aria-hidden") || ""}`);
  const beforeChecks = accessibilityReport(baseline.html, baseline.title, baseline.language || language);
  const afterChecks = accessibilityReport(currentHtml, currentTitle, language);
  const accessibilityBefore = Math.round((beforeChecks.filter((check) => check.ok).length / beforeChecks.length) * 100);
  const accessibilityAfter = Math.round((afterChecks.filter((check) => check.ok).length / afterChecks.length) * 100);
  const sensitiveChanges: string[] = [];
  if (items[0].delta) sensitiveChanges.push("Heading structure changed");
  if (beforeLinks.join("\n") !== afterLinks.join("\n")) sensitiveChanges.push("Link destinations changed");
  if (beforeAlts.join("\n") !== afterAlts.join("\n")) sensitiveChanges.push("Image accessibility changed");
  if (items.find((entry) => entry.label === "Tables")?.delta) sensitiveChanges.push("Table structure changed");
  if (accessibilityAfter < accessibilityBefore) sensitiveChanges.push(`Accessibility decreased ${accessibilityBefore - accessibilityAfter} points`);
  const risk = sensitiveChanges.length >= 3 || accessibilityAfter < accessibilityBefore - 10 ? "high" : sensitiveChanges.length ? "medium" : "low";
  return { baselineTitle: baseline.title, baselineSavedAt: baseline.savedAt, risk, wordsAdded, wordsRemoved, accessibilityBefore, accessibilityAfter, sensitiveChanges, items };
}

function createLearnerJourneySimulation(sourceHtml: string, language: DocumentLanguage): LearnerJourneyResult {
  const parsed = new DOMParser().parseFromString(sourceHtml, "text/html");
  const root = parsed.body;
  const clean = (value: string | null | undefined, fallback = "Unlabeled item") => (value || "").replace(/\s+/g, " ").trim().slice(0, 120) || fallback;
  if (!root || !clean(root.textContent, "")) {
    const emptyPersonas: LearnerJourneyPersona[] = ([
      ["keyboard", "Keyboard navigation"], ["screen-reader", "Screen-reader order"], ["low-vision", "Low vision & reflow"], ["cognitive", "Cognitive clarity"], ["mobile", "Mobile learning"],
    ] as Array<[LearnerJourneyPersonaId, string]>).map(([id, label]) => ({ id, label, score: 0, status: "blocked", evidence: "The page has no learner content to simulate.", recommendation: "Add meaningful content, then run the simulator again." }));
    return { score: 0, language, sourceHtml, focusStops: [], readingStops: [], personas: emptyPersonas, frictionPoints: emptyPersonas.map((persona) => `${persona.label}: ${persona.recommendation}`) };
  }
  const focusable = Array.from(root.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'));
  const focusStops = focusable.map((element, index) => ({ order: index + 1, role: element.tagName.toLowerCase(), label: clean(element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || (element as HTMLInputElement).value) }));
  const readingElements = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,li,a[href],img,blockquote,figcaption,caption,th"));
  const readingStops = readingElements.map((element, index) => ({ order: index + 1, role: element.tagName === "IMG" ? "image" : element.tagName.toLowerCase(), label: clean(element.tagName === "IMG" ? element.getAttribute("alt") || (element.getAttribute("role") === "presentation" ? "Decorative image" : "Image without alternative text") : element.textContent) })).slice(0, 80);
  const unnamedFocus = focusStops.filter((stop) => stop.label === "Unlabeled item").length;
  const positiveTabindex = focusable.filter((element) => Number(element.getAttribute("tabindex") || 0) > 0).length;
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const vagueLinks = links.filter((link) => /^(aquí|clic aquí|click here|más|ver más|enlace)$/i.test(clean(link.textContent, ""))).length;
  const ids = new Set(Array.from(root.querySelectorAll<HTMLElement>("[id]"), (element) => element.id));
  const brokenInternalLinks = links.filter((link) => { const href = link.getAttribute("href") || ""; return href.startsWith("#") && href !== "#" && !ids.has(href.slice(1)); }).length;
  const headings = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4"));
  const headingLevels = headings.map((heading) => Number(heading.tagName.slice(1)));
  const headingHierarchyReady = headingLevels.every((level, index) => index === 0 || level <= headingLevels[index - 1] + 1);
  const h1Count = headings.filter((heading) => heading.tagName === "H1").length;
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const imageIssues = images.filter((image) => { const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true"; return decorative ? image.getAttribute("alt") !== "" : !image.getAttribute("alt")?.trim(); }).length;
  const tables = Array.from(root.querySelectorAll<HTMLTableElement>("table"));
  const tableIssues = tables.filter((table) => !table.querySelector("th") || (!table.querySelector("caption") && !table.getAttribute("aria-label"))).length;
  const inlineStyled = Array.from(root.querySelectorAll<HTMLElement>("[style]"));
  const smallText = inlineStyled.filter((element) => { const value = element.style.fontSize; return value.endsWith("px") && Number.parseFloat(value) < 12; }).length;
  const fixedWidths = inlineStyled.filter((element) => [element.style.width, element.style.minWidth].some((value) => value.endsWith("px") && Number.parseFloat(value) >= 400)).length;
  const paragraphs = Array.from(root.querySelectorAll<HTMLParagraphElement>("p"));
  const longParagraphs = paragraphs.filter((paragraph) => clean(paragraph.textContent, "").split(/\s+/).filter(Boolean).length > 120).length;
  const learning = createLearningExperiencePulse(sourceHtml, language);
  const cognitiveMetrics = learning.metrics.filter((metric) => ["structure", "guidance", "cognitive-load"].includes(metric.id));
  const cognitiveScore = Math.round(cognitiveMetrics.reduce((total, metric) => total + metric.score, 0) / Math.max(1, cognitiveMetrics.length));
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  const keyboardScore = clamp(100 - unnamedFocus * 25 - positiveTabindex * 20 - vagueLinks * 15 - brokenInternalLinks * 20);
  const screenReaderScore = clamp(100 - (h1Count === 1 ? 0 : 25) - (headingHierarchyReady ? 0 : 20) - Math.min(30, imageIssues * 15) - Math.min(25, tableIssues * 15));
  const lowVisionScore = clamp(100 - Math.min(45, smallText * 15) - Math.min(55, fixedWidths * 20));
  const mobileScore = clamp(100 - Math.min(60, fixedWidths * 25) - Math.min(40, tables.filter((table) => /min-width\s*:\s*(?:[4-9]\d{2,}|\d{4,})px/i.test(table.getAttribute("style") || "")).length * 20));
  const classify = (score: number): LearnerJourneyPersona["status"] => score >= 80 ? "ready" : score >= 50 ? "review" : "blocked";
  const personas: LearnerJourneyPersona[] = [
    { id: "keyboard", label: "Keyboard navigation", score: keyboardScore, status: classify(keyboardScore), evidence: `${focusStops.length} focus stop${focusStops.length === 1 ? "" : "s"} · ${unnamedFocus} unnamed · ${positiveTabindex} forced order · ${brokenInternalLinks} broken internal link${brokenInternalLinks === 1 ? "" : "s"}`, recommendation: keyboardScore >= 80 ? "Focus order and interactive names are predictable." : "Give every control a clear name, remove positive tabindex values, and repair internal destinations." },
    { id: "screen-reader", label: "Screen-reader order", score: screenReaderScore, status: classify(screenReaderScore), evidence: `${readingStops.length} semantic reading stop${readingStops.length === 1 ? "" : "s"} · ${h1Count} H1 · ${imageIssues} image issue${imageIssues === 1 ? "" : "s"} · ${tableIssues} table issue${tableIssues === 1 ? "" : "s"}`, recommendation: screenReaderScore >= 80 ? "The semantic reading path is coherent." : "Repair heading hierarchy, image alternatives, and table names before assistive-technology testing." },
    { id: "low-vision", label: "Low vision & reflow", score: lowVisionScore, status: classify(lowVisionScore), evidence: `${smallText} inline text size${smallText === 1 ? "" : "s"} below 12 px · ${fixedWidths} fixed width${fixedWidths === 1 ? "" : "s"} at or above 400 px`, recommendation: lowVisionScore >= 80 ? "The page supports enlarged text and reflow." : "Remove small inline text and fixed pixel widths that obstruct 200% zoom." },
    { id: "cognitive", label: "Cognitive clarity", score: cognitiveScore, status: classify(cognitiveScore), evidence: `${longParagraphs} paragraph${longParagraphs === 1 ? "" : "s"} over 120 words · structure ${learning.metrics.find((metric) => metric.id === "structure")?.score || 0}% · guidance ${learning.metrics.find((metric) => metric.id === "guidance")?.score || 0}%`, recommendation: cognitiveScore >= 80 ? "The learning path is chunked and easy to scan." : "Shorten dense paragraphs and strengthen headings, instructions, and sequenced steps." },
    { id: "mobile", label: "Mobile learning", score: mobileScore, status: classify(mobileScore), evidence: `${fixedWidths} fixed-width element${fixedWidths === 1 ? "" : "s"} · ${tables.length} table${tables.length === 1 ? "" : "s"} evaluated for narrow-screen flow`, recommendation: mobileScore >= 80 ? "The source is ready for narrow-screen reflow testing." : "Replace fixed widths and ensure wide tables remain horizontally scrollable." },
  ];
  const score = Math.round(personas.reduce((total, persona) => total + persona.score, 0) / personas.length);
  const frictionPoints = personas.filter((persona) => persona.status !== "ready").map((persona) => `${persona.label}: ${persona.recommendation}`);
  return { score, language, sourceHtml, focusStops, readingStops, personas, frictionPoints };
}

function buildLearnerJourneyPreview(result: LearnerJourneyResult, persona: LearnerJourneyPersonaId) {
  if (persona === "screen-reader") {
    const items = result.readingStops.map((stop) => `<li><span>${escapeHtml(stop.role)}</span><strong>${escapeHtml(stop.label)}</strong></li>`).join("");
    return `<!doctype html><html lang="${result.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;background:#f6f7fa;color:#222;font:16px/1.55 Arial,sans-serif}h1{font-size:21px}p{color:#5f6878}ol{padding:0;list-style:none;counter-reset:step}li{counter-increment:step;display:grid;grid-template-columns:38px 110px 1fr;gap:10px;padding:10px;border-bottom:1px solid #dfe3ea;background:#fff}li:before{content:counter(step);display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#5b2a86;color:#fff;font-weight:700}li span{color:#6b38d1;font-size:11px;font-weight:800;text-transform:uppercase}li strong{font-size:13px}@media(max-width:520px){li{grid-template-columns:34px 1fr}li strong{grid-column:2}}</style></head><body><h1>Semantic reading order</h1><p>Approximation based on document structure; verify with a real screen reader.</p><ol>${items || "<li><span>empty</span><strong>No semantic reading stops detected.</strong></li>"}</ol></body></html>`;
  }
  const parsed = new DOMParser().parseFromString(result.sourceHtml, "text/html");
  const root = parsed.body;
  if (!root) return "";
  if (persona === "keyboard") Array.from(root.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')).forEach((element, index) => element.setAttribute("data-journey-order", String(index + 1)));
  if (persona === "cognitive") Array.from(root.querySelectorAll<HTMLParagraphElement>("p")).forEach((paragraph) => { if (cleanTextContent(paragraph.textContent).split(/\s+/).filter(Boolean).length > 120) paragraph.setAttribute("data-cognitive-friction", "true"); });
  const personaCss: Record<Exclude<LearnerJourneyPersonaId, "screen-reader">, string> = {
    keyboard: `[data-journey-order]{position:relative;outline:3px solid #7850c7!important;outline-offset:4px}[data-journey-order]::before{content:attr(data-journey-order);position:absolute;z-index:20;top:-14px;left:-10px;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#5b2a86;color:#fff;font:700 11px Arial}`,
    "low-vision": `#learner-preview{font-size:200%!important;line-height:1.8!important;max-width:100%!important}#learner-preview *{max-width:100%!important;letter-spacing:.02em}#learner-preview a{text-decoration-thickness:.12em}`,
    cognitive: `#learner-preview p{max-width:68ch}#learner-preview h1,#learner-preview h2,#learner-preview h3,#learner-preview h4{outline:2px solid #2f8a70;outline-offset:4px}[data-cognitive-friction]{outline:4px solid #c67818!important;background:#fff4dc!important;padding:12px!important}`,
    mobile: `#learner-preview{width:100%;max-width:390px!important;margin:auto!important}#learner-preview img,#learner-preview video,#learner-preview canvas{max-width:100%!important;height:auto!important}#learner-preview table{display:block!important;max-width:100%!important;overflow-x:auto!important}`,
  };
  return `<!doctype html><html lang="${result.language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${exportedPageStyles}body{padding:18px;background:#e9ecf2}#learner-preview{width:min(100%,860px);margin:auto;background:#fff;padding:clamp(20px,6vw,54px);box-shadow:0 8px 24px #1f293719}${personaCss[persona]}</style></head><body><main id="learner-preview">${root.innerHTML}</main></body></html>`;
}

function cleanTextContent(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function createLearningConstellation(sourceHtml: string, title: string, language: DocumentLanguage): LearningConstellationResult {
  const parsed = new DOMParser().parseFromString(sourceHtml, "text/html");
  const root = parsed.body;
  const label = (element: Element | null, fallback: string) => cleanTextContent(element?.textContent).slice(0, 74) || fallback;
  const documentElements = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,li,a[href],table,figure,video,iframe,[data-learning-objective],[data-learning-activity],[data-assessment]"));
  const headings = documentElements.filter((element) => /^H[1-6]$/.test(element.tagName));
  const objectivePattern = /\b(objectives?|outcomes?|competenc(?:y|ies)|objetivos?|resultados?|competencias?)\b/i;
  const assessmentPattern = /\b(quiz|exam|test|assessment|assignment|project|rubric|discussion|foro|prueba|examen|evaluaci[oó]n|asignaci[oó]n|proyecto|r[uú]brica)\b/i;
  const activityPattern = /\b(activity|practice|exercise|reflection|case study|actividad|pr[aá]ctica|ejercicio|reflexi[oó]n|estudio de caso)\b/i;
  const actionVerbPattern = language === "es-PR" ? /^(analiz|aplic|compar|cre|diseñ|evalu|explic|identific|integr|demostr|desarroll|describ|distingu|interpret)/i : /^(analy|apply|compare|create|design|evaluate|explain|identify|integrate|demonstrate|develop|describe|distinguish|interpret)/i;
  const nodes: ConstellationNode[] = [{ id: "course", kind: "course", label: title.trim() || label(root.querySelector("h1"), "Untitled learning page"), x: 400, y: 250, weight: 28, evidence: "Document nucleus" }];
  const edges: ConstellationEdge[] = [];
  const headingIds = new Map<Element, string>();
  const headingStack: Array<{ level: number; id: string }> = [];
  const addNode = (kind: ConstellationNodeKind, nodeLabel: string, parentId: string | undefined, evidence: string) => {
    const normalized = nodeLabel.toLocaleLowerCase(language);
    if (!nodeLabel || nodes.some((node) => node.kind === kind && node.label.toLocaleLowerCase(language) === normalized)) return undefined;
    const id = `node-${nodes.length}`;
    nodes.push({ id, kind, label: nodeLabel, x: 0, y: 0, weight: kind === "section" ? 19 : kind === "objective" ? 17 : 14, parentId, evidence });
    if (parentId) edges.push({ source: parentId, target: id, relation: kind === "assessment" ? "assesses" : kind === "resource" ? "extends" : kind === "activity" ? "supports" : "contains" });
    return id;
  };
  headings.slice(0, 12).forEach((heading) => {
    const level = Number(heading.tagName.slice(1));
    while (headingStack.length && headingStack.at(-1)!.level >= level) headingStack.pop();
    const text = label(heading, `Heading ${nodes.length}`);
    const kind: ConstellationNodeKind = assessmentPattern.test(text) ? "assessment" : objectivePattern.test(text) ? "objective" : activityPattern.test(text) ? "activity" : "section";
    const parentId = headingStack.at(-1)?.id || "course";
    const id = addNode(kind, text, parentId, `H${level} in document order`);
    if (id) { headingIds.set(heading, id); headingStack.push({ level, id }); }
  });
  const nearestHeadingId = (element: Element) => {
    const position = documentElements.indexOf(element as HTMLElement);
    for (let index = position - 1; index >= 0; index -= 1) if (headingIds.has(documentElements[index])) return headingIds.get(documentElements[index])!;
    return "course";
  };
  documentElements.filter((element) => element.matches("p,li,[data-learning-objective]")).slice(0, 80).forEach((element) => {
    if (nodes.filter((node) => node.kind === "objective").length >= 8) return;
    const text = label(element, "");
    const previousHeading = headings.filter((heading) => documentElements.indexOf(heading) < documentElements.indexOf(element)).at(-1);
    const explicit = element.hasAttribute("data-learning-objective") || objectivePattern.test(label(previousHeading || null, ""));
    if (text.length >= 10 && text.length <= 220 && (explicit || actionVerbPattern.test(text))) addNode("objective", text, nearestHeadingId(element), explicit ? "Objective context" : "Observable action verb");
  });
  documentElements.filter((element) => element.matches("[data-assessment],[data-learning-activity],table")).slice(0, 6).forEach((element) => {
    const text = label(element, element.tagName === "TABLE" ? "Structured learning table" : "Learning activity");
    const kind: ConstellationNodeKind = element.hasAttribute("data-assessment") || assessmentPattern.test(text) ? "assessment" : "activity";
    addNode(kind, text, nearestHeadingId(element), element.tagName === "TABLE" ? "Structured table evidence" : "Explicit learning marker");
  });
  documentElements.filter((element) => element.matches("a[href],figure,video,iframe")).slice(0, 6).forEach((element) => {
    const resourceLabel = element.tagName === "A" ? label(element, "Unnamed linked resource") : label(element, `${element.tagName.toLowerCase()} resource`);
    addNode("resource", resourceLabel, nearestHeadingId(element), element.tagName === "A" ? `Linked resource: ${element.getAttribute("href") || "missing destination"}` : `${element.tagName.toLowerCase()} media resource`);
  });
  const visibleNodes = nodes.slice(0, 28);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));
  visibleNodes.slice(1).forEach((node, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, visibleNodes.length - 1)) * Math.PI * 2;
    const radius = node.kind === "section" ? 176 : node.kind === "objective" ? 130 : node.kind === "assessment" ? 205 : node.kind === "activity" ? 222 : 238;
    node.x = Math.round(400 + Math.cos(angle) * radius);
    node.y = Math.round(250 + Math.sin(angle) * radius * .82);
  });
  const sectionCount = visibleNodes.filter((node) => node.kind === "section").length;
  const objectiveCount = visibleNodes.filter((node) => node.kind === "objective").length;
  const activityCount = visibleNodes.filter((node) => node.kind === "activity").length;
  const assessmentCount = visibleNodes.filter((node) => node.kind === "assessment").length;
  const resourceCount = visibleNodes.filter((node) => node.kind === "resource").length;
  const headingLevels = headings.map((heading) => Number(heading.tagName.slice(1)));
  const hierarchyGap = headingLevels.some((level, index) => index > 0 && level > headingLevels[index - 1] + 1);
  const orphanIds = visibleNodes.filter((node) => node.parentId === "course" && ["activity", "assessment", "resource"].includes(node.kind)).map((node) => node.id);
  const score = Math.max(0, Math.min(100, (sectionCount >= 2 ? 25 : sectionCount ? 12 : 0) + (objectiveCount ? 25 : 0) + (activityCount ? 18 : 0) + (assessmentCount ? 22 : 0) + (resourceCount ? 10 : 0) - Math.min(24, orphanIds.length * 8) - (hierarchyGap ? 12 : 0)));
  const gaps = [!objectiveCount && "No explicit or action-oriented learning objective was detected.", !activityCount && "No practice or structured learning activity was detected.", !assessmentCount && "No assessment node was detected to close the learning loop.", sectionCount < 2 && "The knowledge architecture needs at least two distinguishable sections.", hierarchyGap && "A heading-level jump breaks the visible knowledge hierarchy.", orphanIds.length > 0 && `${orphanIds.length} learning node${orphanIds.length === 1 ? " is" : "s are"} connected only to the document nucleus.`].filter(Boolean) as string[];
  const trajectory = (id: ConstellationTrajectory["id"], trajectoryLabel: string, trajectoryScore: number, kinds: ConstellationNodeKind[], signal: string): ConstellationTrajectory => ({ id, label: trajectoryLabel, score: trajectoryScore, status: trajectoryScore >= 80 ? "stable" : trajectoryScore >= 50 ? "turbulent" : "lost", path: visibleNodes.filter((node) => kinds.includes(node.kind)).slice(0, 5).map((node) => node.label), signal });
  const trajectories: ConstellationTrajectory[] = [
    trajectory("first-contact", "First Contact", Math.min(100, (objectiveCount ? 35 : 0) + (sectionCount >= 2 ? 30 : sectionCount ? 15 : 0) + (activityCount ? 20 : 0) + (resourceCount ? 15 : 0)), ["objective", "section", "activity", "resource"], "A novice needs an explicit destination, gradual knowledge bodies, guided practice, and support."),
    trajectory("warp-sprint", "Warp Sprint", Math.min(100, (objectiveCount ? 30 : 0) + (sectionCount ? 25 : 0) + (!hierarchyGap ? 25 : 0) + (resourceCount ? 20 : 0)), ["objective", "section", "resource"], "A time-limited learner needs a scannable route with immediate purpose and direct resources."),
    trajectory("mastery-orbit", "Mastery Orbit", Math.min(100, (objectiveCount ? 25 : 0) + (activityCount ? 25 : 0) + (assessmentCount ? 35 : 0) + (resourceCount ? 15 : 0)), ["objective", "activity", "assessment", "resource"], "An advanced learner needs application, evidence of mastery, and extension resources."),
  ];
  return { score, status: score >= 80 && !gaps.length ? "ready" : score >= 50 ? "review" : "blocked", nodes: visibleNodes, edges: visibleEdges, orphanIds, metrics: [{ label: "Knowledge bodies", value: String(sectionCount), detail: "Semantic sections" }, { label: "Objectives", value: String(objectiveCount), detail: "Explicit or action-oriented" }, { label: "Practice + proof", value: String(activityCount + assessmentCount), detail: `${activityCount} activities · ${assessmentCount} assessments` }, { label: "Resources", value: String(resourceCount), detail: "Linked or embedded" }], trajectories, gaps, generatedAt: new Date().toISOString() };
}

function stableContentFingerprint(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `UP-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

export default function Home() {
  const editor = useRef<HTMLDivElement>(null);
  const codeEditor = useRef<HTMLTextAreaElement>(null);
  const codeLineNumbers = useRef<HTMLDivElement>(null);
  const codeHighlightLayer = useRef<HTMLPreElement>(null);
  const livePreviewFrame = useRef<HTMLIFrameElement>(null);
  const localFileInput = useRef<HTMLInputElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const [html, setHtml] = useState(starterHtml);
  const htmlRef = useRef(starterHtml);
  const [mode, setMode] = useState<"visual" | "ultra" | "html">("visual");
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("home");
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [codeView, setCodeView] = useState<"lms" | "source">("source");
  const [codeWorkspace, setCodeWorkspace] = useState<"code" | "split" | "live">("split");
  const [codeWrapEnabled, setCodeWrapEnabled] = useState(false);
  const [codeCaret, setCodeCaret] = useState(0);
  const [showCodeDiagnostics, setShowCodeDiagnostics] = useState(true);
  const [liveSelection, setLiveSelection] = useState<HtmlLiveSelection | null>(null);
  const [lmsHtml, setLmsHtml] = useState("");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState(100);
  const [rulerUnit, setRulerUnit] = useState<"in" | "cm">("in");
  const [showRulers, setShowRulers] = useState(true);
  const [showMarginGuides, setShowMarginGuides] = useState(true);
  const [showFormattingMarks, setShowFormattingMarks] = useState(false);
  const [showSemanticMap, setShowSemanticMap] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [readingAloud, setReadingAloud] = useState(false);
  const [previewCompareOpen, setPreviewCompareOpen] = useState(false);
  const [universalPreflightOpen, setUniversalPreflightOpen] = useState(false);
  const [universalPreflightResults, setUniversalPreflightResults] = useState<LmsPreflightResult[]>([]);
  const [learningPulseOpen, setLearningPulseOpen] = useState(false);
  const [learningPulseResult, setLearningPulseResult] = useState<LearningExperienceResult | null>(null);
  const [semanticChangeOpen, setSemanticChangeOpen] = useState(false);
  const [semanticChangeResult, setSemanticChangeResult] = useState<SemanticChangeResult | null>(null);
  const [learnerJourneyOpen, setLearnerJourneyOpen] = useState(false);
  const [learnerJourneyResult, setLearnerJourneyResult] = useState<LearnerJourneyResult | null>(null);
  const [learningConstellationOpen, setLearningConstellationOpen] = useState(false);
  const [learningConstellationResult, setLearningConstellationResult] = useState<LearningConstellationResult | null>(null);
  const [courseTwinOpen, setCourseTwinOpen] = useState(false);
  const [courseTwinResult, setCourseTwinResult] = useState<CourseDigitalTwinResult | null>(null);
  const [readinessCenterOpen, setReadinessCenterOpen] = useState(false);
  const [publicationReadiness, setPublicationReadiness] = useState<PublicationReadinessResult | null>(null);
  const [accessibilityIssueCursor, setAccessibilityIssueCursor] = useState(-1);
  const [previewIssueCursor, setPreviewIssueCursor] = useState(-1);
  const [rightPanel, setRightPanel] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<"review" | "outline" | "preview">("review");
  const [previewAuditChecks, setPreviewAuditChecks] = useState<PreviewAuditCheck[]>([]);
  const [previewDeviceResults, setPreviewDeviceResults] = useState<PreviewDeviceResult[]>([]);
  const [previewAuditTime, setPreviewAuditTime] = useState("");
  const [accessibilityHighlight, setAccessibilityHighlight] = useState<{ location: AccessibilityLocation; requestId: number } | null>(null);
  const [accessibilitySpotlight, setAccessibilitySpotlight] = useState<{ top: number; left: number; width: number; height: number; label: string } | null>(null);
  const [title, setTitle] = useState("Untitled document");
  const [saved, setSaved] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [documentFileName, setDocumentFileName] = useState("documento-sin-titulo.html");
  const [documentLanguage, setDocumentLanguage] = useState<DocumentLanguage>("es-PR");
  const [lmsProfile, setLmsProfile] = useState<LmsProfile>("universal");
  const [documentAuthor, setDocumentAuthor] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [pageSetup, setPageSetup] = useState<PageSetup>({ size: "letter", orientation: "portrait", margin: "normal" });
  const [imageDragActive, setImageDragActive] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [ribbonCommand, setRibbonCommand] = useState("");
  const [ribbonTextColor, setRibbonTextColor] = useState("#242a36");
  const [ribbonHighlightColor, setRibbonHighlightColor] = useState("#fff3a3");
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, strikeThrough: false, subscript: false, superscript: false, unorderedList: false, orderedList: false, alignLeft: false, alignCenter: false, alignRight: false, alignJustify: false });
  const [activeBlock, setActiveBlock] = useState("p");
  const [capturedFormat, setCapturedFormat] = useState<CapturedFormat | null>(null);
  const [selectionContext, setSelectionContext] = useState<"table" | "picture" | "link" | null>(null);
  const [selectedImageSummary, setSelectedImageSummary] = useState<SelectedImageSummary | null>(null);

  useEffect(() => {
    const compactLayout = window.matchMedia("(max-width: 1040px)");
    if (compactLayout.matches) setRightPanel(false);
  }, []);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as { html?: string; title?: string; fileName?: string; language?: DocumentLanguage; lmsProfile?: LmsProfile; author?: string; description?: string; pageSetup?: PageSetup };
        const restoredHtml = typeof draft.html === "string" ? draft.html : "";
        htmlRef.current = restoredHtml;
        setHtml(restoredHtml);
        if (editor.current) editor.current.innerHTML = restoredHtml;
        if (draft.title) setTitle(draft.title);
        if (draft.fileName) setDocumentFileName(draft.fileName);
        if (draft.language === "es-PR" || draft.language === "en-US") setDocumentLanguage(draft.language);
        if (isLmsProfile(draft.lmsProfile)) setLmsProfile(draft.lmsProfile);
        setDocumentAuthor(draft.author || "");
        setDocumentDescription(draft.description || "");
        if (isPageSetup(draft.pageSetup)) setPageSetup(draft.pageSetup);
        toast.success("Draft recovered", { description: "Your autosaved work was restored." });
      }
    } catch { localStorage.removeItem(DRAFT_KEY); }
    setDraftLoaded(true);
  }, []);
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ html, title, fileName: documentFileName, language: documentLanguage, lmsProfile, author: documentAuthor, description: documentDescription, pageSetup, updatedAt: new Date().toISOString() }));
      setSaved(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftLoaded, html, title, documentFileName, documentLanguage, lmsProfile, documentAuthor, documentDescription, pageSetup]);

  htmlRef.current = html;
  const attachEditor = useCallback((node: HTMLDivElement | null) => {
    editor.current = node;
    if (node && node.innerHTML !== htmlRef.current) node.innerHTML = htmlRef.current;
    if (node) { applyAutomaticFirstLineIndentation(node, documentLanguage); applyPreviewKeyboardSemantics(node); }
  }, [documentLanguage]);
  useEffect(() => {
    if (mode !== "visual" || !editor.current) return;
    if (editor.current.innerHTML !== html) editor.current.innerHTML = html;
    applyAutomaticFirstLineIndentation(editor.current, documentLanguage);
    applyPreviewKeyboardSemantics(editor.current);
    const normalized = editor.current.innerHTML;
    if (normalized !== html) {
      htmlRef.current = normalized;
      setHtml(normalized);
      setSaved(false);
    }
  }, [html, mode, documentLanguage]);
  useEffect(() => {
    if (mode !== "visual" || !accessibilityHighlight || !editor.current) return;
    let removalTimer = 0;
    const frame = window.requestAnimationFrame(() => {
      const root = editor.current;
      if (!root) return;
      const { location } = accessibilityHighlight;
      const target = location.selector === "@editor-start"
        ? (root.firstElementChild as HTMLElement | null) || root
        : Array.from(root.querySelectorAll<HTMLElement>(location.selector))[location.index];
      if (!target) { setAccessibilityHighlight(null); return; }
      const targetRect = target.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setAccessibilitySpotlight({
        top: targetRect.top - rootRect.top + root.offsetTop,
        left: targetRect.left - rootRect.left + root.offsetLeft,
        width: Math.max(targetRect.width, 36),
        height: Math.max(targetRect.height, 28),
        label: location.label,
      });
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      removalTimer = window.setTimeout(() => { setAccessibilitySpotlight(null); setAccessibilityHighlight(null); }, 6000);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (removalTimer) window.clearTimeout(removalTimer);
    };
  }, [accessibilityHighlight, mode]);
  const runPreviewAudit = useCallback((announce = false, profileOverride?: LmsProfile) => {
    const canvas = editor.current;
    if (!canvas) return [] as PreviewAuditCheck[];
    const auditProfile = profileOverride || lmsProfile;
    const images = Array.from(canvas.querySelectorAll<HTMLImageElement>("img"));
    const tables = Array.from(canvas.querySelectorAll<HTMLTableElement>("table"));
    const headings = Array.from(canvas.querySelectorAll<HTMLElement>("h1,h2,h3,h4"));
    const headingLevels = headings.map((heading) => Number(heading.tagName.slice(1)));
    const headingHierarchyOk = headingLevels.every((level, index) => index === 0 || level <= headingLevels[index - 1] + 1);
    const sourceSynchronized = canvas.innerHTML === htmlRef.current;
    const wrappingCandidates = Array.from(canvas.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,li,a,blockquote,figcaption"));
    const textWraps = wrappingCandidates.every((element) => element.scrollWidth <= element.clientWidth + 2 || ["auto", "scroll"].includes(getComputedStyle(element).overflowX));
    const pageOverflow = canvas.scrollWidth > canvas.clientWidth + 2;
    const mediaContained = images.every((image) => image.clientWidth <= (image.parentElement?.clientWidth || canvas.clientWidth) + 2);
    const tablesScrollable = tables.every((table) => table.scrollWidth <= table.clientWidth + 2 || ["auto", "scroll"].includes(getComputedStyle(table).overflowX));
    const auditStage = document.createElement("div");
    auditStage.className = "responsive-audit-stage";
    document.body.appendChild(auditStage);
    const deviceResults: PreviewDeviceResult[] = ([
      ["desktop", "Desktop", 860],
      ["tablet", "Tablet", 720],
      ["mobile", "Mobile", 390],
    ] as const).map(([testedDevice, label, width]) => {
      const frame = document.createElement("div");
      frame.className = `device-frame ${testedDevice}`;
      frame.style.width = `${width}px`;
      frame.style.transition = "none";
      const clone = canvas.cloneNode(true) as HTMLDivElement;
      clone.removeAttribute("contenteditable");
      clone.removeAttribute("role");
      clone.removeAttribute("aria-label");
      clone.classList.remove("show-formatting-marks", "show-semantic-map", "image-drag-active");
      frame.appendChild(clone); auditStage.appendChild(frame);
      const pageFits = clone.scrollWidth <= clone.clientWidth + 2;
      const imagesFit = Array.from(clone.querySelectorAll<HTMLImageElement>("img")).every((image) => image.clientWidth <= (image.parentElement?.clientWidth || clone.clientWidth) + 2);
      const tablesFit = Array.from(clone.querySelectorAll<HTMLTableElement>("table")).every((table) => table.scrollWidth <= table.clientWidth + 2 || ["auto", "scroll"].includes(getComputedStyle(table).overflowX));
      const ok = pageFits && imagesFit && tablesFit;
      return { device: testedDevice, label, width, ok, detail: ok ? "Content, images, and tables fit." : "Review an element that exceeds this viewport." };
    });
    auditStage.remove();
    setPreviewDeviceResults(deviceResults);
    const matrixReady = deviceResults.every((result) => result.ok);
    const overflowingElements = Array.from(canvas.querySelectorAll<HTMLElement>("*:not(table)")).filter((element) => element.scrollWidth > element.clientWidth + 2 && !["auto", "scroll"].includes(getComputedStyle(element).overflowX));
    const overflowingElement = overflowingElements[0];
    const overflowingIndex = overflowingElement ? Array.from(canvas.querySelectorAll<HTMLElement>(overflowingElement.tagName.toLowerCase())).indexOf(overflowingElement) : -1;
    const mediaIssueIndex = images.findIndex((image) => image.clientWidth > (image.parentElement?.clientWidth || canvas.clientWidth) + 2);
    const packageAssetIssueIndex = images.findIndex((image) => !/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(image.getAttribute("src") || ""));
    const imageLoadIssueIndex = images.findIndex((image) => image.complete && image.naturalWidth === 0);
    const imageAlternativeIssueIndex = images.findIndex((image) => {
      const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true" || image.getAttribute("data-ultrapage-decorative") === "true";
      return (!decorative && !image.getAttribute("alt")?.trim()) || (decorative && Boolean(image.getAttribute("alt")?.trim()));
    });
    const decorativeSemanticsIssueIndex = images.findIndex((image) => {
      const declaredDecorative = image.getAttribute("data-ultrapage-decorative") === "true" || image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true";
      return declaredDecorative && !(image.getAttribute("alt") === "" && (image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true"));
    });
    const tableIssueIndex = tables.findIndex((table) => table.scrollWidth > table.clientWidth + 2 && !["auto", "scroll"].includes(getComputedStyle(table).overflowX));
    const tableKeyboardIssueIndex = tables.findIndex((table) => table.tabIndex < 0);
    const tableHeaders = Array.from(canvas.querySelectorAll<HTMLTableCellElement>("th"));
    const tableHeaderScopeIssueIndex = tableHeaders.findIndex((header) => !["col", "row", "colgroup", "rowgroup"].includes((header.getAttribute("scope") || "").toLowerCase()));
    const textIssueIndex = wrappingCandidates.findIndex((element) => element.scrollWidth > element.clientWidth + 2 && !["auto", "scroll"].includes(getComputedStyle(element).overflowX));
    const textIssue = textIssueIndex >= 0 ? wrappingCandidates[textIssueIndex] : null;
    const textIssueSelector = textIssue?.tagName.toLowerCase() || "p";
    const textIssueSelectorIndex = textIssue ? Array.from(canvas.querySelectorAll<HTMLElement>(textIssueSelector)).indexOf(textIssue) : 0;
    const contrastCandidates = Array.from(canvas.querySelectorAll<HTMLElement>("p,li,a,h1,h2,h3,h4,td,th,figcaption,blockquote")).filter((element) => Boolean(element.textContent?.trim()));
    const contrastIssueIndex = contrastCandidates.findIndex((element) => {
      const style = getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize) || 16;
      const fontWeight = Number.parseInt(style.fontWeight, 10) || (style.fontWeight === "bold" ? 700 : 400);
      const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      return computedContrastRatio(element, canvas) < (largeText ? 3 : 4.5);
    });
    const contrastIssue = contrastIssueIndex >= 0 ? contrastCandidates[contrastIssueIndex] : null;
    const contrastSelector = contrastIssue?.tagName.toLowerCase() || "p";
    const contrastSelectorIndex = contrastIssue ? Array.from(canvas.querySelectorAll<HTMLElement>(contrastSelector)).indexOf(contrastIssue) : 0;
    const smallTextCandidates = Array.from(canvas.querySelectorAll<HTMLElement>("p,li,a,td,th,figcaption,blockquote")).filter((element) => Boolean(element.textContent?.trim()));
    const smallTextIssueIndex = smallTextCandidates.findIndex((element) => (Number.parseFloat(getComputedStyle(element).fontSize) || 16) < 12);
    const smallTextIssue = smallTextIssueIndex >= 0 ? smallTextCandidates[smallTextIssueIndex] : null;
    const smallTextSelector = smallTextIssue?.tagName.toLowerCase() || "p";
    const smallTextSelectorIndex = smallTextIssue ? Array.from(canvas.querySelectorAll<HTMLElement>(smallTextSelector)).indexOf(smallTextIssue) : 0;
    const emptyStructureCandidates = Array.from(canvas.querySelectorAll<HTMLElement>("h1,h2,h3,h4,a,li,th,caption,figcaption")).filter((element) => !element.textContent?.trim() && !element.querySelector("img,svg,video,iframe"));
    const emptyStructureIssue = emptyStructureCandidates[0] || null;
    const emptyStructureSelector = emptyStructureIssue?.tagName.toLowerCase() || "h1";
    const emptyStructureSelectorIndex = emptyStructureIssue ? Array.from(canvas.querySelectorAll<HTMLElement>(emptyStructureSelector)).indexOf(emptyStructureIssue) : 0;
    const previewLinks = Array.from(canvas.querySelectorAll<HTMLAnchorElement>("a"));
    const brokenInternalLinkIndex = previewLinks.findIndex((link) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#") || href === "#") return false;
      let targetId = href.slice(1);
      try { targetId = decodeURIComponent(targetId); } catch { /* A malformed fragment is treated as missing. */ }
      return !Array.from(canvas.querySelectorAll<HTMLElement>("[id]")).some((target) => target.id === targetId);
    });
    const lmsAuditOutput = buildLmsHtml(canvas.innerHTML, documentLanguage, auditProfile);
    const lmsAuditDocument = new DOMParser().parseFromString(lmsAuditOutput, "text/html");
    const normalizeAuditText = (value: string | null | undefined) => (value || "").replace(/\s+/g, " ").trim();
    const semanticSelectors = ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "a", "img", "figure", "figcaption", "table", "caption", "thead", "tbody", "tr", "th", "td", "blockquote"];
    const lmsStructurePreserved = semanticSelectors.every((selector) => lmsAuditDocument.querySelectorAll(selector).length >= canvas.querySelectorAll(selector).length);
    const lmsTextPreserved = normalizeAuditText(lmsAuditDocument.body.textContent) === normalizeAuditText(canvas.textContent);
    const lmsParityReady = Boolean(lmsAuditOutput.trim()) && lmsStructurePreserved && lmsTextPreserved;
    const lmsImages = Array.from(lmsAuditDocument.querySelectorAll<HTMLImageElement>("img"));
    const lmsImageSemanticsReady = lmsImages.length === images.length && lmsImages.every((image) => {
      const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true";
      return decorative ? image.getAttribute("alt") === "" : Boolean(image.getAttribute("alt")?.trim());
    });
    const lmsMarkupClean = !lmsAuditDocument.querySelector("script,style,object,embed,form,input,button,[data-ultrapage-image-id],[data-ultrapage-alt-status],[data-ultrapage-selected],[data-ultrapage-decorative]");
    const checks: PreviewAuditCheck[] = [
      { ok: Boolean(canvas.textContent?.trim() || images.length || tables.length), label: "Content renders", detail: "The editable canvas contains visible content." },
      { ok: !pageOverflow, label: "No page overflow", detail: pageOverflow ? "An element extends beyond the simulated device width." : "Content remains inside the simulated viewport.", location: overflowingElement ? { selector: overflowingElement.tagName.toLowerCase(), index: Math.max(0, overflowingIndex), label: `Overflowing ${overflowingElement.tagName.toLowerCase()} element` } : undefined },
      { ok: mediaContained, label: "Responsive images", detail: images.length ? `${images.length} image${images.length === 1 ? " fits" : "s fit"} the content area.` : "No images require responsive testing.", location: mediaIssueIndex >= 0 ? { selector: "img", index: mediaIssueIndex, label: `Image ${mediaIssueIndex + 1}` } : undefined },
      { ok: imageLoadIssueIndex < 0, label: "Image rendering", detail: imageLoadIssueIndex < 0 ? (images.length ? "Every completed image request rendered successfully." : "No image resources require rendering checks.") : "An image source finished loading without producing a usable image.", location: imageLoadIssueIndex >= 0 ? { selector: "img", index: imageLoadIssueIndex, label: `Image ${imageLoadIssueIndex + 1} did not render` } : undefined },
      { ok: imageAlternativeIssueIndex < 0, label: "Image alternatives", detail: imageAlternativeIssueIndex < 0 ? (images.length ? "Every informative image has alt text and every decorative image has empty alt text." : "No images require alternative-text review.") : "An image needs meaningful alt text or an explicit decorative decision.", location: imageAlternativeIssueIndex >= 0 ? { selector: "img", index: imageAlternativeIssueIndex, label: `Image ${imageAlternativeIssueIndex + 1} needs accessibility review` } : undefined },
      { ok: decorativeSemanticsIssueIndex < 0, label: "Decorative image semantics", detail: decorativeSemanticsIssueIndex < 0 ? "Decorative images are hidden from assistive technology consistently." : "A decorative image has conflicting alt, role, or aria-hidden values.", location: decorativeSemanticsIssueIndex >= 0 ? { selector: "img", index: decorativeSemanticsIssueIndex, label: `Decorative image ${decorativeSemanticsIssueIndex + 1}` } : undefined },
      { ok: packageAssetIssueIndex < 0, label: "HTML package assets", detail: packageAssetIssueIndex < 0 ? "Images are embedded and can be extracted into the ZIP package." : "An external image will be downloaded during export; if its server blocks access, it will remain listed in manifest.json.", location: packageAssetIssueIndex >= 0 ? { selector: "img", index: packageAssetIssueIndex, label: `External image ${packageAssetIssueIndex + 1}` } : undefined },
      { ok: tablesScrollable, label: "Responsive tables", detail: tables.length ? `${tables.length} table${tables.length === 1 ? " remains contained or scrolls" : "s remain contained or scroll"} horizontally.` : "No tables require responsive testing.", location: tableIssueIndex >= 0 ? { selector: "table", index: tableIssueIndex, label: `Table ${tableIssueIndex + 1}` } : undefined },
      { ok: tableKeyboardIssueIndex < 0, label: "Keyboard-scrollable tables", detail: tableKeyboardIssueIndex < 0 ? (tables.length ? "Every table can receive keyboard focus for horizontal scrolling." : "No tables require keyboard scrolling.") : "A table cannot receive keyboard focus for horizontal scrolling.", location: tableKeyboardIssueIndex >= 0 ? { selector: "table", index: tableKeyboardIssueIndex, label: `Table ${tableKeyboardIssueIndex + 1} is not keyboard focusable` } : undefined },
      { ok: tableHeaderScopeIssueIndex < 0, label: "Table header associations", detail: tableHeaderScopeIssueIndex < 0 ? (tableHeaders.length ? "Every table header declares its row or column relationship." : "No table headers require association testing.") : "A table header is missing a valid scope attribute.", location: tableHeaderScopeIssueIndex >= 0 ? { selector: "th", index: tableHeaderScopeIssueIndex, label: `Table header ${tableHeaderScopeIssueIndex + 1} without row or column scope` } : undefined },
      { ok: matrixReady, label: "Responsive device matrix", detail: matrixReady ? "Desktop, Tablet, and Mobile passed simultaneously." : "At least one simulated viewport requires review." },
      { ok: headings.length === 0 || headings[0].tagName === "H1", label: "Preview structure", detail: headings.length ? `${headings.length} heading${headings.length === 1 ? "" : "s"} detected; the first is ${headings[0].tagName}.` : "No headings are present yet.", location: headings.length && headings[0].tagName !== "H1" ? { selector: "h1,h2,h3,h4", index: 0, label: "First heading" } : undefined },
      { ok: headingHierarchyOk, label: "Heading hierarchy", detail: headingHierarchyOk ? "Heading levels progress without skipped levels." : "A heading level is skipped; adjust the document outline.", location: !headingHierarchyOk ? { selector: "h1,h2,h3,h4", index: Math.max(0, headingLevels.findIndex((level, index) => index > 0 && level > headingLevels[index - 1] + 1)), label: "Skipped heading level" } : undefined },
      { ok: sourceSynchronized, label: "Design and HTML synchronized", detail: sourceSynchronized ? "The Design canvas matches the current editable HTML source." : "Refresh the Design canvas before publishing." },
      { ok: textWraps, label: "Text and links wrap", detail: textWraps ? "Paragraphs, headings, list items, and links remain inside the content area." : "A long text or link requires wrapping review.", location: !textWraps ? { selector: textIssueSelector, index: Math.max(0, textIssueSelectorIndex), label: `Non-wrapping ${textIssueSelector} element` } : undefined },
      { ok: contrastIssueIndex < 0, label: "Readable color contrast", detail: contrastIssue ? `${contrastSelector.toUpperCase()} text does not meet the WCAG contrast threshold.` : "Visible text meets WCAG AA contrast thresholds.", location: contrastIssue ? { selector: contrastSelector, index: Math.max(0, contrastSelectorIndex), label: `Low-contrast ${contrastSelector} element` } : undefined },
      { ok: smallTextIssueIndex < 0, label: "Readable text size", detail: smallTextIssue ? `${smallTextSelector.toUpperCase()} text is smaller than 12 px.` : "Body text remains at or above the 12 px minimum.", location: smallTextIssue ? { selector: smallTextSelector, index: Math.max(0, smallTextSelectorIndex), label: `Small ${smallTextSelector} text` } : undefined },
      { ok: emptyStructureCandidates.length === 0, label: "No empty semantic elements", detail: emptyStructureIssue ? `An empty ${emptyStructureSelector.toUpperCase()} can create confusing navigation or reading pauses.` : "Headings, links, list items, and labels contain meaningful content.", location: emptyStructureIssue ? { selector: emptyStructureSelector, index: Math.max(0, emptyStructureSelectorIndex), label: `Empty ${emptyStructureSelector} element` } : undefined },
      { ok: brokenInternalLinkIndex < 0, label: "Internal links resolve", detail: brokenInternalLinkIndex < 0 ? "Every table-of-contents and same-page link points to an existing element." : "An internal link points to an ID that does not exist in the document.", location: brokenInternalLinkIndex >= 0 ? { selector: "a", index: brokenInternalLinkIndex, label: `Broken internal link ${brokenInternalLinkIndex + 1}` } : undefined },
      { ok: lmsParityReady, label: "LMS content parity", detail: lmsParityReady ? `Text and semantic elements are preserved in ${lmsProfiles[auditProfile].shortLabel} HTML.` : `The ${lmsProfiles[auditProfile].shortLabel} conversion changes visible text or removes a semantic element.` },
      { ok: lmsImageSemanticsReady, label: "LMS image accessibility parity", detail: lmsImageSemanticsReady ? `Alt text and decorative decisions survive the ${lmsProfiles[auditProfile].shortLabel} conversion.` : `An image loses or conflicts with its accessibility decision in ${lmsProfiles[auditProfile].shortLabel} output.`, location: !lmsImageSemanticsReady && images.length ? { selector: "img", index: 0, label: "First image requiring LMS parity review" } : undefined },
      { ok: lmsMarkupClean, label: `${lmsProfiles[auditProfile].shortLabel} markup hygiene`, detail: lmsMarkupClean ? "Unsafe elements and editor-only metadata are absent from the LMS output." : "The generated LMS fragment contains an unsafe element or editor-only metadata." },
      { ok: Boolean(lmsAuditOutput.trim()), label: `${lmsProfiles[auditProfile].shortLabel} output`, detail: "The current design produces portable LMS HTML." },
    ];
    setPreviewAuditChecks(checks);
    setPreviewIssueCursor(-1);
    setPreviewAuditTime(new Intl.DateTimeFormat(documentLanguage, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date()));
    if (announce) {
      const passed = checks.filter((check) => check.ok).length;
      setSidePanelTab("preview");
      setRightPanel(true);
      toast[passed === checks.length ? "success" : "warning"](`Preview audit: ${passed}/${checks.length} checks passed`);
    }
    return checks;
  }, [documentLanguage, lmsProfile]);
  useEffect(() => {
    if (mode !== "visual") return;
    const frame = window.requestAnimationFrame(() => runPreviewAudit(false));
    return () => window.cancelAnimationFrame(frame);
  }, [html, device, zoom, mode, showRulers, showMarginGuides, pageSetup, runPreviewAudit]);
  const organizeSourceHtml = () => {
    if (codeView !== "source") { toast.info("Switch to Edit Source to organize the editable HTML"); return; }
    const organized = formatHtmlFragment(html);
    htmlRef.current = organized;
    setHtml(organized);
    setSaved(false);
    toast.success("HTML tags organized", { description: "Structure and indentation were normalized without changing inline content." });
  };
  const updateSourceCode = (nextHtml: string, caret?: number) => {
    htmlRef.current = nextHtml;
    setHtml(nextHtml);
    setSaved(false);
    if (typeof caret === "number") window.requestAnimationFrame(() => {
      codeEditor.current?.focus();
      codeEditor.current?.setSelectionRange(caret, caret);
      setCodeCaret(caret);
    });
  };
  const insertHtmlSnippet = (snippet: string) => {
    if (codeView !== "source") { toast.info("Switch to Edit Source to insert HTML"); return; }
    const target = codeEditor.current;
    const start = target?.selectionStart ?? html.length;
    const end = target?.selectionEnd ?? start;
    const lineStart = html.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const indentation = html.slice(lineStart, start).match(/^\s*/)?.[0] || "";
    const prepared = snippet.split("\n").map((line, index) => index ? `${indentation}${line}` : line).join("\n");
    updateSourceCode(`${html.slice(0, start)}${prepared}${html.slice(end)}`, start + prepared.length);
  };
  const validateHtmlSource = () => {
    const diagnostics = htmlDiagnostics;
    const errors = diagnostics.filter((item) => item.severity === "error").length;
    const warnings = diagnostics.length - errors;
    setShowCodeDiagnostics(true);
    if (codeWorkspace === "live") setCodeWorkspace("split");
    toast[errors ? "error" : warnings ? "warning" : "success"](errors || warnings ? `HTML validation: ${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}` : "HTML validation passed", { description: errors || warnings ? "Select a diagnostic to move to its exact line and column." : "Tags are balanced and the source passed the built-in LMS safety checks." });
  };
  const goToCodeLocation = (offset: number, length = 0, sourceOverride?: string) => {
    if (codeWorkspace === "live") setCodeWorkspace("split");
    const reveal = (attempt = 0) => window.requestAnimationFrame(() => {
      const target = codeEditor.current;
      if (!target) {
        if (attempt < 3) reveal(attempt + 1);
        return;
      }
      target.focus();
      target.setSelectionRange(offset, offset + length);
      setCodeCaret(offset);
      const position = sourcePosition(sourceOverride ?? activeCode, offset);
      const lineHeight = Number.parseFloat(window.getComputedStyle(target).lineHeight) || 23.1;
      target.scrollTop = Math.max(0, (position.line - 3) * lineHeight);
      if (!codeWrapEnabled) target.scrollLeft = Math.max(0, (position.column - 4) * 8.4);
      if (codeLineNumbers.current) codeLineNumbers.current.scrollTop = target.scrollTop;
      if (codeHighlightLayer.current) {
        codeHighlightLayer.current.scrollTop = target.scrollTop;
        codeHighlightLayer.current.scrollLeft = target.scrollLeft;
      }
    });
    reveal();
  };
  const clearLiveSelection = () => {
    livePreviewFrame.current?.contentDocument?.querySelectorAll('[data-ultrapage-live-selected="true"]').forEach((element) => element.removeAttribute("data-ultrapage-live-selected"));
    setLiveSelection(null);
  };
  const locateLiveSelection = () => {
    if (!liveSelection) { toast.info("Select text or an element in Live Preview first"); return; }
    goToCodeLocation(liveSelection.offset, liveSelection.length);
  };
  const connectLiveSelection = (frame: HTMLIFrameElement) => {
    livePreviewFrame.current = frame;
    const document = frame.contentDocument;
    if (!document) return;
    const previewRoot = codeView === "source" ? document.querySelector<HTMLElement>("main.ultra-page") : document.body;
    if (!previewRoot) return;
    const synchronize = (element: Element, selectedText = "") => {
      if (element === previewRoot || !previewRoot.contains(element)) return;
      const tag = element.tagName.toLowerCase();
      const peers = Array.from(previewRoot.querySelectorAll(tag));
      const ordinal = peers.indexOf(element);
      if (ordinal < 0) return;
      const sourceMatch = findOpeningTagByOrdinal(activeCode, tag, ordinal);
      if (!sourceMatch) {
        toast.warning("The Live element could not be matched to the current HTML source", { description: "Validate or format the HTML, then try again." });
        return;
      }
      document.querySelectorAll('[data-ultrapage-live-selected="true"]').forEach((selected) => selected.removeAttribute("data-ultrapage-live-selected"));
      element.setAttribute("data-ultrapage-live-selected", "true");
      const normalizedSelection = selectedText.replace(/\s+/g, " ").trim().slice(0, 512);
      const codeMatch = findTextWithinElement(activeCode, sourceMatch, tag, normalizedSelection) || sourceMatch;
      const imageAlternative = tag === "img" ? element.getAttribute("alt") || "" : "";
      const compactText = normalizedSelection || imageAlternative || element.textContent?.replace(/\s+/g, " ").trim() || "";
      const label = compactText ? `${tag} · ${compactText.slice(0, 58)}${compactText.length > 58 ? "…" : ""}` : tag;
      const position = sourcePosition(activeCode, codeMatch.offset);
      setLiveSelection({ tag, ordinal, offset: codeMatch.offset, length: codeMatch.length, line: position.line, column: position.column, label, selectedText: normalizedSelection || undefined });
      goToCodeLocation(codeMatch.offset, codeMatch.length);
    };
    document.addEventListener("mouseup", () => {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed || !selection.anchorNode) return;
      const commonAncestor = selection.rangeCount ? selection.getRangeAt(0).commonAncestorContainer : selection.anchorNode;
      const element = commonAncestor.nodeType === 1 ? commonAncestor as Element : commonAncestor.parentElement;
      if (element) synchronize(element, selection.toString());
    });
    let selectionFrame = 0;
    document.addEventListener("selectionchange", () => {
      window.cancelAnimationFrame(selectionFrame);
      selectionFrame = window.requestAnimationFrame(() => {
        const selection = document.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) return;
        const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;
        const element = commonAncestor.nodeType === 1 ? commonAncestor as Element : commonAncestor.parentElement;
        if (element) synchronize(element, selection.toString());
      });
    });
    document.addEventListener("click", (event) => {
      const target = event.target && (event.target as Node).nodeType === 1 ? event.target as Element : null;
      if (!target || document.getSelection()?.toString().trim()) return;
      synchronize(target);
    });
    document.addEventListener("focusin", (event) => {
      const target = event.target && (event.target as Node).nodeType === 1 ? event.target as Element : null;
      if (target && target !== document.body) synchronize(target);
    });
    if (liveSelection) {
      const previousMatch = previewRoot.querySelectorAll(liveSelection.tag)[liveSelection.ordinal];
      if (previousMatch) {
        previousMatch.setAttribute("data-ultrapage-live-selected", "true");
        previousMatch.scrollIntoView({ block: "center", inline: "nearest" });
      }
    }
  };
  const handleCodeKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (codeView !== "source") return;
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey && start === end && html.slice(Math.max(0, start - 2), start) === "  ") {
        updateSourceCode(`${html.slice(0, start - 2)}${html.slice(end)}`, start - 2);
      } else {
        updateSourceCode(`${html.slice(0, start)}  ${html.slice(start, end)}${html.slice(end)}`, start + 2);
      }
      return;
    }
    if (event.key === ">" && start === end) {
      const pendingTag = html.slice(0, start).match(/<([a-z][\w:-]*)(?:\s[^<>]*)?$/i)?.[1];
      if (pendingTag && !HTML_VOID_ELEMENTS.has(pendingTag.toUpperCase())) {
        event.preventDefault();
        const insertion = `></${pendingTag}>`;
        updateSourceCode(`${html.slice(0, start)}${insertion}${html.slice(end)}`, start + 1);
        return;
      }
    }
    if (event.key !== "Enter" || start !== end) return;
    event.preventDefault();
    const beforeCaret = html.slice(0, start);
    const afterCaret = html.slice(end);
    const currentLine = beforeCaret.slice(beforeCaret.lastIndexOf("\n") + 1);
    const baseIndent = currentLine.match(/^\s*/)?.[0] || "";
    const opening = currentLine.trim().match(/^<([a-z][\w:-]*)(?:\s[^>]*)?>$/i)?.[1]?.toUpperCase();
    const nestedIndent = opening && !HTML_VOID_ELEMENTS.has(opening) ? `${baseIndent}  ` : baseIndent;
    const beforeClosingTag = /^\s*<\//.test(afterCaret);
    const insertion = beforeClosingTag && nestedIndent !== baseIndent ? `\n${nestedIndent}\n${baseIndent}` : `\n${nestedIndent}`;
    updateSourceCode(`${beforeCaret}${insertion}${afterCaret}`, start + 1 + nestedIndent.length);
  };
  const changeMode = (value: string) => {
    const nextMode = value as "visual" | "ultra" | "html";
    if (mode === "visual" && editor.current) {
      setAccessibilityHighlight(null);
      setAccessibilitySpotlight(null);
      applyAutomaticFirstLineIndentation(editor.current, documentLanguage);
      applyPreviewKeyboardSemantics(editor.current);
      const currentHtml = editor.current.innerHTML;
      htmlRef.current = currentHtml;
      setHtml(currentHtml);
    }
    if (nextMode === "html" && codeView === "source") {
      const organized = formatHtmlFragment(htmlRef.current);
      htmlRef.current = organized;
      setHtml(organized);
    }
    setMode(nextMode);
  };
  useEffect(() => { if (mode !== "visual") setLmsHtml(buildLmsHtml(html, documentLanguage, lmsProfile)); }, [html, mode, documentLanguage, lmsProfile]);
  const updateActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"), subscript: document.queryCommandState("subscript"), superscript: document.queryCommandState("superscript"),
        unorderedList: document.queryCommandState("insertUnorderedList"), orderedList: document.queryCommandState("insertOrderedList"),
        alignLeft: document.queryCommandState("justifyLeft"), alignCenter: document.queryCommandState("justifyCenter"), alignRight: document.queryCommandState("justifyRight"), alignJustify: document.queryCommandState("justifyFull"),
      });
      const block = String(document.queryCommandValue("formatBlock") || "p").replace(/[<>]/g, "").toLowerCase();
      setActiveBlock(block || "p");
    } catch { /* Browser does not expose the current formatting state. */ }
  };
  useEffect(() => {
    const rememberSelection = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || !editor.current) return;
      const range = selection.getRangeAt(0);
      if (editor.current.contains(range.commonAncestorContainer)) {
        savedSelection.current = range.cloneRange(); updateActiveFormats();
        const fullySelectedNode = range.startContainer === range.endContainer && range.startContainer.nodeType === Node.ELEMENT_NODE && range.endOffset === range.startOffset + 1
          ? range.startContainer.childNodes[range.startOffset]
          : null;
        const selectedElement = fullySelectedNode instanceof HTMLElement ? fullySelectedNode : null;
        const node = selectedElement || (range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer as HTMLElement);
        const context = node?.closest("table") ? "table" : node?.matches("img") || node?.closest("figure")?.querySelector("img") || node?.closest("img") ? "picture" : node?.closest("a") ? "link" : null;
        setSelectionContext(context);
        setRibbonTab((current) => (current === "table" && context !== "table") || (current === "picture" && context !== "picture") || (current === "link" && context !== "link") ? "home" : current);
      }
    };
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);
  const selectEditorContext = (element: HTMLElement, context: "table" | "picture" | "link", selectWholeElement = false) => {
    if (!editor.current?.contains(element)) return;
    editor.current.querySelectorAll("img[data-ultrapage-selected]").forEach((image) => image.removeAttribute("data-ultrapage-selected"));
    if (context === "picture") {
      const image = element.matches("img") ? element as HTMLImageElement : element.querySelector<HTMLImageElement>("img");
      if (image) {
        selectedImageRef.current = image;
        image.setAttribute("data-ultrapage-selected", "true");
        const images = Array.from(editor.current.querySelectorAll<HTMLImageElement>("img"));
        const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true" || image.getAttribute("data-ultrapage-decorative") === "true";
        setSelectedImageSummary({ index: Math.max(0, images.indexOf(image)) + 1, total: images.length, status: decorative ? "decorative" : image.getAttribute("alt")?.trim() ? "described" : "needs-alt" });
      }
    } else {
      selectedImageRef.current = null;
      setSelectedImageSummary(null);
    }
    const range = document.createRange();
    if (selectWholeElement) range.selectNode(element);
    else { range.selectNodeContents(element); range.collapse(true); }
    const selection = window.getSelection();
    selection?.removeAllRanges(); selection?.addRange(range);
    savedSelection.current = range.cloneRange();
    setSelectionContext(context);
    setRibbonTab(context);
    setRibbonCollapsed(false);
  };
  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || !editor.current) return;
    const image = target.closest<HTMLImageElement>("img");
    if (image && editor.current.contains(image)) { selectEditorContext(image, "picture", true); return; }
    const cell = target.closest<HTMLTableCellElement>("th,td");
    if (cell && editor.current.contains(cell)) { selectEditorContext(cell, "table"); return; }
    const link = target.closest<HTMLAnchorElement>("a");
    if (link && editor.current.contains(link)) { event.preventDefault(); selectEditorContext(link, "link"); }
  };
  const inspectDesignSelectionInHtml = () => {
    const root = editor.current;
    const range = savedSelection.current;
    if (!root || !range || !root.contains(range.commonAncestorContainer)) {
      toast.info("Select text, an image, a link, or a table cell in Design Preview first");
      return;
    }
    const fullySelectedNode = range.startContainer === range.endContainer && range.startContainer.nodeType === Node.ELEMENT_NODE && range.endOffset === range.startOffset + 1
      ? range.startContainer.childNodes[range.startOffset]
      : null;
    const selectedElement = fullySelectedNode instanceof HTMLElement ? fullySelectedNode : null;
    const candidate = selectedElement || (range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer as HTMLElement);
    if (!candidate || candidate === root) {
      toast.info("Select a specific element or text inside Design Preview");
      return;
    }
    const tag = candidate.tagName.toLowerCase();
    const ordinal = Array.from(root.querySelectorAll(tag)).indexOf(candidate);
    if (ordinal < 0) {
      toast.error("The selected Design element could not be mapped to HTML");
      return;
    }
    applyAutomaticFirstLineIndentation(root, documentLanguage);
    applyPreviewKeyboardSemantics(root);
    const organized = formatHtmlFragment(root.innerHTML);
    const sourceMatch = findOpeningTagByOrdinal(organized, tag, ordinal);
    if (!sourceMatch) {
      toast.warning("The selected Design element could not be located in the organized HTML", { description: "Validate the source and try again." });
      return;
    }
    const selectedText = range.toString().replace(/\s+/g, " ").trim().slice(0, 512);
    const imageAlternative = tag === "img" ? candidate.getAttribute("alt") || "" : "";
    const codeMatch = findTextWithinElement(organized, sourceMatch, tag, selectedText) || sourceMatch;
    const compactText = selectedText || imageAlternative || candidate.textContent?.replace(/\s+/g, " ").trim() || "";
    const label = compactText ? `${tag} · ${compactText.slice(0, 58)}${compactText.length > 58 ? "…" : ""}` : tag;
    const position = sourcePosition(organized, codeMatch.offset);
    htmlRef.current = organized;
    setHtml(organized);
    setCodeView("source");
    setCodeWorkspace("split");
    setLiveSelection({ tag, ordinal, offset: codeMatch.offset, length: codeMatch.length, line: position.line, column: position.column, label, selectedText: selectedText || undefined });
    setMode("html");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => goToCodeLocation(codeMatch.offset, codeMatch.length, organized)));
    toast.success(`Design selection located in HTML at line ${position.line}`, { description: selectedText ? "The matching text is highlighted in Split view." : `<${tag}> is highlighted in Split view.` });
  };
  const openHtmlSplit = () => {
    setCodeView("source");
    setCodeWorkspace("split");
    changeMode("html");
  };
  const command = (name: string, value?: string) => {
    if (!editor.current) return;
    editor.current.focus();
    const selection = window.getSelection();
    if (selection && savedSelection.current) { selection.removeAllRanges(); selection.addRange(savedSelection.current); }
    document.execCommand(name, false, value);
    updateActiveFormats();
    applyAutomaticFirstLineIndentation(editor.current, documentLanguage);
    applyPreviewKeyboardSemantics(editor.current);
    htmlRef.current = editor.current.innerHTML;
    setHtml(editor.current.innerHTML); setSaved(false);
    if (selection?.rangeCount) savedSelection.current = selection.getRangeAt(0).cloneRange();
    editor.current.focus();
  };
  const applyFont = (fontName: string) => { if (!fontName) return; command("fontName", fontName); };
  const applyFontSize = (pixels: string) => {
    if (!pixels || !editor.current) return;
    editor.current.focus();
    document.execCommand("fontSize", false, "7");
    const numericSize = Number(pixels);
    const legacySize = numericSize <= 10 ? "2" : numericSize <= 16 ? "3" : numericSize <= 18 ? "4" : numericSize <= 24 ? "5" : numericSize <= 32 ? "6" : "7";
    editor.current.querySelectorAll<HTMLElement>('font[size="7"]:not([data-ultrapage-size])').forEach((element) => {
      element.style.fontSize = `${numericSize}px`;
      element.setAttribute("size", legacySize);
      element.setAttribute("data-ultrapage-size", pixels);
    });
    setHtml(editor.current.innerHTML); setSaved(false); editor.current.focus();
  };
  const selectedBlocks = () => {
    if (!editor.current) return { targets: [] as HTMLElement[], range: null as Range | null };
    const selection = window.getSelection();
    const range = savedSelection.current;
    editor.current.focus();
    if (selection && range) { selection.removeAllRanges(); selection.addRange(range); }
    const activeRange = selection?.rangeCount ? selection.getRangeAt(0) : range;
    const blockSelector = "p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,td,th";
    const semanticBlocks = Array.from(editor.current.querySelectorAll<HTMLElement>(blockSelector));
    const directDivs = Array.from(editor.current.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element.tagName === "DIV" && !element.classList.contains("ultrapage-watermark"));
    const blocks = [...semanticBlocks, ...directDivs];
    let targets = activeRange ? blocks.filter((block) => { try { return activeRange.intersectsNode(block); } catch { return false; } }) : [];
    targets = targets.filter((block) => !targets.some((candidate) => candidate !== block && block.contains(candidate)));
    if (!targets.length && activeRange) {
      const node = activeRange.startContainer.nodeType === Node.TEXT_NODE ? activeRange.startContainer.parentElement : activeRange.startContainer as HTMLElement;
      const closest = node?.closest<HTMLElement>(`${blockSelector},div`);
      if (closest && closest !== editor.current && editor.current.contains(closest) && !closest.classList.contains("ultrapage-watermark")) targets = [closest];
    }
    return { targets, range: activeRange || null };
  };
  const pastePlainText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { toast.info("The clipboard does not contain text"); return; }
      command("insertText", text);
      toast.success("Text pasted without formatting");
    } catch { toast.error("Clipboard access was blocked", { description: "Use Ctrl+Shift+V or Command+Shift+V to paste plain text." }); }
  };
  const useFormatPainter = () => {
    if (!editor.current) return;
    if (!capturedFormat) {
      const range = savedSelection.current;
      const node = range?.startContainer;
      const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement | undefined;
      if (!element || !editor.current.contains(element)) { toast.info("Select formatted text first"); return; }
      const style = window.getComputedStyle(element);
      setCapturedFormat({ fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, fontStyle: style.fontStyle, textDecorationLine: style.textDecorationLine, color: style.color, backgroundColor: style.backgroundColor, lineHeight: style.lineHeight, textAlign: style.textAlign });
      toast.success("Formatting captured", { description: "Select the destination paragraph and choose Format Painter again." });
      return;
    }
    const { targets, range } = selectedBlocks();
    if (!targets.length) { toast.info("Select the destination paragraph"); return; }
    targets.forEach((block) => {
      block.style.fontFamily = capturedFormat.fontFamily; block.style.fontSize = capturedFormat.fontSize; block.style.fontWeight = capturedFormat.fontWeight;
      block.style.fontStyle = capturedFormat.fontStyle; block.style.textDecorationLine = capturedFormat.textDecorationLine; block.style.color = capturedFormat.color;
      block.style.backgroundColor = capturedFormat.backgroundColor; block.style.lineHeight = capturedFormat.lineHeight; block.style.textAlign = capturedFormat.textAlign;
    });
    setHtml(editor.current.innerHTML); setSaved(false); savedSelection.current = range?.cloneRange() || null; setCapturedFormat(null);
    toast.success("Formatting applied");
  };
  const applyLineSpacing = (spacing: string) => {
    if (!spacing || !editor.current) return;
    const { targets, range } = selectedBlocks();
    if (!targets.length) { toast.info("Select the text you want to modify"); return; }
    targets.forEach((block) => { block.style.lineHeight = spacing; });
    setHtml(editor.current.innerHTML); setSaved(false);
    savedSelection.current = range?.cloneRange() || null;
  };
  const applyIndentation = (indentation: string) => {
    if (!indentation || !editor.current) return;
    const { targets, range } = selectedBlocks();
    if (!targets.length) { toast.info("Select the paragraph you want to modify"); return; }
    targets.forEach((block) => {
      block.style.marginLeft = "";
      block.style.paddingLeft = "";
      block.style.textIndent = "";
      if (block.tagName === "P") block.setAttribute(AUTO_INDENT_ATTRIBUTE, "off");
      if (indentation === "first-line") block.style.textIndent = "48px";
      if (indentation === "left") block.style.marginLeft = "48px";
      if (indentation === "hanging") { block.style.paddingLeft = "48px"; block.style.textIndent = "-48px"; }
    });
    setHtml(editor.current.innerHTML); setSaved(false);
    savedSelection.current = range?.cloneRange() || null;
  };
  const applyParagraphSpacing = (spacing: string) => {
    if (!editor.current) return;
    const { targets, range } = selectedBlocks();
    if (!targets.length) { toast.info("Select the paragraphs you want to modify"); return; }
    targets.forEach((block) => { block.style.marginBottom = spacing === "default" ? "" : `${Number(spacing)}px`; });
    setHtml(editor.current.innerHTML); setSaved(false);
    savedSelection.current = range?.cloneRange() || null;
  };
  const clearFormatting = () => {
    if (!editor.current) return;
    const { targets, range } = selectedBlocks();
    const selection = window.getSelection();
    editor.current.focus();
    if (selection && range) { selection.removeAllRanges(); selection.addRange(range); }
    document.execCommand("removeFormat", false);
    targets.forEach((block) => {
      block.removeAttribute("style"); block.removeAttribute("class"); block.removeAttribute("align");
      if (block.tagName === "P") block.setAttribute(AUTO_INDENT_ATTRIBUTE, "off");
      block.querySelectorAll<HTMLElement>("*").forEach((element) => {
        element.removeAttribute("style"); element.removeAttribute("class"); element.removeAttribute("align");
        element.removeAttribute("face"); element.removeAttribute("color"); element.removeAttribute("size");
        element.removeAttribute("data-ultrapage-size");
      });
      block.querySelectorAll("font,span,b,strong,i,em,u,s").forEach((element) => element.replaceWith(...Array.from(element.childNodes)));
    });
    setHtml(editor.current.innerHTML); setSaved(false);
    savedSelection.current = range?.cloneRange() || null;
    toast.success("Formato eliminado");
  };
  const selectedTableContext = () => {
    if (!editor.current || !savedSelection.current) return null;
    const container = savedSelection.current.startContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
    const table = element?.closest<HTMLTableElement>("table");
    if (!table || !editor.current.contains(table)) return null;
    return {
      table,
      row: element?.closest<HTMLTableRowElement>("tr") || null,
      cell: element?.closest<HTMLTableCellElement>("th,td") || null,
    };
  };
  const editSelectedTable = (action: "add-row" | "delete-row" | "add-column" | "delete-column" | "grid" | "apa7") => {
    if (!editor.current) return false;
    const context = selectedTableContext();
    if (!context) { toast.error("Select a table cell first"); return false; }
    const { table, row, cell } = context;
    let nextCell: HTMLTableCellElement | null = cell;
    if (action === "add-row") {
      const columnCount = table.rows[0]?.cells.length || 1;
      const body = table.tBodies[0] || table.createTBody();
      const newRow = body.insertRow(row && row.parentElement === body ? row.sectionRowIndex + 1 : -1);
      Array.from({ length: columnCount }, () => { const newCell = newRow.insertCell(); newCell.textContent = "Data"; });
      nextCell = newRow.cells[Math.min(cell?.cellIndex ?? 0, newRow.cells.length - 1)] || null;
    }
    if (action === "delete-row") {
      const target = row && row.parentElement?.tagName.toLowerCase() === "tbody" ? row : table.tBodies[0]?.rows[table.tBodies[0].rows.length - 1];
      if (!target) { toast.error("La fila de encabezado no se puede eliminar"); return false; }
      const body = target.parentElement as HTMLTableSectionElement;
      if (body.rows.length <= 1) { toast.error("La tabla debe conservar al menos una fila de datos"); return false; }
      const nextRowIndex = Math.max(0, target.sectionRowIndex - 1);
      target.remove();
      const remainingRow = body.rows[Math.min(nextRowIndex, body.rows.length - 1)];
      nextCell = remainingRow?.cells[Math.min(cell?.cellIndex ?? 0, remainingRow.cells.length - 1)] || null;
    }
    if (action === "add-column") {
      const insertAfter = cell?.cellIndex ?? ((table.rows[0]?.cells.length || 1) - 1);
      Array.from(table.rows).forEach((tableRow) => {
        const newCell = tableRow.insertCell(Math.min(insertAfter + 1, tableRow.cells.length));
        if (tableRow.parentElement?.tagName.toLowerCase() === "thead") {
          const heading = document.createElement("th"); heading.scope = "col"; heading.textContent = `Header ${tableRow.cells.length}`; newCell.replaceWith(heading);
        } else newCell.textContent = "Data";
      });
      nextCell = row?.cells[Math.min(insertAfter + 1, (row?.cells.length || 1) - 1)] || table.rows[0]?.cells[Math.min(insertAfter + 1, (table.rows[0]?.cells.length || 1) - 1)] || null;
    }
    if (action === "delete-column") {
      if ((table.rows[0]?.cells.length || 0) <= 1) { toast.error("La tabla debe conservar al menos una columna"); return false; }
      const index = cell?.cellIndex ?? ((table.rows[0]?.cells.length || 1) - 1);
      Array.from(table.rows).forEach((tableRow) => { if (tableRow.cells[index]) tableRow.deleteCell(index); });
      const targetRow = row && table.contains(row) ? row : table.rows[0];
      nextCell = targetRow?.cells[Math.min(index, (targetRow?.cells.length || 1) - 1)] || null;
    }
    if (action === "grid" || action === "apa7") table.setAttribute("data-table-style", action);
    if (nextCell && table.contains(nextCell)) {
      const nextRange = document.createRange(); nextRange.selectNodeContents(nextCell); nextRange.collapse(true);
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(nextRange);
      savedSelection.current = nextRange.cloneRange();
    }
    setSelectionContext("table"); setRibbonTab("table");
    setHtml(editor.current.innerHTML); setSaved(false);
    toast.success("Table updated");
    return true;
  };
  const applyWatermark = ({ text, color, opacity, size, angle }: { text: string; color: string; opacity: number; size: number; angle: number }) => {
    if (!editor.current) return;
    editor.current.querySelector(".ultrapage-watermark")?.remove();
    const watermark = document.createElement("div");
    watermark.className = "ultrapage-watermark";
    watermark.setAttribute("contenteditable", "false");
    watermark.setAttribute("aria-hidden", "true");
    watermark.textContent = text.trim() || "BORRADOR";
    watermark.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(${angle}deg);color:${color};opacity:${opacity};font-size:${size}px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:.12em;white-space:nowrap;pointer-events:none;user-select:none;z-index:0`;
    editor.current.prepend(watermark);
    setHtml(editor.current.innerHTML); setSaved(false);
    toast.success("Watermark aplicada");
  };
  const removeWatermark = () => {
    if (!editor.current) return;
    const watermark = editor.current.querySelector(".ultrapage-watermark");
    if (!watermark) { toast.info("El documento no tiene una marca de agua"); return; }
    watermark.remove(); setHtml(editor.current.innerHTML); setSaved(false); toast.success("Watermark eliminada");
  };
  const insertAccessibleLink = ({ text, url, newTab }: { text: string; url: string; newTab: boolean }) => {
    const cleanUrl = url.trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(cleanUrl)) { toast.error("Use a valid address beginning with https://"); return false; }
    const label = text.trim() || cleanUrl;
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    command("insertHTML", `<a href="${escapeHtml(cleanUrl)}"${target}>${escapeHtml(label)}</a>`);
    toast.success("Enlace accesible insertado");
    return true;
  };
  const selectedLinkContext = () => {
    if (!editor.current || !savedSelection.current) return null;
    const container = savedSelection.current.startContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
    const link = element?.closest<HTMLAnchorElement>("a");
    return link && editor.current.contains(link) ? link : null;
  };
  const getSelectedLinkData = (): SelectedLinkData | null => {
    const link = selectedLinkContext();
    return link ? { text: link.textContent || "", url: link.getAttribute("href") || "", newTab: link.getAttribute("target") === "_blank" } : null;
  };
  const updateSelectedLink = ({ text, url, newTab }: SelectedLinkData) => {
    if (!editor.current) return false;
    const link = selectedLinkContext();
    const cleanUrl = url.trim();
    if (!link) { toast.error("Select a link first"); return false; }
    if (!text.trim()) { toast.error("Enter descriptive link text"); return false; }
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(cleanUrl)) { toast.error("Use a valid address beginning with https://"); return false; }
    link.textContent = text.trim(); link.setAttribute("href", cleanUrl);
    if (newTab) { link.setAttribute("target", "_blank"); link.setAttribute("rel", "noopener noreferrer"); }
    else { link.removeAttribute("target"); link.removeAttribute("rel"); }
    setHtml(editor.current.innerHTML); setSaved(false); toast.success("Link properties updated"); return true;
  };
  const copySelectedLinkAddress = async () => {
    const link = selectedLinkContext();
    if (!link) { toast.error("Select a link first"); return; }
    try { await navigator.clipboard.writeText(link.href); toast.success("Link address copied"); }
    catch { toast.error("Clipboard access was blocked"); }
  };
  const openSelectedLink = () => {
    const link = selectedLinkContext();
    if (!link) { toast.error("Select a link first"); return; }
    window.open(link.href, "_blank", "noopener,noreferrer");
  };
  const removeSelectedLink = () => {
    if (!editor.current) return;
    const link = selectedLinkContext();
    if (!link) { toast.error("Select a link first"); return; }
    link.replaceWith(...Array.from(link.childNodes)); setHtml(editor.current.innerHTML); setSaved(false); setSelectionContext(null); setRibbonTab("home"); toast.success("Link removed; text preserved");
  };
  const replaceText = (searchText: string, replacement: string) => {
    if (!editor.current || !searchText) return 0;
    const expression = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const walker = document.createTreeWalker(editor.current, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = []; let current = walker.nextNode();
    while (current) {
      const parent = current.parentElement;
      if (parent && !parent.closest(".ultrapage-watermark")) nodes.push(current as Text);
      current = walker.nextNode();
    }
    let replacements = 0;
    nodes.forEach((node) => {
      const original = node.data;
      const matches = original.match(expression);
      if (matches) { replacements += matches.length; node.data = original.replace(expression, replacement); }
    });
    if (replacements) {
      htmlRef.current = editor.current.innerHTML; setHtml(editor.current.innerHTML); setSaved(false);
      toast.success(`${replacements} coincidencia${replacements === 1 ? "" : "s"} reemplazada${replacements === 1 ? "" : "s"}`);
    } else toast.info("No se encontraron coincidencias");
    return replacements;
  };
  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const clipboardHtml = event.clipboardData.getData("text/html");
    const clipboardText = event.clipboardData.getData("text/plain");
    const itemFiles = Array.from(event.clipboardData.items).map((item) => item.kind === "file" ? item.getAsFile() : null).filter((file): file is File => Boolean(file?.type.startsWith("image/")));
    const fileImages = [...itemFiles, ...Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"))]
      .filter((file, index, files) => files.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size && candidate.type === file.type) === index);
    const pasteId = `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const insertedIds: string[] = [];
    const dataSources: string[] = [];
    for (const file of fileImages) {
      if (!/^image\/(png|jpeg|gif|webp|avif)$/i.test(file.type) || file.size > 10 * 1024 * 1024) continue;
      try { dataSources.push(await blobToDataUrl(file)); }
      catch { /* The exact failure is reported after processing the remaining clipboard content. */ }
    }
    const parsed = clipboardHtml ? new DOMParser().parseFromString(clipboardHtml, "text/html") : null;
    const pastedImages = parsed ? Array.from(parsed.body.querySelectorAll<HTMLImageElement>("img")) : [];
    let dataSourceIndex = 0;
    pastedImages.forEach((image, index) => {
      const currentSource = image.getAttribute("src") || "";
      const portableSource = /^(https?:\/\/|\/|data:image\/(png|jpe?g|gif|webp|avif);base64,)/i.test(currentSource);
      if (dataSources[dataSourceIndex]) image.setAttribute("src", dataSources[dataSourceIndex++]);
      else if (!portableSource) image.removeAttribute("src");
      const id = `${pasteId}-${index + 1}`;
      image.setAttribute("data-ultrapage-image-id", id);
      insertedIds.push(id);
      const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true";
      if (!decorative && !image.getAttribute("alt")?.trim()) image.setAttribute("data-ultrapage-alt-status", "pending");
    });
    let markup = parsed ? parsed.body.innerHTML : escapeHtml(clipboardText).replace(/\r?\n/g, "<br>");
    if (!pastedImages.length && dataSources.length) {
      const imageMarkup = dataSources.map((source, index) => {
        const id = `${pasteId}-${index + 1}`;
        insertedIds.push(id);
        return `<figure><img src="${source}" alt="" loading="lazy" data-ultrapage-image-id="${id}" data-ultrapage-alt-status="pending" style="display:block;max-width:100%;height:auto;margin:0 auto"></figure>`;
      }).join("");
      markup = clipboardText.trim() ? `${escapeHtml(clipboardText).replace(/\r?\n/g, "<br>")}${imageMarkup}` : imageMarkup;
    }
    const cleaned = sanitizePastedHtml(markup);
    if (!cleaned.trim()) {
      toast.error("Nothing portable could be pasted", { description: "Copy the image itself or save it locally, then paste or drop the file again." });
      return;
    }
    command("insertHTML", cleaned);
    const inserted = insertedIds.map((id) => editor.current?.querySelector<HTMLImageElement>(`img[data-ultrapage-image-id="${id}"]`)).filter((image): image is HTMLImageElement => Boolean(image));
    const pending = inserted.filter((image) => image.getAttribute("data-ultrapage-alt-status") === "pending");
    if (pending[0]) selectEditorContext(pending[0], "picture", true);
    const lostImages = pastedImages.length - inserted.length;
    if (pending.length) toast.warning(`${pending.length} pasted image${pending.length === 1 ? " needs" : "s need"} accessibility review`, { description: "Use Picture > Alt Text, or explicitly mark the image decorative." });
    else toast.success("Pasted content cleaned", { description: "Images and portable LMS content were preserved." });
    if (lostImages > 0) toast.error(`${lostImages} image${lostImages === 1 ? " was" : "s were"} not portable`, { description: "Copy the image itself or insert the saved file from the Image command." });
  };
  const insertAccessibleImage = ({ src, alt, caption, decorative, width }: { src: string; alt: string; caption: string; decorative: boolean; width: number }) => {
    const cleanSrc = src.trim();
    const hostedImage = /^(https?:\/\/|\/)/i.test(cleanSrc);
    const embeddedImage = /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(cleanSrc);
    if (!hostedImage && !embeddedImage) { toast.error("Choose an image from your computer or use a valid HTTPS address"); return false; }
    if (embeddedImage && cleanSrc.length > 14 * 1024 * 1024) { toast.error("The embedded image is too large. Use an image smaller than 10 MB."); return false; }
    if (!decorative && !alt.trim()) { toast.error("Add an image description or mark it as decorative"); return false; }
    const safeWidth = Math.min(100, Math.max(10, Number(width) || 100));
    const image = `<img src="${escapeHtml(cleanSrc)}" alt="${decorative ? "" : escapeHtml(alt.trim())}"${decorative ? ' role="presentation" aria-hidden="true" data-ultrapage-decorative="true" data-ultrapage-alt-status="decorative"' : ' data-ultrapage-alt-status="described"'} loading="lazy" style="display:block;max-width:${safeWidth}%;height:auto;margin:0 auto">`;
    const markup = caption.trim() ? `<figure>${image}<figcaption>${escapeHtml(caption.trim())}</figcaption></figure>` : `<figure>${image}</figure>`;
    command("insertHTML", markup); toast.success("Imagen accesible insertada"); return true;
  };
  const selectedImageContext = () => {
    if (!editor.current) return null;
    const rememberedImage = selectedImageRef.current;
    if (rememberedImage && editor.current.contains(rememberedImage)) return { image: rememberedImage, figure: rememberedImage.closest<HTMLElement>("figure") };
    if (!savedSelection.current) return null;
    const container = savedSelection.current.startContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
    const figure = element?.closest<HTMLElement>("figure") || (element?.matches("figure") ? element : null);
    const image = element?.closest<HTMLImageElement>("img") || figure?.querySelector<HTMLImageElement>("img") || null;
    if (!image || !editor.current.contains(image)) return null;
    return { image, figure: figure || image.closest<HTMLElement>("figure") };
  };
  const getSelectedImageData = (): SelectedImageData | null => {
    const context = selectedImageContext();
    if (!context) return null;
    const { image, figure } = context;
    const parsedWidth = Number.parseFloat(image.style.width || image.style.maxWidth || "100");
    return { alt: image.getAttribute("alt") || "", caption: figure?.querySelector("figcaption")?.textContent || "", decorative: image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true", width: Math.min(100, Math.max(10, Number.isFinite(parsedWidth) ? parsedWidth : 100)) };
  };
  const updateSelectedImage = ({ alt, caption, decorative, width }: SelectedImageData) => {
    if (!editor.current) return false;
    const context = selectedImageContext();
    if (!context) { toast.error("Select an image first"); return false; }
    if (!decorative && !alt.trim()) { toast.error("Add alternative text or mark the image as decorative"); return false; }
    const { image, figure } = context;
    image.setAttribute("alt", decorative ? "" : alt.trim());
    if (decorative) { image.setAttribute("role", "presentation"); image.setAttribute("aria-hidden", "true"); image.setAttribute("data-ultrapage-decorative", "true"); image.setAttribute("data-ultrapage-alt-status", "decorative"); }
    else { image.removeAttribute("role"); image.removeAttribute("aria-hidden"); image.removeAttribute("data-ultrapage-decorative"); image.setAttribute("data-ultrapage-alt-status", "described"); }
    image.style.maxWidth = `${Math.min(100, Math.max(10, width))}%`; image.style.width = "auto"; image.style.height = "auto";
    let figcaption = figure?.querySelector<HTMLElement>("figcaption") || null;
    if (caption.trim()) {
      if (!figcaption && figure) { figcaption = document.createElement("figcaption"); figure.appendChild(figcaption); }
      if (figcaption) figcaption.textContent = caption.trim();
    } else figcaption?.remove();
    selectedImageRef.current = image;
    const images = Array.from(editor.current.querySelectorAll<HTMLImageElement>("img"));
    setSelectedImageSummary({ index: Math.max(0, images.indexOf(image)) + 1, total: images.length, status: decorative ? "decorative" : "described" });
    setHtml(editor.current.innerHTML); setSaved(false); toast.success("Image accessibility updated"); return true;
  };
  const arrangeSelectedImage = (action: "left" | "center" | "right" | "full" | "delete") => {
    if (!editor.current) return;
    const context = selectedImageContext();
    if (!context) { toast.error("Select an image first"); return; }
    const { image, figure } = context;
    if (action === "delete") { (figure || image).remove(); selectedImageRef.current = null; setSelectedImageSummary(null); setSelectionContext(null); setRibbonTab("home"); }
    else if (action === "full") { image.style.width = "100%"; image.style.maxWidth = "100%"; image.style.margin = "0 auto"; }
    else {
      image.style.display = "block"; image.style.width = "auto";
      image.style.marginLeft = action === "left" ? "0" : "auto"; image.style.marginRight = action === "right" ? "0" : "auto";
    }
    setHtml(editor.current.innerHTML); setSaved(false); toast.success(action === "delete" ? "Image removed" : "Image layout updated");
  };
  const toggleSelectedImageDecorative = () => {
    if (!editor.current) return;
    const current = getSelectedImageData();
    if (!current) { toast.error("Select an image first"); return; }
    if (current.decorative) {
      const context = selectedImageContext();
      if (!context) return;
      context.image.removeAttribute("role");
      context.image.removeAttribute("aria-hidden");
      context.image.removeAttribute("data-ultrapage-decorative");
      context.image.setAttribute("data-ultrapage-alt-status", "pending");
      setSelectedImageSummary((summary) => summary ? { ...summary, status: "needs-alt" } : summary);
      setHtml(editor.current.innerHTML); setSaved(false);
      toast.warning("Image changed to informative", { description: "Open Alt Text and add a meaningful description." });
      return;
    }
    updateSelectedImage({ ...current, alt: "", decorative: true });
  };
  const selectNextImageIssue = () => {
    if (!editor.current) return;
    const images = Array.from(editor.current.querySelectorAll<HTMLImageElement>("img"));
    const currentIndex = selectedImageRef.current ? images.indexOf(selectedImageRef.current) : -1;
    const needsReview = (image: HTMLImageElement) => {
      const decorative = image.getAttribute("role") === "presentation" || image.getAttribute("aria-hidden") === "true" || image.getAttribute("data-ultrapage-decorative") === "true";
      return (!decorative && !image.getAttribute("alt")?.trim()) || (decorative && Boolean(image.getAttribute("alt")?.trim()));
    };
    const ordered = [...images.slice(currentIndex + 1), ...images.slice(0, currentIndex + 1)];
    const issue = ordered.find(needsReview);
    if (!issue) { toast.success("All images have an accessibility decision"); return; }
    selectEditorContext(issue, "picture", true);
    issue.scrollIntoView({ behavior: "smooth", block: "center" });
    toast.info("Image selected", { description: "Use Alt Text or Mark Decorative in the Picture Ribbon." });
  };
  const insertLocalImageFile = async (file: File, source: "clipboard" | "drop") => {
    const validType = /^image\/(png|jpeg|gif|webp|avif)$/i.test(file.type);
    if (!validType) { toast.error("Unsupported image", { description: "Use PNG, JPG, GIF, WebP, or AVIF." }); return false; }
    if (file.size > 10 * 1024 * 1024) { toast.error("The image exceeds the 10 MB limit"); return false; }
    const alternativeText = window.prompt("Alternative text for this image. Leave blank only if it is decorative.", "");
    if (alternativeText === null) return false;
    const decorative = !alternativeText.trim();
    if (decorative && !window.confirm("Insert this image as decorative with empty alternative text?")) return false;
    try {
      const imageSource = await blobToDataUrl(file);
      const caption = file.name && !/^image\.[a-z]+$/i.test(file.name) ? file.name.replace(/\.[^.]+$/, "") : "";
      const inserted = insertAccessibleImage({ src: imageSource, alt: alternativeText, caption, decorative, width: 100 });
      if (inserted) toast.success(source === "drop" ? "Dropped image inserted" : "Pasted image inserted");
      return inserted;
    } catch (problem) {
      toast.error("The image could not be read", { description: problem instanceof Error ? problem.message : "Try another image." });
      return false;
    }
  };
  const handleImageDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setImageDragActive(true);
  };
  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const imageFile = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
    setImageDragActive(false);
    if (!imageFile || !editor.current) return;
    event.preventDefault();
    const dropDocument = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null };
    const dropRange = dropDocument.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (dropRange && editor.current.contains(dropRange.commonAncestorContainer)) savedSelection.current = dropRange.cloneRange();
    void insertLocalImageFile(imageFile, "drop");
  };
  const insertAccessibleMedia = ({ url, title, transcript, captions }: { url: string; title: string; transcript: string; captions: boolean }) => {
    const embed = normalizeMediaEmbed(url);
    if (!embed) { toast.error("Use a valid HTTPS link from YouTube, Vimeo, or Kaltura"); return false; }
    if (!title.trim()) { toast.error("Add a descriptive video title"); return false; }
    const transcriptUrl = transcript.trim();
    if (transcriptUrl && !/^https:\/\//i.test(transcriptUrl)) { toast.error("The transcript must use an HTTPS address"); return false; }
    if (!captions && !transcriptUrl) { toast.error("Confirm that the video has captions or add a transcript"); return false; }
    const safeTitle = escapeHtml(title.trim());
    const transcriptLink = transcriptUrl ? ` · <a class="media-transcript" href="${escapeHtml(transcriptUrl)}">Accessible transcript</a>` : "";
    const markup = `<figure class="responsive-media" data-accessible-media="true" data-captions="${captions ? "true" : "false"}"><div class="media-frame"><iframe src="${escapeHtml(embed)}" title="${safeTitle}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><figcaption>${safeTitle}${transcriptLink}</figcaption></figure><p class="media-fallback"><a href="${escapeHtml(url.trim())}">Open video: ${safeTitle}</a></p>`;
    command("insertHTML", markup); toast.success("Video accesible insertado"); return true;
  };
  const insertAccessibleEquation = ({ formula, description, block }: { formula: string; description: string; block: boolean }) => {
    if (!formula.trim() || !description.trim()) { toast.error("Enter the equation and its accessible description"); return false; }
    const tag = block ? "div" : "span";
    const style = block ? 'display:block;text-align:center;margin:20px 0;font-family:Georgia,serif;font-size:1.15em' : 'font-family:Georgia,serif';
    command("insertHTML", `<${tag} class="accessible-equation" role="math" aria-label="${escapeHtml(description.trim())}" style="${style}">${escapeHtml(formula.trim())}</${tag}>`);
    toast.success("Equation accesible insertada"); return true;
  };
  const insertMarkup = (markup: string) => { const next = `${html}${markup}`; setHtml(next); if (editor.current) editor.current.innerHTML = next; setSaved(false); toast.success("Elemento insertado"); };
  const generateTableOfContents = () => {
    const source = mode === "visual" ? editor.current?.innerHTML || html : html;
    const parsed = new DOMParser().parseFromString(source, "text/html");
    parsed.querySelectorAll('[data-ultrapage-toc="true"]').forEach((element) => element.remove());
    const headings = Array.from(parsed.body.querySelectorAll<HTMLElement>("h1,h2,h3,h4"));
    if (!headings.length) { toast.error("No headings found", { description: "Add H1, H2, H3, or H4 before creating the table of contents." }); return; }
    const usedIds = new Set<string>();
    headings.forEach((heading, index) => {
      const base = (heading.id || heading.textContent || `seccion-${index + 1}`).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `seccion-${index + 1}`;
      let unique = base; let suffix = 2;
      while (usedIds.has(unique)) unique = `${base}-${suffix++}`;
      usedIds.add(unique); heading.id = unique;
    });
    const nav = parsed.createElement("nav");
    nav.className = "ultrapage-toc"; nav.setAttribute("data-ultrapage-toc", "true"); nav.setAttribute("aria-label", "Table of Contents");
    const label = parsed.createElement("p"); label.className = "ultrapage-toc-title"; label.textContent = documentLanguage === "en-US" ? "Contents" : "Contenido";
    const list = parsed.createElement("ol");
    headings.forEach((heading) => {
      const item = parsed.createElement("li"); item.style.marginLeft = `${Math.max(0, Number(heading.tagName[1]) - 1) * 14}px`;
      const link = parsed.createElement("a"); link.href = `#${heading.id}`; link.textContent = heading.textContent?.trim() || heading.id;
      item.appendChild(link); list.appendChild(item);
    });
    nav.append(label, list);
    const firstH1 = parsed.body.querySelector("h1");
    if (firstH1) firstH1.after(nav); else parsed.body.prepend(nav);
    const next = parsed.body.innerHTML;
    htmlRef.current = next; setHtml(next); setSaved(false); setMode("visual");
    if (editor.current) editor.current.innerHTML = next;
    toast.success("Table of Contents created", { description: `${headings.length} linked headings.` });
  };
  const save = () => {
    const currentHtml = mode === "visual" ? editor.current?.innerHTML || html : html;
    htmlRef.current = currentHtml; setHtml(currentHtml);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ html: currentHtml, title, fileName: documentFileName, language: documentLanguage, lmsProfile, author: documentAuthor, description: documentDescription, pageSetup, updatedAt: new Date().toISOString() }));
    const snapshot: DraftSnapshot = { id: crypto.randomUUID?.() || String(Date.now()), html: currentHtml, title, fileName: documentFileName, language: documentLanguage, lmsProfile, author: documentAuthor, description: documentDescription, pageSetup, savedAt: new Date().toISOString() };
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as DraftSnapshot[];
      if (history[0]?.html !== currentHtml || history[0]?.title !== title) localStorage.setItem(HISTORY_KEY, JSON.stringify([snapshot, ...history].slice(0, 10)));
    } catch { localStorage.setItem(HISTORY_KEY, JSON.stringify([snapshot])); }
    setSaved(true); toast.success("Page saved", { description: "The draft will remain available after closing or refreshing the browser." });
  };
  const restoreSnapshot = (snapshot: DraftSnapshot) => {
    htmlRef.current = snapshot.html; setHtml(snapshot.html); setTitle(snapshot.title); setDocumentFileName(snapshot.fileName); if (snapshot.language) setDocumentLanguage(snapshot.language); if (isLmsProfile(snapshot.lmsProfile)) setLmsProfile(snapshot.lmsProfile); setDocumentAuthor(snapshot.author || ""); setDocumentDescription(snapshot.description || ""); if (isPageSetup(snapshot.pageSetup)) setPageSetup(snapshot.pageSetup); setMode("visual"); setSaved(true);
    if (editor.current) editor.current.innerHTML = snapshot.html;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ html: snapshot.html, title: snapshot.title, fileName: snapshot.fileName, language: snapshot.language || documentLanguage, lmsProfile: snapshot.lmsProfile || lmsProfile, author: snapshot.author || "", description: snapshot.description || "", pageSetup: snapshot.pageSetup || pageSetup, updatedAt: new Date().toISOString() }));
    toast.success("Version restored", { description: snapshot.title });
  };
  const copyHtml = async () => {
    const currentHtml = mode === "visual" ? editor.current?.innerHTML || html : html;
    const compatibleMarkup = buildLmsHtml(currentHtml, documentLanguage, lmsProfile);
    const target = lmsProfiles[lmsProfile];
    try {
      if (navigator.clipboard.write && typeof ClipboardItem !== "undefined") {
        const clipboardItem = new ClipboardItem({
          "text/html": new Blob([compatibleMarkup], { type: "text/html" }),
          "text/plain": new Blob([compatibleMarkup], { type: "text/plain" }),
        });
        await navigator.clipboard.write([clipboardItem]);
        toast.success(`Content ready for ${target.label}`, { description: "Paste it into the LMS visual editor or HTML source editor." });
      } else {
        await navigator.clipboard.writeText(compatibleMarkup);
        toast.success("Compatible HTML code copied", { description: `Paste it into ${target.label}’s HTML source editor.` });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(compatibleMarkup);
        toast.success("Compatible HTML code copied", { description: `The browser used compatibility mode. Paste it into ${target.label}’s HTML source editor.` });
      } catch {
        toast.error("Clipboard access was denied", { description: "Open the HTML tab and copy the code manually." });
      }
    }
  };
  const insertFile = (name: string, type: string, href?: string, embeddedSrc?: string, alternativeText?: string) => {
    if (!href) { toast.info("Conecte primero su propio curso o Content Collection"); return; }
    const resourceUrl = href;
    const imageSource = embeddedSrc || resourceUrl;
    const webDavSource = embeddedSrc ? ` data-ultrapage-webdav-src="${escapeHtml(resourceUrl)}"` : "";
    const alt = alternativeText?.trim() || "";
    const decorativeAttributes = type === "Imagen" && !alt ? ' role="presentation"' : "";
    const markup = type === "Imagen" ? `<figure><img src="${escapeHtml(imageSource)}"${webDavSource} alt="${escapeHtml(alt)}"${decorativeAttributes} loading="lazy" style="display:block;max-width:100%;height:auto;margin:0 auto"><figcaption>${escapeHtml(name)}</figcaption></figure>` : `<p><a href="${escapeHtml(resourceUrl)}">${escapeHtml(name)}</a></p>`;
    command("insertHTML", markup); toast.success("Resource inserted", { description: `${name} was added to the page.` });
  };
  const openDocument = (name: string, content: string) => {
    const plainTextFile = /\.txt$/i.test(name);
    const parsedFile = plainTextFile ? null : new DOMParser().parseFromString(content, "text/html");
    const importedLanguage = parsedFile?.documentElement.lang;
    const importedLmsProfile = parsedFile?.querySelector('meta[name="ultrapage-lms-profile"]')?.getAttribute("content");
    const importedAuthor = parsedFile?.querySelector('meta[name="author"]')?.getAttribute("content") || "";
    const importedDescription = parsedFile?.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const importedPageSetup: PageSetup = {
      size: parsedFile?.querySelector('meta[name="ultrapage-page-size"]')?.getAttribute("content") === "a4" ? "a4" : "letter",
      orientation: parsedFile?.querySelector('meta[name="ultrapage-page-orientation"]')?.getAttribute("content") === "landscape" ? "landscape" : "portrait",
      margin: (parsedFile?.querySelector('meta[name="ultrapage-page-margin"]')?.getAttribute("content") as PageMargin) || "normal",
    };
    const extracted = content.match(/<main[^>]*class=["'][^"']*ultra-page[^"']*["'][^>]*>([\s\S]*?)<\/main>/i)?.[1] || content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || content;
    const body = plainTextFile
      ? extracted.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("")
      : sanitizePastedHtml(extracted);
    setHtml(body); setDocumentFileName(name); setTitle(name.replace(/\.(html?|txt)$/i, "")); if (importedLanguage === "en-US" || importedLanguage === "es-PR") setDocumentLanguage(importedLanguage); if (isLmsProfile(importedLmsProfile)) setLmsProfile(importedLmsProfile); setDocumentAuthor(importedAuthor); setDocumentDescription(importedDescription); if (isPageSetup(importedPageSetup)) setPageSetup(importedPageSetup); setMode("visual"); setSaved(true);
    if (editor.current) editor.current.innerHTML = body;
    toast.success("File opened safely", { description: `${name} is ready to edit.` });
  };
  const importLocalDocument = async (file?: File) => {
    if (!file) return;
    if (!/\.(html?|txt|json|docx)$/i.test(file.name)) { toast.error("Unsupported format", { description: "Select an HTML, HTM, TXT, DOCX, or UltraPage project file." }); return; }
    const maximumSize = /\.docx$/i.test(file.name) ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maximumSize) { toast.error("The file is too large", { description: `The import limit for this file is ${maximumSize / 1024 / 1024} MB.` }); return; }
    try {
      if (/\.docx$/i.test(file.name)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/import", { method: "POST", body: formData });
        const converted = await response.json() as { html?: string; warnings?: string[]; error?: string };
        if (!response.ok || typeof converted.html !== "string") throw new Error(converted.error || "The Word document could not be converted.");
        const body = sanitizePastedHtml(converted.html);
        const importedTitle = file.name.replace(/\.docx$/i, "");
        htmlRef.current = body;
        setHtml(body);
        setTitle(importedTitle);
        setDocumentFileName(exportFileName(importedTitle, "html"));
        setDocumentAuthor("");
        setDocumentDescription("");
        setMode("visual");
        setSaved(false);
        if (editor.current) editor.current.innerHTML = body;
        const warningCount = converted.warnings?.length || 0;
        toast.success("Word document imported", { description: warningCount ? `The document is editable. Review ${warningCount} conversion notice${warningCount === 1 ? "" : "s"} and run Accessibility Review.` : "Headings, lists, tables, and links are ready for editing." });
        return;
      }
      const content = await file.text();
      if (/\.json$/i.test(file.name)) {
        const project = JSON.parse(content) as { format?: string; version?: number; html?: string; title?: string; fileName?: string; language?: string; lmsProfile?: string; author?: string; description?: string; pageSetup?: PageSetup };
        if (project.format !== "ultrapage-project" || project.version !== 1 || typeof project.html !== "string") throw new Error("Invalid UltraPage project");
        const body = sanitizePastedHtml(project.html);
        const projectLanguage: DocumentLanguage = project.language === "en-US" ? "en-US" : "es-PR";
        const projectTitle = typeof project.title === "string" && project.title.trim() ? project.title.trim() : file.name.replace(/\.ultrapage\.json$|\.json$/i, "");
        const projectFileName = typeof project.fileName === "string" && /\.(html?|txt)$/i.test(project.fileName) ? project.fileName : exportFileName(projectTitle, "html");
        htmlRef.current = body;
        setHtml(body);
        setTitle(projectTitle);
        setDocumentFileName(projectFileName);
        setDocumentLanguage(projectLanguage);
        if (isLmsProfile(project.lmsProfile)) setLmsProfile(project.lmsProfile);
        setDocumentAuthor(typeof project.author === "string" ? project.author : "");
        setDocumentDescription(typeof project.description === "string" ? project.description : "");
        if (isPageSetup(project.pageSetup)) setPageSetup(project.pageSetup);
        setMode("visual");
        setSaved(true);
        if (editor.current) editor.current.innerHTML = body;
        toast.success("UltraPage project restored", { description: "Content, language, and document metadata were recovered." });
      } else openDocument(file.name, content);
    } catch (problem) {
      toast.error("The file could not be opened", { description: problem instanceof Error && problem.message === "Invalid UltraPage project" ? "The JSON file is not a valid UltraPage project." : problem instanceof Error ? problem.message : "Verify that the file is not damaged." });
    } finally { if (localFileInput.current) localFileInput.current.value = ""; }
  };
  const newDocument = () => {
    const name = prompt("New file name", "new-page.html")?.trim();
    if (!name) return;
    const validName = /\.(html?|txt)$/i.test(name) ? name : `${name}.html`;
    const content = "";
    setDocumentFileName(validName); setTitle(validName.replace(/\.(html?|txt)$/i, "")); setHtml(content); setDocumentAuthor(""); setDocumentDescription(""); setDocumentLanguage("es-PR"); setPageSetup({ size: "letter", orientation: "portrait", margin: "normal" }); setMode("visual"); setSaved(false);
    if (editor.current) editor.current.innerHTML = content;
    toast.success("New document created");
  };
  const downloadDocument = async (): Promise<HtmlPackageResult> => {
    const currentHtml = normalizeAutomaticIndentationHtml(mode === "visual" ? editor.current?.innerHTML || html : html, documentLanguage);
    const safeTitle = escapeHtml(title);
    const safeAuthor = escapeHtml(documentAuthor.trim());
    const safeDescription = escapeHtml(documentDescription.trim());
    const zip = new JSZip();
    const parsed = new DOMParser().parseFromString(`<main id="ultrapage-package-root" class="ultra-page">${currentHtml}</main>`, "text/html");
    const root = parsed.querySelector<HTMLElement>("#ultrapage-package-root");
    if (!root) throw new Error("The HTML package could not be prepared.");
    const assets: Array<{ file: string | null; type: string; status: "bundled" | "external"; source: string; alt: string }> = [];
    const packagedSources = new Map<string, string>();
    let bundledAssets = 0;
    let externalAssets = 0;
    const extensionFor = (mimeType: string, source: string) => {
      const mime = mimeType.toLowerCase().split(";", 1)[0];
      const byMime: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/avif": "avif" };
      if (byMime[mime]) return byMime[mime];
      return source.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || "img";
    };
    for (const image of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
      const source = image.getAttribute("src")?.trim() || "";
      const webDavSource = image.getAttribute("data-ultrapage-webdav-src")?.trim() || "";
      const sourceLabel = webDavSource || (/^data:/i.test(source) ? "embedded-image" : source || "missing-source");
      image.removeAttribute("data-ultrapage-webdav-src");
      if (!source) {
        externalAssets += 1;
        assets.push({ file: null, type: "missing", status: "external", source: sourceLabel, alt: image.alt || "" });
        continue;
      }
      const previousPath = packagedSources.get(source);
      if (previousPath) { image.setAttribute("src", previousPath); continue; }
      try {
        const response = await fetch(source, { credentials: "omit", cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const mimeType = blob.type.toLowerCase().split(";", 1)[0];
        if (!/^image\/(png|jpeg|gif|webp|avif)$/.test(mimeType)) throw new Error("Unsupported image type");
        if (!blob.size || blob.size > 25 * 1024 * 1024) throw new Error("Image exceeds 25 MB");
        bundledAssets += 1;
        const assetPath = `images/image-${String(bundledAssets).padStart(3, "0")}.${extensionFor(mimeType, source)}`;
        zip.file(assetPath, blob);
        packagedSources.set(source, assetPath);
        image.setAttribute("src", assetPath);
        image.removeAttribute("loading");
        assets.push({ file: assetPath, type: mimeType, status: "bundled", source: sourceLabel, alt: image.alt || "" });
      } catch {
        externalAssets += 1;
        assets.push({ file: null, type: "remote-reference", status: "external", source: sourceLabel, alt: image.alt || "" });
      }
    }
    const packagedHtml = root.innerHTML;
    const packageStyles = `${exportedPageStyles}\n${pagePrintCss(pageSetup)}`;
    const fileContent = `<!doctype html><html lang="${documentLanguage}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light"><meta name="generator" content="UltraPage Studio"><meta name="ultrapage-lms-profile" content="${lmsProfile}"><meta name="ultrapage-page-size" content="${pageSetup.size}"><meta name="ultrapage-page-orientation" content="${pageSetup.orientation}"><meta name="ultrapage-page-margin" content="${pageSetup.margin}"><title>${safeTitle}</title>${safeAuthor ? `<meta name="author" content="${safeAuthor}">` : ""}${safeDescription ? `<meta name="description" content="${safeDescription}">` : ""}<style>${packageStyles}</style></head><body><main class="ultra-page">${packagedHtml}</main></body></html>`;
    const lmsFragment = buildLmsHtml(packagedHtml, documentLanguage, lmsProfile);
    const accessibilityChecks = accessibilityReport(packagedHtml, title, documentLanguage);
    const generatedAt = new Date().toISOString();
    zip.file("index.html", fileContent);
    zip.file("lms-fragment.html", `<!-- Generated for ${lmsProfiles[lmsProfile].label} by UltraPage Studio -->\n${lmsFragment}`);
    zip.file("styles/ultrapage.css", packageStyles.trim());
    zip.file("accessibility-report.txt", [`UltraPage Studio Accessibility Report`, `Generated: ${generatedAt}`, `Document: ${title}`, `Language: ${documentLanguage}`, `Target LMS: ${lmsProfiles[lmsProfile].label}`, "", ...accessibilityChecks.map((check) => `${check.ok ? "PASS" : "REVIEW"}: ${check.text}`)].join("\n"));
    zip.file("manifest.json", JSON.stringify({ format: "ultrapage-html-package", version: 1, generatedAt, title, language: documentLanguage, lmsProfile, author: documentAuthor, description: documentDescription, pageSetup, entryPoint: "index.html", lmsFragment: "lms-fragment.html", styleReference: "styles/ultrapage.css", assets, summary: { bundledAssets, externalAssets } }, null, 2));
    zip.file("README.txt", [`UltraPage Studio HTML Package`, `=============================`, "", `Open index.html to view the responsive page.`, `Use lms-fragment.html when pasting source code into ${lmsProfiles[lmsProfile].label}.`, `The images folder contains resources that could be packaged safely.`, `manifest.json lists every image and identifies any external reference that could not be downloaded because of server access or CORS restrictions.`, `accessibility-report.txt contains the automated accessibility results at export time.`, "", `Keep index.html and the images folder together when uploading this package to a web server or LMS file area.`].join("\n"));
    const packageBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, mimeType: "application/zip" });
    const fileName = exportFileName(title, "html-package.zip");
    downloadBlob(packageBlob, fileName);
    return { bundledAssets, externalAssets, fileName };
  };
  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (saved) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saved]);
  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if (event.key === "Escape" && focusMode) { setFocusMode(false); return; }
      if (event.key === "Escape" && rightPanel && window.matchMedia("(max-width: 1040px)").matches) { setRightPanel(false); return; }
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "s") { event.preventDefault(); save(); return; }
      if (mode !== "visual") return;
      if (event.altKey && /^[1-4]$/.test(event.key)) { event.preventDefault(); command("formatBlock", `h${event.key}`); return; }
      if (modifier && event.shiftKey && event.key === "7") { event.preventDefault(); command("insertOrderedList"); return; }
      if (modifier && event.shiftKey && event.key === "8") { event.preventDefault(); command("insertUnorderedList"); }
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [mode, html, title, documentFileName, documentLanguage, lmsProfile, documentAuthor, documentDescription, rightPanel, focusMode]);
  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const repairAccessibility = () => {
    const parsed = new DOMParser().parseFromString(`<div id="accessibility-repair-root">${html}</div>`, "text/html");
    const root = parsed.querySelector<HTMLElement>("#accessibility-repair-root");
    if (!root) return;
    let changes = 0;
    const replaceTag = (element: HTMLElement, tagName: string) => {
      const replacement = parsed.createElement(tagName);
      Array.from(element.attributes).forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
      while (element.firstChild) replacement.appendChild(element.firstChild);
      element.replaceWith(replacement);
      changes += 1;
      return replacement;
    };

    root.querySelectorAll("script,style,object,embed,form,input,button").forEach((element) => { element.remove(); changes += 1; });
    root.querySelectorAll<HTMLElement>("*").forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        if (/^on/i.test(attribute.name) || ((attribute.name === "href" || attribute.name === "src") && /^javascript:/i.test(attribute.value.trim()))) {
          element.removeAttribute(attribute.name);
          changes += 1;
        }
      });
      const minimumWidth = element.style.getPropertyValue("min-width");
      const fixedPixels = minimumWidth.match(/^(\d+(?:\.\d+)?)px$/i);
      if (fixedPixels && Number(fixedPixels[1]) >= 400) { element.style.removeProperty("min-width"); changes += 1; }
    });

    root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6").forEach((heading) => {
      if (!heading.textContent?.trim()) { heading.remove(); changes += 1; }
    });
    let headings = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"));
    const h1s = headings.filter((heading) => heading.tagName === "H1");
    if (!h1s.length) {
      const heading = parsed.createElement("h1");
      heading.textContent = title.trim() || "Document title";
      root.prepend(heading);
      changes += 1;
    } else if (h1s.length > 1) {
      h1s.slice(1).forEach((heading) => replaceTag(heading, "h2"));
    }
    headings = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6"));
    let previousLevel = 0;
    headings.forEach((heading) => {
      const currentLevel = Number(heading.tagName.slice(1));
      const allowedLevel = previousLevel ? Math.min(currentLevel, previousLevel + 1) : 1;
      const normalized = currentLevel !== allowedLevel ? replaceTag(heading, `h${allowedLevel}`) : heading;
      previousLevel = Number(normalized.tagName.slice(1));
    });

    root.querySelectorAll<HTMLTableElement>("table").forEach((table, tableIndex) => {
      if (!table.querySelector("caption") && !table.getAttribute("aria-label")?.trim()) {
        const caption = parsed.createElement("caption");
        caption.textContent = `Table ${tableIndex + 1}. Enter a descriptive title`;
        table.prepend(caption);
        changes += 1;
      }
      const firstRow = table.querySelector("tr");
      if (firstRow && !firstRow.querySelector("th")) {
        Array.from(firstRow.querySelectorAll<HTMLTableCellElement>("td")).forEach((cell) => {
          const header = parsed.createElement("th");
          Array.from(cell.attributes).forEach((attribute) => header.setAttribute(attribute.name, attribute.value));
          header.setAttribute("scope", "col");
          while (cell.firstChild) header.appendChild(cell.firstChild);
          cell.replaceWith(header);
          changes += 1;
        });
      }
      table.querySelectorAll<HTMLTableCellElement>("th").forEach((header) => {
        if (["col", "row", "colgroup", "rowgroup"].includes((header.getAttribute("scope") || "").toLowerCase())) return;
        header.setAttribute("scope", header.closest("thead") || header.cellIndex > 0 ? "col" : "row");
        changes += 1;
      });
    });

    root.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]').forEach((link) => {
      const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
      if (!rel.has("noopener") || !rel.has("noreferrer")) {
        rel.add("noopener"); rel.add("noreferrer");
        link.setAttribute("rel", Array.from(rel).join(" "));
        changes += 1;
      }
    });

    const usedIds = new Set<string>();
    root.querySelectorAll<HTMLElement>("[id]").forEach((element) => {
      const original = element.id;
      if (!usedIds.has(original)) { usedIds.add(original); return; }
      let suffix = 2;
      let replacement = `${original}-${suffix}`;
      while (usedIds.has(replacement)) { suffix += 1; replacement = `${original}-${suffix}`; }
      element.id = replacement;
      usedIds.add(replacement);
      changes += 1;
    });

    const repaired = sanitizePastedHtml(root.innerHTML);
    htmlRef.current = repaired;
    setHtml(repaired);
    if (editor.current) editor.current.innerHTML = repaired;
    if (!title.trim()) {
      const firstHeading = root.querySelector("h1")?.textContent?.trim() || "Accessible document";
      setTitle(firstHeading);
      changes += 1;
    }
    setSaved(false);
    if (changes) toast.success("Safe accessibility fixes completed", { description: `${changes} ajuste${changes === 1 ? "" : "s"} aplicado${changes === 1 ? "" : "s"}. Review recommendations that require human judgment.` });
    else toast.info("No automatic fixes are pending");
  };

  const filteredFiles = demoFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const pageChecks = accessibilityReport(html, title, documentLanguage);
  const accessibilityScore = Math.round((pageChecks.filter((check) => check.ok).length / pageChecks.length) * 100);
  const accessibilityIssueCount = pageChecks.reduce((total, check) => check.ok ? total : total + Math.max(1, check.locations?.length || (check.location ? 1 : 0)), 0);
  const accessibilityIssueMap = pageChecks.flatMap((check) => check.ok ? [] : (check.locations?.length ? check.locations : check.location ? [check.location] : []).map((location) => ({ check, location })));
  const previewIssueMap = previewAuditChecks.filter((check) => !check.ok && check.location);
  const locateAccessibilityIssue = (check: AccessibilityCheck, requestedLocation?: AccessibilityLocation) => {
    const location = requestedLocation || check.locations?.[0] || check.location;
    if (!location) { toast.info("This recommendation applies to the document as a whole"); return; }
    if (location.view === "settings" || location.selector === "@title") {
      changeMode("visual");
      window.requestAnimationFrame(() => {
        const titleField = document.querySelector<HTMLInputElement>(".title-input");
        titleField?.scrollIntoView({ behavior: "smooth", block: "center" });
        titleField?.focus();
        titleField?.select();
        toast.warning(`Located: ${location.label}`, { description: check.text });
      });
      return;
    }
    if (location.view === "html" || location.selector === "@html") {
      setCodeView("source"); setCodeWorkspace("code"); changeMode("html");
      window.requestAnimationFrame(() => {
        goToCodeLocation(location.sourceOffset || 0, location.sourceLength || 0);
        toast.warning(`Located: ${location.label}`, { description: "Review the editable HTML source for unsafe or unsupported markup." });
      });
      return;
    }
    changeMode("visual");
    window.requestAnimationFrame(() => window.setTimeout(() => {
      const root = editor.current;
      if (!root) return;
      setAccessibilitySpotlight(null);
      const resolveTarget = () => {
        const currentRoot = editor.current;
        if (!currentRoot) return null;
        if (location.selector === "@editor-start") return (currentRoot.firstElementChild as HTMLElement | null) || currentRoot;
        return Array.from(currentRoot.querySelectorAll<HTMLElement>(location.selector))[location.index] || null;
      };
      const target = resolveTarget();
      if (!target) { toast.error("The affected element is no longer in the document", { description: "Run Accessibility Checks again to refresh the location." }); return; }
      if (location.context === "picture") selectEditorContext(target, "picture", true);
      else if (location.context === "link") selectEditorContext(target, "link", true);
      else if (location.context === "table") {
        const tableTarget = target.querySelector<HTMLElement>("th,td") || target;
        selectEditorContext(tableTarget, "table");
      }
      setAccessibilityHighlight({ location, requestId: Date.now() });
      toast.warning(`Located: ${location.label}`, { description: check.text });
    }, 60));
  };
  const navigateAccessibilityIssue = (direction: 1 | -1) => {
    if (!accessibilityIssueMap.length) { toast.success("No accessibility issues are pending"); return; }
    const next = accessibilityIssueCursor < 0 ? (direction === 1 ? 0 : accessibilityIssueMap.length - 1) : (accessibilityIssueCursor + direction + accessibilityIssueMap.length) % accessibilityIssueMap.length;
    setAccessibilityIssueCursor(next);
    const issue = accessibilityIssueMap[next];
    locateAccessibilityIssue(issue.check, issue.location);
    toast.info(`Issue ${next + 1} of ${accessibilityIssueMap.length}`);
  };
  const inspectPreviewIssue = (check: PreviewAuditCheck) => {
    if (!check.location) return;
    const location = check.location;
    changeMode("visual");
    window.requestAnimationFrame(() => window.setTimeout(() => {
      const root = editor.current;
      if (!root) return;
      const target = Array.from(root.querySelectorAll<HTMLElement>(location.selector))[location.index];
      if (!target) { toast.error("The affected preview element is no longer available", { description: "Run Preview Audit again to refresh the result." }); return; }
      if (target.matches("img") || target.querySelector("img")) selectEditorContext(target, "picture", true);
      else if (target.matches("table,th,td") || target.querySelector("table")) selectEditorContext(target.matches("th,td") ? target : target.querySelector<HTMLElement>("th,td") || target, "table");
      else if (target.matches("a") || target.querySelector("a")) selectEditorContext(target.matches("a") ? target : target.querySelector<HTMLElement>("a") || target, "link", true);
      setAccessibilitySpotlight(null);
      setAccessibilityHighlight({ location: { ...location, view: "design" }, requestId: Date.now() });
      toast.warning(`Inspecting: ${location.label}`, { description: check.detail });
    }, 60));
  };
  const navigatePreviewIssue = (direction: 1 | -1) => {
    if (!previewIssueMap.length) { toast.success("No Design Preview issues are pending"); return; }
    const next = previewIssueCursor < 0 ? (direction === 1 ? 0 : previewIssueMap.length - 1) : (previewIssueCursor + direction + previewIssueMap.length) % previewIssueMap.length;
    setPreviewIssueCursor(next);
    inspectPreviewIssue(previewIssueMap[next]);
    toast.info(`Preview issue ${next + 1} of ${previewIssueMap.length}`);
  };
  const runBlackboardPreviewAudit = () => {
    setLmsProfile("blackboard");
    setSaved(false);
    runPreviewAudit(true, "blackboard");
    toast.info("Target LMS changed to Blackboard Ultra", { description: "The quality gate used the Blackboard conversion profile." });
  };
  const runUniversalLmsPreflight = () => {
    const results = createUniversalLmsPreflight(htmlRef.current, documentLanguage);
    setUniversalPreflightResults(results);
    setUniversalPreflightOpen(true);
    const ready = results.filter((result) => result.ready).length;
    toast[ready === results.length ? "success" : "warning"](`Universal LMS Preflight: ${ready}/${results.length} profiles ready`);
  };
  const downloadUniversalPreflightReport = () => {
    const results = universalPreflightResults.length ? universalPreflightResults : createUniversalLmsPreflight(htmlRef.current, documentLanguage);
    const lines = [
      "UltraPage Studio — Universal LMS Preflight",
      "===========================================",
      `Generated: ${new Date().toISOString()}`,
      `Document: ${title || "Untitled document"}`,
      `Language: ${languageLabels[documentLanguage]}`,
      "",
      ...results.flatMap((result) => [
        `${result.ready ? "READY" : "REVIEW"} · ${lmsProfiles[result.profile].label} · ${result.score}% · ${result.outputBytes.toLocaleString()} bytes`,
        ...result.checks.map((check) => `  ${check.ok ? "PASS" : "REVIEW"} · ${check.label}: ${check.detail}`),
        "",
      ]),
      "Automated results support review but do not guarantee legal or LMS conformance.",
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), exportFileName(title, "universal-lms-preflight.txt"));
    toast.success("Universal LMS Preflight report downloaded");
  };
  const runLearningExperiencePulse = () => {
    const result = createLearningExperiencePulse(htmlRef.current, documentLanguage);
    setLearningPulseResult(result);
    setLearningPulseOpen(true);
    toast[result.score >= 80 ? "success" : "warning"](`Learning Experience Pulse: ${result.score}%`);
  };
  const downloadLearningExperienceReport = () => {
    const result = learningPulseResult || createLearningExperiencePulse(htmlRef.current, documentLanguage);
    const lines = [
      "UltraPage Studio — Learning Experience Pulse",
      "============================================",
      `Generated: ${new Date().toISOString()}`,
      `Document: ${title || "Untitled document"}`,
      `Language: ${languageLabels[documentLanguage]}`,
      `Overall experience score: ${result.score}%`,
      `Length: ${result.wordCount} words · ${result.readingMinutes} minute${result.readingMinutes === 1 ? "" : "s"} estimated reading`,
      "",
      ...result.metrics.flatMap((metric) => [`${metric.score >= 80 ? "STRONG" : metric.score >= 50 ? "REVIEW" : "MISSING"} · ${metric.label} · ${metric.score}%`, `  Evidence: ${metric.detail}`, `  Recommendation: ${metric.recommendation}`, ""]),
      "Automated instructional-design signals support expert review and do not replace faculty judgment.",
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), exportFileName(title, "learning-experience-pulse.txt"));
    toast.success("Learning Experience Pulse report downloaded");
  };
  const runSemanticChangeImpact = () => {
    let history: DraftSnapshot[] = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as DraftSnapshot[]; } catch { /* A damaged local history is treated as unavailable. */ }
    const baseline = history[0];
    if (!baseline) { toast.info("Save a version before using Change Impact", { description: "UltraPage compares the current page with the most recent manual save." }); return; }
    const result = createSemanticChangeImpact(htmlRef.current, baseline, title, documentLanguage);
    setSemanticChangeResult(result);
    setSemanticChangeOpen(true);
    toast[result.risk === "high" ? "warning" : "success"](`Semantic Change Impact: ${result.risk} risk`);
  };
  const downloadSemanticChangeReport = () => {
    if (!semanticChangeResult) return;
    const result = semanticChangeResult;
    const lines = [
      "UltraPage Studio — Semantic Change Impact",
      "==========================================",
      `Generated: ${new Date().toISOString()}`,
      `Current document: ${title || "Untitled document"}`,
      `Baseline: ${result.baselineTitle} · ${result.baselineSavedAt}`,
      `Risk: ${result.risk.toUpperCase()}`,
      `Words: +${result.wordsAdded} / -${result.wordsRemoved}`,
      `Accessibility: ${result.accessibilityBefore}% → ${result.accessibilityAfter}%`,
      "",
      "Semantic inventory",
      ...result.items.map((entry) => `${entry.sensitive ? "SENSITIVE" : "INFO"} · ${entry.label}: ${entry.before} → ${entry.after} (${entry.delta >= 0 ? "+" : ""}${entry.delta})`),
      "",
      "Sensitive changes",
      ...(result.sensitiveChanges.length ? result.sensitiveChanges.map((change) => `REVIEW · ${change}`) : ["PASS · No sensitive structural or accessibility changes detected."]),
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), exportFileName(title, "semantic-change-impact.txt"));
    toast.success("Semantic Change Impact report downloaded");
  };
  const runLearnerJourneySimulator = () => {
    const result = createLearnerJourneySimulation(htmlRef.current, documentLanguage);
    setLearnerJourneyResult(result);
    setLearnerJourneyOpen(true);
    toast[result.personas.some((persona) => persona.status === "blocked") ? "warning" : result.score >= 80 ? "success" : "warning"](`Inclusive Learner Journey: ${result.score}%`);
  };
  const downloadLearnerJourneyReport = () => {
    const result = learnerJourneyResult || createLearnerJourneySimulation(htmlRef.current, documentLanguage);
    const lines = [
      "UltraPage Studio — Inclusive Learner Journey Simulator",
      "=======================================================",
      `Generated: ${new Date().toISOString()}`,
      `Document: ${title || "Untitled document"}`,
      `Language: ${languageLabels[documentLanguage]}`,
      `Overall journey score: ${result.score}%`,
      `Focus stops: ${result.focusStops.length} · Semantic reading stops: ${result.readingStops.length}`,
      "",
      ...result.personas.flatMap((persona) => [`${persona.status.toUpperCase()} · ${persona.label} · ${persona.score}%`, `  Evidence: ${persona.evidence}`, `  Recommendation: ${persona.recommendation}`, ""]),
      "First focus stops",
      ...result.focusStops.slice(0, 25).map((stop) => `${stop.order}. ${stop.role.toUpperCase()} · ${stop.label}`),
      "",
      "First semantic reading stops",
      ...result.readingStops.slice(0, 40).map((stop) => `${stop.order}. ${stop.role.toUpperCase()} · ${stop.label}`),
      "",
      "This structural simulation supports inclusive-design review. It does not replace testing by learners or validation with actual assistive technology.",
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), exportFileName(title, "inclusive-learner-journey.txt"));
    toast.success("Learner Journey report downloaded");
  };
  const runLearningConstellation = () => {
    const result = createLearningConstellation(htmlRef.current, title, documentLanguage);
    setLearningConstellationResult(result);
    setLearningConstellationOpen(true);
    toast[result.status === "ready" ? "success" : "warning"](`Learning Constellation: ${result.score}%`);
  };
  const downloadLearningConstellation = () => {
    const result = learningConstellationResult || createLearningConstellation(htmlRef.current, title, documentLanguage);
    const artifact = { schema: "ultrapage-learning-constellation/v1", application: "UltraPage Studio", owner: "Eduardo Augusto García Rodríguez", document: { title: title || "Untitled document", language: documentLanguage, fingerprint: stableContentFingerprint(`${title}|${documentLanguage}|${htmlRef.current.replace(/\s+/g, " ").trim()}`) }, ...result, interoperability: { alignmentModel: "CASE-inspired relationship graph", certification: "Not a certified CASE package", learnerDataIncluded: false }, simulation: { mode: "science-fiction-inspired deterministic simulation", claim: "No extraterrestrial or quantum technology is claimed." } };
    downloadBlob(new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json;charset=utf-8" }), exportFileName(title, "learning-constellation.json"));
    toast.success("Learning Constellation JSON downloaded");
  };
  const createCurrentCourseTwin = () => {
    const source = htmlRef.current;
    const root = new DOMParser().parseFromString(source, "text/html").body;
    const lmsResults = createUniversalLmsPreflight(source, documentLanguage);
    const lmsScores = Object.fromEntries(lmsResults.map((result) => [result.profile, result.score])) as Record<LmsProfile, number>;
    const learning = createLearningExperiencePulse(source, documentLanguage);
    const journey = createLearnerJourneySimulation(source, documentLanguage);
    const journeyScore = (perspective: TwinPerspective) => {
      const personaId = perspective === "reflow" ? "low-vision" : perspective;
      return journey.personas.find((persona) => persona.id === personaId)?.score || 0;
    };
    const embeddedAssetBytes = Array.from(source.matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/g), (match) => match[1]).reduce((total, payload) => total + Math.floor(payload.length * .75), 0);
    const externalAssets = root.querySelectorAll('img[src^="http"],iframe[src^="http"],video[src^="http"],source[src^="http"]').length;
    const fixedWidthElements = Array.from(root.querySelectorAll<HTMLElement>("[style]")).filter((element) => [element.style.width, element.style.minWidth].some((value) => /\b(?:[4-9]\d{2}|\d{4,})px\b/i.test(value))).length;
    const longParagraphs = Array.from(root.querySelectorAll("p")).filter((paragraph) => (paragraph.textContent || "").trim().split(/\s+/).filter(Boolean).length > 120).length;
    const accessibilityScore = pageChecks.length ? Math.round(pageChecks.filter((check) => check.ok).length / pageChecks.length * 100) : 0;
    return createCourseDigitalTwin({
      title: title.trim() || "Untitled document",
      generatedAt: new Date().toISOString(),
      fingerprint: stableContentFingerprint(`${title.trim()}|${documentLanguage}|${source.replace(/\s+/g, " ").trim()}`),
      sourceBytes: new Blob([source]).size,
      embeddedAssetBytes,
      externalAssets,
      fixedWidthElements,
      longParagraphs,
      accessibilityScore,
      learningScore: learning.score,
      journeyScores: { keyboard: journeyScore("keyboard"), "screen-reader": journeyScore("screen-reader"), reflow: journeyScore("reflow"), cognitive: journeyScore("cognitive") },
      lmsScores,
    });
  };
  const runCourseDigitalTwin = () => {
    const result = createCurrentCourseTwin();
    setCourseTwinResult(result);
    setCourseTwinOpen(true);
    toast[result.status === "stable" ? "success" : "warning"](`Course Digital Twin: ${result.status.toUpperCase()} · ${result.score}%`);
  };
  const downloadCourseDigitalTwin = () => {
    const result = courseTwinResult || createCurrentCourseTwin();
    downloadBlob(new Blob([JSON.stringify(result, null, 2)], { type: "application/json;charset=utf-8" }), exportFileName(title, "course-digital-twin.json"));
    toast.success("Course Digital Twin report downloaded");
  };
  const runPublicationReadiness = () => {
    const designChecks = runPreviewAudit(false);
    const designScore = designChecks.length ? Math.round((designChecks.filter((check) => check.ok).length / designChecks.length) * 100) : 0;
    const lmsResults = createUniversalLmsPreflight(htmlRef.current, documentLanguage);
    const lmsScore = lmsResults.length ? Math.round(lmsResults.reduce((total, result) => total + result.score, 0) / lmsResults.length) : 0;
    const learning = createLearningExperiencePulse(htmlRef.current, documentLanguage);
    const journey = createLearnerJourneySimulation(htmlRef.current, documentLanguage);
    const constellation = createLearningConstellation(htmlRef.current, title, documentLanguage);
    const digitalTwin = createCurrentCourseTwin();
    let history: DraftSnapshot[] = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as DraftSnapshot[]; } catch { /* A damaged local history is treated as unavailable. */ }
    const change = history[0] ? createSemanticChangeImpact(htmlRef.current, history[0], title, documentLanguage) : null;
    const changeScore = !change ? 70 : change.risk === "low" ? 100 : change.risk === "medium" ? 65 : 20;
    const pillars: ReadinessPillar[] = [
      { id: "accessibility", label: "Accessibility", score: accessibilityScore, status: accessibilityScore < 70 ? "blocked" : accessibilityScore === 100 ? "ready" : "review", evidence: `${pageChecks.filter((check) => check.ok).length}/${pageChecks.length} automated checks passed · ${accessibilityIssueCount} exact issue${accessibilityIssueCount === 1 ? "" : "s"}`, recommendation: accessibilityScore === 100 ? "Accessibility checks are clear." : "Open the issue map and resolve every affected location." },
      { id: "design", label: "Design Preview", score: designScore, status: designScore < 70 ? "blocked" : designScore === 100 ? "ready" : "review", evidence: `${designChecks.filter((check) => check.ok).length}/${designChecks.length || PREVIEW_AUDIT_CHECK_COUNT} visual, responsive, and parity controls passed`, recommendation: designScore === 100 ? "The current preview is stable across the tested conditions." : "Run Preview Audit and inspect the first failed control." },
      { id: "lms", label: "LMS Portability", score: lmsScore, status: lmsResults.some((result) => result.score < 60) ? "blocked" : lmsResults.every((result) => result.ready) ? "ready" : "review", evidence: `${lmsResults.filter((result) => result.ready).length}/${lmsResults.length} LMS profiles ready · ${lmsResults.reduce((total, result) => total + result.checks.filter((check) => check.ok).length, 0)} of ${lmsResults.length * 5} signals passed`, recommendation: lmsResults.every((result) => result.ready) ? "Content is portable across all five destination profiles." : "Open LMS Preflight and review the destination-specific signals." },
      { id: "learning", label: "Learning Experience", score: learning.score, status: learning.score < 50 ? "blocked" : learning.score >= 80 ? "ready" : "review", evidence: `${learning.metrics.filter((metric) => metric.score >= 80).length}/6 dimensions strong · ${learning.wordCount} words · ${learning.readingMinutes} min reading`, recommendation: learning.score >= 80 ? "The page exposes a strong instructional path." : "Use Learning Pulse to strengthen the lowest-scoring dimensions." },
      { id: "change", label: "Change Safety", score: changeScore, status: change?.risk === "high" ? "blocked" : change?.risk === "low" ? "ready" : "review", evidence: change ? `${change.risk.toUpperCase()} impact · accessibility ${change.accessibilityBefore}% → ${change.accessibilityAfter}% · ${change.sensitiveChanges.length} sensitive signal${change.sensitiveChanges.length === 1 ? "" : "s"}` : "No manual-save baseline is available for comparison.", recommendation: !change ? "Save intentionally to establish a semantic comparison baseline." : change.risk === "low" ? "No sensitive regression was detected." : "Open Change Impact and review every sensitive modification." },
      { id: "journey", label: "Learner Journey", score: journey.score, status: journey.personas.some((persona) => persona.status === "blocked") ? "blocked" : journey.score >= 80 ? "ready" : "review", evidence: `${journey.personas.filter((persona) => persona.status === "ready").length}/5 inclusive perspectives ready · ${journey.focusStops.length} focus stops · ${journey.readingStops.length} reading stops`, recommendation: journey.score >= 80 && !journey.personas.some((persona) => persona.status === "blocked") ? "The simulated learner journeys are coherent." : "Open Learner Simulator and review each persona-specific friction point." },
      { id: "constellation", label: "Knowledge Architecture", score: constellation.score, status: constellation.status, evidence: `${constellation.nodes.length} semantic nodes · ${constellation.edges.length} relationships · ${constellation.orphanIds.length} unanchored`, recommendation: constellation.status === "ready" ? "The learning constellation forms a coherent knowledge path." : "Open Learning Constellation and close the highlighted architecture gaps." },
      { id: "digital-twin", label: "Course Digital Twin", score: digitalTwin.score, status: digitalTwin.status === "stable" ? "ready" : digitalTwin.status === "critical" ? "blocked" : "review", evidence: `${digitalTwin.scenarios.filter((scenario) => scenario.status === "stable").length}/${digitalTwin.scenarios.length} deployment scenarios stable · ${digitalTwin.criticalScenarioIds.length} critical`, recommendation: digitalTwin.status === "stable" ? "The course twin predicts stable delivery across the modeled conditions." : "Open Course Digital Twin and review the weakest deployment scenarios." },
    ];
    const blockers = pillars.filter((pillar) => pillar.status === "blocked").map((pillar) => `${pillar.label}: ${pillar.evidence}`);
    const recommendations = pillars.filter((pillar) => pillar.status !== "ready").map((pillar) => `${pillar.label}: ${pillar.recommendation}`);
    const weights: Record<ReadinessPillarId, number> = { accessibility: .16, design: .11, lms: .13, learning: .12, change: .1, journey: .14, constellation: .11, "digital-twin": .13 };
    const score = Math.round(pillars.reduce((total, pillar) => total + pillar.score * weights[pillar.id], 0));
    const status: PublicationReadinessResult["status"] = blockers.length ? "BLOCKED" : pillars.every((pillar) => pillar.status === "ready") ? "READY" : "REVIEW";
    const result: PublicationReadinessResult = {
      status,
      score,
      generatedAt: new Date().toISOString(),
      fingerprint: stableContentFingerprint(`${title.trim()}|${documentLanguage}|${lmsProfile}|${htmlRef.current.replace(/\s+/g, " ").trim()}`),
      profile: lmsProfile,
      owner: "Eduardo Augusto García Rodríguez",
      pillars,
      blockers,
      recommendations,
    };
    setPublicationReadiness(result);
    setReadinessCenterOpen(true);
    toast[status === "READY" ? "success" : "warning"](`Publication readiness: ${status} · ${score}%`);
  };
  const downloadReadinessPassport = () => {
    if (!publicationReadiness) return;
    const passport = {
      schema: "ultrapage-readiness-passport/v1",
      application: "UltraPage Studio",
      document: { title: title || "Untitled document", language: documentLanguage, targetLms: lmsProfiles[publicationReadiness.profile].label },
      ...publicationReadiness,
      notice: "The fingerprint identifies this audited content state; it is not a digital signature or legal certification.",
    };
    downloadBlob(new Blob([JSON.stringify(passport, null, 2)], { type: "application/json;charset=utf-8" }), exportFileName(title, "readiness-passport.json"));
    toast.success("Readiness Passport downloaded", { description: `${publicationReadiness.status} · ${publicationReadiness.fingerprint}` });
  };
  const openReadinessPillar = (pillar: ReadinessPillarId) => {
    setReadinessCenterOpen(false);
    if (pillar === "accessibility") { setSidePanelTab("review"); setRightPanel(true); return; }
    if (pillar === "design") { runPreviewAudit(true); return; }
    if (pillar === "lms") { runUniversalLmsPreflight(); return; }
    if (pillar === "learning") { runLearningExperiencePulse(); return; }
    if (pillar === "change") { runSemanticChangeImpact(); return; }
    if (pillar === "journey") { runLearnerJourneySimulator(); return; }
    if (pillar === "digital-twin") { runCourseDigitalTwin(); return; }
    runLearningConstellation();
  };
  const plainText = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&lt;|&gt;|&#39;|&quot;/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  const characterCount = plainText.length;
  const documentOutline = Array.from(html.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi), (match, index) => ({
    level: Number(match[1]),
    text: match[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim() || `Header H${match[1]} sin texto`,
    index,
  }));
  const focusHeading = (index: number) => {
    setMode("visual");
    window.requestAnimationFrame(() => {
      const heading = editor.current?.querySelectorAll<HTMLElement>("h1,h2,h3,h4")[index];
      if (!heading) return;
      heading.tabIndex = -1;
      heading.scrollIntoView({ behavior: "smooth", block: "center" });
      heading.focus({ preventScroll: true });
    });
  };
  const fitPageWidth = () => {
    const workspaceWidth = document.querySelector<HTMLElement>(".canvas-wrap")?.clientWidth || window.innerWidth;
    const previewWidth = device === "desktop" ? 860 : device === "tablet" ? 720 : 390;
    const availableWidth = Math.max(260, workspaceWidth - 64);
    const fittedZoom = Math.max(50, Math.min(150, Math.floor((availableWidth / previewWidth) * 10) * 10));
    setZoom(fittedZoom);
    toast.success(`Page width fitted to ${fittedZoom}%`);
  };
  const toggleReadAloud = () => {
    if (!("speechSynthesis" in window)) { toast.error("Read Aloud is not supported by this browser"); return; }
    if (readingAloud) {
      window.speechSynthesis.cancel();
      setReadingAloud(false);
      toast.info("Read Aloud stopped");
      return;
    }
    const text = editor.current?.innerText.trim() || new DOMParser().parseFromString(html, "text/html").body.textContent?.trim() || "";
    if (!text) { toast.info("Add content before using Read Aloud"); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = documentLanguage;
    utterance.rate = 1;
    utterance.onend = () => setReadingAloud(false);
    utterance.onerror = () => setReadingAloud(false);
    window.speechSynthesis.speak(utterance);
    setReadingAloud(true);
    toast.success("Read Aloud started", { description: "Select Read Aloud again to stop." });
  };
  const toggleFocusMode = () => {
    setFocusMode((active) => {
      const next = !active;
      if (next) { setRightPanel(false); setRibbonCollapsed(false); }
      toast.success(next ? "Focus Mode enabled" : "Focus Mode disabled");
      return next;
    });
  };
  const resetPreview = () => {
    setDevice("desktop");
    setZoom(100);
    setShowRulers(true);
    setShowMarginGuides(true);
    setShowFormattingMarks(false);
    setShowSemanticMap(false);
    setRulerUnit("in");
    setRightPanel(false);
    toast.success("Design Preview reset");
  };
  const downloadPreviewAuditReport = () => {
    if (!previewAuditChecks.length) {
      runPreviewAudit(true);
      toast.info("Preview Audit was refreshed", { description: "Select Download Report again when the results appear." });
      return;
    }
    const generatedAt = new Date().toISOString();
    const passed = previewAuditChecks.filter((check) => check.ok).length;
    const dimensions = pageDimensions(pageSetup);
    const lines = [
      "UltraPage Studio — Design Preview Audit",
      "========================================",
      `Generated: ${generatedAt}`,
      `Document: ${title || "Untitled document"}`,
      `Target LMS: ${lmsProfiles[lmsProfile].label}`,
      `Language: ${languageLabels[documentLanguage]}`,
      `Page: ${pageSizes[pageSetup.size].label} · ${dimensions.width} × ${dimensions.height} in · ${pageSetup.orientation} · ${pageMargins[pageSetup.margin].label} margins`,
      `Active preview: ${device} at ${zoom}%`,
      `Result: ${passed}/${previewAuditChecks.length} checks passed`,
      "",
      "Responsive device matrix",
      ...previewDeviceResults.map((result) => `${result.ok ? "PASS" : "REVIEW"} · ${result.label} (${result.width}px): ${result.detail}`),
      "",
      "Audit checks",
      ...previewAuditChecks.map((check, index) => `${index + 1}. ${check.ok ? "PASS" : "REVIEW"} · ${check.label}: ${check.detail}${check.location ? ` · Location: ${check.location.label}` : ""}`),
      "",
      "Automated results support review but do not guarantee legal or LMS conformance.",
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), exportFileName(title, "preview-audit.txt"));
    toast.success("Preview Audit report downloaded", { description: `${passed}/${previewAuditChecks.length} checks passed.` });
  };
  const handleEditorInput = (event: React.FormEvent<HTMLDivElement>) => {
    applyAutomaticFirstLineIndentation(event.currentTarget, documentLanguage);
    applyPreviewKeyboardSemantics(event.currentTarget);
    const next = event.currentTarget.innerHTML;
    htmlRef.current = next;
    setHtml(next);
    setSaved(false);
  };
  const availableRibbonTabs: RibbonTab[] = ["file", "home", "insert", "layout", "references", "review", "view", "tools", ...(selectionContext === "table" ? ["table" as const] : []), ...(selectionContext === "picture" ? ["picture" as const] : []), ...(selectionContext === "link" ? ["link" as const] : [])];
  const handleRibbonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const tabs = availableRibbonTabs;
    const currentIndex = tabs.indexOf(ribbonTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setRibbonTab(nextTab);
    window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-ribbon-tab="${nextTab}"]`)?.focus());
  };
  const executeRibbonCommand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = ribbonCommand.trim().toLowerCase();
    const openRibbonTab = (tab: typeof ribbonTab) => { changeMode("visual"); setRibbonTab(tab); setRibbonCollapsed(false); };
    const actions: Record<string, () => void> = {
      "new document": newDocument, "open document": () => localFileInput.current?.click(), "save document": save,
      "home tools": () => openRibbonTab("home"), "insert content": () => openRibbonTab("insert"), "page layout": () => openRibbonTab("layout"),
      "references": () => openRibbonTab("references"), "review": () => openRibbonTab("review"), "view": () => openRibbonTab("view"), "native tools": () => openRibbonTab("tools"),
      "open estiloapa": () => { window.location.href = "/tools#apa"; },
      "open txt test generator": () => { window.location.href = "/tools#txt"; },
      "open qti 2.1": () => { window.location.href = "/tools#qti"; },
      "accessibility review": () => { setSidePanelTab("review"); setRightPanel(true); }, "preview audit": () => runPreviewAudit(true), "publication readiness command center": runPublicationReadiness, "course digital twin": runCourseDigitalTwin, "inclusive learner journey simulator": runLearnerJourneySimulator, "learning constellation map": runLearningConstellation, "universal lms preflight": runUniversalLmsPreflight, "learning experience pulse": runLearningExperiencePulse, "semantic change impact": runSemanticChangeImpact, "document outline": () => { setSidePanelTab("outline"); setRightPanel(true); },
      "blackboard audit": runBlackboardPreviewAudit, "next preview issue": () => navigatePreviewIssue(1), "previous preview issue": () => navigatePreviewIssue(-1),
      "inspect selection html": inspectDesignSelectionInHtml, "open split view": openHtmlSplit,
      "table tools": () => selectionContext === "table" ? openRibbonTab("table") : toast.info("Select a table cell first"),
      "picture tools": () => selectionContext === "picture" ? openRibbonTab("picture") : toast.info("Select an image first"),
      "link tools": () => selectionContext === "link" ? openRibbonTab("link") : toast.info("Select a link first"),
      "final preview": () => changeMode("ultra"), "html editor": () => changeMode("html"), "desktop preview": () => setDevice("desktop"), "tablet preview": () => setDevice("tablet"), "mobile preview": () => setDevice("mobile"),
      "show rulers": () => setShowRulers(true), "hide rulers": () => setShowRulers(false), "show margin guides": () => setShowMarginGuides(true), "hide margin guides": () => setShowMarginGuides(false),
      "show formatting marks": () => setShowFormattingMarks(true), "hide formatting marks": () => setShowFormattingMarks(false),
      "show structure map": () => setShowSemanticMap(true), "hide structure map": () => setShowSemanticMap(false),
      "compare previews": () => setPreviewCompareOpen(true), "read aloud": toggleReadAloud, "stop reading": toggleReadAloud,
      "download preview report": downloadPreviewAuditReport,
      "focus mode": () => { if (!focusMode) toggleFocusMode(); }, "exit focus mode": () => { if (focusMode) toggleFocusMode(); },
      "page width": fitPageWidth, "reset view": resetPreview,
      "table of contents": generateTableOfContents, "clear formatting": clearFormatting, "copy": () => command("copy"), "cut": () => command("cut"), "paste plain text": pastePlainText, "format painter": useFormatPainter,
    };
    const action = actions[value];
    if (!action) { toast.info("Choose a command from the list"); return; }
    action(); setRibbonCommand("");
  };

  const activeLms = lmsProfiles[lmsProfile];
  const configuredPage = pageDimensions(pageSetup);
  const configuredMargin = pageMargins[pageSetup.margin];
  const pageCanvasStyle = {
    zoom: `${zoom}%`,
    "--page-ratio": configuredPage.height / configuredPage.width,
    "--page-margin-x": `${(configuredMargin.horizontal / configuredPage.width) * 100}%`,
    "--page-margin-y": `calc(100cqw * ${configuredMargin.vertical / configuredPage.width})`,
  } as React.CSSProperties;
  const finalPreviewMarkup = lmsHtml;
  const liveSelectionStyles = `[data-ultrapage-live-selected="true"]{outline:4px solid #6b38d1!important;outline-offset:4px!important;background-color:rgba(255,237,153,.42)!important;box-shadow:0 0 0 8px rgba(107,56,209,.13)!important;scroll-margin:80px}`;
  const finalPreviewDocument = `<!doctype html><html lang="${documentLanguage}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>*{box-sizing:border-box}html{background:#f3f4f7}body{margin:0;padding:32px;background:#fff;color:#242a36;font-family:Arial,'Segoe UI',sans-serif;min-height:100vh}${liveSelectionStyles}@media(max-width:600px){body{padding:20px 16px}}</style></head><body>${finalPreviewMarkup}</body></html>`;
  const sourcePreviewDocument = `<!doctype html><html lang="${documentLanguage}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${exportedPageStyles}${liveSelectionStyles}</style></head><body><main class="ultra-page">${html}</main></body></html>`;
  const activeCode = codeView === "lms" ? formatHtmlFragment(lmsHtml) : html;
  useEffect(() => {
    setLiveSelection((current) => {
      if (!current) return null;
      const opening = findOpeningTagByOrdinal(activeCode, current.tag, current.ordinal);
      if (!opening) return null;
      const refreshed = current.selectedText ? findTextWithinElement(activeCode, opening, current.tag, current.selectedText) || opening : opening;
      const position = sourcePosition(activeCode, refreshed.offset);
      return { ...current, offset: refreshed.offset, length: refreshed.length, line: position.line, column: position.column };
    });
  }, [activeCode, codeView]);
  const codeLineCount = activeCode ? activeCode.split(/\r?\n/).length : 0;
  const htmlDiagnostics = useMemo(() => analyzeHtmlSource(activeCode), [activeCode]);
  const htmlErrors = htmlDiagnostics.filter((item) => item.severity === "error").length;
  const htmlWarnings = htmlDiagnostics.length - htmlErrors;
  const htmlTagPath = useMemo(() => getHtmlTagPath(activeCode, Math.min(codeCaret, activeCode.length)), [activeCode, codeCaret]);
  const codePreviewDocument = codeView === "lms" ? finalPreviewDocument : sourcePreviewDocument;
  const previewChecksPassed = previewAuditChecks.filter((check) => check.ok).length;
  const previewChecksTotal = previewAuditChecks.length || PREVIEW_AUDIT_CHECK_COUNT;

  return <main className={`min-h-screen bg-[#f4f6f9] text-[#172033] ${focusMode ? "focus-mode" : ""}`}>
    <style>{pagePrintCss(pageSetup)}</style>
    <Toaster position="bottom-right" richColors />
    <UniversalLmsPreflightDialog open={universalPreflightOpen} onOpenChange={setUniversalPreflightOpen} results={universalPreflightResults} activeProfile={lmsProfile} onSelectProfile={(profile) => { setLmsProfile(profile); setSaved(false); setUniversalPreflightOpen(false); runPreviewAudit(true, profile); }} onDownload={downloadUniversalPreflightReport}/>
    <LearningExperiencePulseDialog open={learningPulseOpen} onOpenChange={setLearningPulseOpen} result={learningPulseResult} onDownload={downloadLearningExperienceReport}/>
    <SemanticChangeImpactDialog open={semanticChangeOpen} onOpenChange={setSemanticChangeOpen} result={semanticChangeResult} onDownload={downloadSemanticChangeReport}/>
    <LearnerJourneyDialog open={learnerJourneyOpen} onOpenChange={setLearnerJourneyOpen} result={learnerJourneyResult} onDownload={downloadLearnerJourneyReport}/>
    <LearningConstellationDialog open={learningConstellationOpen} onOpenChange={setLearningConstellationOpen} result={learningConstellationResult} onDownload={downloadLearningConstellation}/>
    <CourseDigitalTwinDialog open={courseTwinOpen} onOpenChange={setCourseTwinOpen} result={courseTwinResult} onDownload={downloadCourseDigitalTwin}/>
    <PublicationReadinessDialog open={readinessCenterOpen} onOpenChange={setReadinessCenterOpen} result={publicationReadiness} onDownload={downloadReadinessPassport} onOpenPillar={openReadinessPillar}/>
    <input ref={localFileInput} className="sr-only" type="file" accept=".html,.htm,.txt,.docx,.ultrapage.json,.json,text/html,text/plain,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => importLocalDocument(event.target.files?.[0])} aria-label="Open an HTML, TXT, Word, or UltraPage project file"/>
    <header className="topbar">
      <div className="brandmark" aria-hidden="true"><img src="/brand/ultrapage-mark.svg" alt="" /></div><div className="brandcopy"><strong>UltraPage Studio</strong><span>Accessible editor for every LMS</span></div>
      <label className="lms-profile-picker"><span>Target LMS</span><select value={lmsProfile} onChange={(event) => { setLmsProfile(event.target.value as LmsProfile); setSaved(false); }} aria-label="Target learning management system">{Object.entries(lmsProfiles).map(([value, profile]) => <option key={value} value={value}>{profile.label}</option>)}</select></label>
      <div className="header-actions"><Button className="save-button" onClick={save}><Save size={16}/> Save</Button></div>
    </header>
    <div className={`workspace ${rightPanel ? "panel-open" : ""}`}>
      <aside className="leftbar" aria-label="Workspace navigation"><button className={`rail-button ${mode === "visual" ? "active" : ""}`} aria-label="Open Design editor" title="Design editor" aria-pressed={mode === "visual"} onClick={() => setMode("visual")}><FileText /></button><button className={`rail-button ${rightPanel && sidePanelTab === "review" ? "active" : ""}`} aria-label="Open accessibility review" title="Accessibility review" aria-pressed={rightPanel && sidePanelTab === "review"} onClick={() => { setSidePanelTab("review"); setRightPanel(true); }}><Accessibility /></button><button className={`rail-button ${mode === "html" ? "active" : ""}`} aria-label="Open HTML editor" title="HTML editor" aria-pressed={mode === "html"} onClick={() => setMode("html")}><Code2 /></button><div className="rail-spacer" /><button className="avatar" aria-label="User profile">EG</button></aside>
      <section className="editor-shell">
        <div className="document-head"><div><div className="breadcrumbs"><span>Standalone editor</span><span>/</span><span>Document</span></div><input className="title-input" value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} aria-label="Page title" /><label className="document-language"><span>Document language</span><select value={documentLanguage} onChange={(event) => { setDocumentLanguage(event.target.value as DocumentLanguage); setSaved(false); }} aria-label="Primary document language"><option value="es-PR">Español (Puerto Rico)</option><option value="en-US">English (United States)</option></select></label></div><button type="button" className="mobile-panel-toggle" onClick={() => setRightPanel(true)} aria-expanded={rightPanel} aria-controls="editor-side-panel"><PanelRight size={16}/> Insights</button></div>
        <Tabs value={mode} onValueChange={changeMode} className="editor-tabs">
          <div className={`ribbon-shell ${mode === "visual" ? "" : "ribbon-compact"} ${ribbonCollapsed ? "ribbon-collapsed" : ""}`}>
            <div className="ribbon-nav">
              <TabsList className="mode-tabs"><TabsTrigger value="visual">Design</TabsTrigger><TabsTrigger value="ultra">Final Preview</TabsTrigger><TabsTrigger value="html">HTML</TabsTrigger></TabsList>
              {mode === "visual" && <div className="ribbon-tabs" role="tablist" aria-label="Editor ribbon">
                {availableRibbonTabs.map((tab) => <button key={tab} id={`ribbon-tab-${tab}`} type="button" role="tab" data-ribbon-tab={tab} data-contextual={tab === "table" || tab === "picture" || tab === "link" ? tab : undefined} aria-controls="ribbon-panel" aria-selected={ribbonTab === tab} tabIndex={ribbonTab === tab ? 0 : -1} className={`${ribbonTab === tab ? "active" : ""} ${tab === "table" || tab === "picture" || tab === "link" ? `contextual ${tab}` : ""}`.trim()} onKeyDown={handleRibbonKeyDown} onClick={() => { setRibbonTab(tab); setRibbonCollapsed(false); }}>{tab[0].toUpperCase() + tab.slice(1)}{(tab === "table" || tab === "picture" || tab === "link") && <span className="sr-only"> contextual tools</span>}</button>)}
              </div>}
              {mode === "visual" && <form className="ribbon-command-search" onSubmit={executeRibbonCommand} role="search"><Search aria-hidden="true"/><label className="sr-only" htmlFor="ribbon-command-input">Search ribbon commands</label><input id="ribbon-command-input" list="ribbon-command-options" value={ribbonCommand} onChange={(event) => setRibbonCommand(event.target.value)} placeholder="Search commands" autoComplete="off"/><datalist id="ribbon-command-options">{["New document","Open document","Save document","Home tools","Insert content","Page layout","References","Review","View","Native tools","Open EstiloAPA","Open TXT Test Generator","Open QTI 2.1","Table tools","Picture tools","Link tools","Accessibility review","Preview audit","Publication Readiness Command Center","Course Digital Twin","Inclusive Learner Journey Simulator","Learning Constellation Map","Universal LMS Preflight","Learning Experience Pulse","Semantic Change Impact","Blackboard audit","Next preview issue","Previous preview issue","Download preview report","Document outline","Final preview","HTML editor","Desktop preview","Tablet preview","Mobile preview","Compare previews","Read aloud","Stop reading","Focus mode","Exit focus mode","Page width","Reset view","Show rulers","Hide rulers","Show margin guides","Hide margin guides","Show formatting marks","Hide formatting marks","Show structure map","Hide structure map","Table of contents","Copy","Cut","Paste plain text","Format painter","Clear formatting"].map((item) => <option key={item} value={item}/>)}</datalist></form>}
              {mode === "visual" && <div className="ribbon-quick" role="group" aria-label="Quick access"><button type="button" onClick={() => command("undo")} aria-label="Undo" title="Undo"><Undo2 /></button><button type="button" onClick={() => command("redo")} aria-label="Redo" title="Redo"><Redo2 /></button><button type="button" className={ribbonCollapsed ? "collapsed" : ""} aria-expanded={!ribbonCollapsed} aria-controls="ribbon-panel" onClick={() => setRibbonCollapsed((collapsed) => !collapsed)} aria-label={ribbonCollapsed ? "Expand ribbon" : "Collapse ribbon"} title={ribbonCollapsed ? "Expand ribbon" : "Collapse ribbon"}><ChevronDown /></button></div>}
            </div>
            {mode === "visual" && !ribbonCollapsed && <div id="ribbon-panel" className="ribbon-panel" role="tabpanel" aria-labelledby={`ribbon-tab-${ribbonTab}`}>
              {ribbonTab === "file" && <>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={newDocument}><FilePlus2/><span>New</span></button><button type="button" className="ribbon-command" onClick={() => localFileInput.current?.click()}><Upload/><span>Open</span></button><button type="button" className="ribbon-command" onClick={save}><Save/><span>Save</span></button><ExportDialog ribbon html={html} title={title} language={documentLanguage} lmsProfile={lmsProfile} author={documentAuthor} description={documentDescription} pageSetup={pageSetup} downloadHtml={downloadDocument}/><button type="button" className="ribbon-command" onClick={() => window.print()}><Printer/><span>Print</span></button></div><span className="ribbon-group-label">Document</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={copyHtml}><Copy/><span>Copy for {activeLms.shortLabel}</span></button></div><span className="ribbon-group-label">Publish</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><HistoryDialog restoreSnapshot={restoreSnapshot} ribbon/><DocumentPropertiesDialog author={documentAuthor} description={documentDescription} setAuthor={setDocumentAuthor} setDescription={setDocumentDescription} ribbon/><ApplicationAboutDialog/></div><span className="ribbon-group-label">Information</span></div>
              </>}
              {ribbonTab === "home" && <>
                <div className="ribbon-group ribbon-clipboard-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => command("copy")} title="Copy selected content"><Copy/><span>Copy</span></button><button type="button" className="ribbon-command" onClick={() => command("cut")} title="Cut selected content"><Scissors/><span>Cut</span></button><button type="button" className="ribbon-command" onClick={pastePlainText} title="Paste without source formatting"><ClipboardPaste/><span>Paste Text</span></button><button type="button" className={`ribbon-command ${capturedFormat ? "is-active" : ""}`} aria-pressed={Boolean(capturedFormat)} onClick={useFormatPainter} title={capturedFormat ? "Apply captured formatting" : "Capture formatting"}><Palette/><span>Format Painter</span></button><button type="button" className="ribbon-command" onClick={clearFormatting} aria-label="Clear formatting" title="Clear formatting from the selected text"><Eraser/><span>Clear</span></button></div><span className="ribbon-group-label">Clipboard & Formatting</span></div>
                <div className="ribbon-group ribbon-font-group"><div className="ribbon-group-body"><div className="ribbon-select-row"><label className="toolbar-select-label font-family-select"><span className="sr-only">Font family</span><select defaultValue="" onChange={(event) => applyFont(event.target.value)} aria-label="Font family"><option value="" disabled>Font family</option><option value="Arial">Arial</option><option value="Calibri">Calibri</option><option value="Georgia">Georgia</option><option value="Tahoma">Tahoma</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option></select></label><label className="toolbar-select-label font-size-select"><span className="sr-only">Font size</span><select defaultValue="" onChange={(event) => applyFontSize(event.target.value)} aria-label="Font size"><option value="" disabled>Size</option><option value="10">10 px</option><option value="12">12 px</option><option value="14">14 px</option><option value="16">16 px</option><option value="18">18 px</option><option value="24">24 px</option><option value="32">32 px</option><option value="40">40 px</option></select></label></div><div className="ribbon-icon-row"><button type="button" className={activeFormats.bold ? "is-active" : ""} aria-pressed={activeFormats.bold} onClick={() => command("bold")} aria-label="Bold" title="Bold"><Bold/></button><button type="button" className={activeFormats.italic ? "is-active" : ""} aria-pressed={activeFormats.italic} onClick={() => command("italic")} aria-label="Italic" title="Italic"><Italic/></button><button type="button" className={activeFormats.underline ? "is-active" : ""} aria-pressed={activeFormats.underline} onClick={() => command("underline")} aria-label="Underline" title="Underline"><Underline/></button><button type="button" className={activeFormats.strikeThrough ? "is-active" : ""} aria-pressed={activeFormats.strikeThrough} onClick={() => command("strikeThrough")} aria-label="Strikethrough" title="Strikethrough"><Strikethrough/></button><button type="button" className={activeFormats.subscript ? "is-active" : ""} aria-pressed={activeFormats.subscript} onClick={() => command("subscript")} aria-label="Subscript" title="Subscript"><Subscript/></button><button type="button" className={activeFormats.superscript ? "is-active" : ""} aria-pressed={activeFormats.superscript} onClick={() => command("superscript")} aria-label="Superscript" title="Superscript"><Superscript/></button><label className="ribbon-color-picker" title="Text color"><Palette/><input type="color" value={ribbonTextColor} onChange={(event) => { setRibbonTextColor(event.target.value); command("foreColor", event.target.value); }} aria-label="Text color"/></label><label className="ribbon-color-picker" title="Highlight color"><Highlighter/><input type="color" value={ribbonHighlightColor} onChange={(event) => { setRibbonHighlightColor(event.target.value); command("hiliteColor", event.target.value); }} aria-label="Highlight color"/></label></div></div><span className="ribbon-group-label">Font</span></div>
                <div className="ribbon-group ribbon-paragraph-group"><div className="ribbon-group-body"><div className="ribbon-icon-row"><button type="button" className={activeFormats.unorderedList ? "is-active" : ""} aria-pressed={activeFormats.unorderedList} onClick={() => command("insertUnorderedList")} aria-label="Bulleted list" title="Bulleted list"><List/></button><button type="button" className={activeFormats.orderedList ? "is-active" : ""} aria-pressed={activeFormats.orderedList} onClick={() => command("insertOrderedList")} aria-label="Numbered list" title="Numbered list"><ListOrdered/></button><button type="button" onClick={() => command("outdent")} aria-label="Decrease indent" title="Decrease indent"><Rows3 className="indent-decrease"/></button><button type="button" onClick={() => command("indent")} aria-label="Increase indent" title="Increase indent"><Rows3/></button><button type="button" className={activeFormats.alignLeft ? "is-active" : ""} aria-pressed={activeFormats.alignLeft} onClick={() => command("justifyLeft")} aria-label="Align left" title="Align left"><AlignLeft/></button><button type="button" className={activeFormats.alignCenter ? "is-active" : ""} aria-pressed={activeFormats.alignCenter} onClick={() => command("justifyCenter")} aria-label="Center" title="Center"><AlignCenter/></button><button type="button" className={activeFormats.alignRight ? "is-active" : ""} aria-pressed={activeFormats.alignRight} onClick={() => command("justifyRight")} aria-label="Align right" title="Align right"><AlignRight/></button><button type="button" className={activeFormats.alignJustify ? "is-active" : ""} aria-pressed={activeFormats.alignJustify} onClick={() => command("justifyFull")} aria-label="Justify" title="Justify"><AlignJustify/></button></div></div><span className="ribbon-group-label">Paragraph</span></div>
                <div className="ribbon-group ribbon-styles-group"><div className="ribbon-group-body ribbon-style-gallery">{[["p","Paragraph"],["h1","H1"],["h2","H2"],["h3","H3"],["h4","H4"]].map(([tag,label]) => <button type="button" key={tag} className={activeBlock === tag ? "is-active" : ""} aria-pressed={activeBlock === tag} onClick={() => command("formatBlock", tag)}><span className={`style-preview style-${tag}`}>{label}</span></button>)}</div><span className="ribbon-group-label">Styles</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><AdvancedToolsDialog command={command} replaceText={replaceText}/></div><span className="ribbon-group-label">Editing</span></div>
              </>}
              {ribbonTab === "insert" && <>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><LinkDialog insertLink={insertAccessibleLink}/><ImageDialog insertImage={insertAccessibleImage}/><MediaDialog insertMedia={insertAccessibleMedia}/><EquationDialog insertEquation={insertAccessibleEquation}/></div><span className="ribbon-group-label">Media & Links</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><TableDialog insertMarkup={insertMarkup} language={documentLanguage}/></div><span className="ribbon-group-label">Tables</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><ContentDialog documentLanguage={documentLanguage} documentAuthor={documentAuthor} documentDescription={documentDescription} pageSetup={pageSetup} trigger={<button className="ribbon-command" aria-label="Insert from Content Collection"><ImagePlus/><span>Content</span></button>} search={search} setSearch={setSearch} files={filteredFiles} insertFile={insertFile} documentHtml={html} documentFileName={documentFileName} openDocument={openDocument} newDocument={newDocument}/><button type="button" className="ribbon-command" onClick={() => command("insertHTML", documentLanguage === "es-PR" ? '<div class="callout"><strong>Importante</strong><p>Escriba aquí la información destacada.</p></div>' : '<div class="callout"><strong>Important</strong><p>Enter the highlighted information here.</p></div>')}><Plus/><span>Callout</span></button><button type="button" className="ribbon-command" onClick={() => command("insertHorizontalRule")}><Minus/><span>Divider</span></button><button type="button" className="ribbon-command" onClick={() => command("formatBlock", "blockquote")}><Quote/><span>Quote</span></button></div><span className="ribbon-group-label">Elements</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => command("insertHTML", documentLanguage === "es-PR" ? '<h2>Objetivos de aprendizaje</h2><ul><li>Objetivo 1</li><li>Objetivo 2</li></ul>' : '<h2>Learning Objectives</h2><ul><li>Objective 1</li><li>Objective 2</li></ul>')}><List/><span>Objectives</span></button><button type="button" className="ribbon-command" onClick={() => command("insertHTML", documentLanguage === "es-PR" ? '<div class="callout"><strong>Instrucciones</strong><p>Complete los siguientes pasos.</p></div>' : '<div class="callout"><strong>Instructions</strong><p>Complete the following steps.</p></div>')}><FileText/><span>Instructions</span></button><ModuleTemplateDialog insertMarkup={insertMarkup} hasH1={/<h1\b/i.test(html)} language={documentLanguage} ribbon/></div><span className="ribbon-group-label">Templates</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => { const now = new Date(); command("insertHTML", `<time datetime="${now.toISOString()}">${new Intl.DateTimeFormat(documentLanguage, { dateStyle: "long", timeStyle: "short" }).format(now)}</time>`); }}><CalendarDays/><span>Date & Time</span></button><button type="button" className="ribbon-command" onClick={() => command("insertHTML", '<hr class="ultrapage-page-break" style="break-after:page;page-break-after:always" aria-label="Page break">')}><FileText/><span>Page Break</span></button></div><span className="ribbon-group-label">Document Parts</span></div>
              </>}
              {ribbonTab === "layout" && <>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><PageSetupDialog value={pageSetup} onChange={(next) => { setPageSetup(next); setSaved(false); }}/><WatermarkDialog applyWatermark={applyWatermark} removeWatermark={removeWatermark}/></div><span className="ribbon-group-label">Page</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-layout-fields"><div className="ribbon-select-row"><label className="toolbar-select-label line-spacing-select"><span className="sr-only">Line spacing</span><select defaultValue="" onChange={(event) => applyLineSpacing(event.target.value)} aria-label="Line spacing"><option value="" disabled>Line spacing</option><option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0 double</option><option value="2.5">2.5</option></select></label><label className="toolbar-select-label indentation-select"><span className="sr-only">Paragraph indentation</span><select defaultValue="" onChange={(event) => applyIndentation(event.target.value)} aria-label="Paragraph indentation"><option value="" disabled>Indentation</option><option value="first-line">First line (0.5″)</option><option value="left">Entire paragraph (0.5″)</option><option value="hanging">Hanging indent (0.5″)</option><option value="none">Remove indentation</option></select></label></div><label className="toolbar-select-label paragraph-spacing-select"><span className="sr-only">Space after paragraph</span><select defaultValue="" onChange={(event) => applyParagraphSpacing(event.target.value)} aria-label="Space after selected paragraphs"><option value="" disabled>Space after paragraph</option><option value="default">Theme default</option><option value="0">0 px</option><option value="8">8 px</option><option value="12">12 px</option><option value="16">16 px</option><option value="24">24 px</option></select></label><p className="ribbon-hint">Paragraphs with 4+ sentences receive an automatic 0.5″ first-line indent.</p></div><span className="ribbon-group-label">Paragraph Layout</span></div>
              </>}
              {ribbonTab === "references" && <>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><ApaDialog insertMarkup={insertMarkup} language={documentLanguage}/><RubricDialog insertMarkup={insertMarkup} language={documentLanguage}/><button type="button" className="ribbon-command" onClick={generateTableOfContents}><BookOpen/><span>Contents</span></button></div><span className="ribbon-group-label">Academic Documents</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => command("insertHTML", documentLanguage === "es-PR" ? '<p class="apa-reference">Autor, A. A. (Año). <em>Título de la obra</em>. Editorial.</p>' : '<p class="apa-reference">Author, A. A. (Year). <em>Title of work</em>. Publisher.</p>')}><FileText/><span>Reference</span></button><button type="button" className="ribbon-command" onClick={() => command("superscript")}><Superscript/><span>Superscript</span></button></div><span className="ribbon-group-label">References</span></div>
              </>}
              {ribbonTab === "review" && <>
                <div className="ribbon-group ribbon-review-score"><div className="ribbon-group-body"><button type="button" className="ribbon-score-button" onClick={() => { setSidePanelTab("review"); setRightPanel(true); }}><span>{accessibilityScore}</span><strong>Accessibility</strong><small>{accessibilityIssueCount} issue{accessibilityIssueCount === 1 ? "" : "s"}</small></button></div><span className="ribbon-group-label">Review</span></div>
                <div className="ribbon-group ribbon-preflight-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command ribbon-ready-center-command" onClick={runPublicationReadiness}><Check/><span>Ready Center</span></button><button type="button" className="ribbon-command ribbon-twin-command" onClick={runCourseDigitalTwin}><Monitor/><span>Course Twin</span></button><button type="button" className="ribbon-command ribbon-constellation-command" onClick={runLearningConstellation}><Orbit/><span>Constellation</span></button><button type="button" className="ribbon-command ribbon-journey-command" onClick={runLearnerJourneySimulator}><Accessibility/><span>Learner Simulator</span></button><button type="button" className="ribbon-command ribbon-preflight-command" onClick={runUniversalLmsPreflight}><Sparkles/><span>LMS Preflight</span></button><button type="button" className="ribbon-command ribbon-learning-pulse-command" onClick={runLearningExperiencePulse}><BookOpen/><span>Learning Pulse</span></button><button type="button" className="ribbon-command ribbon-change-impact-command" onClick={runSemanticChangeImpact}><History/><span>Change Impact</span></button></div><span className="ribbon-group-label">Publishing Intelligence</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={repairAccessibility}><Accessibility/><span>Safe Fix</span></button><button type="button" className={`ribbon-command ${spellCheckEnabled ? "is-active" : ""}`} aria-pressed={spellCheckEnabled} onClick={() => setSpellCheckEnabled((enabled) => !enabled)}><Check/><span>Spelling</span></button><button type="button" className={`ribbon-command ${readingAloud ? "is-active" : ""}`} aria-pressed={readingAloud} onClick={toggleReadAloud}><Volume2/><span>{readingAloud ? "Stop Reading" : "Read Aloud"}</span></button></div><span className="ribbon-group-label">Proofing</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" disabled={!accessibilityIssueMap.length} onClick={() => navigateAccessibilityIssue(-1)}><ChevronDown className="issue-previous"/><span>Previous</span></button><button type="button" className="ribbon-command" disabled={!accessibilityIssueMap.length} onClick={() => navigateAccessibilityIssue(1)}><ChevronDown/><span>Next Issue</span></button><button type="button" className="ribbon-command" onClick={() => { setSidePanelTab("review"); setRightPanel(true); }}><Eye/><span>Issue Map</span></button></div><span className="ribbon-group-label">Accessibility Navigation</span></div>
              </>}
              {ribbonTab === "view" && <>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className={`ribbon-command ${device === "desktop" ? "is-active" : ""}`} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor/><span>Desktop</span></button><button type="button" className={`ribbon-command ${device === "tablet" ? "is-active" : ""}`} aria-pressed={device === "tablet"} onClick={() => setDevice("tablet")}><Tablet/><span>Tablet</span></button><button type="button" className={`ribbon-command ${device === "mobile" ? "is-active" : ""}`} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone/><span>Mobile</span></button></div><span className="ribbon-group-label">Responsive Preview</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-zoom-controls"><button type="button" onClick={() => setZoom((value) => Math.max(50, value - 10))} aria-label="Zoom out"><ZoomOut/></button><label><span className="sr-only">Document zoom</span><select value={zoom} onChange={(event) => setZoom(Number(event.target.value))} aria-label="Document zoom"><option value="50">50%</option><option value="75">75%</option><option value="90">90%</option><option value="100">100%</option><option value="110">110%</option><option value="125">125%</option><option value="150">150%</option></select></label><button type="button" onClick={() => setZoom((value) => Math.min(150, value + 10))} aria-label="Zoom in"><ZoomIn/></button><button type="button" onClick={() => setZoom(100)}>100%</button><button type="button" className="fit-width-button" onClick={fitPageWidth}>Page Width</button><button type="button" className="reset-view-button" onClick={resetPreview}>Reset</button></div><span className="ribbon-group-label">Zoom</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className={`ribbon-command ${showRulers ? "is-active" : ""}`} aria-pressed={showRulers} onClick={() => setShowRulers((visible) => !visible)}><Columns3/><span>Rulers</span></button><button type="button" className={`ribbon-command ${showMarginGuides ? "is-active" : ""}`} aria-pressed={showMarginGuides} onClick={() => setShowMarginGuides((visible) => !visible)}><Rows3/><span>Margins</span></button><button type="button" className={`ribbon-command ${showFormattingMarks ? "is-active" : ""}`} aria-pressed={showFormattingMarks} onClick={() => setShowFormattingMarks((visible) => !visible)}><Pilcrow/><span>Marks</span></button><button type="button" className={`ribbon-command ${showSemanticMap ? "is-active" : ""}`} aria-pressed={showSemanticMap} onClick={() => setShowSemanticMap((visible) => !visible)}><Eye/><span>Structure</span></button><button type="button" className="ribbon-command" onClick={() => setRulerUnit((current) => current === "in" ? "cm" : "in")}><Columns3/><span>{rulerUnit === "in" ? "Inches" : "Centimeters"}</span></button></div><span className="ribbon-group-label">Show</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={inspectDesignSelectionInHtml} title="Locate the current Design selection in editable HTML"><Search/><span>Inspect HTML</span></button><button type="button" className="ribbon-command" onClick={openHtmlSplit}><Columns3/><span>Open Split</span></button></div><span className="ribbon-group-label">Design to Code</span></div>
                <div className="ribbon-group ribbon-preview-quality"><div className="ribbon-group-body ribbon-command-row"><button type="button" className={`ribbon-preview-score ${previewAuditChecks.length > 0 && previewChecksPassed === previewChecksTotal ? "ready" : "attention"}`} onClick={() => runPreviewAudit(true)} aria-label={`Run Preview Audit. ${previewChecksPassed} of ${previewChecksTotal} checks passed`}><span>{previewChecksPassed}/{previewChecksTotal}</span><strong>Preview Audit</strong><small>{previewAuditChecks.length ? "Quality gate" : "Run quality gate"}</small></button><PreviewCompareDialog open={previewCompareOpen} onOpenChange={setPreviewCompareOpen} sourceDocument={sourcePreviewDocument} lmsDocument={finalPreviewDocument} lmsLabel={activeLms.label}/><button type="button" className="ribbon-command" onClick={downloadPreviewAuditReport}><Download/><span>Audit Report</span></button></div><span className="ribbon-group-label">Preview Quality</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" disabled={!previewIssueMap.length} onClick={() => navigatePreviewIssue(-1)}><ChevronDown className="issue-previous"/><span>Previous</span></button><button type="button" className="ribbon-command" disabled={!previewIssueMap.length} onClick={() => navigatePreviewIssue(1)}><ChevronDown/><span>Next Issue</span></button><button type="button" className={`ribbon-command ${lmsProfile === "blackboard" ? "is-active" : ""}`} aria-pressed={lmsProfile === "blackboard"} onClick={runBlackboardPreviewAudit}><Stamp/><span>Blackboard Check</span></button></div><span className="ribbon-group-label">Quality Navigation</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className={`ribbon-command ${rightPanel ? "is-active" : ""}`} aria-pressed={rightPanel} onClick={() => setRightPanel((visible) => !visible)}><PanelRight/><span>Insights</span></button><button type="button" className="ribbon-command" onClick={() => { setSidePanelTab("outline"); setRightPanel(true); }}><Heading2/><span>Outline</span></button><button type="button" className={`ribbon-command ${focusMode ? "is-active" : ""}`} aria-pressed={focusMode} onClick={toggleFocusMode}><Maximize2/><span>{focusMode ? "Exit Focus" : "Focus"}</span></button><KeyboardShortcutsDialog ribbon/></div><span className="ribbon-group-label">Workspace</span></div>
              </>}
              {ribbonTab === "tools" && <>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row ribbon-native-tools"><a className="ribbon-command" href="/tools#apa"><BookOpen/><span>EstiloAPA</span></a><a className="ribbon-command" href="/tools#txt"><FileText/><span>TXT Tests</span></a><a className="ribbon-command" href="/tools#qti"><Table2/><span>QTI 2.1</span></a></div><span className="ribbon-group-label">Native UltraPage Tools</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><ContentDialog documentLanguage={documentLanguage} documentAuthor={documentAuthor} documentDescription={documentDescription} pageSetup={pageSetup} trigger={<button className="ribbon-command" aria-label="Open Content Collection"><Cloud/><span>WebDAV</span></button>} search={search} setSearch={setSearch} files={filteredFiles} insertFile={insertFile} documentHtml={html} documentFileName={documentFileName} openDocument={openDocument} newDocument={newDocument}/></div><span className="ribbon-group-label">Connected Services</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-tool-summary"><strong>3 audited native tools</strong><span>DOCX · PDF · HTML · TXT · GIFT · QTI 1.2/2.1</span><small>Open files, compare LMS compatibility, validate, export, and download reports. Original repositories remain independent.</small></div><span className="ribbon-group-label">Studio Integration</span></div>
              </>}
              {ribbonTab === "table" && <>
                <div className="ribbon-group ribbon-context-summary"><div className="ribbon-group-body"><span className="context-badge"><Table2/> Table selected</span></div><span className="ribbon-group-label">Context</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => editSelectedTable("add-row")}><Rows3/><span>Add Row</span></button><button type="button" className="ribbon-command ribbon-danger" onClick={() => editSelectedTable("delete-row")}><Trash2/><span>Delete Row</span></button></div><span className="ribbon-group-label">Rows</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => editSelectedTable("add-column")}><Columns3/><span>Add Column</span></button><button type="button" className="ribbon-command ribbon-danger" onClick={() => editSelectedTable("delete-column")}><Trash2/><span>Delete Column</span></button></div><span className="ribbon-group-label">Columns</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => editSelectedTable("grid")}><Table2/><span>All Borders</span></button><button type="button" className="ribbon-command" onClick={() => editSelectedTable("apa7")}><BookOpen/><span>APA 7</span></button><TableEditDialog editTable={editSelectedTable}/></div><span className="ribbon-group-label">Table Style</span></div>
              </>}
              {ribbonTab === "picture" && <>
                <div className="ribbon-group ribbon-context-summary picture-context"><div className="ribbon-group-body"><span className="context-badge"><FileImage/> Picture {selectedImageSummary ? `${selectedImageSummary.index} of ${selectedImageSummary.total}` : "selected"}</span></div><span className="ribbon-group-label">Context</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><div className={`picture-access-status ${selectedImageSummary?.status || "needs-alt"}`}><span>{selectedImageSummary?.status === "described" ? <Check/> : selectedImageSummary?.status === "decorative" ? <Eraser/> : <AlertTriangle/>}</span><strong>{selectedImageSummary?.status === "described" ? "Alt text ready" : selectedImageSummary?.status === "decorative" ? "Decorative" : "Needs alt text"}</strong><small>{selectedImageSummary?.status === "needs-alt" ? "Not yet accessible" : "Accessibility set"}</small></div><ImagePropertiesDialog getImage={getSelectedImageData} updateImage={updateSelectedImage}/><button type="button" className={`ribbon-command ${selectedImageSummary?.status === "decorative" ? "is-active" : ""}`} onClick={toggleSelectedImageDecorative}><Eraser/><span>{selectedImageSummary?.status === "decorative" ? "Informative" : "Decorative"}</span></button><button type="button" className="ribbon-command" onClick={selectNextImageIssue}><Accessibility/><span>Next Issue</span></button></div><span className="ribbon-group-label">Accessibility</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => arrangeSelectedImage("full")}><ImagePlus/><span>Full Width</span></button></div><span className="ribbon-group-label">Size</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command" onClick={() => arrangeSelectedImage("left")}><AlignLeft/><span>Left</span></button><button type="button" className="ribbon-command" onClick={() => arrangeSelectedImage("center")}><AlignCenter/><span>Center</span></button><button type="button" className="ribbon-command" onClick={() => arrangeSelectedImage("right")}><AlignRight/><span>Right</span></button></div><span className="ribbon-group-label">Image Alignment</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command ribbon-danger" onClick={() => arrangeSelectedImage("delete")}><Trash2/><span>Remove</span></button></div><span className="ribbon-group-label">Picture</span></div>
              </>}
              {ribbonTab === "link" && <>
                <div className="ribbon-group ribbon-context-summary link-context"><div className="ribbon-group-body"><span className="context-badge"><Link2/> Link selected</span></div><span className="ribbon-group-label">Context</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><LinkPropertiesDialog getLink={getSelectedLinkData} updateLink={updateSelectedLink}/><button type="button" className="ribbon-command" onClick={openSelectedLink}><Monitor/><span>Open Link</span></button><button type="button" className="ribbon-command" onClick={copySelectedLinkAddress}><Copy/><span>Copy URL</span></button></div><span className="ribbon-group-label">Link</span></div>
                <div className="ribbon-group"><div className="ribbon-group-body ribbon-command-row"><button type="button" className="ribbon-command ribbon-danger" onClick={removeSelectedLink}><Unlink/><span>Remove Link</span></button></div><span className="ribbon-group-label">Remove</span></div>
              </>}
            </div>}
          </div>
          <TabsContent value="visual" className="canvas-wrap" onScroll={syncPinnedRulers}><div className={`device-frame ${device}`} style={pageCanvasStyle}><div className="ultra-label"><span className="mini-logo" aria-hidden="true"><img src="/brand/ultrapage-mark.svg" alt="" /></span><span>Design Preview</span><span className="design-state">{device[0].toUpperCase() + device.slice(1)} · {zoom}%</span><span className="design-state design-editable">Editable</span>{showSemanticMap && <span className="design-state design-structure">Structure map</span>}{device === "desktop" && <span className="design-state design-paper">{pageSizes[pageSetup.size].label} · {configuredPage.width} × {configuredPage.height} in · {pageSetup.orientation}</span>}<button type="button" className={`design-audit-pill ${previewAuditChecks.length > 0 && previewAuditChecks.every((check) => check.ok) ? "ready" : "attention"}`} onClick={() => runPreviewAudit(true)} aria-label="Open Design Preview audit" title={previewAuditTime ? `Last checked ${previewAuditTime}` : "Run Preview Audit"}><Eye/>{previewChecksPassed}/{previewChecksTotal}</button><span className="ruler-status">{showRulers ? `Rulers: ${rulerUnit === "in" ? "inches" : "centimeters"}` : "Rulers hidden"}</span></div><EditorRulers unit={rulerUnit} device={device} pageWidth={configuredPage.width} pageHeight={configuredPage.height} onToggle={() => setRulerUnit((current) => current === "in" ? "cm" : "in")} showRulers={showRulers} showMarginGuides={showMarginGuides}><div ref={attachEditor} className={`page-canvas ${imageDragActive ? "image-drag-active" : ""} ${showFormattingMarks ? "show-formatting-marks" : ""} ${showSemanticMap ? "show-semantic-map" : ""}`} contentEditable role="textbox" aria-multiline="true" aria-describedby="design-editor-help" lang={documentLanguage} spellCheck={spellCheckEnabled} suppressContentEditableWarning onClick={handleEditorClick} onPaste={handlePaste} onDragEnter={handleImageDragOver} onDragOver={handleImageDragOver} onDragLeave={() => setImageDragActive(false)} onDrop={handleImageDrop} onInput={handleEditorInput} aria-label="Editable page content" />{accessibilitySpotlight && <div className="accessibility-spotlight" style={{ top: accessibilitySpotlight.top, left: accessibilitySpotlight.left, width: accessibilitySpotlight.width, height: accessibilitySpotlight.height }} aria-hidden="true"><span>{accessibilitySpotlight.label}</span></div>}<span id="design-editor-help" className="sr-only">Rich text editing area. Select text or click an image, link, or table cell, then use View → Inspect HTML to locate its exact source in Split view. Use the Ribbon to format content, insert accessible elements, and review the document.</span></EditorRulers></div></TabsContent>
          <TabsContent value="ultra" className="blackboard-preview-wrap"><div className={`device-frame ${device}`} style={{ zoom: `${zoom}%` }}><div className="ultra-label"><span className="mini-logo" aria-hidden="true"><img src="/brand/ultrapage-mark.svg" alt="" /></span><span>Exact {activeLms.label} output</span><span className="final-preview-badge">Read only</span></div><iframe className="blackboard-preview-frame" title={`Final preview of content prepared for ${activeLms.label}`} srcDoc={finalPreviewDocument} sandbox="allow-scripts allow-same-origin allow-presentation"/><p className="final-preview-help">This preview uses the exact fragment generated by <strong>Copy for {activeLms.shortLabel}</strong>. {activeLms.guidance} Desktop, tablet, and mobile controls adjust the test width.</p></div></TabsContent>
          <TabsContent value="html" className={`code-wrap code-workspace-${codeWorkspace}`}>
            <div className="code-header">
              <div className="code-heading"><span>{codeView === "lms" ? `HTML ready to paste into ${activeLms.label}` : "Editable source HTML"}</span><div className="code-view-switch" role="group" aria-label="HTML code type"><button type="button" className={codeView === "source" ? "active" : ""} aria-pressed={codeView === "source"} onClick={() => setCodeView("source")}>Edit Source</button><button type="button" className={codeView === "lms" ? "active" : ""} aria-pressed={codeView === "lms"} onClick={() => setCodeView("lms")}>For {activeLms.shortLabel}</button></div></div>
              <div className="dreamweaver-view-switch" role="group" aria-label="HTML workspace view"><button type="button" className={codeWorkspace === "code" ? "active" : ""} aria-pressed={codeWorkspace === "code"} onClick={() => setCodeWorkspace("code")}><Code2/>Code</button><button type="button" className={codeWorkspace === "split" ? "active" : ""} aria-pressed={codeWorkspace === "split"} onClick={() => setCodeWorkspace("split")}><Columns3/>Split</button><button type="button" className={codeWorkspace === "live" ? "active" : ""} aria-pressed={codeWorkspace === "live"} onClick={() => setCodeWorkspace("live")}><Eye/>Live</button></div>
              <button className="copy-code-button" onClick={copyHtml}><Copy size={14}/> Copy Code</button>
            </div>
            <div className="code-authoring-bar" role="toolbar" aria-label="HTML authoring tools">
              <div className="html-ribbon-group"><span className="html-ribbon-label">Code</span><button type="button" onClick={organizeSourceHtml} disabled={codeView !== "source"} title={codeView === "source" ? "Normalize indentation and organize nested tags" : "Switch to Edit Source to organize HTML"}><Code2/> Format</button><button type="button" className={codeWrapEnabled ? "active" : ""} aria-pressed={codeWrapEnabled} onClick={() => setCodeWrapEnabled((enabled) => !enabled)}><Rows3/> Wrap</button></div>
              <div className="html-ribbon-group"><span className="html-ribbon-label">Quality</span><button type="button" className={htmlErrors ? "diagnostic-error" : htmlWarnings ? "diagnostic-warning" : "diagnostic-pass"} onClick={validateHtmlSource}><Check/> Validate <b>{htmlErrors + htmlWarnings}</b></button><button type="button" className={showCodeDiagnostics ? "active" : ""} aria-pressed={showCodeDiagnostics} onClick={() => setShowCodeDiagnostics((visible) => !visible)}><AlertTriangle/> Problems</button></div>
              <div className="html-ribbon-group"><span className="html-ribbon-label">Live Sync</span><span className={`live-sync-badge ${liveSelection ? "matched" : "ready"}`}><PlugZap/>{liveSelection ? `Ln ${liveSelection.line}` : "Auto"}</span><button type="button" disabled={!liveSelection} onClick={locateLiveSelection} title={liveSelection ? `Locate ${liveSelection.label} at line ${liveSelection.line}` : "Select text or an element in Live Preview first"}><Search/> Locate</button><button type="button" disabled={!liveSelection} onClick={clearLiveSelection}><X/> Clear</button></div>
              <div className="html-ribbon-group html-insert-group"><span className="html-ribbon-label">Insert accessible HTML</span><button type="button" disabled={codeView !== "source"} onClick={() => insertHtmlSnippet('<figure>\n  <img src="" alt="Descriptive alternative text">\n  <figcaption>Figure caption</figcaption>\n</figure>')}><ImagePlus/> Image</button><button type="button" disabled={codeView !== "source"} onClick={() => insertHtmlSnippet('<a href="https://">Descriptive link text</a>')}><Link2/> Link</button><button type="button" disabled={codeView !== "source"} onClick={() => insertHtmlSnippet('<table data-table-style="grid">\n  <caption>Descriptive table title</caption>\n  <thead>\n    <tr><th scope="col">Header 1</th><th scope="col">Header 2</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Data</td><td>Data</td></tr>\n  </tbody>\n</table>')}><Table2/> Table</button><button type="button" disabled={codeView !== "source"} onClick={() => insertHtmlSnippet('<!-- Add an author note here -->')}><Quote/> Comment</button></div>
              <span className="syntax-legend" aria-label="Syntax color legend"><span><i className="tag-color"/>Tags</span><span><i className="attribute-color"/>Attributes</span><span><i className="value-color"/>Values</span><span><i className="comment-color"/>Comments</span></span>
            </div>
            <nav className="code-tag-navigator" aria-label="Current HTML tag path"><span>DOM</span><button type="button" onClick={() => goToCodeLocation(0)}>&lt;fragment&gt;</button>{htmlTagPath.map((item, index) => <span className="tag-crumb" key={`${item.offset}-${item.name}`}><i>/</i><button type="button" onClick={() => goToCodeLocation(item.offset, item.name.length + 2)}>&lt;{item.name}&gt;</button>{index === htmlTagPath.length - 1 && <small>current</small>}</span>)}</nav>
            {liveSelection && <div className="live-selection-map" role="status" aria-live="polite"><span><PlugZap/>Live → HTML</span><strong>{liveSelection.label}</strong><code>Ln {liveSelection.line}, Col {liveSelection.column}</code><button type="button" onClick={locateLiveSelection}><Search/>Focus match</button></div>}
            <div className="dreamweaver-workspace">
              {codeWorkspace !== "live" && <section className="code-pane" aria-label="HTML code pane"><div className="pane-label"><Code2/>Code <span>{codeView === "source" ? "Editable · Syntax colors · Auto-close tags" : "Read only · Syntax colors on"}</span></div><div className={`code-editor-shell ${codeWrapEnabled ? "wrap-enabled" : "wrap-disabled"}`}><div ref={codeLineNumbers} className="code-line-numbers" aria-hidden="true">{Array.from({ length: Math.max(1, codeLineCount) }, (_, index) => <span key={index}>{index + 1}</span>)}</div><div className="code-editor-stack"><pre ref={codeHighlightLayer} className="code-highlight-layer" aria-hidden="true"><code>{highlightHtmlSyntax(activeCode)}{"\n"}</code></pre><Textarea ref={codeEditor} value={activeCode} readOnly={codeView === "lms"} wrap={codeWrapEnabled ? "soft" : "off"} onScroll={(event) => { if (codeLineNumbers.current) codeLineNumbers.current.scrollTop = event.currentTarget.scrollTop; if (codeHighlightLayer.current) { codeHighlightLayer.current.scrollTop = event.currentTarget.scrollTop; codeHighlightLayer.current.scrollLeft = event.currentTarget.scrollLeft; } }} onKeyDown={handleCodeKeyDown} onSelect={(event) => setCodeCaret(event.currentTarget.selectionStart)} onClick={(event) => setCodeCaret(event.currentTarget.selectionStart)} onChange={(e) => { if (codeView === "source") updateSourceCode(e.target.value); }} className={`code-editor ${codeView === "lms" ? "compatible" : ""}`} spellCheck={false} aria-label={codeView === "lms" ? `${activeLms.label}-compatible HTML` : "Editable source HTML"} /></div></div></section>}
              {codeWorkspace !== "code" && <section className="live-code-pane" aria-label="Live HTML preview pane"><div className="pane-label"><Eye/>Live Preview <span>{liveSelection ? `Matched <${liveSelection.tag}> · Ln ${liveSelection.line}` : `${device[0].toUpperCase() + device.slice(1)} · Select content to locate HTML`}</span></div><iframe ref={livePreviewFrame} onLoad={(event) => connectLiveSelection(event.currentTarget)} className="dreamweaver-live-frame" title={`Live preview of ${codeView === "source" ? "source HTML" : `${activeLms.label} HTML`}`} srcDoc={codePreviewDocument} sandbox="allow-scripts allow-same-origin allow-presentation"/></section>}
            </div>
            {showCodeDiagnostics && <section className="html-diagnostics" aria-label="HTML validation problems"><header><span><AlertTriangle/> Problems</span><strong className={htmlErrors ? "has-errors" : htmlWarnings ? "has-warnings" : "is-clean"}>{htmlErrors} errors · {htmlWarnings} warnings</strong></header>{htmlDiagnostics.length ? <ol>{htmlDiagnostics.map((item, index) => <li key={`${item.offset}-${item.message}-${index}`} className={item.severity}><button type="button" onClick={() => goToCodeLocation(item.offset, item.length)}><span>{item.severity === "error" ? <X/> : <AlertTriangle/>}</span><strong>Ln {item.line}, Col {item.column}</strong><p>{item.message}</p></button></li>)}</ol> : <div className="diagnostics-empty"><Check/><span><strong>No HTML problems detected</strong><small>Tags are balanced and built-in LMS safety checks passed.</small></span></div>}</section>}
            <div className="code-status" role="status" aria-live="polite"><span>Ln {sourcePosition(activeCode, Math.min(codeCaret, activeCode.length)).line}, Col {sourcePosition(activeCode, Math.min(codeCaret, activeCode.length)).column}</span><span>{codeLineCount} line{codeLineCount === 1 ? "" : "s"}</span><span>{activeCode.length} characters</span><span className={htmlErrors ? "code-errors" : htmlWarnings ? "code-warnings" : "code-valid"}>{htmlErrors ? `${htmlErrors} HTML error${htmlErrors === 1 ? "" : "s"}` : htmlWarnings ? `${htmlWarnings} warning${htmlWarnings === 1 ? "" : "s"}` : "Valid HTML"}</span><span>{liveSelection ? `Live match: ${liveSelection.label} · line ${liveSelection.line}` : codeView === "source" ? "Live selection synchronization enabled" : `${activeLms.shortLabel} output locked · Live selection synchronization enabled`}</span></div>
            <p className="code-help">{codeView === "lms" ? `This is the same fragment used by Copy for ${activeLms.shortLabel}. Review it in Live or Split view before pasting it into the LMS HTML source editor. Select text or click an element in Live Preview to locate its HTML.` : "Edit the source while Split or Live view renders every change. Select text or click an image or element in Live Preview to highlight its opening tag and exact line in HTML. Return to Design without losing content."}</p>
          </TabsContent>
        </Tabs>
        <div className="editor-status-bar" role="status" aria-live="polite">
          <div className="status-cluster"><span className={saved ? "status-save" : "status-save pending"}>{saved ? <Check size={14}/> : <Cloud size={14}/>} {saved ? "Saved" : "Unsaved changes"}</span><span>{wordCount} words</span><span>{characterCount} characters</span><span>{wordCount ? Math.max(1, Math.ceil(wordCount / 200)) : 0} min read</span></div>
          <div className="status-cluster status-context"><button type="button" onClick={() => { setSidePanelTab("review"); setRightPanel(true); }}><Accessibility size={14}/>{accessibilityScore}% accessible · {accessibilityIssueCount} issue{accessibilityIssueCount === 1 ? "" : "s"}</button><span>{languageLabels[documentLanguage]}</span><span>{activeLms.shortLabel}</span><span>{device[0].toUpperCase() + device.slice(1)}</span><div className="status-zoom" role="group" aria-label="Document zoom"><button type="button" onClick={() => setZoom((value) => Math.max(50, value - 10))} aria-label="Zoom out"><Minus size={13}/></button><span>{zoom}%</span><button type="button" onClick={() => setZoom((value) => Math.min(150, value + 10))} aria-label="Zoom in"><Plus size={13}/></button></div></div>
        </div>
      </section>
      {rightPanel && <><button type="button" className="panel-backdrop" onClick={() => setRightPanel(false)} aria-label="Close auxiliary panel"/><aside id="editor-side-panel" className="right-panel" aria-label="Document insights panel"><div className="mobile-panel-heading"><strong>Document insights</strong><button type="button" onClick={() => setRightPanel(false)} aria-label="Close panel"><X size={18}/></button></div><Tabs value={sidePanelTab} onValueChange={(value) => setSidePanelTab(value as "review" | "outline" | "preview")}><TabsList className="side-tabs"><TabsTrigger value="review">Accessibility</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="outline">Outline</TabsTrigger></TabsList><TabsContent value="review"><div className="score-card"><div className="score-ring">{accessibilityScore}</div><div><strong>{accessibilityScore === 100 ? "Accessibility ready" : "Review required"}</strong><span>{accessibilityIssueCount} exact issue{accessibilityIssueCount === 1 ? "" : "s"} pending</span></div></div><button type="button" className="accessibility-repair" onClick={repairAccessibility}><Accessibility size={18}/><span><strong>Safe Fix</strong><small>Repairs structure, tables, links, and HTML without inventing descriptions.</small></span></button><div className="accessibility-location-help"><Eye/><span><strong>Element-level issue map</strong><small>Every affected location is listed separately. Use Locate to highlight that exact element in Design Preview or source line in HTML.</small></span></div>{pageChecks.map((check) => <AccessibilityReviewItem key={check.text} check={check} onLocate={locateAccessibilityIssue}/>)}</TabsContent><TabsContent value="preview"><PreviewAudit checks={previewAuditChecks} deviceResults={previewDeviceResults} device={device} zoom={zoom} auditedAt={previewAuditTime} onRun={() => runPreviewAudit(true)} onDownload={downloadPreviewAuditReport} onSelectDevice={setDevice} onInspect={inspectPreviewIssue} onPrevious={() => navigatePreviewIssue(-1)} onNext={() => navigatePreviewIssue(1)}/></TabsContent><TabsContent value="outline"><DocumentOutline items={documentOutline} onSelect={focusHeading}/></TabsContent></Tabs></aside></>}
    </div>
  </main>;
}

function ModuleTemplateDialog({ insertMarkup, hasH1, language, ribbon = false }: { insertMarkup: (markup: string) => void; hasH1: boolean; language: DocumentLanguage; ribbon?: boolean }) {
  const [open, setOpen] = useState(false);
  const [moduleNumber, setModuleNumber] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const spanish = language === "es-PR";
  const insert = () => {
    if (!moduleTitle.trim()) { toast.error("Enter the module title"); return; }
    const titleTag = hasH1 ? "h2" : "h1";
    const sectionTag = hasH1 ? "h3" : "h2";
    const label = moduleNumber.trim() ? `${spanish ? "MÓDULO" : "MODULE"} ${escapeHtml(moduleNumber.trim())}` : spanish ? "MÓDULO" : "MODULE";
    const markup = spanish
      ? `<section class="module-template"><p class="eyebrow">${label}</p><${titleTag}>${escapeHtml(moduleTitle.trim())}</${titleTag}><p class="lead">Escriba una introducción breve que explique el propósito y la relevancia del módulo.</p><${sectionTag}>Objetivos de aprendizaje</${sectionTag}><ul><li>Objetivo medible 1</li><li>Objetivo medible 2</li></ul><${sectionTag}>Materiales y recursos</${sectionTag}><ul><li>Lectura o recurso principal</li><li>Recurso complementario</li></ul><${sectionTag}>Actividades</${sectionTag}><ol><li>Revise los materiales del módulo.</li><li>Complete la actividad de aprendizaje.</li><li>Participe en la discusión correspondiente.</li></ol><div class="callout"><strong>Evaluación</strong><p>Describa la evidencia que demostrará el logro de los objetivos.</p></div><${sectionTag}>Apoyo y próximos pasos</${sectionTag}><p>Incluya instrucciones para solicitar ayuda y continuar al próximo módulo.</p></section>`
      : `<section class="module-template"><p class="eyebrow">${label}</p><${titleTag}>${escapeHtml(moduleTitle.trim())}</${titleTag}><p class="lead">Enter a brief introduction explaining the module’s purpose and relevance.</p><${sectionTag}>Learning Objectives</${sectionTag}><ul><li>Measurable objective 1</li><li>Measurable objective 2</li></ul><${sectionTag}>Materials and Resources</${sectionTag}><ul><li>Primary reading or resource</li><li>Supplementary resource</li></ul><${sectionTag}>Activities</${sectionTag}><ol><li>Review the module materials.</li><li>Complete the learning activity.</li><li>Participate in the related discussion.</li></ol><div class="callout"><strong>Assessment</strong><p>Describe the evidence that will demonstrate achievement of the objectives.</p></div><${sectionTag}>Support and Next Steps</${sectionTag}><p>Include instructions for requesting assistance and continuing to the next module.</p></section>`;
    insertMarkup(markup); setOpen(false); setModuleNumber(""); setModuleTitle("");
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{ribbon ? <button className="ribbon-command"><BookOpen/><span>Module</span></button> : <button className="template-card"><span className="template-icon blue"><BookOpen/></span><span><strong>Complete Module</strong><small>Accessible LMS structure</small></span><Plus size={16}/></button>}</DialogTrigger><DialogContent className="module-template-dialog"><DialogHeader><DialogTitle>Create Module Structure</DialogTitle><DialogDescription>Generates an organized template and automatically adjusts heading levels.</DialogDescription></DialogHeader><div className="module-template-fields"><label>Number or identifier<Input value={moduleNumber} onChange={(event) => setModuleNumber(event.target.value)} placeholder="4"/></label><label>Module title<Input value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="Technology, People, and Processes"/></label></div>{hasH1 && <p className="field-help">The document already has an H1; the module will begin with H2 to preserve hierarchy.</p>}<div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={insert}><BookOpen size={16}/> Create Module</Button></div></DialogContent></Dialog>;
}

function PageSetupDialog({ value, onChange }: { value: PageSetup; onChange: (value: PageSetup) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PageSetup>(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  const dimensions = pageDimensions(draft);
  const margin = pageMargins[draft.margin];
  const apply = () => { onChange(draft); setOpen(false); toast.success("Page setup applied", { description: `${pageSizes[draft.size].label} · ${draft.orientation} · ${margin.label} margins` }); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button type="button" className="ribbon-command"><Settings2/><span>Page Setup</span></button></DialogTrigger><DialogContent className="page-setup-dialog"><DialogHeader><DialogTitle>Page Setup</DialogTitle><DialogDescription>Choose the paper used by Design Preview, rulers, printing, and Word, PDF, HTML, and project exports.</DialogDescription></DialogHeader><div className="page-setup-grid"><div className="page-setup-fields"><label>Paper size<select value={draft.size} onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value as PageSize }))}><option value="letter">Letter (8.5 × 11 in)</option><option value="a4">A4 (8.27 × 11.69 in)</option></select></label><label>Orientation<select value={draft.orientation} onChange={(event) => setDraft((current) => ({ ...current, orientation: event.target.value as PageOrientation }))}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><label>Margins<select value={draft.margin} onChange={(event) => setDraft((current) => ({ ...current, margin: event.target.value as PageMargin }))}><option value="normal">Normal (0.75 in)</option><option value="narrow">Narrow (0.5 in)</option><option value="wide">Wide (1 in)</option></select></label></div><div className="page-setup-preview"><div style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }}><span style={{ inset: `${(margin.vertical / dimensions.height) * 100}% ${(margin.horizontal / dimensions.width) * 100}%` }}>Content area</span></div><small>{dimensions.width} × {dimensions.height} in</small></div></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={apply}><Check size={16}/> Apply</Button></div></DialogContent></Dialog>;
}

function syncPinnedRulers(event: React.UIEvent<HTMLDivElement>) {
  const viewport = event.currentTarget;
  const rulers = viewport.querySelector<HTMLElement>(".editor-rulers");
  const verticalRuler = rulers?.querySelector<HTMLElement>(".vertical-ruler");
  const horizontalRuler = rulers?.querySelector<HTMLElement>(".horizontal-ruler");
  if (!rulers || !verticalRuler || !horizontalRuler) return;
  const viewportTop = viewport.getBoundingClientRect().top;
  const rulerTop = rulers.getBoundingClientRect().top;
  const horizontalHeight = horizontalRuler.getBoundingClientRect().height;
  const zoomValue = Number.parseFloat(getComputedStyle(rulers.closest<HTMLElement>(".device-frame") || rulers).zoom) || 1;
  const pageOffset = Math.max(0, viewportTop + horizontalHeight - rulerTop) / zoomValue;
  rulers.style.setProperty("--ruler-scroll-y", `${pageOffset}px`);
  rulers.style.setProperty("--ruler-viewport-height", `${Math.max(180, (viewport.clientHeight - horizontalHeight) / zoomValue)}px`);
}

function EditorRulers({ unit, device, pageWidth, pageHeight, onToggle, showRulers, showMarginGuides, children }: { unit: "in" | "cm"; device: "desktop" | "tablet" | "mobile"; pageWidth: number; pageHeight: number; onToggle: () => void; showRulers: boolean; showMarginGuides: boolean; children: React.ReactNode }) {
  const widthInches = device === "desktop" ? pageWidth : device === "tablet" ? 7 : 4;
  const heightInches = device === "desktop" ? pageHeight : 11;
  const horizontalMax = unit === "in" ? widthInches : Number((widthInches * 2.54).toFixed(1));
  const verticalMax = unit === "in" ? heightInches : Number((heightInches * 2.54).toFixed(1));
  const horizontalLabels = [...Array.from({ length: Math.floor(horizontalMax) + 1 }, (_, index) => index), ...(Number.isInteger(horizontalMax) ? [] : [horizontalMax])];
  const verticalLabels = [...Array.from({ length: Math.floor(verticalMax) + 1 }, (_, index) => index), ...(Number.isInteger(verticalMax) ? [] : [verticalMax])];
  const horizontalStyle = { "--ruler-segments": horizontalMax, "--ruler-minor-segments": horizontalMax * (unit === "in" ? 4 : 2) } as React.CSSProperties;
  const verticalStyle = { "--ruler-segments": verticalMax, "--ruler-minor-segments": verticalMax * (unit === "in" ? 4 : 2) } as React.CSSProperties;
  return <div className={`editor-rulers ${showRulers ? "" : "rulers-hidden"}`} data-unit={unit}><button type="button" className="ruler-corner" onClick={onToggle} aria-label={`Change rulers to ${unit === "in" ? "centimeters" : "inches"}`} title="Change measurement unit">{unit}</button><div className="horizontal-ruler" style={horizontalStyle} aria-hidden="true">{horizontalLabels.map((value) => <span key={value} style={{ left: `${(value / horizontalMax) * 100}%` }}>{value}</span>)}</div><div className="vertical-ruler" aria-hidden="true"><div className="vertical-ruler-track" style={verticalStyle}>{verticalLabels.map((value) => <span key={value} style={{ top: `${(value / verticalMax) * 100}%` }}>{value}</span>)}</div></div><div className="measurement-page">{showMarginGuides && <div className="margin-guides" aria-hidden="true"/>}{children}</div></div>;
}

function Block({ icon: Icon, label, onClick }: { icon: typeof FileText; label: string; onClick: () => void }) { return <button className="block-button" onClick={onClick}><Icon size={19}/><span>{label}</span></button>; }
function ReviewItem({ ok, text }: { ok: boolean; text: string }) { return <div className={`review-item ${ok ? "ok" : "warn"}`}><span>{ok ? <Check size={15}/> : "!"}</span><p>{text}</p></div>; }
function AccessibilityReviewItem({ check, onLocate }: { check: AccessibilityCheck; onLocate: (check: AccessibilityCheck, location: AccessibilityLocation) => void }) {
  const locations = check.locations?.length ? check.locations : check.location ? [check.location] : [];
  return <div className={`review-item accessibility-review-item ${check.ok ? "ok" : "warn"}`}><span>{check.ok ? <Check size={15}/> : <AlertTriangle size={13}/>}</span><div className="accessibility-review-copy"><p>{check.text}</p>{!check.ok && locations.length > 0 && <div className="accessibility-occurrences"><small><strong>{locations.length} affected location{locations.length === 1 ? "" : "s"}</strong></small>{locations.map((location, index) => <div className="accessibility-occurrence" key={`${location.selector}-${location.index}-${location.label}`}><span><strong>{index + 1}.</strong> {location.label}</span><button type="button" className="accessibility-locate" onClick={() => onLocate(check, location)}><Eye/> Locate</button></div>)}</div>}</div></div>;
}

function PreviewAudit({ checks, deviceResults, device, zoom, auditedAt, onRun, onDownload, onSelectDevice, onInspect, onPrevious, onNext }: { checks: PreviewAuditCheck[]; deviceResults: PreviewDeviceResult[]; device: "desktop" | "tablet" | "mobile"; zoom: number; auditedAt: string; onRun: () => void; onDownload: () => void; onSelectDevice: (device: "desktop" | "tablet" | "mobile") => void; onInspect: (check: PreviewAuditCheck) => void; onPrevious: () => void; onNext: () => void }) {
  const passed = checks.filter((check) => check.ok).length;
  const ready = checks.length > 0 && passed === checks.length;
  const locatedIssues = checks.filter((check) => !check.ok && check.location).length;
  return <section className="preview-audit-panel" aria-label="Design Preview audit results">
    <div className={`preview-audit-summary ${ready ? "ready" : "attention"}`}><Eye/><span><strong>{ready ? "Preview ready" : "Preview review"}</strong><small>{passed}/{checks.length || PREVIEW_AUDIT_CHECK_COUNT} checks passed · {device} at {zoom}%{auditedAt ? ` · checked ${auditedAt}` : ""}</small></span></div>
    <div className="preview-audit-actions"><button type="button" className="preview-audit-run" onClick={onRun}><Eye/> Run audit again</button><button type="button" className="preview-audit-download" onClick={onDownload}><Download/> Download report</button></div>
    <div className="preview-issue-navigation" role="group" aria-label="Preview issue navigation"><button type="button" onClick={onPrevious} disabled={!locatedIssues}><ChevronDown className="issue-previous"/> Previous issue</button><span>{locatedIssues ? `${locatedIssues} locatable issue${locatedIssues === 1 ? "" : "s"}` : "No locatable issues"}</span><button type="button" onClick={onNext} disabled={!locatedIssues}>Next issue <ChevronDown/></button></div>
    <div className="preview-device-matrix" role="group" aria-label="Responsive device audit">{deviceResults.map((result) => <button type="button" key={result.device} className={`${result.ok ? "ok" : "warn"} ${device === result.device ? "active" : ""}`} aria-pressed={device === result.device} onClick={() => onSelectDevice(result.device)}><span>{result.device === "desktop" ? <Monitor/> : result.device === "tablet" ? <Tablet/> : <Smartphone/>}</span><strong>{result.label}</strong><small>{result.width}px · {result.ok ? "Passed" : "Review"}</small></button>)}</div>
    <div className="preview-audit-list">{checks.map((check) => <div className={`preview-audit-item ${check.ok ? "ok" : "warn"}`} key={check.label}><span>{check.ok ? <Check/> : <AlertTriangle/>}</span><div><strong>{check.label}</strong><small>{check.detail}</small>{!check.ok && check.location && <small className="preview-location">Where: {check.location.label}</small>}</div>{!check.ok && check.location && <button type="button" className="preview-inspect" onClick={() => onInspect(check)}><Eye/> Inspect</button>}</div>)}</div>
    <p className="preview-audit-note">The matrix tests all three viewports during every audit. Select a device card to inspect it on the canvas. Wide tables remain keyboard-accessible through horizontal scrolling.</p>
  </section>;
}

function UniversalLmsPreflightDialog({ open, onOpenChange, results, activeProfile, onSelectProfile, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; results: LmsPreflightResult[]; activeProfile: LmsProfile; onSelectProfile: (profile: LmsProfile) => void; onDownload: () => void }) {
  const ready = results.filter((result) => result.ready).length;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="universal-preflight-dialog"><DialogHeader><DialogTitle>Universal LMS Preflight</DialogTitle><DialogDescription>One document, five destination profiles. UltraPage checks content, semantic structure, image accessibility, links, and markup hygiene before publishing.</DialogDescription></DialogHeader><div className={`universal-preflight-hero ${ready === results.length && results.length ? "ready" : "attention"}`}><span><Sparkles/></span><div><strong>{ready === results.length && results.length ? "Ready across every LMS" : "Cross-LMS review required"}</strong><small>{ready}/{results.length || Object.keys(lmsProfiles).length} profiles ready · 25 compatibility signals</small></div><div className="universal-preflight-score">{results.length ? Math.round(results.reduce((total, result) => total + result.score, 0) / results.length) : 0}%</div></div><div className="universal-preflight-matrix" role="table" aria-label="LMS compatibility matrix"><div className="universal-preflight-row universal-preflight-header" role="row"><span role="columnheader">Destination</span><span role="columnheader">Content</span><span role="columnheader">Structure</span><span role="columnheader">Images</span><span role="columnheader">Links</span><span role="columnheader">Hygiene</span><span role="columnheader">Readiness</span><span role="columnheader">Action</span></div>{results.map((result) => <div className={`universal-preflight-row ${result.ready ? "ready" : "attention"}`} role="row" key={result.profile}><span role="cell"><strong>{lmsProfiles[result.profile].shortLabel}</strong><small>{result.outputBytes.toLocaleString()} bytes{activeProfile === result.profile ? " · active" : ""}</small></span>{result.checks.map((check) => <span role="cell" key={check.label} className={check.ok ? "pass" : "review"} title={check.detail} aria-label={`${check.label}: ${check.ok ? "passed" : "review required"}`}>{check.ok ? <Check/> : <AlertTriangle/>}<small>{check.label}</small></span>)}<span role="cell" className="preflight-readiness"><strong>{result.score}%</strong><small>{result.ready ? "Ready" : "Review"}</small></span><span role="cell"><button type="button" onClick={() => onSelectProfile(result.profile)} disabled={activeProfile === result.profile}>{activeProfile === result.profile ? "Active" : "Use profile"}</button></span></div>)}</div><p className="universal-preflight-note"><Eye/> Select any signal for its accessible description. “Use profile” changes the target LMS and immediately runs the detailed 23-point Design Preview audit.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Matrix</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function LearningExperiencePulseDialog({ open, onOpenChange, result, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; result: LearningExperienceResult | null; onDownload: () => void }) {
  if (!result) return null;
  const status = result.score >= 80 ? "strong" : result.score >= 50 ? "review" : "foundational";
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="learning-pulse-dialog"><DialogHeader><DialogTitle>Learning Experience Pulse</DialogTitle><DialogDescription>Evidence-based instructional-design signals for the current page. The Pulse explains what it detected and preserves faculty judgment.</DialogDescription></DialogHeader><div className={`learning-pulse-hero ${status}`}><div className="learning-pulse-ring" style={{ "--pulse-score": `${result.score * 3.6}deg` } as React.CSSProperties}><span>{result.score}</span><small>EXPERIENCE</small></div><div><strong>{status === "strong" ? "Strong learning experience" : status === "review" ? "Targeted improvements recommended" : "Foundational elements are missing"}</strong><p>{result.wordCount} words · approximately {result.readingMinutes} minute{result.readingMinutes === 1 ? "" : "s"} to read · six instructional-design dimensions</p></div></div><div className="learning-pulse-grid">{result.metrics.map((metric) => <article key={metric.id} className={`learning-pulse-card ${metric.score >= 80 ? "strong" : metric.score >= 50 ? "review" : "foundational"}`}><header><span>{metric.score >= 80 ? <Check/> : <AlertTriangle/>}</span><div><strong>{metric.label}</strong><small>{metric.score}%</small></div></header><div className="learning-pulse-meter" aria-label={`${metric.label}: ${metric.score}%`}><span style={{ width: `${metric.score}%` }}/></div><p>{metric.detail}</p><aside>{metric.recommendation}</aside></article>)}</div><p className="learning-pulse-note"><BookOpen/> The Pulse uses observable page evidence only. It does not grade teaching quality, invent course content, or replace instructor and instructional-designer review.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Report</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function SemanticChangeImpactDialog({ open, onOpenChange, result, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; result: SemanticChangeResult | null; onDownload: () => void }) {
  if (!result) return null;
  const savedAt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.baselineSavedAt));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="semantic-change-dialog"><DialogHeader><DialogTitle>Semantic Change Impact</DialogTitle><DialogDescription>Compares the current page with the latest manual save and highlights changes that may affect learners, accessibility, or LMS output.</DialogDescription></DialogHeader><div className={`semantic-change-hero ${result.risk}`}><span><History/></span><div><strong>{result.risk === "high" ? "High-impact review required" : result.risk === "medium" ? "Sensitive changes detected" : "Low-impact changes"}</strong><small>Baseline: {result.baselineTitle} · saved {savedAt}</small></div><b>{result.risk.toUpperCase()}</b></div><div className="semantic-change-summary"><article><span>+{result.wordsAdded}</span><small>Words added</small></article><article><span>−{result.wordsRemoved}</span><small>Words removed</small></article><article><span>{result.accessibilityBefore}%</span><small>Accessibility before</small></article><article className={result.accessibilityAfter < result.accessibilityBefore ? "decreased" : ""}><span>{result.accessibilityAfter}%</span><small>Accessibility now</small></article></div><div className="semantic-change-inventory" role="table" aria-label="Semantic change inventory"><div role="row" className="semantic-change-row header"><span role="columnheader">Element</span><span role="columnheader">Saved</span><span role="columnheader">Current</span><span role="columnheader">Change</span></div>{result.items.map((entry) => <div role="row" className={`semantic-change-row ${entry.sensitive && entry.delta ? "sensitive" : ""}`} key={entry.label}><span role="cell">{entry.label}{entry.sensitive && <small> sensitive</small>}</span><span role="cell">{entry.before}</span><span role="cell">{entry.after}</span><span role="cell">{entry.delta >= 0 ? "+" : ""}{entry.delta}</span></div>)}</div><section className="semantic-change-signals"><strong>Impact signals</strong>{result.sensitiveChanges.length ? result.sensitiveChanges.map((change) => <p key={change}><AlertTriangle/> {change}</p>) : <p className="clear"><Check/> No sensitive structural or accessibility changes detected.</p>}</section><p className="semantic-change-note"><History/> Save intentionally to establish a new comparison baseline. Automatic draft recovery does not replace that baseline.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Report</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function LearnerJourneyDialog({ open, onOpenChange, result, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; result: LearnerJourneyResult | null; onDownload: () => void }) {
  const [activePersona, setActivePersona] = useState<LearnerJourneyPersonaId>("keyboard");
  useEffect(() => { if (open) setActivePersona("keyboard"); }, [open, result]);
  if (!result) return null;
  const active = result.personas.find((persona) => persona.id === activePersona) || result.personas[0];
  const preview = buildLearnerJourneyPreview(result, activePersona);
  const PersonaIcon = activePersona === "keyboard" ? Keyboard : activePersona === "screen-reader" ? Volume2 : activePersona === "low-vision" ? Eye : activePersona === "mobile" ? Smartphone : BookOpen;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="learner-journey-dialog"><DialogHeader><DialogTitle>Inclusive Learner Journey Simulator</DialogTitle><DialogDescription>Experience-oriented structural previews for five learner perspectives, with evidence and friction points before LMS publication.</DialogDescription></DialogHeader><section className={`learner-journey-hero ${result.score >= 80 ? "ready" : result.score >= 50 ? "review" : "blocked"}`}><div className="learner-journey-score"><span>{result.score}</span><small>JOURNEY</small></div><div><strong>{result.score >= 80 ? "Inclusive journeys are coherent" : result.score >= 50 ? "Targeted journey review recommended" : "Learner barriers require attention"}</strong><p>{result.personas.filter((persona) => persona.status === "ready").length}/5 perspectives ready · {result.focusStops.length} focus stops · {result.readingStops.length} semantic reading stops</p></div></section><div className="learner-persona-tabs" role="tablist" aria-label="Learner simulation perspective">{result.personas.map((persona) => <button type="button" role="tab" aria-selected={persona.id === activePersona} className={`${persona.status} ${persona.id === activePersona ? "active" : ""}`} key={persona.id} onClick={() => setActivePersona(persona.id)}><span>{persona.id === "keyboard" ? <Keyboard/> : persona.id === "screen-reader" ? <Volume2/> : persona.id === "low-vision" ? <Eye/> : persona.id === "mobile" ? <Smartphone/> : <BookOpen/>}</span><strong>{persona.label}</strong><small>{persona.score}% · {persona.status}</small></button>)}</div><div className={`learner-simulation-workspace persona-${activePersona}`}><section className="learner-preview-stage"><header><span><PersonaIcon/> {active.label}</span><b>{active.score}%</b></header><iframe title={`${active.label} structural simulation`} srcDoc={preview} sandbox="allow-same-origin"/></section><aside className="learner-evidence-panel"><span className={`learner-persona-status ${active.status}`}>{active.status.toUpperCase()}</span><strong>Observable evidence</strong><p>{active.evidence}</p><strong>Recommended action</strong><p>{active.recommendation}</p>{activePersona === "keyboard" && <div className="learner-stop-list"><strong>Focus sequence</strong>{result.focusStops.length ? result.focusStops.slice(0, 12).map((stop) => <span key={`${stop.order}-${stop.label}`}><b>{stop.order}</b><small>{stop.role}</small>{stop.label}</span>) : <p>No interactive focus stops are present.</p>}</div>}{activePersona === "screen-reader" && <div className="learner-stop-list"><strong>Reading sequence</strong>{result.readingStops.slice(0, 12).map((stop) => <span key={`${stop.order}-${stop.label}`}><b>{stop.order}</b><small>{stop.role}</small>{stop.label}</span>)}</div>}</aside></div>{result.frictionPoints.length > 0 && <section className="learner-friction-list"><strong>Journey friction points</strong>{result.frictionPoints.map((friction) => <p key={friction}><AlertTriangle/> {friction}</p>)}</section>}<p className="learner-simulation-note"><Accessibility/> This simulator models observable structure, focus order, reflow, and content density. It supports review but does not emulate every assistive technology or replace testing with learners.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Journey Report</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function LearningConstellationDialog({ open, onOpenChange, result, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; result: LearningConstellationResult | null; onDownload: () => void }) {
  const [selectedNodeId, setSelectedNodeId] = useState("course");
  useEffect(() => { if (open) setSelectedNodeId("course"); }, [open, result]);
  if (!result) return null;
  const selected = result.nodes.find((node) => node.id === selectedNodeId) || result.nodes[0];
  const colors: Record<ConstellationNodeKind, string> = { course: "#ffffff", objective: "#7ee7c4", section: "#9fc7ff", activity: "#f6c96b", assessment: "#ff8f9b", resource: "#c6a8ff" };
  const nodeById = new Map(result.nodes.map((node) => [node.id, node]));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="learning-constellation-dialog"><DialogHeader><DialogTitle>Learning Constellation Map</DialogTitle><DialogDescription>A local semantic twin of the learning page: explore objectives, knowledge bodies, practice, evidence, and resources as one navigable system.</DialogDescription></DialogHeader><section className={`constellation-hero ${result.status}`}><div className="constellation-score"><Orbit/><span>{result.score}</span><small>COHERENCE</small></div><div><span>{result.status.toUpperCase()}</span><strong>{result.status === "ready" ? "The learning universe is connected" : result.status === "review" ? "A few knowledge routes need alignment" : "Critical learning bodies are missing"}</strong><p>{result.nodes.length} nodes · {result.edges.length} relationships · {result.orphanIds.length} unanchored</p></div></section><div className="constellation-metrics">{result.metrics.map((metric) => <article key={metric.label}><span>{metric.value}</span><strong>{metric.label}</strong><small>{metric.detail}</small></article>)}</div><section className="deep-space-trajectories"><header><span><Orbit/> Deep-Space Learning Trajectories</span><small>SCIENCE-FICTION-INSPIRED · DETERMINISTIC</small></header><div>{result.trajectories.map((trajectory) => <article className={trajectory.status} key={trajectory.id}><span>{trajectory.score}%</span><strong>{trajectory.label}</strong><small>{trajectory.status}</small><p>{trajectory.signal}</p><ol>{trajectory.path.length ? trajectory.path.map((stop) => <li key={stop}>{stop}</li>) : <li>No viable route detected</li>}</ol></article>)}</div></section><div className="constellation-workspace"><section className="constellation-space" aria-label="Interactive learning constellation"><svg viewBox="0 0 800 500" role="img" aria-labelledby="constellation-map-title constellation-map-description"><title id="constellation-map-title">Learning constellation relationship map</title><desc id="constellation-map-description">Select a node to inspect its type, evidence, and relationship to the learning page.</desc><defs><radialGradient id="space-glow"><stop offset="0" stopColor="#35276b"/><stop offset="1" stopColor="#090c20"/></radialGradient><filter id="node-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="800" height="500" rx="22" fill="url(#space-glow)"/><g className="constellation-stars" aria-hidden="true">{Array.from({ length: 48 }, (_, index) => <circle key={index} cx={(index * 83) % 790 + 5} cy={(index * 47) % 490 + 5} r={index % 7 === 0 ? 1.8 : .8}/>)}</g><g className="constellation-edges" aria-hidden="true">{result.edges.map((edge) => { const source = nodeById.get(edge.source); const target = nodeById.get(edge.target); return source && target ? <line key={`${edge.source}-${edge.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} className={edge.relation}/> : null; })}</g><g>{result.nodes.map((node) => <g key={node.id} className={`constellation-node ${node.kind} ${selected.id === node.id ? "selected" : ""} ${result.orphanIds.includes(node.id) ? "orphan" : ""}`} role="button" tabIndex={0} aria-label={`${node.kind}: ${node.label}`} aria-pressed={selected.id === node.id} onClick={() => setSelectedNodeId(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedNodeId(node.id); } }}><circle cx={node.x} cy={node.y} r={node.weight} fill={colors[node.kind]} filter="url(#node-glow)"/><text x={node.x} y={node.y + node.weight + 15} textAnchor="middle">{node.label.length > 24 ? `${node.label.slice(0, 22)}…` : node.label}</text></g>)}</g></svg><div className="constellation-legend" aria-label="Node legend">{Object.entries(colors).map(([kind, color]) => <span key={kind}><i style={{ background: color }}/>{kind}</span>)}</div></section><aside className="constellation-inspector"><span className={`constellation-kind ${selected.kind}`}>{selected.kind}</span><strong>{selected.label}</strong><p>{selected.evidence}</p><dl><div><dt>Node ID</dt><dd>{selected.id}</dd></div><div><dt>Connected to</dt><dd>{selected.parentId ? nodeById.get(selected.parentId)?.label || selected.parentId : "Document nucleus"}</dd></div><div><dt>Signal</dt><dd>{result.orphanIds.includes(selected.id) ? "Needs stronger alignment" : "Connected"}</dd></div></dl>{result.gaps.length > 0 && <section><strong>Mission gaps</strong>{result.gaps.map((gap) => <p key={gap}><AlertTriangle/> {gap}</p>)}</section>}</aside></div><p className="constellation-note"><Orbit/> The map is generated deterministically on this device and contains no learner data. Its relationship model is CASE-inspired, but the JSON export is not a certified CASE package.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Constellation JSON</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function CourseDigitalTwinDialog({ open, onOpenChange, result, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; result: CourseDigitalTwinResult | null; onDownload: () => void }) {
  const [activeScenarioId, setActiveScenarioId] = useState("");
  useEffect(() => { if (open && result) setActiveScenarioId([...result.scenarios].sort((left, right) => left.score - right.score)[0]?.id || ""); }, [open, result]);
  if (!result) return null;
  const active = result.scenarios.find((scenario) => scenario.id === activeScenarioId) || result.scenarios[0];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="course-twin-dialog"><DialogHeader><DialogTitle>UltraPage Course Digital Twin</DialogTitle><DialogDescription>A local predictive model of how this learning page may behave across LMS, device, network, and accessibility conditions before publication.</DialogDescription></DialogHeader><section className={`course-twin-hero ${result.status}`}><div className="course-twin-core"><Monitor/><span>{result.score}</span><small>TWIN STABILITY</small></div><div><span>{result.status.toUpperCase()}</span><strong>{result.status === "stable" ? "Modeled delivery is stable" : result.status === "critical" ? "A deployment scenario is critical" : "Targeted simulation review required"}</strong><p>{result.scenarios.filter((scenario) => scenario.status === "stable").length}/{result.scenarios.length} scenarios stable · {result.fingerprint}</p></div></section><div className="course-twin-workspace"><div className="course-twin-scenarios" role="tablist" aria-label="Course twin scenarios">{result.scenarios.map((scenario) => <button type="button" role="tab" aria-selected={scenario.id === active.id} className={`${scenario.status} ${scenario.id === active.id ? "active" : ""}`} key={scenario.id} onClick={() => setActiveScenarioId(scenario.id)}><span>{scenario.score}%</span><strong>{scenario.label}</strong><small>{scenario.lms} · {scenario.device} · {scenario.network}</small></button>)}</div><section className={`course-twin-inspector ${active.status}`}><header><div><small>ACTIVE SIMULATION</small><strong>{active.label}</strong></div><b>{active.status.toUpperCase()}</b></header><div className="course-twin-orbit" aria-label={`${active.survivingSignals} of ${active.totalSignals} modeled signals survive`}><span style={{ "--twin-score": `${active.score * 3.6}deg` } as React.CSSProperties}><b>{active.score}</b><small>STABILITY</small></span><dl><div><dt>LMS</dt><dd>{lmsProfiles[active.lms].label}</dd></div><div><dt>Device</dt><dd>{active.device}</dd></div><div><dt>Network</dt><dd>{active.network}</dd></div><div><dt>Perspective</dt><dd>{active.perspective}</dd></div><div><dt>Estimated load</dt><dd>{(active.estimatedLoadMs / 1000).toFixed(1)} s</dd></div><div><dt>Signals surviving</dt><dd>{active.survivingSignals}/{active.totalSignals}</dd></div></dl></div><div className="course-twin-findings"><section><strong>Predicted risks</strong>{active.risks.length ? active.risks.map((risk) => <p key={risk}><AlertTriangle/> {risk}</p>) : <p className="clear"><Check/> No structural risk detected in this modeled condition.</p>}</section><section><strong>Recovery actions</strong>{active.recommendations.length ? <ol>{active.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ol> : <p className="clear"><Check/> No recovery action is required by this simulation.</p>}</section></div></section></div><p className="course-twin-note"><Orbit/> {result.notice} No learner profiles or content leave this device.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Twin Report</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function PublicationReadinessDialog({ open, onOpenChange, result, onDownload, onOpenPillar }: { open: boolean; onOpenChange: (open: boolean) => void; result: PublicationReadinessResult | null; onDownload: () => void; onOpenPillar: (pillar: ReadinessPillarId) => void }) {
  if (!result) return null;
  const checkedAt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.generatedAt));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="readiness-center-dialog"><DialogHeader><DialogTitle>Publication Readiness Command Center</DialogTitle><DialogDescription>A single evidence-based release decision across eight pillars, including predictive delivery simulation.</DialogDescription></DialogHeader><section className={`readiness-center-hero ${result.status.toLowerCase()}`}><div className="readiness-center-ring" style={{ "--readiness-score": `${result.score * 3.6}deg` } as React.CSSProperties}><span>{result.score}</span><small>READINESS</small></div><div><span className="readiness-status">{result.status}</span><strong>{result.status === "READY" ? "Ready for controlled publication" : result.status === "BLOCKED" ? "Critical evidence blocks publication" : "Targeted review remains"}</strong><p>{checkedAt} · {lmsProfiles[result.profile].label} · {result.fingerprint}</p></div></section><div className="readiness-pillar-grid">{result.pillars.map((pillar) => <article className={`readiness-pillar ${pillar.status}`} key={pillar.id}><header><span>{pillar.status === "ready" ? <Check/> : <AlertTriangle/>}</span><div><strong>{pillar.label}</strong><small>{pillar.status.toUpperCase()}</small></div><b>{pillar.score}%</b></header><div className="readiness-meter"><span style={{ width: `${pillar.score}%` }}/></div><p>{pillar.evidence}</p><button type="button" onClick={() => onOpenPillar(pillar.id)}>Open evidence</button></article>)}</div>{result.blockers.length > 0 && <section className="readiness-blockers"><strong>Publication blockers</strong>{result.blockers.map((blocker) => <p key={blocker}><AlertTriangle/> {blocker}</p>)}</section>}{result.recommendations.length > 0 && <section className="readiness-recommendations"><strong>Next best actions</strong><ol>{result.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ol></section>}<p className="readiness-passport-note"><Stamp/> The Readiness Passport records this evidence, owner/creator, LMS profile, timestamp, and content fingerprint. The fingerprint identifies the audited state; it is not a digital signature or legal certification.</p><div className="apa-actions"><Button variant="outline" onClick={onDownload}><Download size={16}/> Download Passport</Button><Button onClick={() => onOpenChange(false)}>Close</Button></div></DialogContent></Dialog>;
}

function PreviewCompareDialog({ open, onOpenChange, sourceDocument, lmsDocument, lmsLabel }: { open: boolean; onOpenChange: (open: boolean) => void; sourceDocument: string; lmsDocument: string; lmsLabel: string }) {
  const [compareDevice, setCompareDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogTrigger asChild><button type="button" className="ribbon-command"><Columns3/><span>Compare</span></button></DialogTrigger><DialogContent className="preview-compare-dialog"><DialogHeader><DialogTitle>Design and LMS Visual Comparison</DialogTitle><DialogDescription>Compare the responsive standalone design with the exact HTML generated for {lmsLabel}. Differences remain visible without changing the document.</DialogDescription></DialogHeader><div className="preview-compare-devices" role="group" aria-label="Comparison viewport"><button type="button" className={compareDevice === "desktop" ? "active" : ""} aria-pressed={compareDevice === "desktop"} onClick={() => setCompareDevice("desktop")}><Monitor/>Desktop</button><button type="button" className={compareDevice === "tablet" ? "active" : ""} aria-pressed={compareDevice === "tablet"} onClick={() => setCompareDevice("tablet")}><Tablet/>Tablet</button><button type="button" className={compareDevice === "mobile" ? "active" : ""} aria-pressed={compareDevice === "mobile"} onClick={() => setCompareDevice("mobile")}><Smartphone/>Mobile</button></div><div className={`preview-compare-grid compare-device-${compareDevice}`}><section><header><strong>Responsive Design</strong><span>Downloaded HTML appearance</span></header><div className="preview-compare-stage"><iframe className="preview-compare-viewport" title={`Responsive Design comparison at ${compareDevice} width`} srcDoc={sourceDocument} sandbox="allow-same-origin"/></div></section><section><header><strong>{lmsLabel} Output</strong><span>Exact Copy for LMS appearance</span></header><div className="preview-compare-stage"><iframe className="preview-compare-viewport" title={`${lmsLabel} comparison at ${compareDevice} width`} srcDoc={lmsDocument} sandbox="allow-same-origin"/></div></section></div><p className="preview-compare-note"><Eye/> Typography may be normalized by the destination LMS. Content, hierarchy, lists, tables, links, images, spacing, and responsive behavior should remain recognizable in both panes.</p></DialogContent></Dialog>;
}

function DocumentOutline({ items, onSelect }: { items: Array<{ level: number; text: string; index: number }>; onSelect: (index: number) => void }) {
  if (!items.length) return <div className="outline-empty"><Heading2/><strong>No headings</strong><span>Add H1, H2, H3, or H4 to create document navigation.</span></div>;
  return <nav className="document-outline" aria-label="Esquema del documento"><p className="panel-label">DOCUMENT OUTLINE</p><ol>{items.map((item) => <li key={`${item.index}-${item.text}`} style={{ paddingLeft: `${(item.level - 1) * 14}px` }}><button onClick={() => onSelect(item.index)}><span>H{item.level}</span><strong>{item.text}</strong></button></li>)}</ol></nav>;
}

type AccessibilityLocation = { selector: string; index: number; label: string; view?: "design" | "html" | "settings"; context?: "table" | "picture" | "link"; sourceOffset?: number; sourceLength?: number };
type AccessibilityCheck = { ok: boolean; text: string; location?: AccessibilityLocation; locations?: AccessibilityLocation[] };

function accessibilityReport(html: string, title: string, language: DocumentLanguage = "es-PR"): AccessibilityCheck[] {
  const cleanText = (value: string, fallback: string) => {
    const cleaned = value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
    return cleaned ? `“${cleaned.slice(0, 52)}${cleaned.length > 52 ? "…" : ""}”` : fallback;
  };
  const locate = (selector: string, index: number, label: string, context?: AccessibilityLocation["context"], view: AccessibilityLocation["view"] = "design"): AccessibilityLocation => ({ selector, index: Math.max(0, index), label, context, view });
  const headingMatches = Array.from(html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi));
  const headingLevels = headingMatches.map((match) => Number(match[1]));
  const headings = headingMatches.map((match) => match[2].replace(/<[^>]+>/g, "").trim());
  const h1Count = headingLevels.filter((level) => level === 1).length;
  const extraH1Locations: AccessibilityLocation[] = [];
  let h1Ordinal = 0;
  headingLevels.forEach((level, index) => {
    if (level !== 1) return;
    if (h1Ordinal > 0) extraH1Locations.push(locate("h1", h1Ordinal, `H1 ${h1Ordinal + 1} ${cleanText(headings[index], "without text")}`));
    h1Ordinal += 1;
  });
  const hierarchyIssueIndexes: number[] = [];
  let previous = 0;
  for (const [index, level] of headingLevels.entries()) {
    if (previous && level > previous + 1) hierarchyIssueIndexes.push(index);
    previous = level;
  }
  const hierarchyOk = headingLevels.length > 0 && hierarchyIssueIndexes.length === 0;
  const hierarchyLocations = hierarchyIssueIndexes.map((index) => locate("h1,h2,h3,h4,h5,h6", index, `Heading ${index + 1}: H${headingLevels[index]} ${cleanText(headings[index], "without text")}`));
  const emptyHeadingLocations = headings.flatMap((heading, index) => heading ? [] : [locate("h1,h2,h3,h4,h5,h6", index, `Heading ${index + 1}: empty heading`)]);
  const images = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
  const imageHasAccessibleDescription = (image: string) => {
    const altMatch = image.match(/\balt=["']([^"']*)["']/i);
    if (!altMatch) return false;
    if (!altMatch[1]) return /\brole=["']presentation["']/i.test(image) || /\baria-hidden=["']true["']/i.test(image);
    return !/^(imagen|foto|gráfico|grafico|describa|image|photo)$/i.test(altMatch[1].trim());
  };
  const imageLabel = (image: string, index: number) => {
    const alt = image.match(/\balt=["']([^"']*)["']/i)?.[1]?.trim();
    const src = image.match(/\bsrc=["']([^"']*)["']/i)?.[1] || "";
    const rawFile = src.split(/[/?#]/).filter(Boolean).at(-1) || "";
    let file = rawFile.slice(0, 42);
    try { file = decodeURIComponent(rawFile).slice(0, 42); } catch { /* Keep malformed URLs readable without interrupting the audit. */ }
    return `Image ${index + 1}${alt ? ` — alt ${cleanText(alt, "")}` : file ? ` — ${file}` : " — no alt text"}`;
  };
  const inaccessibleImageLocations = images.flatMap((image, index) => imageHasAccessibleDescription(image) ? [] : [locate("img", index, imageLabel(image, index), "picture")]);
  const nonPortableImageLocations = images.flatMap((image, index) => /\bsrc=["']data:image\/(?:png|jpe?g);base64,/i.test(image) ? [] : [locate("img", index, `${imageLabel(image, index)} · external or nonportable source`, "picture")]);
  const links = Array.from(html.matchAll(/<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi), (match) => ({ attributes: `${match[1]}${match[3]}`, href: match[2], text: match[4].replace(/<[^>]+>/g, "").trim() }));
  const vagueLink = /^(aquí|clic aquí|click here|más|ver más|enlace)$/i;
  const invalidLinkLocations = links.flatMap((link, index) => vagueLink.test(link.text) || !link.text || !/^(https?:|mailto:|tel:|\/|#)/i.test(link.href) ? [locate("a", index, `Link ${index + 1} — ${cleanText(link.text, "without descriptive text")}`, "link")] : []);
  const insecureLinkLocations = links.flatMap((link, index) => /target=["']_blank["']/i.test(link.attributes) && !/rel=["'][^"']*noopener/i.test(link.attributes) ? [locate("a", index, `Link ${index + 1} — ${cleanText(link.text, link.href)}`, "link")] : []);
  const tables = Array.from(html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi), (match) => match[0]);
  const tableLabel = (table: string, index: number) => `Table ${index + 1} — ${cleanText(table.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)?.[1] || "", "no caption")}`;
  const headerlessTableLocations = tables.flatMap((table, index) => /<th\b/i.test(table) ? [] : [locate("table", index, tableLabel(table, index), "table")]);
  const unnamedTableLocations = tables.flatMap((table, index) => /<caption\b/i.test(table) || /aria-label=["'][^"']+["']/i.test(table) ? [] : [locate("table", index, tableLabel(table, index), "table")]);
  const tableHeaders = Array.from(html.matchAll(/<th\b([^>]*)>([\s\S]*?)<\/th>/gi), (match) => ({ attributes: match[1], text: match[2] }));
  const unscopedTableHeaderLocations = tableHeaders.flatMap((header, index) => /\bscope=["'](?:col|row|colgroup|rowgroup)["']/i.test(header.attributes) ? [] : [locate("th", index, `Table header ${index + 1} — ${cleanText(header.text, "missing row or column scope")}`, "table")]);
  const media = Array.from(html.matchAll(/<figure\b[^>]*data-accessible-media=["']true["'][^>]*>[\s\S]*?<\/figure>/gi), (match) => match[0]);
  const inaccessibleMediaLocations = media.flatMap((item, index) => /<iframe\b[^>]*title=["'][^"']+["']/i.test(item) && (/data-captions=["']true["']/i.test(item) || /class=["'][^"']*media-transcript/i.test(item)) ? [] : [locate('figure[data-accessible-media="true"]', index, `Video ${index + 1} — missing title, captions, or transcript`)]);
  const unsafeMatches = Array.from(html.matchAll(/<\/?(?:script|object|embed|form|input|button)\b|\son\w+\s*=|(?:href|src)\s*=\s*["']javascript:/gi));
  const unsafeLocations = unsafeMatches.map((match) => { const offset = match.index || 0; const position = sourcePosition(html, offset); return { ...locate("@html", 0, `HTML source · line ${position.line}, column ${position.column} · ${cleanText(match[0], "unsafe markup")}`, undefined, "html"), sourceOffset: offset, sourceLength: match[0].length }; });
  const fixedWidthMatches = Array.from(html.matchAll(/min-width\s*:\s*(?:[4-9]\d{2,}|\d{4,})px/gi));
  const fixedWidthLocations = fixedWidthMatches.map((match, index) => { const position = sourcePosition(html, match.index || 0); return locate('[style*="min-width"]', index, `Fixed-width element ${index + 1} · HTML line ${position.line}, column ${position.column}`); });
  const ids = Array.from(html.matchAll(/\bid=["']([^"']+)["']/gi), (match) => match[1]);
  const duplicateIdLocations = ids.flatMap((id, index) => ids.indexOf(id) === index ? [] : [locate("[id]", index, `Element ${index + 1} with duplicate ID “${id}”`)]);
  const brokenInternalLinkLocations = links.flatMap((link, index) => {
    if (!link.href.startsWith("#") || link.href === "#") return [];
    let targetId = link.href.slice(1);
    try { targetId = decodeURIComponent(targetId); } catch { /* Keep malformed fragments available for exact location. */ }
    return ids.includes(targetId) ? [] : [locate("a", index, `Link ${index + 1} — target “#${targetId || "missing"}” does not exist`, "link")];
  });
  return [
    { ok: Boolean(title.trim()), text: "The document has an identifiable title", locations: title.trim() ? [] : [locate("@title", 0, "Document title field is empty", undefined, "settings")] },
    { ok: h1Count === 1, text: h1Count === 1 ? "There is exactly one H1 heading" : `There must be exactly one H1; currently there are ${h1Count}`, locations: h1Count === 0 ? [locate("@editor-start", 0, "Beginning of the document · H1 is missing")] : extraH1Locations },
    { ok: hierarchyOk, text: headingLevels.length ? "The heading hierarchy does not skip levels" : "Add headings to create an accessible document structure", locations: headingLevels.length ? hierarchyLocations : [locate("@editor-start", 0, "Beginning of the document · heading structure is missing")] },
    { ok: emptyHeadingLocations.length === 0, text: "Headings contain descriptive text", locations: emptyHeadingLocations },
    { ok: inaccessibleImageLocations.length === 0, text: images.length ? "Informative images have alternative text and decorative images are identified correctly" : "No images require alternative text", locations: inaccessibleImageLocations },
    { ok: nonPortableImageLocations.length === 0, text: images.length ? "Images are embedded as PNG or JPEG for reliable Word and PDF export" : "No images require portable embedding", locations: nonPortableImageLocations },
    { ok: invalidLinkLocations.length === 0, text: "Links have descriptive text and valid destinations", locations: invalidLinkLocations },
    { ok: insecureLinkLocations.length === 0, text: "Links opened in new tabs include security protection", locations: insecureLinkLocations },
    { ok: headerlessTableLocations.length === 0, text: tables.length ? "Tables include header cells" : "No tables require headers", locations: headerlessTableLocations },
    { ok: unnamedTableLocations.length === 0, text: tables.length ? "All tables have a caption or accessible name" : "No tables require a caption", locations: unnamedTableLocations },
    { ok: unscopedTableHeaderLocations.length === 0, text: tableHeaders.length ? "Table headers identify their row or column scope" : "No table headers require scope attributes", locations: unscopedTableHeaderLocations },
    { ok: inaccessibleMediaLocations.length === 0, text: media.length ? "Videos have a title and captions or a transcript" : "No videos require review", locations: inaccessibleMediaLocations },
    { ok: unsafeLocations.length === 0, text: "The HTML contains no executable or unsafe code", locations: unsafeLocations },
    { ok: fixedWidthLocations.length === 0, text: fixedWidthLocations.length ? "Remove fixed minimum widths of 400 px or more to improve mobile display" : "The content does not impose minimum widths that overflow mobile screens", locations: fixedWidthLocations },
    { ok: duplicateIdLocations.length === 0, text: duplicateIdLocations.length ? "Duplicate identifiers may break the table of contents" : "Internal identifiers are unique", locations: duplicateIdLocations },
    { ok: brokenInternalLinkLocations.length === 0, text: brokenInternalLinkLocations.length ? "Internal links must point to an existing element ID" : "Internal links point to existing destinations", locations: brokenInternalLinkLocations },
    { ok: true, text: `The primary language is set to ${languageLabels[language]}` },
  ];
}

async function requestExport(format: "docx" | "pdf", html: string, title: string, language: DocumentLanguage = "es-PR", author = "", description = "", pageSetup: PageSetup = { size: "letter", orientation: "portrait", margin: "normal" }) {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, html, title, author: author.trim() || "UltraPage Studio", description: description.trim(), language, pageSetup }),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(problem.error || "The file could not be generated.");
  }
  return response.blob();
}

function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href; link.download = fileName; link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function exportFileName(title: string, extension: string) {
  const base = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, "-") || "documento-accesible";
  return `${base}.${extension}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function ExportDialog({ html, title, language, lmsProfile, author, description, pageSetup, downloadHtml, ribbon = false }: { html: string; title: string; language: DocumentLanguage; lmsProfile: LmsProfile; author: string; description: string; pageSetup: PageSetup; downloadHtml: () => Promise<HtmlPackageResult>; ribbon?: boolean }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"docx" | "pdf" | "html" | "">("");
  const portableHtml = normalizeAutomaticIndentationHtml(html, language);
  const checks = accessibilityReport(portableHtml, title, language);
  const warnings = checks.filter((check) => !check.ok).length;
  const exportProject = () => {
    const project = {
      format: "ultrapage-project",
      version: 1,
      savedAt: new Date().toISOString(),
      title,
      fileName: exportFileName(title, "html"),
      language,
      lmsProfile,
      author,
      description,
      pageSetup,
      html: portableHtml,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, exportFileName(title, "ultrapage.json"));
    toast.success("UltraPage project downloaded", { description: "Open this file later to continue editing with all document properties." });
    setOpen(false);
  };
  const exportDocument = async (format: "docx" | "pdf") => {
    setExporting(format);
    try {
      const blob = await requestExport(format, portableHtml, title, language, author, description, pageSetup);
      downloadBlob(blob, exportFileName(title, format));
      toast.success(format === "docx" ? "Word document downloaded" : "Accessible PDF descargado", { description: "Document structure, language, and metadata were preserved." });
      setOpen(false);
    } catch (problem) {
      toast.error("Export failed", { description: problem instanceof Error ? problem.message : "Try again." });
    } finally { setExporting(""); }
  };
  const exportHtmlPackage = async () => {
    setExporting("html");
    try {
      const result = await downloadHtml();
      toast.success("HTML package downloaded", { description: `${result.bundledAssets} image${result.bundledAssets === 1 ? "" : "s"} bundled${result.externalAssets ? ` · ${result.externalAssets} external reference${result.externalAssets === 1 ? "" : "s"} listed in the manifest` : ""}.` });
      setOpen(false);
    } catch (problem) {
      toast.error("HTML package export failed", { description: problem instanceof Error ? problem.message : "Try again." });
    } finally { setExporting(""); }
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{ribbon ? <button type="button" className="ribbon-command"><Download/><span>Export</span></button> : <Button variant="outline" className="publish-button"><Download size={16}/> Export</Button>}</DialogTrigger><DialogContent className="export-dialog"><DialogHeader><DialogTitle>Export Accessible Document</DialogTitle><DialogDescription>Download as Word, PDF, a complete HTML package, or an editable UltraPage project. Target profile: {lmsProfiles[lmsProfile].label}.</DialogDescription></DialogHeader><div className={`export-summary ${warnings ? "has-warnings" : "ready"}`}><span>{warnings ? <AlertTriangle size={20}/> : <Check size={20}/>}</span><div><strong>{warnings ? `${warnings} accessibility recommendation${warnings === 1 ? "" : "s"}` : "Ready to export"}</strong><small>{warnings ? "You may export now, but correcting them first is recommended." : "The content passed the automated checks."}</small></div></div><div className="export-checks" aria-label="Accessibility results">{checks.map((check) => <ReviewItem key={check.text} ok={check.ok} text={check.text}/>)}</div><div className="export-options"><button onClick={() => exportDocument("docx")} disabled={Boolean(exporting)}><FileText/><span><strong>Microsoft Word</strong><small>.docx structured and editable</small></span>{exporting === "docx" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={() => exportDocument("pdf")} disabled={Boolean(exporting)}><FileText/><span><strong>Accessible PDF</strong><small>Tagged PDF/UA with language and metadata</small></span>{exporting === "pdf" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={exportHtmlPackage} disabled={Boolean(exporting)}><Code2/><span><strong>Complete HTML Package</strong><small>.zip with HTML, LMS fragment, images, styles, manifest, and accessibility report</small></span>{exporting === "html" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={exportProject} disabled={Boolean(exporting)}><Save/><span><strong>UltraPage Project</strong><small>Editable backup with content, metadata, and LMS profile</small></span><Download/></button></div><p className="export-note"><Accessibility size={15}/> The HTML package preserves embedded and WebDAV images whenever they are available. Remote servers that block downloading remain listed in manifest.json for review.</p></DialogContent></Dialog>;
}

function DocumentPropertiesDialog({ author, description, setAuthor, setDescription, ribbon = false }: { author: string; description: string; setAuthor: (value: string) => void; setDescription: (value: string) => void; ribbon?: boolean }) {
  return <Dialog><DialogTrigger asChild>{ribbon ? <button type="button" className="ribbon-command"><FileText/><span>Properties</span></button> : <Button variant="ghost" size="icon" aria-label="Document Properties" title="Document Properties"><FileText size={17}/></Button>}</DialogTrigger><DialogContent className="properties-dialog"><DialogHeader><DialogTitle>Document Properties</DialogTitle><DialogDescription>These metadata are included in HTML, Word, and PDF. No author is assigned automatically.</DialogDescription></DialogHeader><div className="properties-grid"><label>Author or organization<Input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Optional name"/></label><label>Accessible description<Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Brief summary of the document purpose and content" maxLength={300}/><span>{description.length}/300</span></label></div></DialogContent></Dialog>;
}

function ApplicationAboutDialog() {
  return <Dialog><DialogTrigger asChild><button type="button" className="ribbon-command"><Stamp/><span>About</span></button></DialogTrigger><DialogContent className="about-dialog"><DialogHeader><DialogTitle>About UltraPage Studio</DialogTitle><DialogDescription>Application ownership, authorship, and product-name notice.</DialogDescription></DialogHeader><div className="about-identity"><span className="about-owner-mark" aria-hidden="true">EG</span><div><small>Owner and creator</small><strong>Eduardo Augusto García Rodríguez</strong><p>Independent educational-authoring application.</p></div></div><dl className="about-facts"><div><dt>Copyright</dt><dd>© 2026 Eduardo Augusto García Rodríguez. All rights reserved.</dd></div><div><dt>Product name</dt><dd>“UltraPage Studio” is currently a working name. No registration or exclusivity claim is made by this notice.</dd></div><div><dt>Independence</dt><dd>This project is not affiliated with or endorsed by third-party companies or products that use similar terms.</dd></div></dl><p className="about-legal-note">Ownership of the application and its original code does not by itself establish trademark rights in the working product name.</p></DialogContent></Dialog>;
}

function KeyboardShortcutsDialog({ ribbon = false }: { ribbon?: boolean }) {
  const shortcuts = [
    ["Ctrl/⌘ + S", "Save a version"],
    ["Alt + 1, 2, 3 o 4", "Apply H1, H2, H3, or H4"],
    ["Ctrl/⌘ + Shift + 7", "Create numbered list"],
    ["Ctrl/⌘ + Shift + 8", "Create bulleted list"],
  ];
  return <Dialog><DialogTrigger asChild>{ribbon ? <button type="button" className="ribbon-command"><Keyboard/><span>Shortcuts</span></button> : <Button variant="ghost" size="icon" aria-label="View keyboard shortcuts" title="Keyboard Shortcuts"><Keyboard size={17}/></Button>}</DialogTrigger><DialogContent className="shortcuts-dialog"><DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle><DialogDescription>Edit and structure content without leaving the keyboard.</DialogDescription></DialogHeader><dl className="shortcut-list">{shortcuts.map(([keys, action]) => <div key={keys}><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>)}</dl><p className="field-help">Heading and list shortcuts work in Design view. Standard bold, italic, underline, copy, paste, undo, and redo shortcuts remain available.</p></DialogContent></Dialog>;
}

function HistoryDialog({ restoreSnapshot, ribbon = false }: { restoreSnapshot: (snapshot: DraftSnapshot) => void; ribbon?: boolean }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<DraftSnapshot[]>([]);
  const loadHistory = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as DraftSnapshot[]); }
      catch { setHistory([]); }
    }
  };
  const restore = (snapshot: DraftSnapshot) => { restoreSnapshot(snapshot); setOpen(false); };
  const clear = () => { localStorage.removeItem(HISTORY_KEY); setHistory([]); toast.success("History cleared"); };
  return <Dialog open={open} onOpenChange={loadHistory}><DialogTrigger asChild>{ribbon ? <button type="button" className="ribbon-command"><History/><span>History</span></button> : <Button variant="outline" className="publish-button"><History size={16}/> History</Button>}</DialogTrigger><DialogContent className="history-dialog"><DialogHeader><DialogTitle>Version History</DialogTitle><DialogDescription>Each time you select Save, a version is stored. You can restore up to the ten most recent versions.</DialogDescription></DialogHeader>{history.length ? <div className="history-list">{history.map((snapshot) => <button key={snapshot.id} onClick={() => restore(snapshot)}><History/><span><strong>{snapshot.title || "Untitled document"}</strong><small>{new Date(snapshot.savedAt).toLocaleString("es-PR")}</small></span><span>Restore</span></button>)}</div> : <p className="empty-history">No manually saved versions yet.</p>}<div className="apa-actions">{history.length > 0 && <Button variant="outline" className="remove-watermark" onClick={clear}><Trash2 size={16}/> Clear History</Button>}<Button variant="outline" onClick={() => setOpen(false)}>Close</Button></div></DialogContent></Dialog>;
}

function ImageDialog({ insertImage, block = false }: { insertImage: (options: { src: string; alt: string; caption: string; decorative: boolean; width: number }) => boolean; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("https://");
  const [localName, setLocalName] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [decorative, setDecorative] = useState(false);
  const [width, setWidth] = useState(100);
  const fileInput = useRef<HTMLInputElement>(null);
  const reset = () => { setSrc("https://"); setLocalName(""); setAlt(""); setCaption(""); setDecorative(false); setWidth(100); if (fileInput.current) fileInput.current.value = ""; };
  const chooseLocalImage = async (file?: File) => {
    if (!file) return;
    const validType = /^(image\/(png|jpeg|gif|webp|avif))$/i.test(file.type) && /\.(png|jpe?g|gif|webp|avif)$/i.test(file.name);
    if (!validType) { toast.error("Choose a PNG, JPG, GIF, WebP, or AVIF image"); if (fileInput.current) fileInput.current.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("The image exceeds the 10 MB limit"); if (fileInput.current) fileInput.current.value = ""; return; }
    setReadingFile(true);
    try {
      setSrc(await blobToDataUrl(file));
      setLocalName(file.name);
      if (!caption) setCaption(file.name.replace(/\.[^.]+$/, ""));
      toast.success("Image ready to insert", { description: file.name });
    } catch (problem) {
      toast.error("The image could not be read", { description: problem instanceof Error ? problem.message : "Try another file." });
    } finally { setReadingFile(false); }
  };
  const insert = () => { if (insertImage({ src, alt, caption, decorative, width })) { setOpen(false); reset(); } };
  return <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) reset(); }}><DialogTrigger asChild>{block ? <button className="block-button" aria-label="Insert Accessible Image"><ImagePlus/><span>Image</span></button> : <button aria-label="Insert Accessible Image" title="Insert Accessible Image"><FileImage/></button>}</DialogTrigger><DialogContent className="image-dialog"><DialogHeader><DialogTitle>Insert Accessible Image</DialogTitle><DialogDescription>Choose an image from your computer, select one from WebDAV Content Collection, or use a stable HTTPS address.</DialogDescription></DialogHeader><input ref={fileInput} className="sr-only" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.avif,image/png,image/jpeg,image/gif,image/webp,image/avif" onChange={(event) => chooseLocalImage(event.target.files?.[0])} aria-label="Choose an image from your computer"/><div className="image-dialog-grid"><Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={readingFile}>{readingFile ? <Loader2 className="spin" size={16}/> : <Upload size={16}/>} {readingFile ? "Reading image…" : "Choose from Computer"}</Button>{localName && <p className="field-help" role="status">Selected: <strong>{localName}</strong></p>}{src.startsWith("data:image/") && <img src={src} alt="Selected image preview" style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain", margin: "0 auto" }}/>}<label>Image URL<Input value={src.startsWith("data:image/") ? "Embedded local image" : src} disabled={src.startsWith("data:image/")} onChange={(event) => { setSrc(event.target.value); setLocalName(""); }} placeholder="https://…/image.jpg"/></label><label>Alternative text<Input value={alt} disabled={decorative} onChange={(event) => setAlt(event.target.value)} placeholder="Describe the purpose of the image"/></label><label>Optional caption<Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Figure 1. Description"/></label><label className="checkbox-label"><input type="checkbox" checked={decorative} onChange={(event) => setDecorative(event.target.checked)}/> The image is decorative</label><label className="image-width-label">Image width <span>{width}%</span><Input type="range" min="10" max="100" step="5" value={width} onChange={(event) => setWidth(Number(event.target.value))}/></label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={insert} disabled={readingFile}><ImagePlus size={16}/> Insert Image</Button></div></DialogContent></Dialog>;
}

function ImagePropertiesDialog({ getImage, updateImage }: { getImage: () => SelectedImageData | null; updateImage: (data: SelectedImageData) => boolean }) {
  const [open, setOpen] = useState(false);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [decorative, setDecorative] = useState(false);
  const [width, setWidth] = useState(100);
  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      const data = getImage();
      if (!data) { toast.error("Select an image first"); return; }
      setAlt(data.alt); setCaption(data.caption); setDecorative(data.decorative); setWidth(data.width);
    }
    setOpen(nextOpen);
  };
  const apply = () => { if (updateImage({ alt, caption, decorative, width })) setOpen(false); };
  return <Dialog open={open} onOpenChange={changeOpen}><DialogTrigger asChild><button type="button" className="ribbon-command"><Accessibility/><span>Alt Text</span></button></DialogTrigger><DialogContent className="image-dialog"><DialogHeader><DialogTitle>Picture Accessibility & Properties</DialogTitle><DialogDescription>Describe an informative image or explicitly mark it decorative. The selection stays attached while this window is open.</DialogDescription></DialogHeader><div className="image-dialog-grid"><label>Alternative text<Input value={alt} disabled={decorative} onChange={(event) => setAlt(event.target.value)} placeholder="Describe the image's purpose in context"/></label><p className="field-help">Do not repeat nearby captions. Describe the information or function a learner would otherwise miss.</p><label>Optional caption<Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Figure 1. Description"/></label><label className="checkbox-label"><input type="checkbox" checked={decorative} onChange={(event) => setDecorative(event.target.checked)}/> Decorative — hide this image from assistive technology</label><label className="image-width-label">Maximum width <span>{Math.round(width)}%</span><Input type="range" min="10" max="100" step="5" value={width} onChange={(event) => setWidth(Number(event.target.value))}/></label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={apply}><Check size={16}/> Apply Accessibility</Button></div></DialogContent></Dialog>;
}

function MediaDialog({ insertMedia }: { insertMedia: (options: { url: string; title: string; transcript: string; captions: boolean }) => boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("https://");
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [captions, setCaptions] = useState(true);
  const insert = () => { if (insertMedia({ url, title, transcript, captions })) { setOpen(false); setUrl("https://"); setTitle(""); setTranscript(""); setCaptions(true); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button aria-label="Insert Accessible Video" title="Insert Accessible Video"><Video/></button></DialogTrigger><DialogContent className="media-dialog"><DialogHeader><DialogTitle>Insert Accessible Video</DialogTitle><DialogDescription>Supports HTTPS links from YouTube, Vimeo, and Kaltura. The video must include captions or a transcript.</DialogDescription></DialogHeader><div className="media-dialog-grid"><label>Video URL<Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtu.be/…"/></label><label>Descriptive title<Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Introduction to Module 4"/></label><label>Optional transcript URL<Input value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="https://…/transcript.pdf"/></label><label className="checkbox-label"><input type="checkbox" checked={captions} onChange={(event) => setCaptions(event.target.checked)}/> The video includes synchronized captions</label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={insert}><Video size={16}/> Insert Video</Button></div></DialogContent></Dialog>;
}

function LinkPropertiesDialog({ getLink, updateLink }: { getLink: () => SelectedLinkData | null; updateLink: (data: SelectedLinkData) => boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [newTab, setNewTab] = useState(false);
  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      const data = getLink();
      if (!data) { toast.error("Select a link first"); return; }
      setText(data.text); setUrl(data.url); setNewTab(data.newTab);
    }
    setOpen(nextOpen);
  };
  const apply = () => { if (updateLink({ text, url, newTab })) setOpen(false); };
  return <Dialog open={open} onOpenChange={changeOpen}><DialogTrigger asChild><button type="button" className="ribbon-command"><Link2/><span>Properties</span></button></DialogTrigger><DialogContent className="link-dialog"><DialogHeader><DialogTitle>Edit Link Properties</DialogTitle><DialogDescription>Update the descriptive text, destination, and opening behavior while preserving accessible link security.</DialogDescription></DialogHeader><div className="link-dialog-grid"><label>Descriptive text<Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Module Study Guide"/></label><label>Web address<Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://"/></label><label className="checkbox-label"><input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)}/> Open in a new tab</label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={apply}><Check size={16}/> Apply Changes</Button></div></DialogContent></Dialog>;
}

function EquationDialog({ insertEquation }: { insertEquation: (options: { formula: string; description: string; block: boolean }) => boolean }) {
  const [open, setOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [description, setDescription] = useState("");
  const [block, setBlock] = useState(true);
  const insert = () => { if (insertEquation({ formula, description, block })) { setOpen(false); setFormula(""); setDescription(""); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button aria-label="Insert Accessible Equation" title="Insert Accessible Equation"><Sigma/></button></DialogTrigger><DialogContent className="link-dialog"><DialogHeader><DialogTitle>Insert Accessible Equation</DialogTitle><DialogDescription>Enter the expression using mathematical symbols and a description that a screen reader can announce.</DialogDescription></DialogHeader><div className="link-dialog-grid"><label>Equation<Input value={formula} onChange={(event) => setFormula(event.target.value)} placeholder="E = mc²"/></label><label>Accessible description<Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Energy equals mass times the speed of light squared"/></label><label className="checkbox-label"><input type="checkbox" checked={block} onChange={(event) => setBlock(event.target.checked)}/> Display as a standalone equation</label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={insert}><Sigma size={16}/> Insert Equation</Button></div></DialogContent></Dialog>;
}

function LinkDialog({ insertLink, block = false }: { insertLink: (options: { text: string; url: string; newTab: boolean }) => boolean; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("https://");
  const [newTab, setNewTab] = useState(true);
  const insert = () => { if (insertLink({ text, url, newTab })) { setOpen(false); setText(""); setUrl("https://"); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className={block ? "block-button" : ""} aria-label="Insert Accessible Link"><Link2/><span>{block ? "Link" : ""}</span></button></DialogTrigger><DialogContent className="link-dialog"><DialogHeader><DialogTitle>Insert Accessible Link</DialogTitle><DialogDescription>Use text that describes the destination. Avoid phrases such as “click here” or “more information.”</DialogDescription></DialogHeader><div className="link-dialog-grid"><label>Descriptive text<Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Module Study Guide"/></label><label>Web address<Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://"/></label><label className="checkbox-label"><input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)}/> Open in a new tab</label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={insert}><Link2 size={16}/> Insert Link</Button></div></DialogContent></Dialog>;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  const parsed = Number.parseInt(value, 16);
  return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 };
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const channels = [r, g, b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function AdvancedToolsDialog({ command, replaceText }: { command: (name: string, value?: string) => void; replaceText: (search: string, replacement: string) => number }) {
  const [open, setOpen] = useState(false);
  const [textColor, setTextColor] = useState("#242a36");
  const [highlightColor, setHighlightColor] = useState("#fff2a8");
  const [search, setSearch] = useState("");
  const [replacement, setReplacement] = useState("");
  const ratio = contrastRatio(textColor, highlightColor);
  const normalTextPasses = ratio >= 4.5;
  const largeTextPasses = ratio >= 3;
  const run = (name: string, value?: string) => { command(name, value); setOpen(false); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button aria-label="More tools" title="More tools"><MoreHorizontal/></button></DialogTrigger><DialogContent className="advanced-tools-dialog"><DialogHeader><DialogTitle>More Editing Tools</DialogTitle><DialogDescription>Additional formatting, symbols, dividers, and document search.</DialogDescription></DialogHeader><div className="advanced-format-grid"><label><Palette/> Text color<Input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)}/><Button variant="outline" onClick={() => run("foreColor", textColor)}>Apply</Button></label><label><Highlighter/> Highlight<Input type="color" value={highlightColor} onChange={(event) => setHighlightColor(event.target.value)}/><Button variant="outline" onClick={() => run("hiliteColor", highlightColor)}>Apply</Button></label></div><div className={`contrast-result ${normalTextPasses ? "pass" : "warn"}`} role="status" aria-live="polite"><div className="contrast-swatch" style={{ color: textColor, backgroundColor: highlightColor }}>Aa</div><div><strong>WCAG contrast: {ratio.toFixed(2)}:1</strong><span>Normal text: {normalTextPasses ? "passes AA" : "fails AA"} · Large text: {largeTextPasses ? "passes AA" : "fails AA"}</span></div></div><div className="advanced-command-grid"><button onClick={() => run("subscript")}><Subscript/> Subscript</button><button onClick={() => run("superscript")}><Superscript/> Superscript</button><button onClick={() => run("strikeThrough")}><Strikethrough/> Strikethrough</button><button onClick={() => run("unlink")}><Unlink/> Remove link</button><button onClick={() => run("formatBlock", "blockquote")}><Quote/> Block quote</button><button onClick={() => run("insertHorizontalRule")}><Minus/> Divider</button></div><div className="symbol-row" aria-label="Common symbols">{["©","®","™","°","±","≤","≥","→","•","§"].map((symbol) => <button key={symbol} onClick={() => run("insertText", symbol)}>{symbol}</button>)}</div><div className="find-replace"><p className="panel-label">FIND AND REPLACE</p><div><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find text"/><Input value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="Replace with"/><Button onClick={() => replaceText(search, replacement)} disabled={!search}><Search size={16}/> Replace All</Button></div></div></DialogContent></Dialog>;
}

function RubricDialog({ insertMarkup, language }: { insertMarkup: (markup: string) => void; language: DocumentLanguage }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Assessment Rubric");
  const [criteria, setCriteria] = useState(4);
  const [levels, setLevels] = useState(4);
  const [levelNames, setLevelNames] = useState("Exemplary, Proficient, Developing, Beginning");
  const spanish = language === "es-PR";
  useEffect(() => {
    setTitle((current) => current === "Assessment Rubric" || current === "Rúbrica de evaluación" ? (spanish ? "Rúbrica de evaluación" : "Assessment Rubric") : current);
    setLevelNames((current) => current === "Exemplary, Proficient, Developing, Beginning" || current === "Excelente, Competente, En desarrollo, Inicial" ? (spanish ? "Excelente, Competente, En desarrollo, Inicial" : "Exemplary, Proficient, Developing, Beginning") : current);
  }, [spanish]);
  const create = () => {
    const safeCriteria = Math.min(12, Math.max(1, Number(criteria) || 1));
    const safeLevels = Math.min(6, Math.max(2, Number(levels) || 2));
    const provided = levelNames.split(",").map((value) => value.trim()).filter(Boolean);
    const defaultNames = spanish ? ["Excelente", "Competente", "En desarrollo", "Inicial", "Insuficiente", "No evidenciado"] : ["Exemplary", "Proficient", "Developing", "Beginning", "Insufficient", "Not demonstrated"];
    const names = Array.from({ length: safeLevels }, (_, index) => provided[index] || defaultNames[index] || `${spanish ? "Nivel" : "Level"} ${index + 1}`);
    const safeTitle = escapeHtml(title.trim() || (spanish ? "Rúbrica de evaluación" : "Assessment Rubric"));
    const criterionLabel = spanish ? "Criterio" : "Criterion";
    const maxScoreLabel = spanish ? "Puntuación máxima" : "Maximum score";
    const pointsLabel = spanish ? "puntos" : "points";
    const performancePrompt = spanish ? "Describa el desempeño esperado." : "Describe the expected performance.";
    const headings = names.map((name) => `<th scope="col">${escapeHtml(name)}</th>`).join("");
    const rows = Array.from({ length: safeCriteria }, (_, criterionIndex) => {
      const cells = names.map((_, levelIndex) => `<td><strong>${safeLevels - levelIndex} pts</strong><br>${performancePrompt}</td>`).join("");
      return `<tr><th scope="row">${criterionLabel} ${criterionIndex + 1}</th>${cells}</tr>`;
    }).join("");
    insertMarkup(`<table class="rubric-table" data-table-style="grid" aria-label="${safeTitle}"><caption>${safeTitle}</caption><thead><tr><th scope="col">${criterionLabel}</th>${headings}</tr></thead><tbody>${rows}</tbody></table><p class="rubric-total"><strong>${maxScoreLabel}:</strong> ${safeCriteria * safeLevels} ${pointsLabel}</p>`);
    setOpen(false);
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="rubric-trigger"><Table2 size={16}/> Create Rubric</Button></DialogTrigger><DialogContent className="rubric-dialog"><DialogHeader><DialogTitle>Accessible Rubric Generator</DialogTitle><DialogDescription>Creates a portable table with row and column headers for LMS editors, HTML, Word, and PDF.</DialogDescription></DialogHeader><div className="rubric-fields"><label>Title<Input value={title} onChange={(event) => setTitle(event.target.value)}/></label><label>Criteria<Input type="number" min="1" max="12" value={criteria} onChange={(event) => setCriteria(Number(event.target.value))}/></label><label>Levels<Input type="number" min="2" max="6" value={levels} onChange={(event) => setLevels(Number(event.target.value))}/></label><label className="rubric-levels">Level names<Input value={levelNames} onChange={(event) => setLevelNames(event.target.value)} placeholder="Exemplary, Proficient, Developing, Beginning"/><span>Separate level names with commas.</span></label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}><Table2 size={16}/> Insert Rubric</Button></div></DialogContent></Dialog>;
}

function TableDialog({ insertMarkup, language, block = false }: { insertMarkup: (markup: string) => void; language: DocumentLanguage; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tableStyle, setTableStyle] = useState<"grid" | "apa7">("grid");
  const [title, setTitle] = useState("Table title");
  const spanish = language === "es-PR";
  useEffect(() => { setTitle((current) => current === "Table title" || current === "Título de la tabla" ? (spanish ? "Título de la tabla" : "Table title") : current); }, [spanish]);
  const clean = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
  const createTable = () => {
    const safeRows = Math.min(20, Math.max(1, Number(rows) || 1));
    const safeColumns = Math.min(10, Math.max(1, Number(columns) || 1));
    const headingLabel = spanish ? "Encabezado" : "Header";
    const dataLabel = spanish ? "Dato" : "Data";
    const safeTitleFallback = spanish ? "Título de la tabla" : "Table title";
    const headingCells = Array.from({ length: safeColumns }, (_, index) => `<th scope="col">${headingLabel} ${index + 1}</th>`).join("");
    const bodyRows = Array.from({ length: safeRows }, () => `<tr>${Array.from({ length: safeColumns }, () => `<td>${dataLabel}</td>`).join("")}</tr>`).join("");
    const safeTitle = clean(title.trim() || safeTitleFallback);
    const table = `<table data-table-style="${tableStyle}" aria-label="${safeTitle}">${tableStyle === "grid" ? `<caption>${safeTitle}</caption>` : ""}<thead><tr>${headingCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    const markup = tableStyle === "apa7"
      ? spanish ? `<p class="apa-table-heading"><strong>Tabla 1</strong><br><em>${safeTitle}</em></p>${table}<p class="apa-table-note"><em>Nota.</em> Añada una nota de tabla si es necesaria.</p>` : `<p class="apa-table-heading"><strong>Table 1</strong><br><em>${safeTitle}</em></p>${table}<p class="apa-table-note"><em>Note.</em> Add a table note if needed.</p>`
      : table;
    insertMarkup(markup);
    setOpen(false);
    toast.success(tableStyle === "apa7" ? "APA 7 table created" : "All-borders table created");
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className={block ? "block-button" : "table-tool-button"} aria-label="Crear tabla"><Table2 size={block ? 19 : 17}/><span>Table</span></button></DialogTrigger><DialogContent className="table-creator-dialog"><DialogHeader><DialogTitle>Create Accessible Table</DialogTitle><DialogDescription>Select the size and border style. The first row is created as a column header.</DialogDescription></DialogHeader><div className="table-creator-grid"><label>Table title<Input value={title} onChange={(event) => setTitle(event.target.value)}/></label><label>Data rows<Input type="number" min={1} max={20} value={rows} onChange={(event) => setRows(Number(event.target.value))}/></label><label>Columns<Input type="number" min={1} max={10} value={columns} onChange={(event) => setColumns(Number(event.target.value))}/></label><label>Border style<select value={tableStyle} onChange={(event) => setTableStyle(event.target.value as "grid" | "apa7")}><option value="grid">All borders</option><option value="apa7">APA 7 borders</option></select></label></div><div className={`table-style-preview ${tableStyle}`} aria-label="Table style preview"><strong>{tableStyle === "apa7" ? "APA 7" : "All borders"}</strong><span>Header</span><span>Header</span><span>Data</span><span>Data</span></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={createTable}><Table2 size={16}/> Insert Table</Button></div></DialogContent></Dialog>;
}

function TableEditDialog({ editTable }: { editTable: (action: "add-row" | "delete-row" | "add-column" | "delete-column" | "grid" | "apa7") => boolean }) {
  const [open, setOpen] = useState(false);
  const run = (action: "add-row" | "delete-row" | "add-column" | "delete-column" | "grid" | "apa7") => { if (editTable(action)) setOpen(false); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className="table-tool-button" aria-label="Edit table" title="Select a cell and edit the table"><Table2/><span>Edit table</span></button></DialogTrigger><DialogContent className="table-edit-dialog"><DialogHeader><DialogTitle>Edit Selected Table</DialogTitle><DialogDescription>Place the cursor inside a cell before opening this tool. You can type directly into any table cell.</DialogDescription></DialogHeader><div className="table-edit-actions"><button onClick={() => run("add-row")}><Rows3/><span><strong>Add row</strong><small>Below selected row</small></span></button><button onClick={() => run("delete-row")}><Trash2/><span><strong>Delete row</strong><small>Keeps the header</small></span></button><button onClick={() => run("add-column")}><Columns3/><span><strong>Add column</strong><small>To the right of the cell</small></span></button><button onClick={() => run("delete-column")}><Trash2/><span><strong>Delete column</strong><small>Keeps at least one</small></span></button></div><p className="panel-label">CHANGE STYLE</p><div className="apa-actions"><Button variant="outline" onClick={() => run("grid")}>All borders</Button><Button variant="outline" onClick={() => run("apa7")}>APA 7 borders</Button></div></DialogContent></Dialog>;
}

function WatermarkDialog({ applyWatermark, removeWatermark }: { applyWatermark: (options: { text: string; color: string; opacity: number; size: number; angle: number }) => void; removeWatermark: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("BORRADOR");
  const [color, setColor] = useState("#6b7280");
  const [opacity, setOpacity] = useState(0.16);
  const [size, setSize] = useState(72);
  const [angle, setAngle] = useState(-35);
  const apply = () => { applyWatermark({ text, color, opacity, size, angle }); setOpen(false); };
  const remove = () => { removeWatermark(); setOpen(false); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className="table-tool-button" aria-label="Watermark"><Stamp/><span>Watermark</span></button></DialogTrigger><DialogContent className="watermark-dialog"><DialogHeader><DialogTitle>Create Watermark</DialogTitle><DialogDescription>Add faint text behind the content, such as Draft, Confidential, or Copy.</DialogDescription></DialogHeader><div className="watermark-grid"><label>Text<Input value={text} maxLength={40} onChange={(event) => setText(event.target.value)}/></label><label>Color<Input type="color" value={color} onChange={(event) => setColor(event.target.value)}/></label><label>Opacity <span>{Math.round(opacity * 100)}%</span><Input type="range" min="0.05" max="0.5" step="0.01" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))}/></label><label>Size <span>{size}px</span><Input type="range" min="32" max="140" step="2" value={size} onChange={(event) => setSize(Number(event.target.value))}/></label><label>Angle <span>{angle}°</span><Input type="range" min="-90" max="90" step="5" value={angle} onChange={(event) => setAngle(Number(event.target.value))}/></label></div><div className="watermark-preview"><span style={{ color, opacity, fontSize: `${Math.min(size, 72)}px`, transform: `rotate(${angle}deg)` }}>{text || "DRAFT"}</span></div><div className="apa-actions"><Button variant="outline" className="remove-watermark" onClick={remove}><Trash2 size={16}/> Remove Watermark</Button><Button onClick={apply}><Stamp size={16}/> Apply Watermark</Button></div></DialogContent></Dialog>;
}

function ApaDialog({ insertMarkup, language, fullWidth = false }: { insertMarkup: (markup: string) => void; language: DocumentLanguage; fullWidth?: boolean }) {
  const [author, setAuthor] = useState("Laudon et al."); const [year, setYear] = useState("2025"); const [page, setPage] = useState("");
  const [reference, setReference] = useState("Laudon, K. C., Laudon, J. P., & Traver, C. G. (2025). Management information systems: Managing the digital firm. Pearson.");
  const [label, setLabel] = useState("Relationship Among Technology, People, and Processes");
  const spanish = language === "es-PR";
  useEffect(() => { setLabel((current) => current === "Relationship Among Technology, People, and Processes" || current === "Relación entre tecnología, personas y procesos" ? (spanish ? "Relación entre tecnología, personas y procesos" : "Relationship Among Technology, People, and Processes") : current); }, [spanish]);
  const citation = `(${author}, ${year}${page ? `, p. ${page}` : ""})`;
  return <Dialog><DialogTrigger asChild><Button variant="outline" className={fullWidth ? "apa-trigger full" : "apa-trigger"}><BookOpen size={16}/> APA 7</Button></DialogTrigger><DialogContent className="apa-dialog"><DialogHeader><DialogTitle>APA 7 Tools</DialogTitle><DialogDescription>Inserts academic elements when the course page requires them.</DialogDescription></DialogHeader><Tabs defaultValue="citation"><TabsList className="apa-tabs"><TabsTrigger value="citation"><Quote size={14}/> Citation</TabsTrigger><TabsTrigger value="reference"><BookOpen size={14}/> Reference</TabsTrigger><TabsTrigger value="table"><Table2 size={14}/> Table</TabsTrigger><TabsTrigger value="figure"><ImagePlus size={14}/> Figure</TabsTrigger></TabsList><TabsContent value="citation" className="apa-pane"><div className="form-grid"><label>Author or authors<Input value={author} onChange={(e)=>setAuthor(e.target.value)}/></label><label>Year<Input value={year} onChange={(e)=>setYear(e.target.value)}/></label><label>Optional page<Input value={page} onChange={(e)=>setPage(e.target.value)} placeholder="45"/></label></div><div className="apa-preview"><small>Preview</small><p>{citation}</p></div><div className="apa-actions"><Button variant="outline" onClick={()=>insertMarkup(spanish ? `<p>${author} (${year}) sostiene que [escriba aquí la idea]${page ? ` (p. ${page})` : ""}.</p>` : `<p>${author} (${year}) states that [enter the idea here]${page ? ` (p. ${page})` : ""}.</p>`)}>Narrative citation</Button><Button onClick={()=>insertMarkup(`<span>${citation}</span>`)}>Parenthetical citation</Button></div></TabsContent><TabsContent value="reference" className="apa-pane"><label>Complete reference<Textarea value={reference} onChange={(e)=>setReference(e.target.value)} rows={5}/></label><p className="field-help">Review italics, capitalization, DOI, or URL according to the source type.</p><Button onClick={()=>insertMarkup(`<h2>${spanish ? "Referencias" : "References"}</h2><p class="apa-reference">${reference}</p>`)}>Insert with hanging indent</Button></TabsContent><TabsContent value="table" className="apa-pane"><label>Table title<Input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><div className="apa-preview table-preview"><strong>{spanish ? "Tabla 1" : "Table 1"}</strong><em>{label}</em><div>{spanish ? "Encabezado 1　 Encabezado 2" : "Header 1　 Header 2"}</div></div><Button onClick={()=>insertMarkup(spanish ? `<figure class="apa-table"><p><strong>Tabla 1</strong><br><em>${label}</em></p><table data-table-style="apa7"><thead><tr><th scope="col">Encabezado 1</th><th scope="col">Encabezado 2</th></tr></thead><tbody><tr><td>Dato</td><td>Dato</td></tr></tbody></table><figcaption><em>Nota.</em> Añada la información necesaria para interpretar la tabla.</figcaption></figure>` : `<figure class="apa-table"><p><strong>Table 1</strong><br><em>${label}</em></p><table data-table-style="apa7"><thead><tr><th scope="col">Header 1</th><th scope="col">Header 2</th></tr></thead><tbody><tr><td>Data</td><td>Data</td></tr></tbody></table><figcaption><em>Note.</em> Add the information needed to interpret the table.</figcaption></figure>`)}>Insert APA Table</Button></TabsContent><TabsContent value="figure" className="apa-pane"><label>Figure title<Input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><Button onClick={()=>insertMarkup(spanish ? `<figure class="apa-figure"><p><strong>Figura 1</strong><br><em>${label}</em></p><div class="figure-placeholder">Inserte aquí la imagen desde Content Collection</div><figcaption><em>Nota.</em> Adaptado de Autor (año). Incluya la licencia o los derechos cuando corresponda.</figcaption></figure>` : `<figure class="apa-figure"><p><strong>Figure 1</strong><br><em>${label}</em></p><div class="figure-placeholder">Insert the image from Content Collection here</div><figcaption><em>Note.</em> Adapted from Author (year). Include licensing or rights information when applicable.</figcaption></figure>`)}>Insert APA Figure</Button></TabsContent></Tabs><div className="apa-checklist"><strong>APA 7 Checklist</strong><span>✓ Citations and references match</span><span>✓ DOI as a link https://doi.org/…</span><span>✓ Numbered tables and figures</span><span>✓ Alternative text and accessible notes</span></div></DialogContent></Dialog>;
}
type RemoteFile = { name: string; type: string; size: number | null; href: string };
type ContentDialogProps = {
  trigger: React.ReactNode;
  search: string;
  setSearch: (v: string) => void;
  files: typeof demoFiles;
  insertFile: (name: string, type: string, href?: string, embeddedSrc?: string, alternativeText?: string) => void;
  documentHtml: string;
  documentFileName: string;
  openDocument: (name: string, content: string) => void;
  newDocument: () => void;
  documentLanguage: DocumentLanguage;
  documentAuthor: string;
  documentDescription: string;
  pageSetup: PageSetup;
};

function ContentDialog({ trigger, search, setSearch, files, insertFile, documentHtml, documentFileName, openDocument, newDocument, documentLanguage, documentAuthor, documentDescription, pageSetup }: ContentDialogProps) {
  const defaultUrl = "";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState(defaultUrl);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remoteName, setRemoteName] = useState(documentFileName);
  const [remoteFormat, setRemoteFormat] = useState<"html" | "docx" | "pdf">("html");
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [remoteFiles, setRemoteFiles] = useState<RemoteFile[]>([]);
  const uploadInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ultrapage-webdav-urls") || "[]") as string[];
      setSavedUrls(Array.isArray(stored) ? stored : []);
      localStorage.removeItem("ultrapage-webdav-active");
      setUrl("");
    } catch { setSavedUrls([]); }
  }, []);
  useEffect(() => { setRemoteName(documentFileName); }, [documentFileName]);
  const changeUrl = (nextUrl: string) => {
    setUrl(nextUrl); setConnected(false); setRemoteFiles([]); setError("");
    if (nextUrl) localStorage.setItem("ultrapage-webdav-active", nextUrl);
    else localStorage.removeItem("ultrapage-webdav-active");
  };
  const saveUrl = () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;
    const next = Array.from(new Set([...savedUrls, cleanUrl]));
    setSavedUrls(next); setUrl(cleanUrl);
    localStorage.setItem("ultrapage-webdav-urls", JSON.stringify(next));
    localStorage.setItem("ultrapage-webdav-active", cleanUrl);
    toast.success("WebDAV address saved");
  };
  const removeUrl = () => {
    const next = savedUrls.filter((savedUrl) => savedUrl !== url);
    setSavedUrls(next); localStorage.setItem("ultrapage-webdav-urls", JSON.stringify(next));
    changeUrl(""); toast.success("WebDAV address removed");
  };
  const connect = async (targetUrl = url) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list", url: targetUrl, username, password }) });
      const data = await response.json() as { connected?: boolean; files?: RemoteFile[]; error?: string };
      if (!response.ok) throw new Error(data.error || "The connection could not be established.");
      setUrl(targetUrl); setRemoteFiles(data.files || []); setConnected(true); toast.success("Content Collection conectado");
    } catch (problem) { setConnected(false); setError(problem instanceof Error ? problem.message : "No se pudo conectar."); }
    finally { setLoading(false); }
  };
  const openRemote = async (file: RemoteFile) => {
    if (file.type === "Carpeta") { await connect(file.href); return; }
    if (!/\.(html?|txt)$/i.test(file.name)) {
      const image = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      if (!image) { insertFile(file.name, "Documento", file.href); return; }
      if (/\.svg$/i.test(file.name)) { setError("SVG images cannot be embedded because they may contain unsafe code. Use PNG, JPG, GIF, or WebP."); return; }
      const alternativeText = window.prompt("Alternative text for this image. Leave blank only if the image is decorative.", "");
      if (alternativeText === null) return;
      if (!alternativeText.trim() && !window.confirm("Insert this image as decorative with empty alternative text?")) return;
      setFileLoading(file.href); setError("");
      try {
        const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "download", url: file.href, username, password }) });
        if (!response.ok) {
          const problem = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(problem.error || "The image could not be downloaded from WebDAV.");
        }
        const blob = await response.blob();
        const inferredType = /\.png$/i.test(file.name) ? "image/png" : /\.jpe?g$/i.test(file.name) ? "image/jpeg" : /\.gif$/i.test(file.name) ? "image/gif" : "image/webp";
        if (blob.type && blob.type !== "application/octet-stream" && !/^image\/(png|jpeg|gif|webp)$/i.test(blob.type)) throw new Error("WebDAV did not return a supported image file.");
        if (blob.size > 10 * 1024 * 1024) throw new Error("The image exceeds the 10 MB insertion limit.");
        const imageBlob = /^image\//i.test(blob.type) ? blob : new Blob([blob], { type: inferredType });
        insertFile(file.name, "Imagen", file.href, await blobToDataUrl(imageBlob), alternativeText);
        setDialogOpen(false);
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : "The image could not be inserted.");
      } finally { setFileLoading(""); }
      return;
    }
    setFileLoading(file.href); setError("");
    try {
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", url: file.href, username, password }) });
      const data = await response.json() as { content?: string; name?: string; error?: string };
      if (!response.ok || typeof data.content !== "string") throw new Error(data.error || "The file could not be opened.");
      openDocument(data.name || file.name, data.content); setRemoteName(data.name || file.name); setDialogOpen(false);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The file could not be opened."); }
    finally { setFileLoading(""); }
  };
  const downloadRemote = async (file: RemoteFile) => {
    if (file.type === "Carpeta") return;
    setFileLoading(`download:${file.href}`); setError("");
    try {
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "download", url: file.href, username, password }) });
      if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(problem.error || "No se pudo descargar el archivo.");
      }
      downloadBlob(await response.blob(), file.name);
      toast.success("File downloaded", { description: "Edit it in your usual application and use “Upload Edited File” to return it to WebDAV." });
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No se pudo descargar el archivo."); }
    finally { setFileLoading(""); }
  };
  const uploadEditedFile = async (file?: File) => {
    if (!file || !connected) return;
    const allowed = /\.(html?|txt|docx|pdf|pptx|xlsx|png|jpe?g|gif|webp|svg)$/i.test(file.name);
    if (!allowed) { setError("Select HTML, TXT, Word, PDF, PowerPoint, Excel, or a supported image."); return; }
    if (file.size > 25 * 1024 * 1024) { setError("The file exceeds the 25 MB upload limit."); return; }
    const exists = remoteFiles.some((remote) => remote.type !== "Carpeta" && remote.name.toLowerCase() === file.name.toLowerCase());
    if (exists && !window.confirm(`${file.name} already exists. Replace it with the edited version?`)) { if (uploadInput.current) uploadInput.current.value = ""; return; }
    setFileLoading("upload"); setError("");
    try {
      const textFile = /\.(html?|txt)$/i.test(file.name);
      const payload = textFile
        ? { action: "write", url, username, password, fileName: file.name, content: await file.text() }
        : { action: "writeBinary", url, username, password, fileName: file.name, dataBase64: arrayBufferToBase64(await file.arrayBuffer()) };
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) throw new Error(data.error || "The file could not be uploaded.");
      toast.success(exists ? "File replaced in WebDAV" : "File uploaded to WebDAV", { description: file.name });
      await connect(url);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The file could not be uploaded."); }
    finally { setFileLoading(""); if (uploadInput.current) uploadInput.current.value = ""; }
  };
  const changeRemoteFormat = (format: "html" | "docx" | "pdf") => {
    setRemoteFormat(format);
    setRemoteName((current) => `${current.replace(/\.(html?|txt|docx|pdf)$/i, "")}.${format}`);
  };
  const saveToWebDav = async () => {
    setFileLoading("save"); setError("");
    try {
      const portableHtml = normalizeAutomaticIndentationHtml(documentHtml, documentLanguage);
      let payload: Record<string, string> = { action: "write", url, username, password, fileName: remoteName, content: portableHtml };
      if (remoteFormat === "docx" || remoteFormat === "pdf") {
        const exported = await requestExport(remoteFormat, portableHtml, remoteName.replace(/\.(docx|pdf)$/i, ""), documentLanguage, documentAuthor, documentDescription, pageSetup);
        payload = { action: "writeBinary", url, username, password, fileName: remoteName, dataBase64: arrayBufferToBase64(await exported.arrayBuffer()) };
      }
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) throw new Error(data.error || "The file could not be saved.");
      toast.success("File saved to WebDAV", { description: remoteName }); await connect(url);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The file could not be saved."); }
    finally { setFileLoading(""); }
  };
  const shown = (connected ? remoteFiles : files.map((file) => ({ name: file.name, type: file.type, size: null, href: "" }))).filter((file) => file.name.toLowerCase().includes(search.toLowerCase()));
  return <Dialog open={dialogOpen} onOpenChange={(open)=>{setDialogOpen(open);if(!open)setPassword("");}}><DialogTrigger asChild>{trigger as React.ReactElement}</DialogTrigger><DialogContent className="collection-dialog"><DialogHeader><DialogTitle>Content Collection</DialogTitle><DialogDescription>Open and edit HTML/TXT directly; download other files and upload them again after editing.</DialogDescription></DialogHeader><input ref={uploadInput} className="sr-only" type="file" accept=".html,.htm,.txt,.docx,.pdf,.pptx,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.svg" onChange={(event) => uploadEditedFile(event.target.files?.[0])} aria-label="Select an edited file to upload to WebDAV"/><div className={`connection-card ${connected ? "connected" : ""}`}><div className="connection-heading"><span className="connection-icon">{connected ? <Check size={17}/> : <LockKeyhole size={17}/>}</span><span><strong>{connected ? "Active connection" : "Secure WebDAV connection"}</strong><small>{connected ? `${remoteFiles.length} resources available` : "Institutional Blackboard domains are supported; credentials are not stored"}</small></span></div>{savedUrls.length > 0 && <label>Saved addresses<select className="webdav-select" value={savedUrls.includes(url) ? url : ""} onChange={(e)=>changeUrl(e.target.value)}><option value="">Select another address…</option>{savedUrls.map((savedUrl)=><option key={savedUrl} value={savedUrl}>{savedUrl}</option>)}</select></label>}<label>Editable WebDAV address<Input value={url} onChange={(e)=>changeUrl(e.target.value)} placeholder="https://your-institution.edu/bbcswebdav/courses/…" /></label><p className="field-help">Use the HTTPS Content Collection address supplied by your institution. Its path must begin with /bbcswebdav/.</p><div className="webdav-actions"><Button type="button" size="sm" variant="outline" onClick={saveUrl} disabled={!url.trim()}>Save Address</Button><Button type="button" size="sm" variant="outline" onClick={()=>changeUrl("")}>New Address</Button>{savedUrls.includes(url) && <Button type="button" size="sm" variant="ghost" className="remove-webdav" onClick={removeUrl}>Remove Saved</Button>}</div><div className="credential-grid"><label>Institutional username<Input value={username} autoComplete="username" onChange={(e)=>setUsername(e.target.value)} /></label><label>Password<Input type="password" value={password} autoComplete="current-password" onChange={(e)=>setPassword(e.target.value)} /></label></div>{error && <p className="connection-error" role="alert">{error}</p>}<Button onClick={()=>connect()} disabled={loading || !url || !username || !password}>{loading ? <Loader2 className="spin" size={16}/> : <PlugZap size={16}/>} {loading ? "Connecting…" : connected ? "Refresh Folder" : "Connect to Blackboard"}</Button></div><div className="document-actions"><div className="local-file-actions"><Button type="button" variant="outline" onClick={newDocument}><FilePlus2 size={16}/> Create New File</Button><Button type="button" variant="outline" onClick={() => uploadInput.current?.click()} disabled={!connected || fileLoading === "upload"}>{fileLoading === "upload" ? <Loader2 className="spin" size={16}/> : <Upload size={16}/>} Upload Edited File</Button></div><div className="remote-save"><select className="webdav-select format-select" value={remoteFormat} onChange={(e)=>changeRemoteFormat(e.target.value as "html" | "docx" | "pdf")} aria-label="Format to save in WebDAV"><option value="html">HTML</option><option value="docx">Word (.docx)</option><option value="pdf">Accessible PDF</option></select><Input value={remoteName} onChange={(e)=>setRemoteName(e.target.value)} aria-label="WebDAV file name"/><Button type="button" onClick={saveToWebDav} disabled={!connected || !password || fileLoading === "save"}>{fileLoading === "save" ? <Loader2 className="spin" size={16}/> : <Upload size={16}/>} Save to WebDAV</Button></div></div><div className="collection-status"><span className={connected ? "status-dot" : "status-dot demo"}/><span><strong>{connected ? "Current WebDAV Folder" : "Demo View"}</strong><small>{connected ? url : "Connect to open real files"}</small></span></div><div className="search-box"><Search size={17}/><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files and folders"/></div><div className="file-list">{shown.map((file) => { const image = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name); const editable = /\.(html?|txt)$/i.test(file.name); const folder = file.type === "Carpeta"; const Icon = folder ? Folder : image ? FileImage : FileText; return <div key={`${file.name}-${file.href}`} className="file-row webdav-file-row"><button className="file-main-action" onClick={() => connected ? openRemote(file) : insertFile(file.name, file.type)} disabled={fileLoading === file.href}><span className="file-icon">{fileLoading === file.href ? <Loader2 className="spin" size={19}/> : <Icon size={19}/>}</span><span className="file-name"><strong>{file.name}</strong><small>{folder ? "Open folder" : editable ? "Open and edit in UltraPage" : "Insert link or resource"}</small></span><span className="file-size">{file.size ? formatBytes(file.size) : ""}</span>{editable || folder ? <ChevronDown className="open-file-icon" size={17}/> : <Plus size={17}/>}</button>{connected && !folder && <button type="button" className="file-download-action" onClick={() => downloadRemote(file)} disabled={fileLoading === `download:${file.href}`} aria-label={`Download ${file.name}`} title="Download for editing">{fileLoading === `download:${file.href}` ? <Loader2 className="spin" size={16}/> : <Download size={16}/>}</button>}</div>})}</div><p className="demo-note">HTML, HTM, and TXT files can be edited directly. For Word, PDF, PowerPoint, Excel, or images, download the file, edit it in the appropriate application, and use “Upload Edited File.” Keep the same name to replace the remote version. The password is cleared when closed.</p></DialogContent></Dialog>;
}

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
