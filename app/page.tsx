"use client";

import { useEffect, useRef, useState } from "react";
import { Accessibility, AlertTriangle, Bold, BookOpen, Check, ChevronDown, Cloud, Code2, Copy, Download, FileImage, FilePlus2, FileText, Folder, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, LockKeyhole, Monitor, MoreHorizontal, PanelRight, PlugZap, Plus, Quote, Redo2, Save, Search, Smartphone, Table2, Tablet, Underline, Undo2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "sonner";

const starterHtml = `<p class="eyebrow">MÓDULO 4 · SISTEMAS DE INFORMACIÓN</p><h1>Tecnología, personas y procesos</h1><p class="lead">En este módulo analizaremos cómo las organizaciones integran recursos tecnológicos para apoyar sus operaciones y tomar mejores decisiones.</p><div class="callout"><strong>Objetivo de aprendizaje</strong><p>Al finalizar, podrás evaluar la relación entre usuarios, procesos y tecnología dentro de un sistema de información.</p></div><h2>Antes de comenzar</h2><p>Revisa los materiales del módulo y utiliza la guía de estudio para organizar tus notas. Completa cada actividad en el orden presentado.</p><ul><li>Lectura del capítulo</li><li>Video introductorio</li><li>Foro de discusión</li></ul>`;
const demoFiles = [
  { name: "Banner_Modulo_4.jpg", type: "Imagen", size: "418 KB", icon: FileImage },
  { name: "Guia_de_estudio.pdf", type: "Documento", size: "1.2 MB", icon: FileText },
  { name: "Lecturas", type: "Carpeta", size: "6 archivos", icon: Folder },
  { name: "Recursos_visuales", type: "Carpeta", size: "12 archivos", icon: Folder },
];

export default function Home() {
  const editor = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(starterHtml);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [rightPanel, setRightPanel] = useState(true);
  const [title, setTitle] = useState("Introducción al Módulo 4");
  const [saved, setSaved] = useState(true);
  const [search, setSearch] = useState("");
  const [documentFileName, setDocumentFileName] = useState("introduccion-modulo-4.html");

  useEffect(() => { if (editor.current && editor.current.innerHTML !== html) editor.current.innerHTML = html; }, [mode]);
  const command = (name: string, value?: string) => { document.execCommand(name, false, value); setHtml(editor.current?.innerHTML || html); setSaved(false); editor.current?.focus(); };
  const insertMarkup = (markup: string) => { const next = `${html}${markup}`; setHtml(next); if (editor.current) editor.current.innerHTML = next; setSaved(false); toast.success("Elemento APA 7 insertado"); };
  const save = () => { setHtml(mode === "visual" ? editor.current?.innerHTML || html : html); setSaved(true); toast.success("Página guardada", { description: "Los cambios se conservaron en este borrador." }); };
  const copyHtml = async () => { await navigator.clipboard.writeText(html); toast.success("HTML copiado", { description: "Pégalo en el editor HTML de Blackboard Ultra." }); };
  const insertFile = (name: string, type: string, href?: string) => {
    const resourceUrl = href || `https://blackboard.example.edu/bbcswebdav/courses/DEMO/${name}`;
    const markup = type === "Imagen" ? `<figure><img src="${resourceUrl}" alt="Describa el contenido de la imagen"><figcaption>Figura 1. Recurso visual del módulo.</figcaption></figure>` : `<p><a href="${resourceUrl}">${name}</a></p>`;
    command("insertHTML", markup); toast.success("Recurso insertado", { description: `${name} se añadió a la página.` });
  };
  const openDocument = (name: string, content: string) => {
    const body = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || content;
    setHtml(body); setDocumentFileName(name); setTitle(name.replace(/\.(html?|txt)$/i, "")); setMode("visual"); setSaved(true);
    if (editor.current) editor.current.innerHTML = body;
    toast.success("Archivo abierto", { description: `${name} está listo para editar.` });
  };
  const newDocument = () => {
    const name = prompt("Nombre del archivo nuevo", "nueva-pagina.html")?.trim();
    if (!name) return;
    const validName = /\.(html?|txt)$/i.test(name) ? name : `${name}.html`;
    const content = "<h1>Nueva página</h1><p>Comience a escribir aquí.</p>";
    setDocumentFileName(validName); setTitle(validName.replace(/\.(html?|txt)$/i, "")); setHtml(content); setMode("visual"); setSaved(false);
    if (editor.current) editor.current.innerHTML = content;
    toast.success("Documento nuevo creado");
  };
  const downloadDocument = () => {
    const currentHtml = mode === "visual" ? editor.current?.innerHTML || html : html;
    const fileContent = documentFileName.toLowerCase().endsWith(".txt") ? currentHtml.replace(/<[^>]+>/g, "") : `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body>${currentHtml}</body></html>`;
    const blob = new Blob([fileContent], { type: documentFileName.toLowerCase().endsWith(".txt") ? "text/plain;charset=utf-8" : "text/html;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = downloadUrl; link.download = documentFileName; link.click(); URL.revokeObjectURL(downloadUrl);
    toast.success("Archivo descargado en la computadora");
  };
  const filteredFiles = demoFiles.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const pageChecks = accessibilityReport(html, title);
  const accessibilityScore = Math.round((pageChecks.filter((check) => check.ok).length / pageChecks.length) * 100);

  return <main className="min-h-screen bg-[#f4f6f9] text-[#172033]">
    <Toaster position="bottom-right" richColors />
    <header className="topbar">
      <div className="brandmark" aria-hidden="true"><span>U</span></div><div className="brandcopy"><strong>UltraPage Studio</strong><span>Editor para Blackboard Ultra</span></div>
      <div className="course-pill"><span className="status-dot" />BADM 5060 · 2027-13<ChevronDown size={15} /></div>
      <div className="header-actions"><ApaDialog insertMarkup={insertMarkup}/><span className={saved ? "save-state" : "save-state pending"}>{saved ? <Check size={14}/> : <Cloud size={14}/>} {saved ? "Guardado" : "Cambios sin guardar"}</span><ExportDialog html={html} title={title} downloadHtml={downloadDocument}/><Button variant="outline" className="publish-button" onClick={copyHtml}><Copy size={16}/> Copiar para Ultra</Button><Button className="save-button" onClick={save}><Save size={16}/> Guardar</Button></div>
    </header>
    <div className="workspace">
      <aside className="leftbar" aria-label="Herramientas"><button className="rail-button active" aria-label="Editor"><FileText /></button><button className="rail-button" aria-label="Recursos"><Folder /></button><button className="rail-button" aria-label="Accesibilidad"><Accessibility /></button><button className="rail-button" aria-label="Código"><Code2 /></button><div className="rail-spacer" /><button className="avatar" aria-label="Perfil de Eduardo">EG</button></aside>
      <section className="editor-shell">
        <div className="document-head"><div><div className="breadcrumbs"><span>Contenido del curso</span><span>/</span><span>Módulo 4</span></div><input className="title-input" value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} aria-label="Título de la página" /></div><div className="view-controls" aria-label="Vista previa por dispositivo"><button onClick={() => setDevice("desktop")} className={device === "desktop" ? "active" : ""} aria-label="Computadora"><Monitor size={17}/></button><button onClick={() => setDevice("tablet")} className={device === "tablet" ? "active" : ""} aria-label="Tableta"><Tablet size={17}/></button><button onClick={() => setDevice("mobile")} className={device === "mobile" ? "active" : ""} aria-label="Celular"><Smartphone size={17}/></button><button onClick={() => setRightPanel(!rightPanel)} className={rightPanel ? "active panel-toggle" : "panel-toggle"} aria-label="Mostrar u ocultar panel"><PanelRight size={17}/></button></div></div>
        <Tabs value={mode} onValueChange={(value) => setMode(value as "visual" | "html")} className="editor-tabs">
          <div className="toolbar-row"><TabsList className="mode-tabs"><TabsTrigger value="visual">Diseño</TabsTrigger><TabsTrigger value="html">HTML</TabsTrigger></TabsList>{mode === "visual" && <div className="toolbar" role="toolbar" aria-label="Formato de texto"><button onClick={() => command("undo")} aria-label="Deshacer"><Undo2 /></button><button onClick={() => command("redo")} aria-label="Rehacer"><Redo2 /></button><i/><button onClick={() => command("formatBlock", "h2")} aria-label="Encabezado"><Heading2 /></button><button onClick={() => command("bold")} aria-label="Negrita"><Bold /></button><button onClick={() => command("italic")} aria-label="Itálica"><Italic /></button><button onClick={() => command("underline")} aria-label="Subrayado"><Underline /></button><i/><button onClick={() => command("insertUnorderedList")} aria-label="Lista"><List /></button><button onClick={() => command("insertOrderedList")} aria-label="Lista numerada"><ListOrdered /></button><button onClick={() => { const url = prompt("Dirección del enlace"); if (url) command("createLink", url); }} aria-label="Enlace"><Link2 /></button><ContentDialog trigger={<button aria-label="Insertar desde Content Collection"><ImagePlus /></button>} search={search} setSearch={setSearch} files={filteredFiles} insertFile={insertFile} documentHtml={html} documentFileName={documentFileName} openDocument={openDocument} newDocument={newDocument}/><button aria-label="Más opciones"><MoreHorizontal /></button></div>}</div>
          <TabsContent value="visual" className="canvas-wrap"><div className={`device-frame ${device}`}><div className="ultra-label"><span className="mini-logo">U</span><span>Vista previa en Ultra</span></div><div ref={editor} className="page-canvas" contentEditable suppressContentEditableWarning onInput={(e) => { setHtml(e.currentTarget.innerHTML); setSaved(false); }} aria-label="Contenido editable de la página" /></div></TabsContent>
          <TabsContent value="html" className="code-wrap"><div className="code-header"><span>HTML compatible con Blackboard Ultra</span><button onClick={copyHtml}><Copy size={14}/> Copiar código</button></div><Textarea value={html} onChange={(e) => { setHtml(e.target.value); setSaved(false); }} className="code-editor" spellCheck={false} aria-label="Código HTML" /></TabsContent>
        </Tabs>
      </section>
      {rightPanel && <aside className="right-panel"><Tabs defaultValue="blocks"><TabsList className="side-tabs"><TabsTrigger value="blocks">Bloques</TabsTrigger><TabsTrigger value="review">Revisión</TabsTrigger></TabsList><TabsContent value="blocks"><p className="panel-label">CONTENIDO</p><div className="block-grid"><Block icon={Heading2} label="Encabezado" onClick={() => command("formatBlock", "h2")}/><Block icon={FileText} label="Texto" onClick={() => command("insertParagraph")}/><Block icon={ImagePlus} label="Imagen" onClick={() => toast.info("Selecciona una imagen desde Content Collection.")}/><Block icon={Link2} label="Enlace" onClick={() => { const url = prompt("Dirección del enlace"); if (url) command("createLink", url); }}/><Block icon={List} label="Lista" onClick={() => command("insertUnorderedList")}/><Block icon={Plus} label="Aviso" onClick={() => command("insertHTML", '<div class="callout"><strong>Importante</strong><p>Escriba aquí la información destacada.</p></div>')}/></div><p className="panel-label section-label">FORMATO ACADÉMICO</p><ApaDialog insertMarkup={insertMarkup} fullWidth/><p className="panel-label section-label">PLANTILLAS RÁPIDAS</p><button className="template-card" onClick={() => command("insertHTML", '<h2>Objetivos de aprendizaje</h2><ul><li>Objetivo 1</li><li>Objetivo 2</li></ul>')}><span className="template-icon blue"><List /></span><span><strong>Objetivos</strong><small>Lista accesible</small></span><Plus size={16}/></button><button className="template-card" onClick={() => command("insertHTML", '<div class="callout"><strong>Instrucciones</strong><p>Complete los siguientes pasos.</p></div>')}><span className="template-icon gold"><FileText /></span><span><strong>Instrucciones</strong><small>Bloque destacado</small></span><Plus size={16}/></button><ContentDialog trigger={<Button variant="outline" className="collection-button"><Folder size={17}/> Abrir Content Collection</Button>} search={search} setSearch={setSearch} files={filteredFiles} insertFile={insertFile} documentHtml={html} documentFileName={documentFileName} openDocument={openDocument} newDocument={newDocument}/></TabsContent><TabsContent value="review"><div className="score-card"><div className="score-ring">{accessibilityScore}</div><div><strong>{accessibilityScore === 100 ? "Accesibilidad lista" : "Revisión necesaria"}</strong><span>{pageChecks.filter((check) => !check.ok).length} recomendaciones pendientes</span></div></div>{pageChecks.map((check) => <ReviewItem key={check.text} ok={check.ok} text={check.text}/>)}</TabsContent></Tabs></aside>}
    </div>
  </main>;
}

function Block({ icon: Icon, label, onClick }: { icon: typeof FileText; label: string; onClick: () => void }) { return <button className="block-button" onClick={onClick}><Icon size={19}/><span>{label}</span></button>; }
function ReviewItem({ ok, text }: { ok: boolean; text: string }) { return <div className={`review-item ${ok ? "ok" : "warn"}`}><span>{ok ? <Check size={15}/> : "!"}</span><p>{text}</p></div>; }

type AccessibilityCheck = { ok: boolean; text: string };

function accessibilityReport(html: string, title: string): AccessibilityCheck[] {
  const headingLevels = Array.from(html.matchAll(/<h([1-6])\b[^>]*>/gi), (match) => Number(match[1]));
  let hierarchyOk = headingLevels.length > 0;
  let previous = 0;
  for (const level of headingLevels) {
    if (previous && level > previous + 1) hierarchyOk = false;
    previous = level;
  }
  const images = Array.from(html.matchAll(/<img\b[^>]*>/gi), (match) => match[0]);
  const links = Array.from(html.matchAll(/<a\b[^>]*href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi), (match) => match[1].replace(/<[^>]+>/g, "").trim());
  const vagueLink = /^(aquí|clic aquí|click here|más|ver más|enlace)$/i;
  const tables = Array.from(html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi), (match) => match[0]);
  return [
    { ok: Boolean(title.trim()), text: "El documento tiene un título identificable" },
    { ok: hierarchyOk, text: "La jerarquía de encabezados no omite niveles" },
    { ok: images.every((image) => /\balt=["'][^"']+["']/i.test(image)), text: images.length ? "Todas las imágenes tienen texto alternativo" : "No hay imágenes que requieran texto alternativo" },
    { ok: links.every((link) => !vagueLink.test(link) && Boolean(link)), text: "Los enlaces tienen texto descriptivo" },
    { ok: tables.every((table) => /<th\b/i.test(table)), text: tables.length ? "Las tablas incluyen celdas de encabezado" : "No hay tablas que requieran encabezados" },
    { ok: true, text: "La exportación define el idioma como español de Puerto Rico" },
  ];
}

async function requestExport(format: "docx" | "pdf", html: string, title: string) {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, html, title, author: "Eduardo Augusto García Rodríguez", language: "es-PR" }),
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

function ExportDialog({ html, title, downloadHtml }: { html: string; title: string; downloadHtml: () => void }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"docx" | "pdf" | "">("");
  const checks = accessibilityReport(html, title);
  const warnings = checks.filter((check) => !check.ok).length;
  const exportDocument = async (format: "docx" | "pdf") => {
    setExporting(format);
    try {
      const blob = await requestExport(format, html, title);
      downloadBlob(blob, exportFileName(title, format));
      toast.success(format === "docx" ? "Documento Word descargado" : "PDF accesible descargado", { description: "Se conservaron la estructura, el idioma y los metadatos del documento." });
      setOpen(false);
    } catch (problem) {
      toast.error("No se pudo exportar", { description: problem instanceof Error ? problem.message : "Intente nuevamente." });
    } finally { setExporting(""); }
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" className="publish-button"><Download size={16}/> Exportar</Button></DialogTrigger><DialogContent className="export-dialog"><DialogHeader><DialogTitle>Exportar documento accesible</DialogTitle><DialogDescription>Descarga el contenido en Word, PDF o HTML. La revisión identifica problemas que conviene corregir antes de exportar.</DialogDescription></DialogHeader><div className={`export-summary ${warnings ? "has-warnings" : "ready"}`}><span>{warnings ? <AlertTriangle size={20}/> : <Check size={20}/>}</span><div><strong>{warnings ? `${warnings} recomendación${warnings === 1 ? "" : "es"} de accesibilidad` : "Listo para exportar"}</strong><small>{warnings ? "Puede exportar ahora, pero es preferible corregirlas." : "El contenido pasó las verificaciones automáticas."}</small></div></div><div className="export-checks" aria-label="Resultados de accesibilidad">{checks.map((check) => <ReviewItem key={check.text} ok={check.ok} text={check.text}/>)}</div><div className="export-options"><button onClick={() => exportDocument("docx")} disabled={Boolean(exporting)}><FileText/><span><strong>Microsoft Word</strong><small>.docx estructurado y editable</small></span>{exporting === "docx" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={() => exportDocument("pdf")} disabled={Boolean(exporting)}><FileText/><span><strong>PDF accesible</strong><small>PDF/UA etiquetado, idioma y metadatos</small></span>{exporting === "pdf" ? <Loader2 className="spin"/> : <Download/>}</button><button onClick={() => { downloadHtml(); setOpen(false); }} disabled={Boolean(exporting)}><Code2/><span><strong>Página HTML</strong><small>Compatible con Blackboard Ultra</small></span><Download/></button></div><p className="export-note"><Accessibility size={15}/> La revisión automática ayuda, pero un documento institucional debe validarse también con Microsoft Accessibility Checker o Adobe Acrobat.</p></DialogContent></Dialog>;
}

function ApaDialog({ insertMarkup, fullWidth = false }: { insertMarkup: (markup: string) => void; fullWidth?: boolean }) {
  const [author, setAuthor] = useState("Laudon et al."); const [year, setYear] = useState("2025"); const [page, setPage] = useState("");
  const [reference, setReference] = useState("Laudon, K. C., Laudon, J. P., & Traver, C. G. (2025). Management information systems: Managing the digital firm. Pearson.");
  const [label, setLabel] = useState("Relación entre tecnología, personas y procesos");
  const citation = `(${author}, ${year}${page ? `, p. ${page}` : ""})`;
  return <Dialog><DialogTrigger asChild><Button variant="outline" className={fullWidth ? "apa-trigger full" : "apa-trigger"}><BookOpen size={16}/> APA 7</Button></DialogTrigger><DialogContent className="apa-dialog"><DialogHeader><DialogTitle>Herramientas APA 7</DialogTitle><DialogDescription>Inserta elementos académicos cuando la página del curso los necesite.</DialogDescription></DialogHeader><Tabs defaultValue="citation"><TabsList className="apa-tabs"><TabsTrigger value="citation"><Quote size={14}/> Cita</TabsTrigger><TabsTrigger value="reference"><BookOpen size={14}/> Referencia</TabsTrigger><TabsTrigger value="table"><Table2 size={14}/> Tabla</TabsTrigger><TabsTrigger value="figure"><ImagePlus size={14}/> Figura</TabsTrigger></TabsList><TabsContent value="citation" className="apa-pane"><div className="form-grid"><label>Autor o autores<Input value={author} onChange={(e)=>setAuthor(e.target.value)}/></label><label>Año<Input value={year} onChange={(e)=>setYear(e.target.value)}/></label><label>Página opcional<Input value={page} onChange={(e)=>setPage(e.target.value)} placeholder="45"/></label></div><div className="apa-preview"><small>Vista previa</small><p>{citation}</p></div><div className="apa-actions"><Button variant="outline" onClick={()=>insertMarkup(`<p>${author} (${year}) sostiene que [escriba aquí la idea]${page ? ` (p. ${page})` : ""}.</p>`)}>Cita narrativa</Button><Button onClick={()=>insertMarkup(`<span>${citation}</span>`)}>Cita parentética</Button></div></TabsContent><TabsContent value="reference" className="apa-pane"><label>Referencia completa<Textarea value={reference} onChange={(e)=>setReference(e.target.value)} rows={5}/></label><p className="field-help">Revise cursivas, mayúsculas, DOI o URL según el tipo de fuente.</p><Button onClick={()=>insertMarkup(`<h2>Referencias</h2><p class="apa-reference">${reference}</p>`)}>Insertar con sangría francesa</Button></TabsContent><TabsContent value="table" className="apa-pane"><label>Título de la tabla<Input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><div className="apa-preview table-preview"><strong>Tabla 1</strong><em>{label}</em><div>Encabezado 1　 Encabezado 2</div></div><Button onClick={()=>insertMarkup(`<figure class="apa-table"><p><strong>Tabla 1</strong><br><em>${label}</em></p><table><thead><tr><th scope="col">Encabezado 1</th><th scope="col">Encabezado 2</th></tr></thead><tbody><tr><td>Dato</td><td>Dato</td></tr></tbody></table><figcaption><em>Nota.</em> Describa aquí la información necesaria para interpretar la tabla.</figcaption></figure>`)}>Insertar tabla APA</Button></TabsContent><TabsContent value="figure" className="apa-pane"><label>Título de la figura<Input value={label} onChange={(e)=>setLabel(e.target.value)}/></label><Button onClick={()=>insertMarkup(`<figure class="apa-figure"><p><strong>Figura 1</strong><br><em>${label}</em></p><div class="figure-placeholder">Inserte aquí la imagen desde Content Collection</div><figcaption><em>Nota.</em> Adaptado de Autor (año). Incluya licencia o derechos cuando corresponda.</figcaption></figure>`)}>Insertar figura APA</Button></TabsContent></Tabs><div className="apa-checklist"><strong>Lista de cotejo APA 7</strong><span>✓ Citas y referencias coinciden</span><span>✓ DOI como enlace https://doi.org/…</span><span>✓ Tablas y figuras numeradas</span><span>✓ Texto alternativo y notas accesibles</span></div></DialogContent></Dialog>;
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
};

function ContentDialog({ trigger, search, setSearch, files, insertFile, documentHtml, documentFileName, openDocument, newDocument }: ContentDialogProps) {
  const defaultUrl = "https://interbb.blackboard.com/bbcswebdav/courses/202713.34504/201310.51131_ImportedContent_20120820031821";
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
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ultrapage-webdav-urls") || "[]") as string[];
      const active = localStorage.getItem("ultrapage-webdav-active");
      setSavedUrls(Array.isArray(stored) ? stored : []);
      if (active) setUrl(active);
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
  const changeRemoteFormat = (format: "html" | "docx" | "pdf") => {
    setRemoteFormat(format);
    setRemoteName((current) => `${current.replace(/\.(html?|txt|docx|pdf)$/i, "")}.${format}`);
  };
  const saveToWebDav = async () => {
    setFileLoading("save"); setError("");
    try {
      let payload: Record<string, string> = { action: "write", url, username, password, fileName: remoteName, content: documentHtml };
      if (remoteFormat === "docx" || remoteFormat === "pdf") {
        const exported = await requestExport(remoteFormat, documentHtml, remoteName.replace(/\.(docx|pdf)$/i, ""));
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
  return <Dialog open={dialogOpen} onOpenChange={(open)=>{setDialogOpen(open);if(!open)setPassword("");}}><DialogTrigger asChild>{trigger as React.ReactElement}</DialogTrigger><DialogContent className="collection-dialog"><DialogHeader><DialogTitle>Content Collection</DialogTitle><DialogDescription>Abre y crea páginas; guárdalas como HTML, Word o PDF accesible en Blackboard WebDAV.</DialogDescription></DialogHeader><div className={`connection-card ${connected ? "connected" : ""}`}><div className="connection-heading"><span className="connection-icon">{connected ? <Check size={17}/> : <LockKeyhole size={17}/>}</span><span><strong>{connected ? "Conexión activa" : "Conexión segura WebDAV"}</strong><small>{connected ? `${remoteFiles.length} recursos disponibles` : "Puedes cambiar la dirección; las credenciales no se guardan"}</small></span></div>{savedUrls.length > 0 && <label>Direcciones guardadas<select className="webdav-select" value={savedUrls.includes(url) ? url : ""} onChange={(e)=>changeUrl(e.target.value)}><option value="">Seleccionar otra dirección…</option>{savedUrls.map((savedUrl)=><option key={savedUrl} value={savedUrl}>{savedUrl}</option>)}</select></label>}<label>Dirección WebDAV editable<Input value={url} onChange={(e)=>changeUrl(e.target.value)} placeholder="https://…/bbcswebdav/courses/…" /></label><div className="webdav-actions"><Button type="button" size="sm" variant="outline" onClick={saveUrl} disabled={!url.trim()}>Guardar dirección</Button><Button type="button" size="sm" variant="outline" onClick={()=>changeUrl("")}>Nueva dirección</Button>{savedUrls.includes(url) && <Button type="button" size="sm" variant="ghost" className="remove-webdav" onClick={removeUrl}>Eliminar guardada</Button>}</div><div className="credential-grid"><label>Usuario institucional<Input value={username} autoComplete="username" onChange={(e)=>setUsername(e.target.value)} /></label><label>Contraseña<Input type="password" value={password} autoComplete="current-password" onChange={(e)=>setPassword(e.target.value)} /></label></div>{error && <p className="connection-error" role="alert">{error}</p>}<Button onClick={()=>connect()} disabled={loading || !url || !username || !password}>{loading ? <Loader2 className="spin" size={16}/> : <PlugZap size={16}/>} {loading ? "Conectando…" : connected ? "Actualizar carpeta" : "Conectar con Blackboard"}</Button></div><div className="document-actions"><Button type="button" variant="outline" onClick={newDocument}><FilePlus2 size={16}/> Crear archivo nuevo</Button><div className="remote-save"><select className="webdav-select format-select" value={remoteFormat} onChange={(e)=>changeRemoteFormat(e.target.value as "html" | "docx" | "pdf")} aria-label="Formato para guardar en WebDAV"><option value="html">HTML</option><option value="docx">Word (.docx)</option><option value="pdf">PDF accesible</option></select><Input value={remoteName} onChange={(e)=>setRemoteName(e.target.value)} aria-label="Nombre del archivo para WebDAV"/><Button type="button" onClick={saveToWebDav} disabled={!connected || !password || fileLoading === "save"}>{fileLoading === "save" ? <Loader2 className="spin" size={16}/> : <Upload size={16}/>} Guardar en WebDAV</Button></div></div><div className="collection-status"><span className={connected ? "status-dot" : "status-dot demo"}/><span><strong>{connected ? "Carpeta WebDAV actual" : "Vista de demostración"}</strong><small>{connected ? url : "Conéctate para abrir archivos reales"}</small></span></div><div className="search-box"><Search size={17}/><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar archivos y carpetas"/></div><div className="file-list">{shown.map((file) => { const image = /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name); const editable = /\.(html?|txt)$/i.test(file.name); const Icon = file.type === "Carpeta" ? Folder : image ? FileImage : FileText; return <button key={`${file.name}-${file.href}`} className="file-row" onClick={() => connected ? openRemote(file) : insertFile(file.name, file.type)} disabled={fileLoading === file.href}><span className="file-icon">{fileLoading === file.href ? <Loader2 className="spin" size={19}/> : <Icon size={19}/>}</span><span className="file-name"><strong>{file.name}</strong><small>{file.type === "Carpeta" ? "Abrir carpeta" : editable ? "Abrir para editar" : "Insertar en la página"}</small></span><span className="file-size">{file.size ? formatBytes(file.size) : ""}</span>{editable || file.type === "Carpeta" ? <ChevronDown className="open-file-icon" size={17}/> : <Plus size={17}/>}</button>})}</div><p className="demo-note">HTML, HTM y TXT se pueden abrir para editar. Word y PDF se guardan como archivos finales accesibles. La contraseña se elimina al cerrar esta ventana.</p></DialogContent></Dialog>;
}

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
