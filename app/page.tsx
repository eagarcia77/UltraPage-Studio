"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Accessibility, AlertTriangle, AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, BookOpen, Check, ChevronDown, Cloud, Code2, Columns3, Copy, Download, Eraser, FileImage, FilePlus2, FileText, Folder, Heading2, Highlighter, History, ImagePlus, Italic, Keyboard, Link2, List, ListOrdered, Loader2, LockKeyhole, Minus, Monitor, MoreHorizontal, Palette, PanelRight, PlugZap, Plus, Quote, Redo2, Rows3, Save, Search, Sigma, Smartphone, Stamp, Strikethrough, Subscript, Superscript, Table2, Tablet, Trash2, Underline, Undo2, Unlink, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";

const starterHtml = "";
const exportedPageStyles = `
:root{color-scheme:light}html{-webkit-text-size-adjust:100%;text-size-adjust:100%}*{box-sizing:border-box}body{margin:0;background:#f0f2f6;color:#242a36;font-family:Arial,"Segoe UI",sans-serif;font-size:16px;line-height:1.7;overflow-wrap:break-word}.ultra-page{width:min(100% - 32px,860px);min-height:100vh;margin:24px auto;background:#fff;border:1px solid #dce1e9;border-radius:5px;padding:54px clamp(30px,8vw,92px)}h1{font-size:clamp(27px,5vw,34px);line-height:1.16;letter-spacing:-.035em;margin:10px 0 18px;color:#242439}h2{font-size:clamp(21px,3.6vw,23px);line-height:1.3;margin:32px 0 10px;color:#302254}h3{font-size:clamp(18px,3vw,19px);line-height:1.4;margin:26px 0 8px;color:#302254}h4{font-size:clamp(16px,2.7vw,17px);line-height:1.4;margin:22px 0 7px;color:#302254}p{margin:0 0 16px}.eyebrow{color:#6b38d1;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.lead{font-size:18px;color:#555e70}.callout{border-left:5px solid #6b38d1;background:#f3effc;padding:18px 20px;margin:28px 0;border-radius:0 8px 8px 0}.callout strong{color:#5124a9}.callout p{margin:5px 0 0}ul,ol{margin:12px 0 20px;padding-left:28px}li{margin:4px 0}a{color:#2457a6;text-decoration:underline;text-underline-offset:2px;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #6b38d1;outline-offset:3px}blockquote{border-left:5px solid #6b38d1;margin:24px 0;padding:10px 20px;color:#555e70;background:#faf8ff}figure{margin:28px 0}img,svg,video,canvas{display:block;max-width:100%;height:auto}img{border-radius:7px}figcaption{font-size:13px;color:#6f788a;margin-top:8px}.apa-reference{padding-left:2rem;text-indent:-2rem;margin-bottom:.75rem}table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-collapse:collapse;margin:10px 0}caption{text-align:left;font-weight:700;margin-bottom:8px}th{text-align:left;padding:8px;background:#f3effc}td{padding:8px}table[data-table-style="grid"],table[data-table-style="grid"] th,table[data-table-style="grid"] td{border:1px solid #555}table[data-table-style="apa7"]{border:0}.apa-table th,table[data-table-style="apa7"] th{border-top:2px solid #222;border-bottom:1px solid #555;border-left:0;border-right:0}.apa-table td,table[data-table-style="apa7"] td{border:0}.apa-table tbody tr:last-child td,table[data-table-style="apa7"] tbody tr:last-child td{border-bottom:2px solid #222}.figure-placeholder{min-height:160px;border:2px dashed #c7cdd8;background:#f6f7f9;display:grid;place-items:center;color:#737d90;text-align:center;padding:20px}.ultrapage-toc{border:1px solid #ddd5ee;background:#faf8ff;border-radius:8px;padding:18px 20px;margin:24px 0}.ultrapage-toc-title{font-weight:700;color:#302254;margin:0 0 8px}.ultrapage-toc ol{margin:0;padding-left:22px}.ultrapage-toc li{margin:4px 0}@media(max-width:600px){body{background:#fff}.ultra-page{width:100%;margin:0;border:0;border-radius:0;padding:max(26px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(26px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left))}.lead{font-size:17px}.callout,blockquote{padding:14px 16px}table{font-size:14px}th,td{min-width:110px;padding:7px}ul,ol{padding-left:24px}}@media print{body{background:#fff}.ultra-page{width:100%;margin:0;border:0;padding:0}}
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
type DocumentLanguage = "es-PR" | "en-US";
type DraftSnapshot = { id: string; html: string; title: string; fileName: string; language?: DocumentLanguage; savedAt: string };
const languageLabels: Record<DocumentLanguage, string> = { "es-PR": "Español (Puerto Rico)", "en-US": "English (United States)" };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

function sanitizePastedHtml(source: string) {
  const parsed = new DOMParser().parseFromString(source, "text/html");
  const allowedTags = new Set(["P","DIV","NAV","BR","H1","H2","H3","H4","UL","OL","LI","STRONG","B","EM","I","U","S","SUB","SUP","BLOCKQUOTE","A","TABLE","CAPTION","THEAD","TBODY","TR","TH","TD","FIGURE","FIGCAPTION","IMG"]);
  const removeEntirely = new Set(["SCRIPT","STYLE","META","LINK","IFRAME","OBJECT","EMBED","FORM","INPUT","BUTTON"]);
  Array.from(parsed.body.querySelectorAll<HTMLElement>("*")).forEach((element) => {
    if (removeEntirely.has(element.tagName)) { element.remove(); return; }
    if (!allowedTags.has(element.tagName)) { element.replaceWith(...Array.from(element.childNodes)); return; }
    const safeAttributes = new Set(["href","src","alt","title","scope","colspan","rowspan","class","role","aria-label","aria-hidden","width","height","loading","id","data-table-style","data-ultrapage-toc"]);
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
  });
  return parsed.body.innerHTML;
}

function buildBlackboardHtml(sourceHtml: string, language: DocumentLanguage = "es-PR") {
  const parsed = new DOMParser().parseFromString(`<div id="ultrapage-export">${sourceHtml}</div>`, "text/html");
  const root = parsed.querySelector<HTMLElement>("#ultrapage-export");
  if (!root) return sourceHtml;
  root.setAttribute("lang", language);
  root.querySelectorAll("script,style,object,embed,form,input,button").forEach((element) => element.remove());
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
  root.querySelectorAll("figure").forEach((element) => style(element, "display:block;margin:28px 0"));
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
  root.querySelectorAll("ul").forEach((element) => element.setAttribute("type", "disc"));
  root.querySelectorAll("ol").forEach((element) => element.setAttribute("type", "1"));
  root.querySelectorAll("table").forEach((element) => {
    element.setAttribute("width", "100%"); element.setAttribute("border", "0"); element.setAttribute("cellspacing", "0"); element.setAttribute("cellpadding", "8");
  });
  root.querySelectorAll('table[data-table-style="grid"]').forEach((element) => element.setAttribute("border", "1"));
  root.querySelectorAll("th").forEach((element) => element.setAttribute("bgcolor", "#f3effc"));
  root.querySelectorAll<HTMLElement>(".callout").forEach((callout) => {
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
  return root.outerHTML;
}

export default function Home() {
  const editor = useRef<HTMLDivElement>(null);
  const localFileInput = useRef<HTMLInputElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const [html, setHtml] = useState(starterHtml);
  const htmlRef = useRef(starterHtml);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [codeView, setCodeView] = useState<"blackboard" | "source">("blackboard");
  const [blackboardHtml, setBlackboardHtml] = useState("");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rulerUnit, setRulerUnit] = useState<"in" | "cm">("in");
  const [rightPanel, setRightPanel] = useState(true);
  const [title, setTitle] = useState("Documento sin título");
  const [saved, setSaved] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [documentFileName, setDocumentFileName] = useState("documento-sin-titulo.html");
  const [documentLanguage, setDocumentLanguage] = useState<DocumentLanguage>("es-PR");
  const [documentAuthor, setDocumentAuthor] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");

  useEffect(() => {
    try {
      const properties = JSON.parse(localStorage.getItem("ultrapage-document-properties") || "{}") as { author?: string; description?: string };
      setDocumentAuthor(properties.author || "");
      setDocumentDescription(properties.description || "");
    } catch { localStorage.removeItem("ultrapage-document-properties"); }
  }, []);
  useEffect(() => {
    localStorage.setItem("ultrapage-document-properties", JSON.stringify({ author: documentAuthor, description: documentDescription }));
  }, [documentAuthor, documentDescription]);
  useEffect(() => {
    const compactLayout = window.matchMedia("(max-width: 1040px)");
    if (compactLayout.matches) setRightPanel(false);
  }, []);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const draft = JSON.parse(stored) as { html?: string; title?: string; fileName?: string; language?: DocumentLanguage };
        const restoredHtml = typeof draft.html === "string" ? draft.html : "";
        htmlRef.current = restoredHtml;
        setHtml(restoredHtml);
        if (editor.current) editor.current.innerHTML = restoredHtml;
        if (draft.title) setTitle(draft.title);
        if (draft.fileName) setDocumentFileName(draft.fileName);
        if (draft.language === "es-PR" || draft.language === "en-US") setDocumentLanguage(draft.language);
        toast.success("Borrador recuperado", { description: "Se restauró el trabajo guardado automáticamente." });
      }
    } catch { localStorage.removeItem(DRAFT_KEY); }
    setDraftLoaded(true);
  }, []);
  useEffect(() => {
    if (!draftLoaded) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ html, title, fileName: documentFileName, language: documentLanguage, updatedAt: new Date().toISOString() }));
      setSaved(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftLoaded, html, title, documentFileName, documentLanguage]);

  htmlRef.current = html;
  const attachEditor = useCallback((node: HTMLDivElement | null) => {
    editor.current = node;
    if (node && node.innerHTML !== htmlRef.current) node.innerHTML = htmlRef.current;
  }, []);
  const changeMode = (value: string) => {
    const nextMode = value as "visual" | "html";
    if (mode === "visual" && editor.current) {
      const currentHtml = editor.current.innerHTML;
      htmlRef.current = currentHtml;
      setHtml(currentHtml);
    }
    setMode(nextMode);
  };
  useEffect(() => { if (mode === "html") setBlackboardHtml(buildBlackboardHtml(html, documentLanguage)); }, [html, mode, documentLanguage]);
  useEffect(() => {
    const rememberSelection = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || !editor.current) return;
      const range = selection.getRangeAt(0);
      if (editor.current.contains(range.commonAncestorContainer)) savedSelection.current = range.cloneRange();
    };
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);
  const command = (name: string, value?: string) => {
    if (!editor.current) return;
    editor.current.focus();
    const selection = window.getSelection();
    if (selection && savedSelection.current) { selection.removeAllRanges(); selection.addRange(savedSelection.current); }
    document.execCommand(name, false, value);
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
  const applyLineSpacing = (spacing: string) => {
    if (!spacing || !editor.current) return;
    const { targets, range } = selectedBlocks();
    if (!targets.length) { toast.info("Seleccione el texto que desea modificar"); return; }
    targets.forEach((block) => { block.style.lineHeight = spacing; });
    setHtml(editor.current.innerHTML); setSaved(false);
    savedSelection.current = range?.cloneRange() || null;
  };
  const applyIndentation = (indentation: string) => {
    if (!indentation || !editor.current) return;
    const { targets, range } = selectedBlocks();
    if (!targets.length) { toast.info("Seleccione el párrafo que desea modificar"); return; }
    targets.forEach((block) => {
      block.style.marginLeft = "";
      block.style.paddingLeft = "";
      block.style.textIndent = "";
      if (indentation === "first-line") block.style.textIndent = "48px";
      if (indentation === "left") block.style.marginLeft = "48px";
      if (indentation === "hanging") { block.style.paddingLeft = "48px"; block.style.textIndent = "-48px"; }
    });
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
    if (!context) { toast.error("Seleccione primero una celda de la tabla"); return false; }
    const { table, row, cell } = context;
    if (action === "add-row") {
      const columnCount = table.rows[0]?.cells.length || 1;
      const body = table.tBodies[0] || table.createTBody();
      const newRow = body.insertRow(row && row.parentElement === body ? row.sectionRowIndex + 1 : -1);
      Array.from({ length: columnCount }, () => { const newCell = newRow.insertCell(); newCell.textContent = "Dato"; });
    }
    if (action === "delete-row") {
      const target = row && row.parentElement?.tagName.toLowerCase() === "tbody" ? row : table.tBodies[0]?.rows[table.tBodies[0].rows.length - 1];
      if (!target) { toast.error("La fila de encabezado no se puede eliminar"); return false; }
      target.remove();
    }
    if (action === "add-column") {
      const insertAfter = cell?.cellIndex ?? ((table.rows[0]?.cells.length || 1) - 1);
      Array.from(table.rows).forEach((tableRow) => {
        const newCell = tableRow.insertCell(Math.min(insertAfter + 1, tableRow.cells.length));
        if (tableRow.parentElement?.tagName.toLowerCase() === "thead") {
          const heading = document.createElement("th"); heading.scope = "col"; heading.textContent = `Encabezado ${tableRow.cells.length}`; newCell.replaceWith(heading);
        } else newCell.textContent = "Dato";
      });
    }
    if (action === "delete-column") {
      if ((table.rows[0]?.cells.length || 0) <= 1) { toast.error("La tabla debe conservar al menos una columna"); return false; }
      const index = cell?.cellIndex ?? ((table.rows[0]?.cells.length || 1) - 1);
      Array.from(table.rows).forEach((tableRow) => { if (tableRow.cells[index]) tableRow.deleteCell(index); });
    }
    if (action === "grid" || action === "apa7") table.setAttribute("data-table-style", action);
    setHtml(editor.current.innerHTML); setSaved(false); savedSelection.current = null;
    toast.success("Tabla actualizada");
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
    toast.success("Marca de agua aplicada");
  };
  const removeWatermark = () => {
    if (!editor.current) return;
    const watermark = editor.current.querySelector(".ultrapage-watermark");
    if (!watermark) { toast.info("El documento no tiene una marca de agua"); return; }
    watermark.remove(); setHtml(editor.current.innerHTML); setSaved(false); toast.success("Marca de agua eliminada");
  };
  const insertAccessibleLink = ({ text, url, newTab }: { text: string; url: string; newTab: boolean }) => {
    const cleanUrl = url.trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(cleanUrl)) { toast.error("Utilice una dirección válida que comience con https://"); return false; }
    const label = text.trim() || cleanUrl;
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    command("insertHTML", `<a href="${escapeHtml(cleanUrl)}"${target}>${escapeHtml(label)}</a>`);
    toast.success("Enlace accesible insertado");
    return true;
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
  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const clipboardHtml = event.clipboardData.getData("text/html");
    const clipboardText = event.clipboardData.getData("text/plain");
    const cleaned = clipboardHtml ? sanitizePastedHtml(clipboardHtml) : escapeHtml(clipboardText).replace(/\r?\n/g, "<br>");
    command("insertHTML", cleaned);
    toast.success("Contenido pegado y limpiado", { description: "Se eliminaron estilos y código incompatibles con Blackboard." });
  };
  const insertAccessibleImage = ({ src, alt, caption, decorative, width }: { src: string; alt: string; caption: string; decorative: boolean; width: number }) => {
    const cleanSrc = src.trim();
    if (!/^(https?:\/\/|\/)/i.test(cleanSrc)) { toast.error("Utilice una dirección de imagen válida que comience con https://"); return false; }
    if (!decorative && !alt.trim()) { toast.error("Añada una descripción de la imagen o márquela como decorativa"); return false; }
    const safeWidth = Math.min(100, Math.max(10, Number(width) || 100));
    const image = `<img src="${escapeHtml(cleanSrc)}" alt="${decorative ? "" : escapeHtml(alt.trim())}"${decorative ? ' role="presentation"' : ""} loading="lazy" style="display:block;max-width:${safeWidth}%;height:auto;margin:0 auto">`;
    const markup = caption.trim() ? `<figure>${image}<figcaption>${escapeHtml(caption.trim())}</figcaption></figure>` : `<figure>${image}</figure>`;
    command("insertHTML", markup); toast.success("Imagen accesible insertada"); return true;
  };
  const insertAccessibleEquation = ({ formula, description, block }: { formula: string; description: string; block: boolean }) => {
    if (!formula.trim() || !description.trim()) { toast.error("Escriba la ecuación y su descripción accesible"); return false; }
    const tag = block ? "div" : "span";
    const style = block ? 'display:block;text-align:center;margin:20px 0;font-family:Georgia,serif;font-size:1.15em' : 'font-family:Georgia,serif';
    command("insertHTML", `<${tag} class="accessible-equation" role="math" aria-label="${escapeHtml(description.trim())}" style="${style}">${escapeHtml(formula.trim())}</${tag}>`);
    toast.success("Ecuación accesible insertada"); return true;
  };
  const insertMarkup = (markup: string) => { const next = `${html}${markup}`; setHtml(next); if (editor.current) editor.current.innerHTML = next; setSaved(false); toast.success("Elemento insertado"); };
  const generateTableOfContents = () => {
    const source = mode === "visual" ? editor.current?.innerHTML || html : html;
    const parsed = new DOMParser().parseFromString(source, "text/html");
    parsed.querySelectorAll('[data-ultrapage-toc="true"]').forEach((element) => element.remove());
    const headings = Array.from(parsed.body.querySelectorAll<HTMLElement>("h1,h2,h3,h4"));
    if (!headings.length) { toast.error("No hay encabezados", { description: "Añada H1, H2, H3 o H4 antes de crear la tabla de contenido." }); return; }
    const usedIds = new Set<string>();
    headings.forEach((heading, index) => {
      const base = (heading.id || heading.textContent || `seccion-${index + 1}`).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `seccion-${index + 1}`;
      let unique = base; let suffix = 2;
      while (usedIds.has(unique)) unique = `${base}-${suffix++}`;
      usedIds.add(unique); heading.id = unique;
    });
    const nav = parsed.createElement("nav");
    nav.className = "ultrapage-toc"; nav.setAttribute("data-ultrapage-toc", "true"); nav.setAttribute("aria-label", "Tabla de contenido");
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
    toast.success("Tabla de contenido creada", { description: `${headings.length} encabezados enlazados.` });
  };
  const save = () => {
    const currentHtml = mode === "visual" ? editor.current?.innerHTML || html : html;
    htmlRef.current = currentHtml; setHtml(currentHtml);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ html: currentHtml, title, fileName: documentFileName, language: documentLanguage, updatedAt: new Date().toISOString() }));
    const snapshot: DraftSnapshot = { id: crypto.randomUUID?.() || String(Date.now()), html: currentHtml, title, fileName: documentFileName, language: documentLanguage, savedAt: new Date().toISOString() };
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as DraftSnapshot[];
      if (history[0]?.html !== currentHtml || history[0]?.title !== title) localStorage.setItem(HISTORY_KEY, JSON.stringify([snapshot, ...history].slice(0, 10)));
    } catch { localStorage.setItem(HISTORY_KEY, JSON.stringify([snapshot])); }
    setSaved(true); toast.success("Página guardada", { description: "El borrador permanecerá disponible al cerrar o actualizar el navegador." });
  };
  const restoreSnapshot = (snapshot: DraftSnapshot) => {
    htmlRef.current = snapshot.html; setHtml(snapshot.html); setTitle(snapshot.title); setDocumentFileName(snapshot.fileName); if (snapshot.language) setDocumentLanguage(snapshot.language); setMode("visual"); setSaved(true);
    if (editor.current) editor.current.innerHTML = snapshot.html;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ html: snapshot.html, title: snapshot.title, fileName: snapshot.fileName, language: snapshot.language || documentLanguage, updatedAt: new Date().toISOString() }));
    toast.success("Versión restaurada", { description: snapshot.title });
  };
  const copyHtml = async () => {
    const currentHtml = mode === "visual" ? editor.current?.innerHTML || html : html;
    await navigator.clipboard.writeText(buildBlackboardHtml(currentHtml, documentLanguage));
    toast.success("HTML compatible con Ultra copiado", { description: "Incluye estilos en línea, viñetas y numeración para conservar la vista previa." });
  };
  const insertFile = (name: string, type: string, href?: string) => {
    if (!href) { toast.info("Conecte primero su propio curso o Content Collection"); return; }
    const resourceUrl = href;
    const markup = type === "Imagen" ? `<figure><img src="${resourceUrl}" alt="Describa el contenido de la imagen"><figcaption>Figura 1. Recurso visual del módulo.</figcaption></figure>` : `<p><a href="${resourceUrl}">${name}</a></p>`;
    command("insertHTML", markup); toast.success("Recurso insertado", { description: `${name} se añadió a la página.` });
  };
  const openDocument = (name: string, content: string) => {
    const plainTextFile = /\.txt$/i.test(name);
    const extracted = content.match(/<main[^>]*class=["'][^"']*ultra-page[^"']*["'][^>]*>([\s\S]*?)<\/main>/i)?.[1] || content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || content;
    const body = plainTextFile
      ? extracted.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("")
      : sanitizePastedHtml(extracted);
    setHtml(body); setDocumentFileName(name); setTitle(name.replace(/\.(html?|txt)$/i, "")); setMode("visual"); setSaved(true);
    if (editor.current) editor.current.innerHTML = body;
    toast.success("Archivo abierto de forma segura", { description: `${name} está listo para editar.` });
  };
  const importLocalDocument = async (file?: File) => {
    if (!file) return;
    if (!/\.(html?|txt)$/i.test(file.name)) { toast.error("Formato no compatible", { description: "Seleccione un archivo HTML, HTM o TXT." }); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("El archivo es demasiado grande", { description: "El límite para edición local es 5 MB." }); return; }
    try { openDocument(file.name, await file.text()); }
    catch { toast.error("No se pudo abrir el archivo"); }
    finally { if (localFileInput.current) localFileInput.current.value = ""; }
  };
  const newDocument = () => {
    const name = prompt("Nombre del archivo nuevo", "nueva-pagina.html")?.trim();
    if (!name) return;
    const validName = /\.(html?|txt)$/i.test(name) ? name : `${name}.html`;
    const content = "";
    setDocumentFileName(validName); setTitle(validName.replace(/\.(html?|txt)$/i, "")); setHtml(content); setMode("visual"); setSaved(false);
    if (editor.current) editor.current.innerHTML = content;
    toast.success("Documento nuevo creado");
  };
  const downloadDocument = () => {
    const currentHtml = mode === "visual" ? editor.current?.innerHTML || html : html;
    const safeTitle = escapeHtml(title);
    const safeAuthor = escapeHtml(documentAuthor.trim());
    const safeDescription = escapeHtml(documentDescription.trim());
    const fileContent = documentFileName.toLowerCase().endsWith(".txt") ? currentHtml.replace(/<[^>]+>/g, "") : `<!doctype html><html lang="${documentLanguage}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light"><title>${safeTitle}</title>${safeAuthor ? `<meta name="author" content="${safeAuthor}">` : ""}${safeDescription ? `<meta name="description" content="${safeDescription}">` : ""}<style>${exportedPageStyles}</style></head><body><main class="ultra-page">${currentHtml}</main></body></html>`;
    const blob = new Blob([fileContent], { type: documentFileName.toLowerCase().endsWith(".txt") ? "text/plain;charset=utf-8" : "text/html;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = downloadUrl; link.download = documentFileName; link.click(); URL.revokeObjectURL(downloadUrl);
    toast.success("Archivo descargado en la computadora");
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
  }, [mode, html, title, documentFileName, rightPanel]);

  const filteredFiles = demoFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const pageChecks = accessibilityReport(html, title, documentLanguage);
  const accessibilityScore = Math.round((pageChecks.filter((check) => check.ok).length / pageChecks.length) * 100);
  const plainText = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&lt;|&gt;|&#39;|&quot;/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;
  const characterCount = plainText.length;
  const documentOutline = Array.from(html.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi), (match, index) => ({
    level: Number(match[1]),
    text: match[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim() || `Encabezado H${match[1]} sin texto`,
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

  return <main className="min-h-screen bg-[#f4f6f9] text-[#172033]">
    <Toaster position="bottom-right" richColors />
    <input ref={localFileInput} className="sr-only" type="file" accept=".html,.htm,.txt,text/html,text/plain" onChange={(event) => importLocalDocument(event.target.files?.[0])} aria-label="Abrir archivo HTML o TXT de la computadora"/>
    <header className="topbar">
      <div className="brandmark" aria-hidden="true"><span>U</span></div><div className="brandcopy"><strong>UltraPage Studio</strong><span>Editor para Blackboard Ultra</span></div>
      <div className="course-pill disconnected" aria-label="Estado de conexión"><span className="status-dot disconnected" />Sin curso conectado</div>
      <div className="header-actions"><ApaDialog insertMarkup={insertMarkup}/><span className={saved ? "save-state" : "save-state pending"}>{saved ? <Check size={14}/> : <Cloud size={14}/>} {saved ? "Guardado" : "Cambios sin guardar"}</span><HistoryDialog restoreSnapshot={restoreSnapshot}/><KeyboardShortcutsDialog/><DocumentPropertiesDialog author={documentAuthor} description={documentDescription} setAuthor={setDocumentAuthor} setDescription={setDocumentDescription}/><Button variant="outline" className="publish-button" title="Abrir HTML o TXT de la computadora" onClick={() => localFileInput.current?.click()}><Upload size={16}/> Abrir</Button><ExportDialog html={html} title={title} language={documentLanguage} author={documentAuthor} description={documentDescription} downloadHtml={downloadDocument}/><Button variant="outline" className="publish-button" onClick={copyHtml}><Copy size={16}/> Copiar para Ultra</Button><Button className="save-button" onClick={save}><Save size={16}/> Guardar</Button></div>
    </header>
    <div className="workspace">
      <aside className="leftbar" aria-label="Herramientas"><button className="rail-button active" aria-label="Editor"><FileText /></button><button className="rail-button" aria-label="Recursos"><Folder /></button><button className="rail-button" aria-label="Accesibilidad"><Accessibility /></button><button className="rail-button" aria-label="Código"><Code2 /></button><div className="rail-spacer" /><button className="avatar" aria-label="Perfil de Eduardo">EG</button></aside>
      <section className="editor-shell">
        <div className="document-head"><div><div className="breadcrumbs"><span>Editor independiente</span><span>/</span><span>Documento</span></div><input className="title-input" value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} aria-label="Título de la página" /><div className="document-metrics" aria-live="polite"><span>{wordCount} palabras</span><span>{characterCount} caracteres</span><span>Guardado automático activo</span></div><label className="document-language"><span>Idioma del documento</span><select value={documentLanguage} onChange={(event) => { setDocumentLanguage(event.target.value as DocumentLanguage); setSaved(false); }} aria-label="Idioma principal del documento"><option value="es-PR">Español (Puerto Rico)</option><option value="en-US">English (United States)</option></select></label></div><div className="view-controls" aria-label="Vista previa por dispositivo"><button onClick={() => setDevice("desktop")} className={device === "desktop" ? "active" : ""} aria-label="Computadora"><Monitor size={17}/></button><button onClick={() => setDevice("tablet")} className={device === "tablet" ? "active" : ""} aria-label="Tableta"><Tablet size={17}/></button><button onClick={() => setDevice("mobile")} className={device === "mobile" ? "active" : ""} aria-label="Celular"><Smartphone size={17}/></button><button onClick={() => setRightPanel(!rightPanel)} className={rightPanel ? "active panel-toggle" : "panel-toggle"} aria-label="Mostrar u ocultar panel" aria-expanded={rightPanel} aria-controls="editor-side-panel"><PanelRight size={17}/></button></div><button type="button" className="mobile-panel-toggle" onClick={() => setRightPanel(true)} aria-expanded={rightPanel} aria-controls="editor-side-panel"><PanelRight size={16}/> Herramientas</button></div>
        <Tabs value={mode} onValueChange={changeMode} className="editor-tabs">
          <div className="toolbar-row">
            <TabsList className="mode-tabs"><TabsTrigger value="visual">Diseño</TabsTrigger><TabsTrigger value="html">HTML</TabsTrigger></TabsList>
            {mode === "visual" && <div className="toolbar" role="toolbar" aria-label="Formato de texto">
              <button onClick={() => command("undo")} aria-label="Deshacer"><Undo2 /></button><button onClick={() => command("redo")} aria-label="Rehacer"><Redo2 /></button><i/>
              <label className="toolbar-select-label"><span className="sr-only">Estructura del texto</span><select defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)} aria-label="Párrafo o encabezado"><option value="p">Párrafo</option><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="h4">H4</option></select></label>
              <label className="toolbar-select-label font-family-select"><span className="sr-only">Tipo de letra</span><select defaultValue="" onChange={(event) => applyFont(event.target.value)} aria-label="Tipo de letra"><option value="" disabled>Tipo de letra</option><option value="Arial">Arial</option><option value="Calibri">Calibri</option><option value="Georgia">Georgia</option><option value="Tahoma">Tahoma</option><option value="Times New Roman">Times New Roman</option><option value="Verdana">Verdana</option></select></label>
              <label className="toolbar-select-label font-size-select"><span className="sr-only">Tamaño de letra</span><select defaultValue="" onChange={(event) => applyFontSize(event.target.value)} aria-label="Tamaño de letra"><option value="" disabled>Tamaño</option><option value="10">10 px</option><option value="12">12 px</option><option value="14">14 px</option><option value="16">16 px</option><option value="18">18 px</option><option value="24">24 px</option><option value="32">32 px</option><option value="40">40 px</option></select></label>
              <label className="toolbar-select-label line-spacing-select"><span className="sr-only">Interlineado</span><select defaultValue="" onChange={(event) => applyLineSpacing(event.target.value)} aria-label="Interlineado"><option value="" disabled>Interlineado</option><option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0 doble</option><option value="2.5">2.5</option></select></label>
              <button onClick={() => command("bold")} aria-label="Negrita"><Bold /></button><button onClick={() => command("italic")} aria-label="Itálica"><Italic /></button><button onClick={() => command("underline")} aria-label="Subrayado"><Underline /></button><i/>
              <button onClick={() => command("insertUnorderedList")} aria-label="Lista"><List /></button><button onClick={() => command("insertOrderedList")} aria-label="Lista numerada"><ListOrdered /></button>
              <LinkDialog insertLink={insertAccessibleLink}/>
              <ImageDialog insertImage={insertAccessibleImage}/>
              <EquationDialog insertEquation={insertAccessibleEquation}/>
              <ContentDialog documentLanguage={documentLanguage} documentAuthor={documentAuthor} documentDescription={documentDescription} trigger={<button aria-label="Insertar desde Content Collection"><ImagePlus /></button>} search={search} setSearch={setSearch} files={filteredFiles} insertFile={insertFile} documentHtml={html} documentFileName={documentFileName} openDocument={openDocument} newDocument={newDocument}/>
              <AdvancedToolsDialog command={command} replaceText={replaceText}/>
            </div>}
          </div>
          {mode === "visual" && <div className="secondary-toolbar" role="toolbar" aria-label="Alineación, sangría, tablas y marca de agua"><button className="clear-format-button" onClick={clearFormatting} aria-label="Quitar formato" title="Quitar todo el formato del texto seleccionado"><Eraser /><span>Quitar formato</span></button><span className="secondary-divider"/><TableDialog insertMarkup={insertMarkup}/><TableEditDialog editTable={editSelectedTable}/><WatermarkDialog applyWatermark={applyWatermark} removeWatermark={removeWatermark}/><span className="secondary-divider"/><label className="toolbar-select-label indentation-select"><span className="sr-only">Sangría de párrafo</span><select defaultValue="" onChange={(event) => applyIndentation(event.target.value)} aria-label="Sangría de párrafo"><option value="" disabled>Sangría de párrafo</option><option value="first-line">Primera línea (0.5″)</option><option value="left">Párrafo completo (0.5″)</option><option value="hanging">Sangría francesa (0.5″)</option><option value="none">Quitar sangría</option></select></label><span className="secondary-divider"/><button onClick={() => command("justifyLeft")} aria-label="Alinear a la izquierda" title="Alinear a la izquierda"><AlignLeft /></button><button onClick={() => command("justifyCenter")} aria-label="Centrar texto" title="Centrar texto"><AlignCenter /></button><button onClick={() => command("justifyRight")} aria-label="Alinear a la derecha" title="Alinear a la derecha"><AlignRight /></button><button onClick={() => command("justifyFull")} aria-label="Justificar texto" title="Justificar texto"><AlignJustify /></button></div>}
          <TabsContent value="visual" className="canvas-wrap"><div className={`device-frame ${device}`}><div className="ultra-label"><span className="mini-logo">U</span><span>Vista previa en Ultra</span><span className="ruler-status">Reglas: {rulerUnit === "in" ? "pulgadas" : "centímetros"}</span></div><EditorRulers unit={rulerUnit} device={device} onToggle={() => setRulerUnit((current) => current === "in" ? "cm" : "in")}><div ref={attachEditor} className="page-canvas" contentEditable suppressContentEditableWarning onPaste={handlePaste} onInput={(e) => { htmlRef.current = e.currentTarget.innerHTML; setHtml(e.currentTarget.innerHTML); setSaved(false); }} aria-label="Contenido editable de la página" /></EditorRulers></div></TabsContent>
          <TabsContent value="html" className="code-wrap"><div className="code-header"><div className="code-heading"><span>{codeView === "blackboard" ? "HTML listo para pegar en Blackboard Ultra" : "Código HTML base editable"}</span><div className="code-view-switch" role="group" aria-label="Tipo de código HTML"><button type="button" className={codeView === "blackboard" ? "active" : ""} aria-pressed={codeView === "blackboard"} onClick={() => setCodeView("blackboard")}>Para Blackboard</button><button type="button" className={codeView === "source" ? "active" : ""} aria-pressed={codeView === "source"} onClick={() => setCodeView("source")}>Editar código base</button></div></div><button className="copy-code-button" onClick={copyHtml}><Copy size={14}/> Copiar código</button></div><Textarea value={codeView === "blackboard" ? blackboardHtml : html} readOnly={codeView === "blackboard"} onChange={(e) => { if (codeView === "source") { setHtml(e.target.value); setSaved(false); } }} className={`code-editor ${codeView === "blackboard" ? "compatible" : ""}`} spellCheck={false} aria-label={codeView === "blackboard" ? "Código HTML compatible con Blackboard Ultra" : "Código HTML base editable"} /><p className="code-help">{codeView === "blackboard" ? "Este es el mismo código que utiliza Copiar para Ultra. Pégalo en el editor HTML <> de Blackboard." : "Los cambios realizados aquí se reflejan en la vista Diseño. Cambia a Para Blackboard antes de copiar."}</p></TabsContent>
        </Tabs>
      </section>
      {rightPanel && <><button type="button" className="panel-backdrop" onClick={() => setRightPanel(false)} aria-label="Cerrar panel de herramientas"/><aside id="editor-side-panel" className="right-panel" aria-label="Panel de herramientas"><div className="mobile-panel-heading"><strong>Herramientas del editor</strong><button type="button" onClick={() => setRightPanel(false)} aria-label="Cerrar panel"><X size={18}/></button></div><Tabs defaultValue="blocks"><TabsList className="side-tabs"><TabsTrigger value="blocks">Bloques</TabsTrigger><TabsTrigger value="review">Revisión</TabsTrigger><TabsTrigger value="outline">Esquema</TabsTrigger></TabsList><TabsContent value="blocks"><p className="panel-label">CONTENIDO</p><div className="block-grid"><Block icon={Heading2} label="Encabezado" onClick={() => command("formatBlock", "h2")}/><Block icon={FileText} label="Texto" onClick={() => command("insertParagraph")}/><Block icon={ImagePlus} label="Imagen" onClick={() => toast.info("Selecciona una imagen desde Content Collection.")}/><TableDialog insertMarkup={insertMarkup} block/><LinkDialog insertLink={insertAccessibleLink} block/><Block icon={List} label="Lista" onClick={() => command("insertUnorderedList")}/><Block icon={BookOpen} label="Índice" onClick={generateTableOfContents}/><Block icon={Plus} label="Aviso" onClick={() => command("insertHTML", '<div class="callout"><strong>Importante</strong><p>Escriba aquí la información destacada.</p></div>')}/></div><p className="panel-label section-label">FORMATO ACADÉMICO</p><ApaDialog insertMarkup={insertMarkup} fullWidth/><p className="panel-label section-label">PLANTILLAS RÁPIDAS</p><button className="template-card" onClick={() => command("insertHTML", '<h2>Objetivos de aprendizaje</h2><ul><li>Objetivo 1</li><li>Objetivo 2</li></ul>')}><span className="template-icon blue"><List /></span><span><strong>Objetivos</strong><small>Lista accesible</small></span><Plus size={16}/></button><button className="template-card" onClick={() => command("insertHTML", '<div class="callout"><strong>Instrucciones</strong><p>Complete los siguientes pasos.</p></div>')}><span className="template-icon gold"><FileText /></span><span><strong>Instrucciones</strong><small>Bloque destacado</small></span><Plus size={16}/></button><p className="panel-label section-label">HERRAMIENTAS DESARROLLADAS</p><div className="connected-tools"><a href="https://eagarcia77.github.io/estiloAPA/" target="_blank" rel="noopener noreferrer"><strong>EstiloAPA</strong><span>Referencias y formato APA 7</span></a><a href="https://eagarcia77.github.io/CTEL-SG/index_generator.html" target="_blank" rel="noopener noreferrer"><strong>Generador de índice</strong><span>Índices para documentos</span></a><a href="https://eagarcia77.github.io/CTEL-SG/QTI21_BlackboardV3.html" target="_blank" rel="noopener noreferrer"><strong>QTI 2.1 Blackboard</strong><span>Paquetes de evaluación</span></a></div><ContentDialog documentLanguage={documentLanguage} documentAuthor={documentAuthor} documentDescription={documentDescription} trigger={<Button variant="outline" className="collection-button"><Folder size={17}/> Abrir Content Collection</Button>} search={search} setSearch={setSearch} files={filteredFiles} insertFile={insertFile} documentHtml={html} documentFileName={documentFileName} openDocument={openDocument} newDocument={newDocument}/></TabsContent><TabsContent value="review"><div className="score-card"><div className="score-ring">{accessibilityScore}</div><div><strong>{accessibilityScore === 100 ? "Accesibilidad lista" : "Revisión necesaria"}</strong><span>{pageChecks.filter((check) => !check.ok).length} recomendaciones pendientes</span></div></div>{pageChecks.map((check) => <ReviewItem key={check.text} ok={check.ok} text={check.text}/>)}</TabsContent><TabsContent value="outline"><DocumentOutline items={documentOutline} onSelect={focusHeading}/></TabsContent></Tabs></aside></>}
    </div>
  </main>;
}

function EditorRulers({ unit, device, onToggle, children }: { unit: "in" | "cm"; device: "desktop" | "tablet" | "mobile"; onToggle: () => void; children: React.ReactNode }) {
  const horizontalMax = unit === "in" ? (device === "desktop" ? 9 : device === "tablet" ? 7 : 4) : (device === "desktop" ? 22 : device === "tablet" ? 18 : 10);
  const verticalMax = unit === "in" ? 11 : 28;
  const horizontalLabels = Array.from({ length: horizontalMax + 1 }, (_, index) => index);
  const verticalLabels = Array.from({ length: verticalMax + 1 }, (_, index) => index);
  const horizontalStyle = { "--ruler-segments": horizontalMax, "--ruler-minor-segments": horizontalMax * (unit === "in" ? 4 : 2) } as React.CSSProperties;
  const verticalStyle = { "--ruler-segments": verticalMax, "--ruler-minor-segments": verticalMax * (unit === "in" ? 4 : 2) } as React.CSSProperties;
  return <div className="editor-rulers" data-unit={unit}><button type="button" className="ruler-corner" onClick={onToggle} aria-label={`Cambiar reglas a ${unit === "in" ? "centímetros" : "pulgadas"}`} title="Cambiar unidad de medida">{unit}</button><div className="horizontal-ruler" style={horizontalStyle} aria-hidden="true">{horizontalLabels.map((value) => <span key={value} style={{ left: `${(value / horizontalMax) * 100}%` }}>{value}</span>)}</div><div className="vertical-ruler" style={verticalStyle} aria-hidden="true">{verticalLabels.map((value) => <span key={value} style={{ top: `${(value / verticalMax) * 100}%` }}>{value}</span>)}</div><div className="measurement-page"><div className="margin-guides" aria-hidden="true"/>{children}</div></div>;
}

function Block({ icon: Icon, label, onClick }: { icon: typeof FileText; label: string; onClick: () => void }) { return <button className="block-button" onClick={onClick}><Icon size={19}/><span>{label}</span></button>; }
function ReviewItem({ ok, text }: { ok: boolean; text: string }) { return <div className={`review-item ${ok ? "ok" : "warn"}`}><span>{ok ? <Check size={15}/> : "!"}</span><p>{text}</p></div>; }

function DocumentOutline({ items, onSelect }: { items: Array<{ level: number; text: string; index: number }>; onSelect: (index: number) => void }) {
  if (!items.length) return <div className="outline-empty"><Heading2/><strong>Sin encabezados</strong><span>Añade H1, H2, H3 o H4 para crear la navegación del documento.</span></div>;
  return <nav className="document-outline" aria-label="Esquema del documento"><p className="panel-label">ESQUEMA DEL DOCUMENTO</p><ol>{items.map((item) => <li key={`${item.index}-${item.text}`} style={{ paddingLeft: `${(item.level - 1) * 14}px` }}><button onClick={() => onSelect(item.index)}><span>H{item.level}</span><strong>{item.text}</strong></button></li>)}</ol></nav>;
}

type AccessibilityCheck = { ok: boolean; text: string };

function accessibilityReport(html: string, title: string, language: DocumentLanguage = "es-PR"): AccessibilityCheck[] {
  const headingLevels = Array.from(html.matchAll(/<h([1-6])\b[^>]*>/gi), (match) => Number(match[1]));
  const headings = Array.from(html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi), (match) => match[2].replace(/<[^>]+>/g, "").trim());
  const h1Count = headingLevels.filter((level) => level === 1).length;
  let hierarchyOk = headingLevels.length > 0;
  let previous = 0;
  for (const level of headingLevels) {
    if (previous && level > previous + 1) hierarchyOk = false;
    previous = level;
  }
  const images = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
  const links = Array.from(html.matchAll(/<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi), (match) => ({ attributes: `${match[1]}${match[3]}`, href: match[2], text: match[4].replace(/<[^>]+>/g, "").trim() }));
  const vagueLink = /^(aquí|clic aquí|click here|más|ver más|enlace)$/i;
  const tables = Array.from(html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi), (match) => match[0]);
  const safeMarkup = !/<\/?(?:script|object|embed|form|input|button)\b|\son\w+\s*=|(?:href|src)\s*=\s*["']javascript:/i.test(html);
  const responsiveMarkup = !/min-width\s*:\s*(?:[4-9]\d{2,}|\d{4,})px/i.test(html);
  const ids = Array.from(html.matchAll(/\bid=["']([^"']+)["']/gi), (match) => match[1]);
  const uniqueIds = new Set(ids).size === ids.length;
  return [
    { ok: Boolean(title.trim()), text: "El documento tiene un título identificable" },
    { ok: h1Count === 1, text: h1Count === 1 ? "Existe un solo encabezado H1" : `Debe existir un solo H1; actualmente hay ${h1Count}` },
    { ok: hierarchyOk, text: "La jerarquía de encabezados no omite niveles" },
    { ok: headings.every(Boolean), text: "Los encabezados contienen texto descriptivo" },
    { ok: images.every((image) => /\balt=["'][^"']+["']/i.test(image) && !/alt=["'][^"']*(describa|imagen)[^"']*["']/i.test(image)), text: images.length ? "Todas las imágenes tienen texto alternativo útil" : "No hay imágenes que requieran texto alternativo" },
    { ok: links.every((link) => !vagueLink.test(link.text) && Boolean(link.text) && /^(https?:|mailto:|tel:|\/|#)/i.test(link.href)), text: "Los enlaces tienen texto descriptivo y direcciones válidas" },
    { ok: links.every((link) => !/target=["']_blank["']/i.test(link.attributes) || /rel=["'][^"']*noopener/i.test(link.attributes)), text: "Los enlaces en pestañas nuevas incluyen protección de seguridad" },
    { ok: tables.every((table) => /<th\b/i.test(table)), text: tables.length ? "Las tablas incluyen celdas de encabezado" : "No hay tablas que requieran encabezados" },
    { ok: tables.every((table) => /<caption\b/i.test(table) || /aria-label=["'][^"']+["']/i.test(table)), text: tables.length ? "Todas las tablas tienen título o nombre accesible" : "No hay tablas que requieran título" },
    { ok: safeMarkup, text: "El HTML no contiene código ejecutable o inseguro" },
    { ok: responsiveMarkup, text: responsiveMarkup ? "El contenido no impone anchos mínimos que desborden el celular" : "Elimine anchos mínimos fijos de 400 px o más para mejorar la vista móvil" },
    { ok: uniqueIds, text: uniqueIds ? "Los identificadores internos son únicos" : "Hay identificadores repetidos que pueden romper la tabla de contenido" },
    { ok: true, text: `El idioma principal está definido como ${languageLabels[language]}` },
  ];
}

async function requestExport(format: "docx" | "pdf", html: string, title: string, language: DocumentLanguage = "es-PR", author = "", description = "") {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, html, title, author: author.trim() || "UltraPage Studio", description: description.trim(), language }),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(problem.error || "No se pudo generar el archivo.");
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

function ExportDialog({ html, title, language, author, description, downloadHtml }: { html: string; title: string; language: DocumentLanguage; author: string; description: string; downloadHtml: () => void }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"docx" | "pdf" | "">("");
  const checks = accessibilityReport(html, title, language);
  const warnings = checks.filter((check) => !check.ok).length;
  const exportDocument = async (format: "docx" | "pdf") => {
    setExporting(format);
    try {
      const blob = await requestExport(format, html, title, language, author, description);
      downloadBlob(blob, exportFileName(title, format));
      toast.success(format === "docx" ? "Documento Word descargado" : "PDF accesible descargado", { description: "Se conservaron la estructura, el idioma y los metadatos del documento." });
      setOpen(false);
    } catch (problem) {
      toast.error("No se pudo exportar", { description: problem instanceof Error ? problem.message : "Intente nuevamente." });
    } finally { setExporting(""); }
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="publish-button"><Download size={16}/> Exportar</Button></DialogTrigger><DialogContent className="export-dialog"><DialogHeader><DialogTitle>Exportar documento accesible</DialogTitle><DialogDescription>Descarga el contenido en Word, PDF o HTML. La revisión identifica problemas que conviene corregir antes de exportar.</DialogDescription></DialogHeader><div className={`export-summary ${warnings ? "has-warnings" : "ready"}`}><span>{warnings ? <AlertTriangle size={20}/> : <Check size={20}/>}</span><div><strong>{warnings ? `${warnings} recomendación${warnings === 1 ? "" : "es"} de accesibilidad` : "Listo para exportar"}</strong><small>{warnings ? "Puede exportar ahora, pero es preferible corregirlas." : "El contenido pasó las verificaciones automáticas."}</small></div></div><div className="export-checks" aria-label="Resultados de accesibilidad">{checks.map((check) => <ReviewItem key={check.text} ok={check.ok} text={check.text}/>)}</div><div className="export-options"><button onClick={() => exportDocument("docx")} disabled={Boolean(exporting)}><FileText/><span><strong>Microsoft Word</strong><small>.docx estructurado y editable</small></span>{exporting === "docx" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={() => exportDocument("pdf")} disabled={Boolean(exporting)}><FileText/><span><strong>PDF accesible</strong><small>PDF/UA etiquetado, idioma y metadatos</small></span>{exporting === "pdf" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={() => { downloadHtml(); setOpen(false); }} disabled={Boolean(exporting)}><Code2/><span><strong>Página HTML</strong><small>Responsivo y compatible con Blackboard Ultra</small></span><Download/></button></div><p className="export-note"><Accessibility size={15}/> La revisión automática ayuda, pero un documento institucional debe validarse también con Microsoft Accessibility Checker o Adobe Acrobat.</p></DialogContent></Dialog>;
}

function DocumentPropertiesDialog({ author, description, setAuthor, setDescription }: { author: string; description: string; setAuthor: (value: string) => void; setDescription: (value: string) => void }) {
  return <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Propiedades del documento" title="Propiedades del documento"><FileText size={17}/></Button></DialogTrigger><DialogContent className="properties-dialog"><DialogHeader><DialogTitle>Propiedades del documento</DialogTitle><DialogDescription>Estos metadatos se incorporan en HTML, Word y PDF. No se define un autor automáticamente.</DialogDescription></DialogHeader><div className="properties-grid"><label>Autor u organización<Input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Nombre opcional"/></label><label>Descripción accesible<Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Resumen breve del propósito y contenido del documento" maxLength={300}/><span>{description.length}/300</span></label></div></DialogContent></Dialog>;
}

function KeyboardShortcutsDialog() {
  const shortcuts = [
    ["Ctrl/⌘ + S", "Guardar una versión"],
    ["Alt + 1, 2, 3 o 4", "Aplicar H1, H2, H3 o H4"],
    ["Ctrl/⌘ + Shift + 7", "Crear lista numerada"],
    ["Ctrl/⌘ + Shift + 8", "Crear lista con viñetas"],
  ];
  return <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Ver atajos de teclado" title="Atajos de teclado"><Keyboard size={17}/></Button></DialogTrigger><DialogContent className="shortcuts-dialog"><DialogHeader><DialogTitle>Atajos de teclado</DialogTitle><DialogDescription>Edite y estructure el contenido sin apartarse del teclado.</DialogDescription></DialogHeader><dl className="shortcut-list">{shortcuts.map(([keys, action]) => <div key={keys}><dt><kbd>{keys}</kbd></dt><dd>{action}</dd></div>)}</dl><p className="field-help">Los atajos de encabezados y listas funcionan en la vista Diseño. Los atajos habituales de negrita, cursiva, subrayado, copiar, pegar, deshacer y rehacer continúan disponibles.</p></DialogContent></Dialog>;
}

function HistoryDialog({ restoreSnapshot }: { restoreSnapshot: (snapshot: DraftSnapshot) => void }) {
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
  const clear = () => { localStorage.removeItem(HISTORY_KEY); setHistory([]); toast.success("Historial eliminado"); };
  return <Dialog open={open} onOpenChange={loadHistory}><DialogTrigger asChild><Button variant="outline" className="publish-button"><History size={16}/> Historial</Button></DialogTrigger><DialogContent className="history-dialog"><DialogHeader><DialogTitle>Historial de versiones</DialogTitle><DialogDescription>Cada vez que presiona Guardar se conserva una versión. Puede recuperar hasta las diez más recientes.</DialogDescription></DialogHeader>{history.length ? <div className="history-list">{history.map((snapshot) => <button key={snapshot.id} onClick={() => restore(snapshot)}><History/><span><strong>{snapshot.title || "Documento sin título"}</strong><small>{new Date(snapshot.savedAt).toLocaleString("es-PR")}</small></span><span>Restaurar</span></button>)}</div> : <p className="empty-history">Todavía no hay versiones guardadas manualmente.</p>}<div className="apa-actions">{history.length > 0 && <Button variant="outline" className="remove-watermark" onClick={clear}><Trash2 size={16}/> Borrar historial</Button>}<Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button></div></DialogContent></Dialog>;
}

function ImageDialog({ insertImage }: { insertImage: (options: { src: string; alt: string; caption: string; decorative: boolean; width: number }) => boolean }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState("https://");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [decorative, setDecorative] = useState(false);
  const [width, setWidth] = useState(100);
  const insert = () => { if (insertImage({ src, alt, caption, decorative, width })) { setOpen(false); setSrc("https://"); setAlt(""); setCaption(""); setDecorative(false); setWidth(100); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button aria-label="Insertar imagen accesible" title="Insertar imagen accesible"><FileImage/></button></DialogTrigger><DialogContent className="image-dialog"><DialogHeader><DialogTitle>Insertar imagen accesible</DialogTitle><DialogDescription>Utilice una imagen alojada en Blackboard Content Collection o en una dirección HTTPS estable.</DialogDescription></DialogHeader><div className="image-dialog-grid"><label>Dirección de la imagen<Input value={src} onChange={(event) => setSrc(event.target.value)} placeholder="https://…/imagen.jpg"/></label><label>Texto alternativo<Input value={alt} disabled={decorative} onChange={(event) => setAlt(event.target.value)} placeholder="Describa el propósito de la imagen"/></label><label>Leyenda opcional<Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Figura 1. Descripción"/></label><label className="checkbox-label"><input type="checkbox" checked={decorative} onChange={(event) => setDecorative(event.target.checked)}/> La imagen es decorativa</label><label className="image-width-label">Ancho de la imagen <span>{width}%</span><Input type="range" min="10" max="100" step="5" value={width} onChange={(event) => setWidth(Number(event.target.value))}/></label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={insert}><ImagePlus size={16}/> Insertar imagen</Button></div></DialogContent></Dialog>;
}

function EquationDialog({ insertEquation }: { insertEquation: (options: { formula: string; description: string; block: boolean }) => boolean }) {
  const [open, setOpen] = useState(false);
  const [formula, setFormula] = useState("");
  const [description, setDescription] = useState("");
  const [block, setBlock] = useState(true);
  const insert = () => { if (insertEquation({ formula, description, block })) { setOpen(false); setFormula(""); setDescription(""); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button aria-label="Insertar ecuación accesible" title="Insertar ecuación accesible"><Sigma/></button></DialogTrigger><DialogContent className="link-dialog"><DialogHeader><DialogTitle>Insertar ecuación accesible</DialogTitle><DialogDescription>Escriba la expresión con símbolos matemáticos y una descripción que pueda anunciar un lector de pantalla.</DialogDescription></DialogHeader><div className="link-dialog-grid"><label>Ecuación<Input value={formula} onChange={(event) => setFormula(event.target.value)} placeholder="E = mc²"/></label><label>Descripción accesible<Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Energía es igual a masa por velocidad de la luz al cuadrado"/></label><label className="checkbox-label"><input type="checkbox" checked={block} onChange={(event) => setBlock(event.target.checked)}/> Mostrar como ecuación independiente</label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={insert}><Sigma size={16}/> Insertar ecuación</Button></div></DialogContent></Dialog>;
}

function LinkDialog({ insertLink, block = false }: { insertLink: (options: { text: string; url: string; newTab: boolean }) => boolean; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("https://");
  const [newTab, setNewTab] = useState(true);
  const insert = () => { if (insertLink({ text, url, newTab })) { setOpen(false); setText(""); setUrl("https://"); } };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className={block ? "block-button" : ""} aria-label="Insertar enlace accesible"><Link2/><span>{block ? "Enlace" : ""}</span></button></DialogTrigger><DialogContent className="link-dialog"><DialogHeader><DialogTitle>Insertar enlace accesible</DialogTitle><DialogDescription>Use un texto que describa el destino. Evite expresiones como “clic aquí” o “más información”.</DialogDescription></DialogHeader><div className="link-dialog-grid"><label>Texto descriptivo<Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Guía de estudio del módulo"/></label><label>Dirección web<Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://"/></label><label className="checkbox-label"><input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)}/> Abrir en una pestaña nueva</label></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={insert}><Link2 size={16}/> Insertar enlace</Button></div></DialogContent></Dialog>;
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
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button aria-label="Más herramientas" title="Más herramientas"><MoreHorizontal/></button></DialogTrigger><DialogContent className="advanced-tools-dialog"><DialogHeader><DialogTitle>Más herramientas de edición</DialogTitle><DialogDescription>Formato adicional, símbolos, líneas divisorias y búsqueda dentro del documento.</DialogDescription></DialogHeader><div className="advanced-format-grid"><label><Palette/> Color del texto<Input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)}/><Button variant="outline" onClick={() => run("foreColor", textColor)}>Aplicar</Button></label><label><Highlighter/> Resaltado<Input type="color" value={highlightColor} onChange={(event) => setHighlightColor(event.target.value)}/><Button variant="outline" onClick={() => run("hiliteColor", highlightColor)}>Aplicar</Button></label></div><div className={`contrast-result ${normalTextPasses ? "pass" : "warn"}`} role="status" aria-live="polite"><div className="contrast-swatch" style={{ color: textColor, backgroundColor: highlightColor }}>Aa</div><div><strong>Contraste WCAG: {ratio.toFixed(2)}:1</strong><span>Texto normal: {normalTextPasses ? "cumple AA" : "no cumple AA"} · Texto grande: {largeTextPasses ? "cumple AA" : "no cumple AA"}</span></div></div><div className="advanced-command-grid"><button onClick={() => run("subscript")}><Subscript/> Subíndice</button><button onClick={() => run("superscript")}><Superscript/> Superíndice</button><button onClick={() => run("strikeThrough")}><Strikethrough/> Tachado</button><button onClick={() => run("unlink")}><Unlink/> Quitar enlace</button><button onClick={() => run("formatBlock", "blockquote")}><Quote/> Cita en bloque</button><button onClick={() => run("insertHorizontalRule")}><Minus/> Línea divisoria</button></div><div className="symbol-row" aria-label="Símbolos frecuentes">{["©","®","™","°","±","≤","≥","→","•","§"].map((symbol) => <button key={symbol} onClick={() => run("insertText", symbol)}>{symbol}</button>)}</div><div className="find-replace"><p className="panel-label">BUSCAR Y REEMPLAZAR</p><div><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar texto"/><Input value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="Reemplazar con"/><Button onClick={() => replaceText(search, replacement)} disabled={!search}><Search size={16}/> Reemplazar todo</Button></div></div></DialogContent></Dialog>;
}

function TableDialog({ insertMarkup, block = false }: { insertMarkup: (markup: string) => void; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tableStyle, setTableStyle] = useState<"grid" | "apa7">("grid");
  const [title, setTitle] = useState("Título de la tabla");
  const clean = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
  const createTable = () => {
    const safeRows = Math.min(20, Math.max(1, Number(rows) || 1));
    const safeColumns = Math.min(10, Math.max(1, Number(columns) || 1));
    const headingCells = Array.from({ length: safeColumns }, (_, index) => `<th scope="col">Encabezado ${index + 1}</th>`).join("");
    const bodyRows = Array.from({ length: safeRows }, () => `<tr>${Array.from({ length: safeColumns }, () => "<td>Dato</td>").join("")}</tr>`).join("");
    const safeTitle = clean(title.trim() || "Título de la tabla");
    const table = `<table data-table-style="${tableStyle}" aria-label="${safeTitle}">${tableStyle === "grid" ? `<caption>${safeTitle}</caption>` : ""}<thead><tr>${headingCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    const markup = tableStyle === "apa7"
      ? `<p class="apa-table-heading"><strong>Tabla 1</strong><br><em>${safeTitle}</em></p>${table}<p class="apa-table-note"><em>Nota.</em> Añada aquí la nota de la tabla si es necesaria.</p>`
      : table;
    insertMarkup(markup);
    setOpen(false);
    toast.success(tableStyle === "apa7" ? "Tabla APA 7 creada" : "Tabla con todos los bordes creada");
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className={block ? "block-button" : "table-tool-button"} aria-label="Crear tabla"><Table2 size={block ? 19 : 17}/><span>Tabla</span></button></DialogTrigger><DialogContent className="table-creator-dialog"><DialogHeader><DialogTitle>Crear tabla accesible</DialogTitle><DialogDescription>Seleccione el tamaño y el estilo de bordes. La primera fila se crea como encabezado de columna.</DialogDescription></DialogHeader><div className="table-creator-grid"><label>Título de la tabla<Input value={title} onChange={(event) => setTitle(event.target.value)}/></label><label>Filas de datos<Input type="number" min={1} max={20} value={rows} onChange={(event) => setRows(Number(event.target.value))}/></label><label>Columnas<Input type="number" min={1} max={10} value={columns} onChange={(event) => setColumns(Number(event.target.value))}/></label><label>Estilo de bordes<select value={tableStyle} onChange={(event) => setTableStyle(event.target.value as "grid" | "apa7")}><option value="grid">Todos los bordes</option><option value="apa7">Bordes APA 7</option></select></label></div><div className={`table-style-preview ${tableStyle}`} aria-label="Vista previa del estilo de tabla"><strong>{tableStyle === "apa7" ? "APA 7" : "Todos los bordes"}</strong><span>Encabezado</span><span>Encabezado</span><span>Dato</span><span>Dato</span></div><div className="apa-actions"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={createTable}><Table2 size={16}/> Insertar tabla</Button></div></DialogContent></Dialog>;
}

function TableEditDialog({ editTable }: { editTable: (action: "add-row" | "delete-row" | "add-column" | "delete-column" | "grid" | "apa7") => boolean }) {
  const [open, setOpen] = useState(false);
  const run = (action: "add-row" | "delete-row" | "add-column" | "delete-column" | "grid" | "apa7") => { if (editTable(action)) setOpen(false); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className="table-tool-button" aria-label="Editar tabla" title="Seleccione una celda y edite la tabla"><Table2/><span>Editar tabla</span></button></DialogTrigger><DialogContent className="table-edit-dialog"><DialogHeader><DialogTitle>Editar tabla seleccionada</DialogTitle><DialogDescription>Antes de abrir esta herramienta, coloque el cursor dentro de una celda. Puede escribir directamente en cualquier celda de la tabla.</DialogDescription></DialogHeader><div className="table-edit-actions"><button onClick={() => run("add-row")}><Rows3/><span><strong>Añadir fila</strong><small>Debajo de la fila seleccionada</small></span></button><button onClick={() => run("delete-row")}><Trash2/><span><strong>Eliminar fila</strong><small>Conserva el encabezado</small></span></button><button onClick={() => run("add-column")}><Columns3/><span><strong>Añadir columna</strong><small>A la derecha de la celda</small></span></button><button onClick={() => run("delete-column")}><Trash2/><span><strong>Eliminar columna</strong><small>Conserva al menos una</small></span></button></div><p className="panel-label">CAMBIAR ESTILO</p><div className="apa-actions"><Button variant="outline" onClick={() => run("grid")}>Todos los bordes</Button><Button variant="outline" onClick={() => run("apa7")}>Bordes APA 7</Button></div></DialogContent></Dialog>;
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
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className="table-tool-button" aria-label="Marca de agua"><Stamp/><span>Marca de agua</span></button></DialogTrigger><DialogContent className="watermark-dialog"><DialogHeader><DialogTitle>Crear marca de agua</DialogTitle><DialogDescription>Añada un texto tenue detrás del contenido, como Borrador, Confidencial o Copia.</DialogDescription></DialogHeader><div className="watermark-grid"><label>Texto<Input value={text} maxLength={40} onChange={(event) => setText(event.target.value)}/></label><label>Color<Input type="color" value={color} onChange={(event) => setColor(event.target.value)}/></label><label>Opacidad <span>{Math.round(opacity * 100)}%</span><Input type="range" min="0.05" max="0.5" step="0.01" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))}/></label><label>Tamaño <span>{size}px</span><Input type="range" min="32" max="140" step="2" value={size} onChange={(event) => setSize(Number(event.target.value))}/></label><label>Ángulo <span>{angle}°</span><Input type="range" min="-90" max="90" step="5" value={angle} onChange={(event) => setAngle(Number(event.target.value))}/></label></div><div className="watermark-preview"><span style={{ color, opacity, fontSize: `${Math.min(size, 72)}px`, transform: `rotate(${angle}deg)` }}>{text || "BORRADOR"}</span></div><div className="apa-actions"><Button variant="outline" className="remove-watermark" onClick={remove}><Trash2 size={16}/> Quitar marca</Button><Button onClick={apply}><Stamp size={16}/> Aplicar marca</Button></div></DialogContent></Dialog>;
}

function ApaDialog({ insertMarkup, fullWidth = false }: { insertMarkup: (markup: string) => void; fullWidth?: boolean }) {
  const [author, setAuthor] = useState("Laudon et al."); const [year, setYear] = useState("2025"); const [page, setPage] = useState("");
  const [reference, setReference] = useState("Laudon, K. C., Laudon, J. P., & Traver, C. G. (2025). Management information systems: Managing the digital firm. Pearson.");
  const [label, setLabel] = useState("Relación entre tecnología, personas y procesos");
  const citation = `(${author}, ${year}${page ? `, p. ${page}` : ""})`;
  return <Dialog><DialogTrigger asChild><Button variant="outline" className={fullWidth ? "apa-trigger full" : "apa-trigger"}><BookOpen size={16}/> APA 7</Button></DialogTrigger><DialogContent className="apa-dialog"><DialogHeader><DialogTitle>Herramientas APA 7</DialogTitle><DialogDescription>Inserta elementos académicos cuando la página del curso los necesite.</DialogDescription></DialogHeader><Tabs defaultValue="citation"><TabsList className="apa-tabs"><TabsTrigger value="citation"><Quote size={14}/> Cita</TabsTrigger><TabsTrigger value="reference"><BookOpen size={14}/> Referencia</TabsTrigger><TabsTrigger value="table"><Table2 size={14}/> Tabla</TabsTrigger><TabsTrigger value="figure"><ImagePlus size={14}/> Figura</TabsTrigger></TabsList><TabsContent value="citation" className="apa-pane"><div className="form-grid"><label>Autor o autores<Input value={author} onChange={(e)=>setAuthor(e.target.value)}/></label><label>Año<Input value={year} onChange={(e)=>setYear(e.target.value)}/></label><label>Página opcional<Input value={page} onChange={(e)=>setPage(e.target.value)} placeholder="45"/></label></div><div className="apa-preview"><small>Vista previa</small><p>{citation}</p></div><div className="apa-actions"><Button variant="outline" onClick={()=>insertMarkup(`<p>${author} (${year}) sostiene que [escriba aquí la idea]${page ? ` (p. ${page})` : ""}.</p>`)}>Cita narrativa</Button><Button onClick={()=>insertMarkup(`<span>${citation}</span>`)}>Cita parentética</Button></div></TabsContent><TabsContent value="reference" className="apa-pane"><label>Referencia completa<Textarea value={reference} onChange={(e)=>setReference(e.target.value)} rows={5}/></label><p className="field-help">Revise cursivas, mayúsculas, DOI o URL según el tipo de fuente.</p><Button onClick={()=>insertMarkup(`<h2>Referencias</h2><p class="apa-reference">${reference}</p>`)}>Insertar con sangría francesa</Button></TabsContent><TabsContent value="table" className="apa-pane"><label>Título de la tabla<Input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><div className="apa-preview table-preview"><strong>Tabla 1</strong><em>{label}</em><div>Encabezado 1　 Encabezado 2</div></div><Button onClick={()=>insertMarkup(`<figure class="apa-table"><p><strong>Tabla 1</strong><br><em>${label}</em></p><table data-table-style="apa7"><thead><tr><th scope="col">Encabezado 1</th><th scope="col">Encabezado 2</th></tr></thead><tbody><tr><td>Dato</td><td>Dato</td></tr></tbody></table><figcaption><em>Nota.</em> Describa aquí la información necesaria para interpretar la tabla.</figcaption></figure>`)}>Insertar tabla APA</Button></TabsContent><TabsContent value="figure" className="apa-pane"><label>Título de la figura<Input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><Button onClick={()=>insertMarkup(`<figure class="apa-figure"><p><strong>Figura 1</strong><br><em>${label}</em></p><div class="figure-placeholder">Inserte aquí la imagen desde Content Collection</div><figcaption><em>Nota.</em> Adaptado de Autor (año). Incluya licencia o derechos cuando corresponda.</figcaption></figure>`)}>Insertar figura APA</Button></TabsContent></Tabs><div className="apa-checklist"><strong>Lista de cotejo APA 7</strong><span>✓ Citas y referencias coinciden</span><span>✓ DOI como enlace https://doi.org/…</span><span>✓ Tablas y figuras numeradas</span><span>✓ Texto alternativo y notas accesibles</span></div></DialogContent></Dialog>;
}
type RemoteFile = { name: string; type: string; size: number | null; href: string };
type ContentDialogProps = {
  trigger: React.ReactNode;
  search: string;
  setSearch: (v: string) => void;
  files: typeof demoFiles;
  insertFile: (name: string, type: string, href?: string) => void;
  documentHtml: string;
  documentFileName: string;
  openDocument: (name: string, content: string) => void;
  newDocument: () => void;
  documentLanguage: DocumentLanguage;
  documentAuthor: string;
  documentDescription: string;
};

function ContentDialog({ trigger, search, setSearch, files, insertFile, documentHtml, documentFileName, openDocument, newDocument, documentLanguage, documentAuthor, documentDescription }: ContentDialogProps) {
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
    toast.success("Dirección WebDAV guardada");
  };
  const removeUrl = () => {
    const next = savedUrls.filter((savedUrl) => savedUrl !== url);
    setSavedUrls(next); localStorage.setItem("ultrapage-webdav-urls", JSON.stringify(next));
    changeUrl(""); toast.success("Dirección WebDAV eliminada");
  };
  const connect = async (targetUrl = url) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list", url: targetUrl, username, password }) });
      const data = await response.json() as { connected?: boolean; files?: RemoteFile[]; error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo establecer la conexión.");
      setUrl(targetUrl); setRemoteFiles(data.files || []); setConnected(true); toast.success("Content Collection conectado");
    } catch (problem) { setConnected(false); setError(problem instanceof Error ? problem.message : "No se pudo conectar."); }
    finally { setLoading(false); }
  };
  const openRemote = async (file: RemoteFile) => {
    if (file.type === "Carpeta") { await connect(file.href); return; }
    if (!/\.(html?|txt)$/i.test(file.name)) {
      const image = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name);
      insertFile(file.name, image ? "Imagen" : "Documento", file.href);
      return;
    }
    setFileLoading(file.href); setError("");
    try {
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read", url: file.href, username, password }) });
      const data = await response.json() as { content?: string; name?: string; error?: string };
      if (!response.ok || typeof data.content !== "string") throw new Error(data.error || "No se pudo abrir el archivo.");
      openDocument(data.name || file.name, data.content); setRemoteName(data.name || file.name); setDialogOpen(false);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No se pudo abrir el archivo."); }
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
      toast.success("Archivo descargado", { description: "Edítelo en su programa habitual y use “Subir archivo editado” para devolverlo a WebDAV." });
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No se pudo descargar el archivo."); }
    finally { setFileLoading(""); }
  };
  const uploadEditedFile = async (file?: File) => {
    if (!file || !connected) return;
    const allowed = /\.(html?|txt|docx|pdf|pptx|xlsx|png|jpe?g|gif|webp|svg)$/i.test(file.name);
    if (!allowed) { setError("Seleccione HTML, TXT, Word, PDF, PowerPoint, Excel o una imagen compatible."); return; }
    if (file.size > 25 * 1024 * 1024) { setError("El archivo supera el límite de carga de 25 MB."); return; }
    const exists = remoteFiles.some((remote) => remote.type !== "Carpeta" && remote.name.toLowerCase() === file.name.toLowerCase());
    if (exists && !window.confirm(`${file.name} ya existe. ¿Desea reemplazarlo con la versión editada?`)) { if (uploadInput.current) uploadInput.current.value = ""; return; }
    setFileLoading("upload"); setError("");
    try {
      const textFile = /\.(html?|txt)$/i.test(file.name);
      const payload = textFile
        ? { action: "write", url, username, password, fileName: file.name, content: await file.text() }
        : { action: "writeBinary", url, username, password, fileName: file.name, dataBase64: arrayBufferToBase64(await file.arrayBuffer()) };
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) throw new Error(data.error || "No se pudo subir el archivo.");
      toast.success(exists ? "Archivo reemplazado en WebDAV" : "Archivo subido a WebDAV", { description: file.name });
      await connect(url);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No se pudo subir el archivo."); }
    finally { setFileLoading(""); if (uploadInput.current) uploadInput.current.value = ""; }
  };
  const changeRemoteFormat = (format: "html" | "docx" | "pdf") => {
    setRemoteFormat(format);
    setRemoteName((current) => `${current.replace(/\.(html?|txt|docx|pdf)$/i, "")}.${format}`);
  };
  const saveToWebDav = async () => {
    setFileLoading("save"); setError("");
    try {
      let payload: Record<string, string> = { action: "write", url, username, password, fileName: remoteName, content: documentHtml };
      if (remoteFormat === "docx" || remoteFormat === "pdf") {
        const exported = await requestExport(remoteFormat, documentHtml, remoteName.replace(/\.(docx|pdf)$/i, ""), documentLanguage, documentAuthor, documentDescription);
        payload = { action: "writeBinary", url, username, password, fileName: remoteName, dataBase64: arrayBufferToBase64(await exported.arrayBuffer()) };
      }
      const response = await fetch("/api/webdav", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok || !data.saved) throw new Error(data.error || "No se pudo guardar el archivo.");
      toast.success("Archivo guardado en WebDAV", { description: remoteName }); await connect(url);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "No se pudo guardar el archivo."); }
    finally { setFileLoading(""); }
  };
  const shown = (connected ? remoteFiles : files.map((file) => ({ name: file.name, type: file.type, size: null, href: "" }))).filter((file) => file.name.toLowerCase().includes(search.toLowerCase()));
  return <Dialog open={dialogOpen} onOpenChange={(open)=>{setDialogOpen(open);if(!open)setPassword("");}}><DialogTrigger asChild>{trigger as React.ReactElement}</DialogTrigger><DialogContent className="collection-dialog"><DialogHeader><DialogTitle>Content Collection</DialogTitle><DialogDescription>Abre y edita HTML/TXT directamente; descarga otros archivos y vuelve a subirlos después de editarlos.</DialogDescription></DialogHeader><input ref={uploadInput} className="sr-only" type="file" accept=".html,.htm,.txt,.docx,.pdf,.pptx,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.svg" onChange={(event) => uploadEditedFile(event.target.files?.[0])} aria-label="Seleccionar archivo editado para subir a WebDAV"/><div className={`connection-card ${connected ? "connected" : ""}`}><div className="connection-heading"><span className="connection-icon">{connected ? <Check size={17}/> : <LockKeyhole size={17}/>}</span><span><strong>{connected ? "Conexión activa" : "Conexión segura WebDAV"}</strong><small>{connected ? `${remoteFiles.length} recursos disponibles` : "Puedes cambiar la dirección; las credenciales no se guardan"}</small></span></div>{savedUrls.length > 0 && <label>Direcciones guardadas<select className="webdav-select" value={savedUrls.includes(url) ? url : ""} onChange={(e)=>changeUrl(e.target.value)}><option value="">Seleccionar otra dirección…</option>{savedUrls.map((savedUrl)=><option key={savedUrl} value={savedUrl}>{savedUrl}</option>)}</select></label>}<label>Dirección WebDAV editable<Input value={url} onChange={(e)=>changeUrl(e.target.value)} placeholder="https://…/bbcswebdav/courses/…" /></label><div className="webdav-actions"><Button type="button" size="sm" variant="outline" onClick={saveUrl} disabled={!url.trim()}>Guardar dirección</Button><Button type="button" size="sm" variant="outline" onClick={()=>changeUrl("")}>Nueva dirección</Button>{savedUrls.includes(url) && <Button type="button" size="sm" variant="ghost" className="remove-webdav" onClick={removeUrl}>Eliminar guardada</Button>}</div><div className="credential-grid"><label>Usuario institucional<Input value={username} autoComplete="username" onChange={(e)=>setUsername(e.target.value)} /></label><label>Contraseña<Input type="password" value={password} autoComplete="current-password" onChange={(e)=>setPassword(e.target.value)} /></label></div>{error && <p className="connection-error" role="alert">{error}</p>}<Button onClick={()=>connect()} disabled={loading || !url || !username || !password}>{loading ? <Loader2 className="spin" size={16}/> : <PlugZap size={16}/>} {loading ? "Conectando…" : connected ? "Actualizar carpeta" : "Conectar con Blackboard"}</Button></div><div className="document-actions"><div className="local-file-actions"><Button type="button" variant="outline" onClick={newDocument}><FilePlus2 size={16}/> Crear archivo nuevo</Button><Button type="button" variant="outline" onClick={() => uploadInput.current?.click()} disabled={!connected || fileLoading === "upload"}>{fileLoading === "upload" ? <Loader2 className="spin" size={16}/> : <Upload size={16}/>} Subir archivo editado</Button></div><div className="remote-save"><select className="webdav-select format-select" value={remoteFormat} onChange={(e)=>changeRemoteFormat(e.target.value as "html" | "docx" | "pdf")} aria-label="Formato para guardar en WebDAV"><option value="html">HTML</option><option value="docx">Word (.docx)</option><option value="pdf">PDF accesible</option></select><Input value={remoteName} onChange={(e)=>setRemoteName(e.target.value)} aria-label="Nombre del archivo para WebDAV"/><Button type="button" onClick={saveToWebDav} disabled={!connected || !password || fileLoading === "save"}>{fileLoading === "save" ? <Loader2 className="spin" size={16}/> : <Upload size={16}/>} Guardar en WebDAV</Button></div></div><div className="collection-status"><span className={connected ? "status-dot" : "status-dot demo"}/><span><strong>{connected ? "Carpeta WebDAV actual" : "Vista de demostración"}</strong><small>{connected ? url : "Conéctate para abrir archivos reales"}</small></span></div><div className="search-box"><Search size={17}/><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar archivos y carpetas"/></div><div className="file-list">{shown.map((file) => { const image = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name); const editable = /\.(html?|txt)$/i.test(file.name); const folder = file.type === "Carpeta"; const Icon = folder ? Folder : image ? FileImage : FileText; return <div key={`${file.name}-${file.href}`} className="file-row webdav-file-row"><button className="file-main-action" onClick={() => connected ? openRemote(file) : insertFile(file.name, file.type)} disabled={fileLoading === file.href}><span className="file-icon">{fileLoading === file.href ? <Loader2 className="spin" size={19}/> : <Icon size={19}/>}</span><span className="file-name"><strong>{file.name}</strong><small>{folder ? "Abrir carpeta" : editable ? "Abrir y editar en UltraPage" : "Insertar enlace o recurso"}</small></span><span className="file-size">{file.size ? formatBytes(file.size) : ""}</span>{editable || folder ? <ChevronDown className="open-file-icon" size={17}/> : <Plus size={17}/>}</button>{connected && !folder && <button type="button" className="file-download-action" onClick={() => downloadRemote(file)} disabled={fileLoading === `download:${file.href}`} aria-label={`Descargar ${file.name}`} title="Descargar para editar">{fileLoading === `download:${file.href}` ? <Loader2 className="spin" size={16}/> : <Download size={16}/>}</button>}</div>})}</div><p className="demo-note">HTML, HTM y TXT se editan directamente. Para Word, PDF, PowerPoint, Excel o imágenes: descargue, edite con su programa y use “Subir archivo editado”. Si conserva el nombre, puede reemplazar la versión remota. La contraseña se elimina al cerrar.</p></DialogContent></Dialog>;
}

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
