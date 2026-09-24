"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ExternalLink, FileQuestion, PackageCheck } from "lucide-react";

type ToolId = "apa" | "txt" | "qti";

const tools: Array<{ id: ToolId; name: string; description: string; source: string; icon: typeof BookOpen; original: string }> = [
  {
    id: "apa",
    name: "EstiloAPA",
    description: "APA 7 references, academic formatting, audits, and document export.",
    source: "/native-tools/estiloapa/index.html",
    icon: BookOpen,
    original: "https://eagarcia77.github.io/estiloAPA/",
  },
  {
    id: "txt",
    name: "TXT Test Generator",
    description: "Convert and verify questions for Blackboard Ultra TXT import.",
    source: "/native-tools/txt-test-generator/index.html",
    icon: FileQuestion,
    original: "https://eagarcia77.github.io/CTEL-SG/index_generator.html",
  },
  {
    id: "qti",
    name: "QTI 2.1 Blackboard",
    description: "Validate questions and create Blackboard assessment packages.",
    source: "/native-tools/qti-blackboard/index.html",
    icon: PackageCheck,
    original: "https://eagarcia77.github.io/CTEL-SG/QTI21_BlackboardV3.html",
  },
];

export default function NativeToolsPage() {
  const [selected, setSelected] = useState<ToolId>("apa");

  useEffect(() => {
    const selectFromHash = () => {
      const next = window.location.hash.replace("#", "") as ToolId;
      if (tools.some((tool) => tool.id === next)) setSelected(next);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  const active = tools.find((tool) => tool.id === selected) || tools[0];
  const selectTool = (id: ToolId) => {
    setSelected(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return <main className="native-tools-page">
    <header className="native-tools-header">
      <a href="/" className="native-tools-back"><ArrowLeft size={17}/> Back to Studio</a>
      <div className="native-tools-brand"><span className="brandmark"><span>U</span></span><span><strong>UltraPage Studio</strong><small>Native Tools</small></span></div>
      <a href={active.original} target="_blank" rel="noopener noreferrer" className="native-tools-original">Original repository version <ExternalLink size={15}/></a>
    </header>
    <div className="native-tools-workspace">
      <aside className="native-tools-menu" aria-label="Native tools">
        <p>DEVELOPED TOOLS</p>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return <button key={tool.id} type="button" className={selected === tool.id ? "active" : ""} onClick={() => selectTool(tool.id)} aria-pressed={selected === tool.id}>
            <span><Icon size={19}/></span>
            <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
          </button>;
        })}
        <div className="native-tools-note"><strong>Native copies</strong><span>These tools run from the UltraPage Studio repository. Their original repositories remain unchanged.</span></div>
      </aside>
      <section className="native-tool-stage" aria-labelledby="native-tool-title">
        <div className="native-tool-stage-header">
          <div><strong id="native-tool-title">{active.name}</strong><span>{active.description}</span></div>
          <a href={active.source} target="_blank" rel="noopener noreferrer">Open full screen <ExternalLink size={14}/></a>
        </div>
        <iframe key={active.id} src={active.source} title={`${active.name} native UltraPage Studio tool`} className="native-tool-frame" allow="clipboard-read; clipboard-write" />
      </section>
    </div>
  </main>;
}
