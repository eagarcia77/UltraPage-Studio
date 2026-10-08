import assert from "node:assert/strict";
import test from "node:test";
import { applyFastForward, commitRevision, compareRevisions, createBranch, createUniverse, headRevision, isForeignUniverseBroadcast, planMerge, resolveDivergence, switchBranch, verifyRevision, verifyUniverse } from "../lib/multiverse-engine.ts";
import type { ContinuityDocument } from "../lib/temporal-continuity.ts";

const base: ContinuityDocument = {
  html: "<h1>Module</h1><p>Original content.</p>",
  title: "Module",
  fileName: "module.html",
  language: "en-US",
  lmsProfile: "blackboard",
  author: "Eduardo Augusto García Rodríguez",
  description: "Course module",
  pageSetup: { size: "letter", orientation: "portrait", margin: "normal" },
};

test("creates a sealed universe and detects revision tampering", async () => {
  const universe = await createUniverse(base, "Blackboard", "2026-10-08T01:00:00.000Z");
  assert.equal(await verifyUniverse(universe), true);
  const revision = { ...universe.revisions[0], message: "Forged" };
  assert.equal(await verifyRevision(revision), false);
});

test("deduplicates checkpoints with identical content", async () => {
  const universe = await createUniverse(base);
  const result = await commitRevision(universe, { ...base });
  assert.equal(result.committed, false);
  assert.equal(result.universe.revisions.length, 1);
});

test("rejects a stale edit when another tab advanced the observed head", async () => {
  const original = await createUniverse(base, "Main", "2026-10-08T01:00:00.000Z");
  const observedHead = headRevision(original)!.id;
  const advanced = (await commitRevision(original, { ...base, html: "<h1>Module</h1><p>Remote tab update.</p>" }, "Remote update", "2026-10-08T01:01:00.000Z", observedHead)).universe;
  await assert.rejects(
    commitRevision(advanced, { ...base, html: "<h1>Module</h1><p>Stale local update.</p>" }, "Stale update", "2026-10-08T01:02:00.000Z", observedHead),
    (problem: unknown) => problem instanceof Error && problem.name === "MultiverseConflictError",
  );
});

test("ignores same-tab broadcasts and accepts only foreign updates for this document", () => {
  assert.equal(isForeignUniverseBroadcast({ documentKey: "module.html", senderId: "tab-a" }, "module.html", "tab-a"), false);
  assert.equal(isForeignUniverseBroadcast({ documentKey: "other.html", senderId: "tab-b" }, "module.html", "tab-a"), false);
  assert.equal(isForeignUniverseBroadcast({ documentKey: "module.html", senderId: "tab-b" }, "module.html", "tab-a"), true);
});

test("creates an independent timeline from the selected revision", async () => {
  const universe = await createUniverse(base, "Main", "2026-10-08T01:00:00.000Z");
  const branched = createBranch(universe, "Accessible revision", universe.revisions[0].id, "2026-10-08T01:05:00.000Z", "accessible");
  assert.equal(branched.activeBranchId, "accessible");
  assert.equal(branched.branches.length, 2);
  assert.equal(headRevision(branched)?.contentHash, universe.revisions[0].contentHash);
});

test("fast-forwards only when the target is an ancestor", async () => {
  const original = await createUniverse(base, "Main", "2026-10-08T01:00:00.000Z");
  const mainId = original.activeBranchId;
  let universe = createBranch(original, "Canvas", undefined, "2026-10-08T01:05:00.000Z", "canvas");
  universe = (await commitRevision(universe, { ...base, html: "<h1>Module</h1><p>Canvas update.</p>" }, "Canvas adaptation", "2026-10-08T01:10:00.000Z")).universe;
  assert.equal(planMerge(universe, "canvas", mainId).status, "fast-forward");
  const merged = applyFastForward(universe, "canvas", mainId, "2026-10-08T01:15:00.000Z").universe;
  assert.equal(headRevision(merged, mainId)?.document.html.includes("Canvas update"), true);
});

test("divergent timelines require an explicit resolution", async () => {
  let universe = await createUniverse(base, "Main", "2026-10-08T01:00:00.000Z");
  const mainId = universe.activeBranchId;
  universe = createBranch(universe, "Faculty review", undefined, "2026-10-08T01:02:00.000Z", "faculty");
  universe = (await commitRevision(universe, { ...base, html: "<h1>Module</h1><p>Faculty version.</p>" }, "Faculty edit", "2026-10-08T01:03:00.000Z")).universe;
  universe = switchBranch(universe, mainId);
  universe = (await commitRevision(universe, { ...base, html: "<h1>Module</h1><p>Main version.</p>" }, "Main edit", "2026-10-08T01:04:00.000Z")).universe;
  assert.equal(planMerge(universe, "faculty", mainId).status, "diverged");
  const resolved = await resolveDivergence(universe, "faculty", "source", mainId, "2026-10-08T01:05:00.000Z");
  const head = headRevision(resolved, mainId)!;
  assert.equal(head.parentIds.length, 2);
  assert.equal(head.document.html.includes("Faculty version"), true);
  assert.equal(await verifyUniverse(resolved), true);
});

test("resolves divergence against an explicit target even if another tab changed the active timeline", async () => {
  let universe = await createUniverse(base, "Main", "2026-10-08T01:00:00.000Z");
  const mainId = universe.activeBranchId;
  universe = createBranch(universe, "Faculty review", undefined, "2026-10-08T01:02:00.000Z", "faculty");
  universe = (await commitRevision(universe, { ...base, html: "<h1>Module</h1><p>Faculty version.</p>" }, "Faculty edit", "2026-10-08T01:03:00.000Z")).universe;
  universe = switchBranch(universe, mainId);
  universe = (await commitRevision(universe, { ...base, html: "<h1>Module</h1><p>Main version.</p>" }, "Main edit", "2026-10-08T01:04:00.000Z")).universe;
  universe = switchBranch(universe, "faculty");
  const resolved = await resolveDivergence(universe, "faculty", "source", mainId, "2026-10-08T01:05:00.000Z");
  assert.equal(headRevision(resolved, mainId)?.document.html.includes("Faculty version"), true);
  assert.equal(resolved.activeBranchId, "faculty");
});

test("semantic comparison reports content and metadata changes", async () => {
  let universe = await createUniverse(base);
  universe = (await commitRevision(universe, { ...base, title: "Revised module", html: "<h1>Module</h1><p>Original content with an activity.</p><h2>Practice</h2>" })).universe;
  const comparison = compareRevisions(universe.revisions[0], universe.revisions[1]);
  assert.equal(comparison.identical, false);
  assert.ok(comparison.wordsAdded > 0);
  assert.ok(comparison.blocksAdded > 0);
  assert.deepEqual(comparison.metadataChanges, ["title"]);
});
