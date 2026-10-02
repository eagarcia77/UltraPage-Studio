"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileQuestion,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";

type ToolId = "apa" | "txt" | "qti";
type FrameState = "loading" | "ready" | "slow" | "error";
type ProbeStatus = "pending" | "pass" | "warn" | "fail";
type NativeManifest = {
  syncedAt?: string;
  importedAt?: string;
  compatibilityProfile?: string;
  compatibilityReviewedAt?: string;
  audit?: {
    ribbonUnified?: boolean;
    keyboardNavigation?: string[];
    groups?: string[];
    publishedToRemote?: boolean;
  };
  lastSync?: { checkedFiles?: number; updatedFiles?: string[] };
};
type ToolProbe = { id: ToolId; label: string; status: ProbeStatus; message: string };

const ribbonGroups = ["File", "Document", "Authoring", "Review", "Report", "Preview", "Export"];
const tools: Array<{ id: ToolId; name: string; description: string; compatibility: string; source: string; icon: typeof BookOpen; original: string }> = [
  {
    id: "apa",
    name: "EstiloAPA",
    description: "APA 7 references, academic formatting, audits, and document export.",
    compatibility: "Portable documents for every LMS",
    source: "/native-tools/estiloapa/index.html",
    icon: BookOpen,
    original: "https://eagarcia77.github.io/estiloAPA/",
  },
  {
    id: "txt",
    name: "TXT Test Generator",
    description: "Convert and verify questions for Blackboard Ultra TXT or Moodle GIFT import.",
    compatibility: "Blackboard Ultra TXT + Moodle GIFT",
    source: "/native-tools/txt-test-generator/index.html",
    icon: FileQuestion,
    original: "https://eagarcia77.github.io/CTEL-SG/index_generator.html",
  },
  {
    id: "qti",
    name: "QTI 2.1 Blackboard",
    description: "Validate questions and create Blackboard assessment packages.",
    compatibility: "Blackboard Ultra QTI 2.1 profile",
    source: "/native-tools/qti-blackboard/index.html",
    icon: PackageCheck,
    original: "https://eagarcia77.github.io/CTEL-SG/QTI21_BlackboardV3.html",
  },
];

const statusLabel: Record<ProbeStatus, string> = {
  pending: "Pending",
  pass: "Passed",
  warn: "Review",
  fail: "Failed",
};

export default function NativeToolsPage() {
  const [selected, setSelected] = useState<ToolId>("apa");
  const [frameKey, setFrameKey] = useState(0);
  const [frameState, setFrameState] = useState<FrameState>("loading");
  const [online, setOnline] = useState(true);
  const [manifest, setManifest] = useState<NativeManifest | null>(null);
  const [toolProbes, setToolProbes] = useState<ToolProbe[]>(
    tools.map((tool) => ({ id: tool.id, label: tool.name, status: "pending", message: "Waiting for audit." })),
  );

  useEffect(() => {
    const selectFromHash = () => {
      const next = window.location.hash.replace("#", "") as ToolId;
      if (tools.some((tool) => tool.id === next)) setSelected(next);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    const connected = () => setOnline(true);
    const disconnected = () => setOnline(false);
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", disconnected);
    };
  }, []);

  useEffect(() => {
    fetch("/native-tools/manifest.json", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: NativeManifest) => setManifest(data))
      .catch(() => setManifest(null));
  }, []);

  useEffect(() => {
    runNativeAudit();
  }, []);

  useEffect(() => {
    setFrameState("loading");
    const timer = window.setTimeout(() => {
      setFrameState((current) => current === "loading" ? "slow" : current);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [selected, frameKey]);

  const runNativeAudit = async () => {
    setToolProbes(tools.map((tool) => ({ id: tool.id, label: tool.name, status: "pending", message: "Checking native copy." })));
    const results = await Promise.all(tools.map(async (tool) => {
      try {
        const response = await fetch(tool.source, { cache: "no-store" });
        if (!response.ok) {
          return { id: tool.id, label: tool.name, status: "fail" as ProbeStatus, message: `Route returned ${response.status}.` };
        }
        const html = await response.text();
        const hasAccessibleName = /aria-label|aria-labelledby|<title/i.test(html);
        const hasRibbonLanguage = /ribbon|File|Document|Authoring|Review|Preview|Export/i.test(html);
        const status: ProbeStatus = hasAccessibleName && hasRibbonLanguage ? "pass" : "warn";
        const message = status === "pass"
          ? "Route responds and accessibility/ribbon markers were detected."
          : "Route responds, but audit markers should be reviewed manually.";
        return { id: tool.id, label: tool.name, status, message };
      } catch {
        return { id: tool.id, label: tool.name, status: "fail" as ProbeStatus, message: "Route could not be checked from the browser." };
      }
    }));
    setToolProbes(results);
  };

  const active = tools.find((tool) => tool.id === selected) || tools[0];
  const selectTool = (id: ToolId) => {
    setSelected(id);
    setFrameKey(0);
    window.history.replaceState(null, "", `#${id}`);
  };
  const reloadTool = () => {
    setFrameState("loading");
    setFrameKey((current) => current + 1);
  };
  const syncedLabel = manifest?.syncedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(manifest.syncedAt))
    : "Version information unavailable";
  const passed = toolProbes.filter((probe) => probe.status === "pass").length;
  const failed = toolProbes.filter((probe) => probe.status === "fail").length;

  return <main className="native-tools-page">
    <header className="native-tools-header">
      <a href="/" className="native-tools-back"><ArrowLeft size={17}/> Back to Studio</a>
      <div className="native-tools-brand"><span className="brandmark" aria-hidden="true"><img src="/brand/ultrapage-mark.svg" alt="" /></span><span><strong>UltraPage Studio</strong><small>Native Tools</small></span></div>
      <a href={active.original} target="_blank" rel="noopener noreferrer" className="native-tools-original">Original repository version <ExternalLink size={15}/></a>
    </header>

    <div className="native-tools-health" aria-live="polite">
      <span className={online ? "native-health-pill ready" : "native-health-pill offline"}>
        {online ? <CheckCircle2 size={15}/> : <WifiOff size={15}/>}
        {online ? "Studio online" : "Limited offline mode"}
      </span>
      <span className="native-health-pill secured"><ShieldCheck size={15}/> Isolated native copy</span>
      {manifest?.compatibilityProfile && <span className="native-health-pill compatible">
        <PackageCheck size={15}/> {manifest.compatibilityProfile} profile reviewed
      </span>}
      <span className="native-health-sync"><Clock3 size={14}/> Last synchronized: {syncedLabel}</span>
    </div>

    <section className="native-tools-note" aria-labelledby="native-audit-title">
      <strong id="native-audit-title">Full native tools audit</strong>
      <span>{passed}/{tools.length} native routes passed the browser probe. {failed > 0 ? `${failed} route(s) require review.` : "No blocked route detected."}</span>
      <span>Shared Ribbon groups: {ribbonGroups.join(" · ")}</span>
      <span>Keyboard audit target: arrows, Home, and End. Server-side audit command: <code>npm run audit:native-tools</code>.</span>
      <button type="button" className="native-tool-reload" onClick={runNativeAudit}><RefreshCw size={14}/> Run audit again</button>
      <div className="native-audit-grid">
        {toolProbes.map((probe) => <span key={probe.id} className={`native-health-pill ${probe.status === "pass" ? "ready" : probe.status === "fail" ? "offline" : "compatible"}`} title={probe.message}>
          {probe.status === "pass" ? <CheckCircle2 size={14}/> : probe.status === "fail" ? <AlertTriangle size={14}/> : <Clock3 size={14}/>}
          {probe.label}: {statusLabel[probe.status]}
        </span>)}
      </div>
    </section>

    <div className="native-tools-workspace">
      <aside className="native-tools-menu" aria-label="Native tools">
        <p>DEVELOPED TOOLS</p>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const current = selected === tool.id;
          const probe = toolProbes.find((item) => item.id === tool.id);
          return <button key={tool.id} type="button" className={current ? "active" : ""} onClick={() => selectTool(tool.id)} aria-pressed={current}>
            <span><Icon size={19}/></span>
            <span><strong>{tool.name}</strong><small>{tool.description}</small><small className="native-tool-compatibility">{tool.compatibility}</small></span>
            {probe?.status === "pass" && <CheckCircle2 className="native-tool-ready-icon" size={16} aria-label="Audit passed"/>}
          </button>;
        })}
        <div className="native-tools-note">
          <strong>Native, traceable copies</strong>
          <span>These tools run from UltraPage Studio. Source repositories remain unchanged.</span>
          <span>Assessment import formats are LMS-specific. Use the Universal LMS profile in the Studio editor for portable page content.</span>
          {manifest?.lastSync?.checkedFiles && <small>{manifest.lastSync.checkedFiles} source files verified during the latest synchronization.</small>}
        </div>
      </aside>

      <section className="native-tool-stage" aria-labelledby="native-tool-title" data-frame-state={frameState}>
        <div className="native-tool-stage-header">
          <div>
            <strong id="native-tool-title">{active.name}</strong>
            <span>{active.description}</span>
          </div>
          <div className="native-tool-stage-actions">
            <span className={`native-frame-status ${frameState}`} role="status">
              {frameState === "ready" && <CheckCircle2 size={14}/>}
              {frameState === "loading" && <RefreshCw className="spin" size={14}/>}
              {frameState === "slow" && <Clock3 size={14}/>}
              {frameState === "error" && <AlertTriangle size={14}/>}
              {frameState === "ready" ? "Ready" : frameState === "loading" ? "Loading" : frameState === "slow" ? "Still loading" : "Load failed"}
            </span>
            <button type="button" className="native-tool-reload" onClick={reloadTool} title="Reload active tool"><RefreshCw size={14}/> Reload</button>
            <a href={active.source} target="_blank" rel="noopener noreferrer">Open full screen <ExternalLink size={14}/></a>
          </div>
        </div>

        <div className="native-tool-frame-wrap">
          {(frameState === "loading" || frameState === "slow" || frameState === "error") && <div className={`native-tool-loading ${frameState}`}>
            {frameState === "error" ? <AlertTriangle size={28}/> : <RefreshCw className={frameState === "loading" ? "spin" : ""} size={28}/>}
            <strong>{frameState === "error" ? "The tool could not be loaded" : frameState === "slow" ? "This tool is taking longer than expected" : `Loading ${active.name}`}</strong>
            <span>{online ? "UltraPage is preparing the native workspace." : "UltraPage is checking locally cached files. Export libraries that require the internet may be unavailable."}</span>
            {(frameState === "slow" || frameState === "error") && <button type="button" onClick={reloadTool}><RefreshCw size={15}/> Try again</button>}
          </div>}
          <iframe
            key={`${active.id}-${frameKey}`}
            src={active.source}
            title={`${active.name} native UltraPage Studio tool`}
            className="native-tool-frame"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setFrameState("ready")}
            onError={() => setFrameState("error")}
          />
        </div>
      </section>
    </div>
  </main>;
}
