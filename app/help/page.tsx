"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, CircleHelp, FileQuestion, FileText, LifeBuoy, PackageCheck, Search } from "lucide-react";
import "./help.css";

type Language = "es" | "en";
type Local = { es: string; en: string };
type Topic = {
  id: string;
  label: Local;
  description: Local;
  steps: { es: string[]; en: string[] };
  caution: Local;
  href: string;
  cta: Local;
};
const loc = (es: string, en: string): Local => ({ es, en });

const topics: Topic[] = [
  {
    id: "studio",
    label: loc("Editor de Curralume Studio", "Curralume Studio editor"),
    description: loc("Diseñe contenido accesible para distintos LMS y guarde su trabajo.", "Design accessible course content for multiple LMS platforms and save your work."),
    steps: {
      es: ["En el editor principal, escriba o importe el contenido y establezca el LMS de destino.", "Utilice Design para editar, HTML para revisar el código y Final Preview para comprobar el resultado.", "Use Save para guardar y Export para crear una copia. Compruebe el resultado con las herramientas de accesibilidad y LMS Preflight.", "Abra Native Tools para convertir evaluaciones o trabajar documentos con formato APA 7."],
      en: ["Write or import content in the main editor, then choose the target LMS.", "Use Design to edit, HTML to inspect the source, and Final Preview to check the output.", "Use Save and Export to keep a copy. Check accessibility and LMS Preflight results.", "Open Native Tools for assessment conversion and APA 7 formatting."]
    },
    caution: loc("Antes de sustituir documentos, guarde una copia. La vista previa no garantiza por sí sola compatibilidad con cada LMS.", "Keep a backup before replacing documents. A preview alone does not guarantee compatibility with every LMS."),
    href: "/",
    cta: loc("Abrir el editor", "Open editor")
  },
  {
    id: "estiloapa",
    label: loc("EstiloAPA — formato APA 7", "EstiloAPA — APA 7 formatting"),
    description: loc("Importe, revise, edite y exporte documentos académicos.", "Import, review, edit, and export academic documents."),
    steps: {
      es: ["Abra EstiloAPA y seleccione un documento DOCX, PDF, TXT, Markdown o HTML.", "Seleccione el perfil adecuado; utilice Format y Run audit para revisar el formato y las observaciones.", "Edite el documento directamente en Editable document. Revise encabezados, interlineado, referencias, tablas y figuras.", "Descargue DOCX, PDF accesible o HTML según la tarea y compruebe el archivo resultante."],
      en: ["Open EstiloAPA and choose a DOCX, PDF, TXT, Markdown, or HTML document.", "Choose an appropriate profile; use Format and Run audit to review formatting findings.", "Edit directly in Editable document. Check headings, spacing, references, tables, and figures.", "Download DOCX, accessible PDF, or HTML as needed and inspect the resulting file."]
    },
    caution: loc("En documentos importantes, pruebe primero las eliminaciones y los cambios con una copia. Si desaparece contenido, consulte las opciones de recuperación antes de recargar.", "For important documents, test edits on a copy. If content disappears, check recovery options before reloading."),
    href: "/native-tools/estiloapa/index.html",
    cta: loc("Abrir EstiloAPA", "Open EstiloAPA")
  },
  {
    id: "txt",
    label: loc("TXT Test Generator", "TXT Test Generator"),
    description: loc("Convierta bancos de preguntas para Blackboard, Moodle y Canvas.", "Convert question banks for Blackboard, Moodle, and Canvas."),
    steps: {
      es: ["Seleccione Target LMS: Blackboard Ultra TXT, Moodle GIFT o Canvas QTI.", "Pegue las preguntas en Question bank content y separe cada pregunta con una línea en blanco.", "Marque las respuestas correctas con un asterisco (*) según los ejemplos de la herramienta.", "Pulse Verify para revisar errores, Convert para ver el resultado y Download para guardar el archivo.", "Importe el archivo en un curso de prueba y compruebe las respuestas y la puntuación."],
      en: ["Select Target LMS: Blackboard Ultra TXT, Moodle GIFT, or Canvas QTI.", "Paste questions in Question bank content, separating questions with a blank line.", "Mark correct answers with an asterisk (*) following the tool's examples.", "Choose Verify for issues, Convert to preview, and Download to save.", "Import into a test course and check answer keys and scoring."]
    },
    caution: loc("Los formatos no son intercambiables: Blackboard TXT, Moodle GIFT y Canvas QTI requieren importaciones diferentes.", "Formats are not interchangeable: Blackboard TXT, Moodle GIFT, and Canvas QTI use different import workflows."),
    href: "/native-tools/txt-test-generator/index.html",
    cta: loc("Abrir TXT Generator", "Open TXT Generator")
  },
  {
    id: "qti",
    label: loc("QTI 2.1 Blackboard", "QTI 2.1 Blackboard"),
    description: loc("Genere paquetes ZIP de evaluación y revise la compatibilidad.", "Generate assessment ZIP packages and review compatibility."),
    steps: {
      es: ["Abra View question format examples para revisar MC, MA, TF, FIB y ESSAY.", "Pegue sus preguntas o use Load example; seleccione Blackboard Ultra como LMS de destino para obtener QTI 2.1.", "Ejecute la validación y revise el preflight antes de descargar el paquete ZIP.", "Importe el ZIP en un curso de prueba, verifique cada pregunta y utilice la lista de verificación posterior a la importación."],
      en: ["Open View question format examples to see MC, MA, TF, FIB, and ESSAY.", "Paste your bank or use Load example; select Blackboard Ultra for a QTI 2.1 package.", "Run validation, review preflight results, and download the ZIP.", "Import the ZIP into a test course, inspect every question, and use the post-import checklist."]
    },
    caution: loc("No cambie el contenido interno del ZIP antes de importarlo. Si una pregunta no es compatible, corríjala y genere el paquete nuevamente.", "Do not alter the internal ZIP files before import. Fix unsupported question types and generate a fresh package."),
    href: "/native-tools/qti-blackboard/index.html",
    cta: loc("Abrir QTI 2.1", "Open QTI 2.1")
  }
];

const questions: { id: string; question: Local; answer: Local }[] = [
  {
    id: "screen",
    question: loc("La pantalla del iPhone se corta o aparece desplazamiento horizontal", "The iPhone screen clips content or scrolls sideways"),
    answer: loc("Abra la versión integrada usando los enlaces de esta página, vuelva a cargarla y compruebe que Safari tenga el zoom de página normal. Si persiste, capture la sección afectada y especifique la herramienta y el navegador.", "Open the integrated tool through this page and reload it. Check that Safari is at normal page zoom. If the issue persists, capture the affected section and note the tool and browser.")
  },
  {
    id: "404",
    question: loc("El enlace muestra 404", "The link returns 404"),
    answer: loc("Use la dirección completa terminada en index.html desde esta ayuda. Abra la página en una pestaña nueva si el enlace antiguo estaba guardado.", "Use the complete index.html link on this page. Open a new tab if a previously saved shortcut is outdated.")
  },
  {
    id: "deletion",
    question: loc("Al borrar texto, el cursor salta o desaparecen palabras", "Deleting text moves the caret or removes unexpected words"),
    answer: loc("Detenga la edición y conserve una copia. Verifique las opciones de historial y recuperación antes de recargar. Para informar el error, indique si utilizó Backspace, Delete o una selección de texto y en qué navegador ocurrió.", "Stop editing and keep a copy. Check history and recovery before reloading. When reporting, specify whether you used Backspace, Delete, or a text selection, and name the browser.")
  },
  {
    id: "export",
    question: loc("No puedo descargar o importar un examen", "I cannot download or import a test"),
    answer: loc("Compruebe Target LMS, ejecute Verify o preflight y descargue el formato correspondiente. Revise si el navegador bloqueó la descarga; pruebe primero en un curso de práctica.", "Check Target LMS, run Verify or preflight, and download the matching format. Check browser download permissions and test in a practice course.")
  },
  {
    id: "privacy",
    question: loc("¿Se envían mis preguntas o documentos a un servidor?", "Are my questions or documents uploaded to a server?"),
    answer: loc("Las herramientas nativas indican que procesan el contenido localmente en el navegador. Evite introducir datos sensibles sin verificar los requisitos de privacidad de su institución y mantenga copias de sus archivos.", "The native tools state that they process content locally in the browser. Check your organization's privacy requirements before entering sensitive data, and keep backups.")
  },
  {
    id: "offline",
    question: loc("¿Qué ocurre si pierdo la conexión?", "What happens when I lose connectivity?"),
    answer: loc("Algunos recursos pueden funcionar sin conexión si ya se guardaron en caché, pero no se garantiza que todas las funciones estén disponibles. Mantenga una copia descargada y vuelva a verificar el estado al conectarse.", "Previously cached resources may work offline, but not all functions are guaranteed. Keep a downloaded copy and recheck status once connected.")
  }
];

export default function HelpPage() {
  const [language, setLanguage] = useState<Language>("es");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase(language === "es" ? "es-PR" : "en-US");
  const displayedTopics = useMemo(() => topics.filter((topic) =>
    !normalized || [topic.label[language], topic.description[language], ...topic.steps[language]]
      .join(" ").toLocaleLowerCase(language === "es" ? "es-PR" : "en-US").includes(normalized)
  ), [normalized, language]);
  const displayedQuestions = useMemo(() => questions.filter((item) =>
    !normalized || (item.question[language] + " " + item.answer[language])
      .toLocaleLowerCase(language === "es" ? "es-PR" : "en-US").includes(normalized)
  ), [normalized, language]);

  return (
    <main className="help-page" lang={language === "es" ? "es-PR" : "en-US"}>
      <header className="help-topbar">
        <Link className="help-brand" href="/" aria-label="Curralume Studio home">
          <img src="/brand/curralume-mark.svg" alt="" width="36" height="36" />
          <strong>Curralume Studio</strong>
        </Link>
        <div className="help-top-actions">
          <Link href="/tools" className="help-nav-action"><BookOpen size={17} aria-hidden="true" /> Native Tools</Link>
          <Link href="/" className="help-nav-action"><ArrowLeft size={17} aria-hidden="true" /> {language === "es" ? "Editor" : "Editor"}</Link>
        </div>
      </header>

      <div className="help-shell">
        <section className="help-hero" aria-labelledby="help-title">
          <div className="help-hero-copy">
            <span className="help-eyebrow"><LifeBuoy size={16} aria-hidden="true" /> {language === "es" ? "Guía oficial de la aplicación" : "Application guide"}</span>
            <h1 id="help-title">{language === "es" ? "Centro de ayuda" : "Help Center"}</h1>
            <p>{language === "es"
              ? "Instrucciones claras para crear, revisar, guardar y exportar documentos y exámenes en Curralume Studio."
              : "Step-by-step guidance for creating, reviewing, saving, and exporting documents and assessments in Curralume Studio."}</p>
          </div>
          <div className="help-language" role="group" aria-label="Help language">
            <button type="button" aria-pressed={language === "es"} className={language === "es" ? "active" : ""} onClick={() => setLanguage("es")}>Español PR</button>
            <button type="button" aria-pressed={language === "en"} className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button>
          </div>
        </section>

        <div className="help-search">
          <label htmlFor="help-search"><Search size={18} aria-hidden="true" /> {language === "es" ? "Buscar en la ayuda" : "Search help"}</label>
          <input id="help-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={language === "es" ? "Ej. APA, iPhone, QTI, descargar..." : "E.g. APA, iPhone, QTI, download..."} />
        </div>

        <div className="help-layout">
          <nav className="help-toc" aria-label={language === "es" ? "Secciones de ayuda" : "Help sections"}>
            <strong>{language === "es" ? "Contenido" : "Contents"}</strong>
            {topics.map((topic) => <a key={topic.id} href={"#" + topic.id}>{topic.label[language]}</a>)}
            <a href="#faq">{language === "es" ? "Problemas frecuentes" : "Frequently asked questions"}</a>
          </nav>

          <div className="help-main-content">
            <div className="help-section-heading">
              <h2>{language === "es" ? "Guías paso a paso" : "Step-by-step guides"}</h2>
              <span aria-live="polite">{displayedTopics.length + displayedQuestions.length} {language === "es" ? "resultados" : "results"}</span>
            </div>
            {displayedTopics.map((topic) => <article className="help-card" id={topic.id} key={topic.id}>
              <div className="help-card-title">
                {topic.id === "studio" ? <FileText aria-hidden="true" /> : topic.id === "estiloapa" ? <BookOpen aria-hidden="true" /> : topic.id === "txt" ? <FileQuestion aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
                <div><h3>{topic.label[language]}</h3><p>{topic.description[language]}</p></div>
              </div>
              <ol>{topic.steps[language].map((step, index) => <li key={index}>{step}</li>)}</ol>
              <p className="help-safety"><CheckCircle2 size={17} aria-hidden="true" /> {topic.caution[language]}</p>
              <a className="help-open-tool" href={topic.href}>{topic.cta[language]} <span aria-hidden="true">↗</span></a>
            </article>)}

            <section id="faq" className="help-faq" aria-labelledby="help-faq-heading">
              <h2 id="help-faq-heading">{language === "es" ? "Problemas frecuentes" : "Frequently asked questions"}</h2>
              {displayedQuestions.map((item) => <details key={item.id}>
                <summary><CircleHelp size={18} aria-hidden="true" /> {item.question[language]}</summary>
                <p>{item.answer[language]}</p>
              </details>)}
            </section>
            {displayedTopics.length === 0 && displayedQuestions.length === 0 &&
              <p className="help-empty" role="status">{language === "es" ? "No encontramos resultados. Pruebe con otra palabra." : "No results found. Try a different search."}</p>}
          </div>
        </div>
        <footer className="help-footer">© 2026 Eduardo Augusto García Rodríguez. All rights reserved.</footer>
      </div>
    </main>
  );
}
