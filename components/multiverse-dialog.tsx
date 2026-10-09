"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, GitBranch, GitCompareArrows, Loader2, Merge, Orbit, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { activeBranch, applyFastForward, commitRevision, compareRevisions, createBranch, createUniverse, headRevision, isForeignUniverseBroadcast, loadUniverse, planMerge, resolveDivergence, switchBranch, updateUniverse, type MultiverseBroadcast, type MultiverseUniverse, type RevisionComparison } from "@/lib/multiverse-engine";
import { documentKey, type ContinuityDocument } from "@/lib/temporal-continuity";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ContinuityDocument;
  onApplyDocument: (document: ContinuityDocument) => void;
};

const CHANNEL = "ultrapage-multiverse-v1";

type PendingResolution = { sourceBranchId: string; targetBranchId: string };

export function MultiverseDialog({ open, onOpenChange, document, onApplyDocument }: Props) {
  const [universe, setUniverse] = useState<MultiverseUniverse | null>(null);
  const [branchName, setBranchName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [comparison, setComparison] = useState<RevisionComparison | null>(null);
  const [pendingResolution, setPendingResolution] = useState<PendingResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [remoteUpdate, setRemoteUpdate] = useState(false);
  const documentRef = useRef(document);
  const activeBranchIdRef = useRef("");
  const observedHeadIdRef = useRef("");
  const tabIdRef = useRef(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  documentRef.current = document;
  const key = documentKey(document);

  const broadcast = useCallback((next: MultiverseUniverse) => {
    activeBranchIdRef.current = next.activeBranchId;
    observedHeadIdRef.current = headRevision(next)?.id || "";
    setUniverse(next);
    setRemoteUpdate(false);
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage({ documentKey: next.documentKey, activeBranchId: next.activeBranchId, senderId: tabIdRef.current });
      channel.close();
    }
  }, []);

  const transact = useCallback(async (message: string, action: (current: MultiverseUniverse) => Promise<MultiverseUniverse> | MultiverseUniverse) => {
    setLoading(true);
    try {
      const next = await updateUniverse(key, async (current) => {
        const initialized = current || await createUniverse(documentRef.current);
        const localTimeline = activeBranchIdRef.current && initialized.branches.some((branch) => branch.id === activeBranchIdRef.current) ? switchBranch(initialized, activeBranchIdRef.current) : initialized;
        const checkpointed = (await commitRevision(localTimeline, documentRef.current, message, undefined, observedHeadIdRef.current || undefined)).universe;
        return action(checkpointed);
      });
      broadcast(next);
      return next;
    } finally { setLoading(false); }
  }, [broadcast, key]);

  const initialize = useCallback(async () => {
    setLoading(true);
    try {
      const next = await updateUniverse(key, async (current) => current || await createUniverse(documentRef.current));
      activeBranchIdRef.current = next.activeBranchId;
      observedHeadIdRef.current = headRevision(next)?.id || "";
      setUniverse(next);
      setSelectedBranchId(next.branches.find((branch) => branch.id !== next.activeBranchId)?.id || "");
    } catch (problem) {
      toast.error("Multiverse could not open", { description: problem instanceof Error ? problem.message : "Local causal memory is unavailable." });
    } finally { setLoading(false); }
  }, [key]);

  useEffect(() => { if (open) void initialize(); }, [initialize, open]);
  useEffect(() => {
    if (!open || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent<MultiverseBroadcast>) => {
      if (isForeignUniverseBroadcast(event.data, key, tabIdRef.current)) setRemoteUpdate(true);
    };
    return () => channel.close();
  }, [key, open]);

  const refresh = async () => {
    const current = await loadUniverse(key);
    if (current) {
      const localView = activeBranchIdRef.current && current.branches.some((branch) => branch.id === activeBranchIdRef.current) ? switchBranch(current, activeBranchIdRef.current) : current;
      const latest = headRevision(localView);
      if (latest) onApplyDocument(latest.document);
      activeBranchIdRef.current = localView.activeBranchId;
      observedHeadIdRef.current = latest?.id || "";
      setUniverse(localView); setRemoteUpdate(false); setComparison(null); setPendingResolution(null);
    }
  };

  const createTimeline = async () => {
    try {
      setLoading(true);
      const next = await updateUniverse(key, async (current) => {
        const initialized = current || await createUniverse(documentRef.current);
        const localTimeline = activeBranchIdRef.current && initialized.branches.some((branch) => branch.id === activeBranchIdRef.current) ? switchBranch(initialized, activeBranchIdRef.current) : initialized;
        const observedHead = observedHeadIdRef.current && localTimeline.revisions.some((revision) => revision.id === observedHeadIdRef.current)
          ? observedHeadIdRef.current
          : headRevision(localTimeline)?.id;
        if (!observedHead) throw new Error("The displayed timeline revision is unavailable.");
        const branched = createBranch(localTimeline, branchName, observedHead);
        return (await commitRevision(branched, documentRef.current, "Initial branch checkpoint", undefined, observedHead)).universe;
      });
      broadcast(next);
      setBranchName("");
      setSelectedBranchId(next.branches.find((branch) => branch.id !== next.activeBranchId)?.id || "");
      toast.success("Timeline created", { description: `${activeBranch(next).name} now evolves independently.` });
    } catch (problem) { toast.error("Timeline was not created", { description: problem instanceof Error ? problem.message : "Try again." }); }
    finally { setLoading(false); }
  };

  const openTimeline = async (branchId: string) => {
    try {
      const next = await transact("Checkpoint before changing timeline", (current) => switchBranch(current, branchId));
      const revision = headRevision(next);
      if (revision) onApplyDocument(revision.document);
      setSelectedBranchId(next.branches.find((branch) => branch.id !== next.activeBranchId)?.id || "");
      setComparison(null); setPendingResolution(null);
      toast.success("Timeline opened", { description: activeBranch(next).name });
    } catch (problem) { toast.error("Timeline could not be opened", { description: problem instanceof Error ? problem.message : "Try again." }); }
  };

  const compare = async () => {
    if (!selectedBranchId) return;
    try {
      const next = await transact("Checkpoint before comparison", (current) => current);
      const source = headRevision(next, selectedBranchId);
      const target = headRevision(next);
      if (source && target) setComparison(compareRevisions(target, source));
    } catch (problem) { toast.error("Comparison failed", { description: problem instanceof Error ? problem.message : "Try again." }); }
  };

  const merge = async () => {
    if (!selectedBranchId) return;
    try {
      let resolution: PendingResolution | null = null;
      const next = await transact("Checkpoint before merge", (current) => {
        const targetBranchId = current.activeBranchId;
        const plan = planMerge(current, selectedBranchId, targetBranchId);
        if (plan.status === "fast-forward") return applyFastForward(current, selectedBranchId, targetBranchId).universe;
        if (plan.status === "diverged") { resolution = { sourceBranchId: selectedBranchId, targetBranchId }; return current; }
        toast.info(plan.status === "identical" ? "The timelines are already identical" : "The current timeline already contains those revisions");
        return current;
      });
      if (resolution) {
        setPendingResolution(resolution);
      } else {
        const revision = headRevision(next);
        if (revision) onApplyDocument(revision.document);
        toast.success("Safe merge completed", { description: "The target timeline advanced without discarding a revision." });
      }
    } catch (problem) { toast.error("Merge failed", { description: problem instanceof Error ? problem.message : "Try again." }); }
  };

  const resolve = async (choice: "source" | "target") => {
    if (!pendingResolution) return;
    try {
      setLoading(true);
      const next = await updateUniverse(key, async (current) => {
        if (!current) throw new Error("The document universe is unavailable.");
        if (!current.branches.some((branch) => branch.id === pendingResolution.targetBranchId)) throw new Error("The displayed target timeline no longer exists.");
        if (!current.branches.some((branch) => branch.id === pendingResolution.sourceBranchId)) throw new Error("The selected source timeline no longer exists.");
        const resolved = await resolveDivergence(current, pendingResolution.sourceBranchId, choice, pendingResolution.targetBranchId);
        return switchBranch(resolved, pendingResolution.targetBranchId);
      });
      broadcast(next);
      const revision = headRevision(next);
      if (revision) onApplyDocument(revision.document);
      setPendingResolution(null); setComparison(null);
      toast.success("Divergence resolved", { description: `The ${choice === "source" ? "selected" : "current"} timeline was preserved in a two-parent merge revision.` });
    } catch (problem) { toast.error("Resolution failed", { description: problem instanceof Error ? problem.message : "Try again." }); }
    finally { setLoading(false); }
  };

  const selectedName = universe?.branches.find((branch) => branch.id === selectedBranchId)?.name || "another timeline";
  const currentHead = universe ? headRevision(universe) : undefined;
  const active = universe ? activeBranch(universe) : undefined;
  const otherBranches = useMemo(() => universe?.branches.filter((branch) => branch.id !== universe.activeBranchId) || [], [universe]);

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="multiverse-dialog"><DialogHeader><DialogTitle>Curralume Multiverse Engine</DialogTitle><DialogDescription>Local-first causal timelines for safe variants, comparison, and human-controlled convergence. Nothing leaves this browser.</DialogDescription></DialogHeader>
    {remoteUpdate && <button type="button" className="multiverse-remote" onClick={refresh}><Orbit/><span><strong>Another tab advanced this timeline.</strong><small>Create a branch to preserve local edits, or deliberately load the latest revision.</small></span><b>Load latest</b></button>}
    <section className="multiverse-hero"><span><Orbit/></span><div><small>ACTIVE TIMELINE</small><strong>{loading && !active ? "Opening causal memory…" : active?.name || "Unavailable"}</strong><p>{currentHead ? `${currentHead.contentHash.slice(0, 12)}… · ${universe?.revisions.length} sealed revision${universe?.revisions.length === 1 ? "" : "s"}` : "No revision loaded"}</p></div><b>{universe?.branches.length || 0}<small>TIMELINES</small></b></section>
    <div className="multiverse-create"><label><span>New timeline name</span><Input value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="Accessible revision" maxLength={80}/></label><Button onClick={createTimeline} disabled={loading || !branchName.trim()}><Plus size={16}/> Create branch</Button></div>
    <section className="multiverse-map" aria-label="Document timelines">{universe?.branches.map((branch) => <button type="button" key={branch.id} className={branch.id === universe.activeBranchId ? "active" : ""} onClick={() => branch.id !== universe.activeBranchId && void openTimeline(branch.id)} disabled={loading}><span><GitBranch/></span><span><strong>{branch.name}</strong><small>{branch.id === universe.activeBranchId ? "Open now" : "Open timeline"} · {new Date(branch.updatedAt).toLocaleString("en-US")}</small></span>{branch.id === universe.activeBranchId ? <Check/> : <b>{universe.revisions.filter((revision) => revision.branchId === branch.id).length}</b>}</button>)}</section>
    {otherBranches.length > 0 && <section className="multiverse-converge"><label><span>Compare or merge into {active?.name}</span><select value={selectedBranchId} onChange={(event) => { setSelectedBranchId(event.target.value); setComparison(null); setPendingResolution(null); }}>{otherBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><Button variant="outline" onClick={compare} disabled={loading || !selectedBranchId}><GitCompareArrows size={16}/> Compare</Button><Button onClick={merge} disabled={loading || !selectedBranchId}><Merge size={16}/> Merge safely</Button></section>}
    {comparison && <section className="multiverse-comparison"><header><GitCompareArrows/><div><strong>Semantic comparison</strong><small>{active?.name} → {selectedName}</small></div></header><div><span><b>+{comparison.wordsAdded}</b><small>unique words</small></span><span><b>−{comparison.wordsRemoved}</b><small>unique words</small></span><span><b>+{comparison.blocksAdded}</b><small>blocks</small></span><span><b>{comparison.metadataChanges.length}</b><small>metadata fields</small></span></div>{comparison.metadataChanges.length > 0 && <p>Changed metadata: {comparison.metadataChanges.join(", ")}.</p>}</section>}
    {pendingResolution && <section className="multiverse-resolution" role="alert"><AlertTriangle/><div><strong>Human decision required</strong><p>{active?.name} and {selectedName} both changed after their shared ancestor. Curralume will not guess which meaning is correct.</p><div><Button variant="outline" onClick={() => resolve("target")} disabled={loading}>Keep {active?.name}</Button><Button onClick={() => resolve("source")} disabled={loading}>Use {selectedName}</Button></div></div></section>}
    <p className="multiverse-note"><Orbit/> SHA-256 seals detect altered revisions. IndexedDB stores the graph; Web Locks serialize writes across tabs. Automatic merge is allowed only for a provable fast-forward.</p>
    {loading && <span className="multiverse-loading" aria-live="polite"><Loader2 className="spin"/> Updating causal memory…</span>}
  </DialogContent></Dialog>;
}
