"use client";

/** CREVELIO — © 2026 Eduardo Augusto García Rodríguez. All rights reserved. */


import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowUpRight, BookOpen, CheckCircle2, FileQuestion, FileText,
  HelpCircle, LifeBuoy, LockKeyhole, MonitorSmartphone, Search, ShieldCheck,
} from "lucide-react";
import "./help.css";

type Language = "es" | "en";
type Category = "studio" | "apa" | "txt" | "qti" | "safety";
type Topic = {
  id: string;
  category: Category;
  icon: typeof BookOpen;
  href: string;
  es: { title: string; summary: string; steps: string[]; tip: string };
  en: { title: string; summary: string; steps: string[]; tip: string };
};

const topics: Topic[] = [
  {
    id: "studio", category: "studio", icon: BookOpen, href: "/",
    es: { title: "Editor principal de CREVELIO", summary: "Crear páginas accesibles para distintos LMS.",
      steps: ["Abra CREVELIO y escriba o pegue el contenido en Design.", "Use HTML para revisar el código y Final Preview para comprobar cómo se verá.", "Seleccione Target LMS y revise el contenido antes de copiarlo o exportarlo.", "Guarde una copia de su trabajo antes de reemplazar contenido o aplicar cambios grandes."],
      tip: "Las verificaciones automáticas ayudan a detectar problemas, pero no sustituyen las pruebas en el LMS real." },
    en: { title: "CREVELIO main editor", summary: "Create accessible pages for different LMS platforms.",
      steps: ["Open CREVELIO and write or paste content in Design.", "Use HTML to inspect the source and Final Preview to check presentation.", "Choose Target LMS and review the content before copying or exporting it.", "Save a copy of your work before replacing content or applying major changes."],
      tip: "Automated checks help identify issues; they do not replace testing inside the actual LMS." },
  },
  {
    id: "webdav", category: "studio", icon: LockKeyhole, href: "/",
    es: { title: "Blackboard Content Collection — WebDAV", summary: "Conectar, abrir, descargar y guardar archivos en las carpetas de Blackboard.",
      steps: [
        "En el editor principal, abra Content Collection.",
        "Introduzca la dirección HTTPS WebDAV provista por su institución. La ruta debe comenzar con /bbcswebdav/.",
        "Escriba las credenciales institucionales y seleccione Connect to Blackboard. Puede guardar la dirección, pero no se guarda la contraseña.",
        "Abra archivos HTML o TXT para editarlos directamente. Para Word, PDF, PowerPoint, Excel o imágenes, descargue primero el archivo y utilice Upload Edited File para subir la versión editada.",
        "Seleccione HTML, Word (.docx) o Accessible PDF, compruebe el nombre del documento y pulse Save to WebDAV para guardarlo en la carpeta actual."
      ],
      tip: "Antes de reemplazar un archivo, CREVELIO solicita confirmación y comprueba su versión. Si Blackboard no permite verificarla, guarde con otro nombre. Conserve una copia y nunca comparta sus credenciales institucionales." },
    en: { title: "Blackboard Content Collection — WebDAV", summary: "Connect to Blackboard folders to open, download and save files.",
      steps: [
        "In the main editor, open Content Collection.",
        "Enter the institutional HTTPS WebDAV address. Its path must begin with /bbcswebdav/.",
        "Enter your institutional credentials and select Connect to Blackboard. You may save the address, but the password is not saved.",
        "Open HTML or TXT files for direct editing. For Word, PDF, PowerPoint, Excel or images, download the file and use Upload Edited File to upload your edited version.",
        "Choose HTML, Word (.docx) or Accessible PDF, check the document name, and select Save to WebDAV to save it in the current folder."
      ],
      tip: "CREVELIO requires confirmation and checks the remote version before replacement. If Blackboard cannot verify it, save under a new name. Keep a backup and never share institutional credentials." },
  },
  {
    id: "apa", category: "apa", icon: FileText, href: "/native-tools/estiloapa/index.html",
    es: { title: "EstiloAPA — documentos APA 7", summary: "Importación, edición, revisión y exportación académica.",
      steps: ["Abra EstiloAPA y seleccione archivos DOCX, PDF, TXT, MD o HTML en Load and process.", "Compruebe el perfil de formato y revise el documento editable antes de exportarlo.", "Use los controles de encabezados, referencias, tablas y revisión APA 7 según corresponda.", "Exporte a DOCX, PDF o HTML y revise el archivo resultante en Word o en su LMS."],
      tip: "Si edita un trabajo importante, conserve el archivo original y pruebe los cambios con una copia." },
    en: { title: "EstiloAPA — APA 7 documents", summary: "Academic import, editing, review and export.",
      steps: ["Open EstiloAPA and select DOCX, PDF, TXT, MD or HTML in Load and process.", "Check the formatting profile and review the editable document before exporting.", "Use heading, reference, table and APA 7 review controls where appropriate.", "Export DOCX, PDF or HTML and inspect the result in Word or your LMS."],
      tip: "For important assignments, keep the original file and test changes on a copy." },
  },
  {
    id: "txt", category: "txt", icon: FileQuestion, href: "/native-tools/txt-test-generator/index.html",
    es: { title: "TXT Test Generator — exámenes", summary: "Bancos de preguntas para Blackboard, Moodle y Canvas.",
      steps: ["Pegue las preguntas en Question bank content, separando cada pregunta con una línea en blanco.", "Abra View examples para comprobar la sintaxis y marque las respuestas correctas con un asterisco.", "Seleccione Target LMS y pulse Verify antes de convertir o descargar.", "Descargue Blackboard TXT, Moodle GIFT o Canvas QTI y realice una importación de prueba."],
      tip: "Los tipos de pregunta admitidos y sus restricciones dependen del LMS de destino. Corrija los errores antes de descargar." },
    en: { title: "TXT Test Generator — assessments", summary: "Question banks for Blackboard, Moodle and Canvas.",
      steps: ["Paste questions into Question bank content, with a blank line between questions.", "Open View examples to check syntax, marking correct answers with an asterisk.", "Select Target LMS and press Verify before converting or downloading.", "Download Blackboard TXT, Moodle GIFT or Canvas QTI and perform a test import."],
      tip: "Supported question types and limitations depend on the destination LMS. Resolve errors before downloading." },
  },
  {
    id: "qti", category: "qti", icon: FileQuestion, href: "/native-tools/qti-blackboard/index.html",
    es: { title: "QTI 2.1 Blackboard — paquetes ZIP", summary: "Validación e intercambio de preguntas con manifiestos QTI.",
      steps: ["Abra View question format examples o pulse Load example para conocer la sintaxis.", "Escriba el banco de preguntas y verifique que los tipos MC, MA, TF, FIB y ESSAY estén correctos.", "Ejecute Preflight y revise el informe antes de exportar.", "Descargue el paquete ZIP del LMS seleccionado e impórtelo primero en un curso de prueba.", "Compruebe puntuación, respuestas y visualización de cada pregunta tras la importación."],
      tip: "No todos los tipos de preguntas se convierten de forma idéntica entre Blackboard, Moodle y Canvas." },
    en: { title: "QTI 2.1 Blackboard — ZIP packages", summary: "QTI manifest and question bank validation.",
      steps: ["Open View question format examples or press Load example to learn the syntax.", "Enter the question bank and check MC, MA, TF, FIB and ESSAY types.", "Run Preflight and review the report before exporting.", "Download the ZIP package for the selected LMS and first import it into a test course.", "Check scores, correct answers and every question after import."],
      tip: "Question types do not always convert identically among Blackboard, Moodle and Canvas." },
  },
  {
    id: "mobile", category: "safety", icon: MonitorSmartphone, href: "/tools",
    es: { title: "Uso en iPhone y otras pantallas", summary: "Navegar, editar y descargar desde dispositivos móviles.",
      steps: ["Abra la herramienta en una pestaña completa si el editor integrado se ve estrecho.", "Mantenga el teléfono en vertical para leer y en horizontal si necesita más espacio.", "Use los paneles desplegables y desplace las tablas anchas dentro de su propio contenedor.", "Si ve una versión antigua, recargue la página. Evite borrar los datos del sitio sin guardar antes sus documentos."],
      tip: "Las descargas de iPhone suelen quedar en Archivos. Compruebe el ZIP o documento descargado antes de cerrar la herramienta." },
    en: { title: "iPhone and small-screen use", summary: "Navigate, edit and download on mobile devices.",
      steps: ["Open a tool full screen if its embedded editor appears too narrow.", "Use portrait view to read or landscape view when more space is needed.", "Expand disclosure panels and scroll wide tables within their containers.", "Reload if an older release appears. Do not clear site data before saving important work."],
      tip: "On iPhone, downloads usually appear in Files. Check the downloaded ZIP or document before closing the tool." },
  },
  {
    id: "recovery", category: "safety", icon: LockKeyhole, href: "/tools",
    es: { title: "Recuperación y protección de contenido", summary: "Evitar pérdida de trabajo y restaurar versiones.",
      steps: ["Guarde o descargue una copia del documento o banco de preguntas periódicamente.", "Si desaparece contenido, no presione Clear ni sobrescriba la versión guardada.", "Revise las opciones de AutoSave, historial o recuperación disponibles en la herramienta.", "Restaure una copia verificada y compruebe que contiene todo el texto antes de continuar."],
      tip: "El almacenamiento local pertenece al navegador y dispositivo actual. Borrar datos del sitio o cambiar de dispositivo puede hacer que esas versiones no estén disponibles." },
    en: { title: "Recovery and content safety", summary: "Prevent data loss and restore earlier versions.",
      steps: ["Save or download a copy of your document or question bank regularly.", "If content disappears, do not press Clear or overwrite the saved version.", "Check the tool's AutoSave, history or recovery controls where available.", "Restore a verified copy and check that all text is present before continuing."],
      tip: "Local storage belongs to the current browser and device. Clearing site data or switching devices may make those versions unavailable." },
  },
  {
    id: "exports", category: "safety", icon: ShieldCheck, href: "/tools",
    es: { title: "Solución de problemas de exportación", summary: "Archivos descargados, ZIP, LMS y compatibilidad.",
      steps: ["Verifique que el banco o documento no muestre errores de validación.", "Confirme el LMS de destino y el tipo de archivo requerido antes de descargar.", "Abra el archivo local para comprobar su contenido y extensión.", "Si falla la importación, revise el informe Preflight o de compatibilidad y pruebe el paquete en un curso de práctica."],
      tip: "Una descarga satisfactoria no garantiza que el LMS importe todos los ítems correctamente; siempre valide el resultado." },
    en: { title: "Export troubleshooting", summary: "Downloads, ZIP packages, LMS import and compatibility.",
      steps: ["Make sure the document or question bank has no blocking validation errors.", "Confirm the target LMS and required file type before downloading.", "Open the downloaded file to inspect its content and extension.", "If import fails, review Preflight or compatibility findings and test the package in a practice course."],
      tip: "A successful download does not guarantee that an LMS imported every item correctly. Always verify the result." },
  },
];

function normalizeHelpQuery(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

const categories: Array<{ id: "all" | Category; es: string; en: string }> = [
  { id: "all", es: "Todos", en: "All" },
  { id: "studio", es: "Editor", en: "Editor" },
  { id: "apa", es: "APA 7", en: "APA 7" },
  { id: "txt", es: "Exámenes TXT", en: "TXT exams" },
  { id: "qti", es: "QTI 2.1", en: "QTI 2.1" },
  { id: "safety", es: "Ayuda técnica", en: "Troubleshooting" },
];

export default function HelpPage() {
  const [language, setLanguage] = useState<Language>("es");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [query, setQuery] = useState("");
  const spanish = language === "es";
  const filtered = useMemo(() => topics.filter((topic) => {
    if (category !== "all" && topic.category !== category) return false;
    const value = [topic.id, topic.es.title, topic.es.summary, topic.es.tip,
      topic.en.title, topic.en.summary, topic.en.tip, ...topic.es.steps, ...topic.en.steps].join(" ");
    return normalizeHelpQuery(value).includes(normalizeHelpQuery(query));
  }), [category, query]);

  return (
    <main className="curralume-help" lang={spanish ? "es-PR" : "en-US"}>
      <a className="help-skip" href="#help-topics">{spanish ? "Ir a las instrucciones" : "Skip to instructions"}</a>
      <header className="help-topbar">
        <a href="/" className="help-back"><ArrowLeft size={18} aria-hidden="true" /> CREVELIO</a>
        <a className="help-tools-link" href="/tools">{spanish ? "Abrir herramientas" : "Open tools"} <ArrowUpRight size={16} aria-hidden="true" /></a>
      </header>
      <div className="help-body">
        <section className="help-hero" aria-labelledby="help-title">
          <div className="help-hero-icon"><LifeBuoy aria-hidden="true" size={28}/></div>
          <div>
            <p className="help-eyebrow">CREVELIO · HELP CENTER</p>
            <h1 id="help-title">{spanish ? "Centro de ayuda" : "Help Center"}</h1>
            <p>{spanish ? "Aprenda a editar, evaluar y exportar documentos y exámenes. Instrucciones prácticas para las herramientas de CREVELIO." :
              "Learn to edit, review, and export documents and assessments with practical guides for CREVELIO tools."}</p>
          </div>
          <div className="help-languages" role="group" aria-label={spanish ? "Idioma de la ayuda" : "Help language"}>
            <button type="button" lang="es-PR" aria-pressed={spanish} className={spanish ? "selected" : ""} onClick={() => setLanguage("es")}>Español</button>
            <button type="button" lang="en-US" aria-pressed={!spanish} className={!spanish ? "selected" : ""} onClick={() => setLanguage("en")}>English</button>
          </div>
        </section>

        <section className="help-search-area" aria-label={spanish ? "Buscar ayuda" : "Search help"}>
          <label className="help-search" htmlFor="help-search-input">
            <Search size={21} aria-hidden="true"/>
            <span className="help-sr-only">{spanish ? "Buscar instrucciones" : "Search instructions"}</span>
            <input id="help-search-input" type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder={spanish ? "Buscar: APA 7, exámenes, ZIP, iPhone, recuperación…" : "Search: APA 7, exams, ZIP, iPhone, recovery…"} />
          </label>
          <div className="help-filters" role="group" aria-label={spanish ? "Filtrar temas" : "Filter topics"}>
            {categories.map(item => <button key={item.id} type="button" aria-pressed={category === item.id}
              className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item[language]}</button>)}
          </div>
        </section>

        <section id="help-topics" aria-labelledby="help-topics-title">
          <div className="help-section-heading">
            <h2 id="help-topics-title">{spanish ? "Guías paso a paso" : "Step-by-step guides"}</h2>
            <span role="status" aria-live="polite">{filtered.length} {spanish ? "temas" : "topics"}</span>
          </div>
          <div className="help-grid">
            {filtered.map(topic => {
              const Icon = topic.icon;
              const text = topic[language];
              return <article className="help-card" key={topic.id} id={topic.id}>
                <div className="help-card-heading">
                  <span className="help-card-icon"><Icon size={22} aria-hidden="true"/></span>
                  <div><h3>{text.title}</h3><p>{text.summary}</p></div>
                </div>
                <ol>{text.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
                <p className="help-tip"><CheckCircle2 size={17} aria-hidden="true"/><span>{text.tip}</span></p>
                <a className="help-open" href={topic.href}>{topic.href === "/tools" ? (spanish ? "Ver herramientas" : "Open tools") : topic.href === "/" ? (spanish ? "Abrir editor" : "Open editor") : (spanish ? "Abrir herramienta" : "Open tool")} <ArrowUpRight size={17} aria-hidden="true"/></a>
              </article>;
            })}
          </div>
          {filtered.length === 0 && <div className="help-empty" role="status">
            <HelpCircle size={25} aria-hidden="true"/>
            <p>{spanish ? "No se encontraron resultados. Pruebe con otra palabra o seleccione Todos." : "No matching topics. Try another term or choose All."}</p>
            <button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>{spanish ? "Mostrar todas las guías" : "Show all guides"}</button>
          </div>}
        </section>
        <section className="help-bottom" aria-label={spanish ? "Notas importantes" : "Important notes"}>
          <ShieldCheck size={22} aria-hidden="true"/>
          <p>{spanish ? "Privacidad y seguridad: las versiones de AutoSave pueden depender del almacenamiento local del navegador. Las conexiones a servicios externos, como WebDAV, requieren configuración explícita. Revise siempre el resultado de las exportaciones y las auditorías automáticas." :
            "Privacy and safety: AutoSave versions may depend on local browser storage. External services such as WebDAV require explicit configuration. Always inspect exported files and automated audit results."}</p>
        </section>
        <footer className="help-footer">© 2026 Eduardo Augusto García Rodríguez. {spanish ? "Todos los derechos reservados. Operado por ZENQAVIO Technologies." : "All rights reserved. Operated by ZENQAVIO Technologies."}</footer>
      </div>
    </main>
  );
}
