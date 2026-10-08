import { documentKey, sha256, stableStringify, type ContinuityDocument } from "./temporal-continuity.ts";

export const MULTIVERSE_FORMAT = "ultrapage-multiverse";
export const MULTIVERSE_VERSION = 1;
export const MULTIVERSE_DATABASE = "ultrapage-multiverse-v1";
export const MULTIVERSE_STORE = "universes";
export const MULTIVERSE_REVISION_LIMIT = 250;
export const MULTIVERSE_BRANCH_LIMIT = 24;

export type MultiverseRevision = {
  id: string;
  branchId: string;
  parentIds: string[];
  createdAt: string;
  message: string;
  contentHash: string;
  seal: string;
  document: ContinuityDocument;
};

export type MultiverseBranch = {
  id: string;
  name: string;
  headRevisionId: string;
  createdAt: string;
  updatedAt: string;
};

export type MultiverseUniverse = {
  format: typeof MULTIVERSE_FORMAT;
  version: typeof MULTIVERSE_VERSION;
  documentKey: string;
  activeBranchId: string;
  branches: MultiverseBranch[];
  revisions: MultiverseRevision[];
};

export type RevisionComparison = {
  identical: boolean;
  wordsAdded: number;
  wordsRemoved: number;
  blocksAdded: number;
  blocksRemoved: number;
  metadataChanges: string[];
};

export type MergePlan =
  | { status: "identical" | "target-ahead"; targetHead: string; sourceHead: string }
  | { status: "fast-forward"; targetHead: string; sourceHead: string }
  | { status: "diverged"; targetHead: string; sourceHead: string; commonAncestorId?: string };

const HASH = /^[a-f0-9]{64}$/;
const now = () => new Date().toISOString();
const randomId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function revisionBase(revision: Omit<MultiverseRevision, "seal">) {
  return { id: revision.id, branchId: revision.branchId, parentIds: revision.parentIds, createdAt: revision.createdAt, message: revision.message, contentHash: revision.contentHash, document: revision.document };
}

export async function createRevision(document: ContinuityDocument, branchId: string, parentIds: string[] = [], message = "Checkpoint", createdAt = now(), id = randomId()): Promise<MultiverseRevision> {
  const contentHash = await sha256(stableStringify(document));
  const base = { id, branchId, parentIds: [...new Set(parentIds)].slice(0, 2), createdAt, message: message.trim().slice(0, 180) || "Checkpoint", contentHash, document };
  return { ...base, seal: await sha256(stableStringify(base)) };
}

export async function verifyRevision(revision: MultiverseRevision) {
  if (!revision || typeof revision !== "object" || !revision.id || !revision.branchId || !Array.isArray(revision.parentIds) || revision.parentIds.length > 2 || !revision.parentIds.every((id) => typeof id === "string" && id.length <= 200) || typeof revision.message !== "string" || revision.message.length > 180 || !HASH.test(revision.contentHash || "") || !HASH.test(revision.seal || "") || Number.isNaN(Date.parse(revision.createdAt))) return false;
  if (!revision.document || documentKey(revision.document) === "untitled-document" || revision.document.html.length > 10_000_000) return false;
  const contentHash = await sha256(stableStringify(revision.document));
  return contentHash === revision.contentHash && await sha256(stableStringify(revisionBase(revision))) === revision.seal;
}

export async function createUniverse(document: ContinuityDocument, branchName = "Main", createdAt = now()): Promise<MultiverseUniverse> {
  const branchId = randomId();
  const first = await createRevision(document, branchId, [], "Initial timeline", createdAt);
  return { format: MULTIVERSE_FORMAT, version: MULTIVERSE_VERSION, documentKey: documentKey(document), activeBranchId: branchId, branches: [{ id: branchId, name: branchName, headRevisionId: first.id, createdAt, updatedAt: createdAt }], revisions: [first] };
}

export async function verifyUniverse(value: unknown): Promise<boolean> {
  if (!value || typeof value !== "object") return false;
  const universe = value as MultiverseUniverse;
  if (universe.format !== MULTIVERSE_FORMAT || universe.version !== MULTIVERSE_VERSION || typeof universe.documentKey !== "string" || !Array.isArray(universe.branches) || !Array.isArray(universe.revisions) || !universe.branches.length || universe.branches.length > MULTIVERSE_BRANCH_LIMIT || !universe.revisions.length || universe.revisions.length > MULTIVERSE_REVISION_LIMIT) return false;
  const revisionIds = new Set(universe.revisions.map((revision) => revision.id));
  const branchIds = new Set(universe.branches.map((branch) => branch.id));
  if (revisionIds.size !== universe.revisions.length || branchIds.size !== universe.branches.length || !branchIds.has(universe.activeBranchId)) return false;
  for (const branch of universe.branches) if (!branch.name || branch.name.length > 80 || !revisionIds.has(branch.headRevisionId) || Number.isNaN(Date.parse(branch.createdAt)) || Number.isNaN(Date.parse(branch.updatedAt))) return false;
  for (const revision of universe.revisions) {
    if (!branchIds.has(revision.branchId) || revision.parentIds.some((id) => !revisionIds.has(id)) || documentKey(revision.document) !== universe.documentKey || !(await verifyRevision(revision))) return false;
  }
  return true;
}

export function activeBranch(universe: MultiverseUniverse) {
  return universe.branches.find((branch) => branch.id === universe.activeBranchId)!;
}

export function headRevision(universe: MultiverseUniverse, branchId = universe.activeBranchId) {
  const branch = universe.branches.find((entry) => entry.id === branchId);
  return branch ? universe.revisions.find((revision) => revision.id === branch.headRevisionId) : undefined;
}

export async function commitRevision(universe: MultiverseUniverse, document: ContinuityDocument, message = "Document update", createdAt = now()) {
  const branch = activeBranch(universe);
  const head = headRevision(universe);
  const contentHash = await sha256(stableStringify(document));
  if (head?.contentHash === contentHash) return { universe, revision: head, committed: false };
  if (universe.revisions.length >= MULTIVERSE_REVISION_LIMIT) throw new Error(`This document reached the ${MULTIVERSE_REVISION_LIMIT}-revision safety limit. Export or archive it before continuing.`);
  const revision = await createRevision(document, branch.id, head ? [head.id] : [], message, createdAt);
  const branches = universe.branches.map((entry) => entry.id === branch.id ? { ...entry, headRevisionId: revision.id, updatedAt: createdAt } : entry);
  const revisions = [...universe.revisions, revision];
  return { universe: { ...universe, branches, revisions }, revision, committed: true };
}

export function createBranch(universe: MultiverseUniverse, name: string, fromRevisionId = activeBranch(universe).headRevisionId, createdAt = now(), id = randomId()) {
  if (universe.branches.length >= MULTIVERSE_BRANCH_LIMIT) throw new Error(`A document can contain up to ${MULTIVERSE_BRANCH_LIMIT} timelines.`);
  if (!universe.revisions.some((revision) => revision.id === fromRevisionId)) throw new Error("The source revision does not exist.");
  const normalized = name.trim().slice(0, 80);
  if (!normalized) throw new Error("Enter a timeline name.");
  if (universe.branches.some((branch) => branch.name.toLowerCase() === normalized.toLowerCase())) throw new Error("A timeline with that name already exists.");
  const branch = { id, name: normalized, headRevisionId: fromRevisionId, createdAt, updatedAt: createdAt };
  return { ...universe, activeBranchId: id, branches: [...universe.branches, branch] };
}

export function switchBranch(universe: MultiverseUniverse, branchId: string) {
  if (!universe.branches.some((branch) => branch.id === branchId)) throw new Error("The selected timeline does not exist.");
  return { ...universe, activeBranchId: branchId };
}

function ancestors(universe: MultiverseUniverse, revisionId: string) {
  const result = new Set<string>();
  const pending = [revisionId];
  while (pending.length) {
    const id = pending.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    universe.revisions.find((revision) => revision.id === id)?.parentIds.forEach((parent) => pending.push(parent));
  }
  return result;
}

export function planMerge(universe: MultiverseUniverse, sourceBranchId: string, targetBranchId = universe.activeBranchId): MergePlan {
  const source = headRevision(universe, sourceBranchId);
  const target = headRevision(universe, targetBranchId);
  if (!source || !target) throw new Error("Both timelines must have a valid head revision.");
  if (source.id === target.id) return { status: "identical", targetHead: target.id, sourceHead: source.id };
  const sourceAncestors = ancestors(universe, source.id);
  const targetAncestors = ancestors(universe, target.id);
  if (sourceAncestors.has(target.id)) return { status: "fast-forward", targetHead: target.id, sourceHead: source.id };
  if (targetAncestors.has(source.id)) return { status: "target-ahead", targetHead: target.id, sourceHead: source.id };
  const commonAncestorId = [...targetAncestors].find((id) => sourceAncestors.has(id));
  return { status: "diverged", targetHead: target.id, sourceHead: source.id, commonAncestorId };
}

export function applyFastForward(universe: MultiverseUniverse, sourceBranchId: string, targetBranchId = universe.activeBranchId, updatedAt = now()) {
  const plan = planMerge(universe, sourceBranchId, targetBranchId);
  if (plan.status !== "fast-forward") return { universe, plan };
  return { universe: { ...universe, branches: universe.branches.map((branch) => branch.id === targetBranchId ? { ...branch, headRevisionId: plan.sourceHead, updatedAt } : branch) }, plan };
}

export async function resolveDivergence(universe: MultiverseUniverse, sourceBranchId: string, selected: "source" | "target", targetBranchId = universe.activeBranchId, createdAt = now()) {
  const plan = planMerge(universe, sourceBranchId, targetBranchId);
  if (plan.status !== "diverged") throw new Error("These timelines are not divergent.");
  if (universe.revisions.length >= MULTIVERSE_REVISION_LIMIT) throw new Error(`This document reached the ${MULTIVERSE_REVISION_LIMIT}-revision safety limit.`);
  const chosen = universe.revisions.find((revision) => revision.id === (selected === "source" ? plan.sourceHead : plan.targetHead))!;
  const target = universe.branches.find((branch) => branch.id === targetBranchId)!;
  const mergeRevision = await createRevision(chosen.document, target.id, [plan.targetHead, plan.sourceHead], `Resolved divergence using ${selected} timeline`, createdAt);
  return { ...universe, revisions: [...universe.revisions, mergeRevision], branches: universe.branches.map((branch) => branch.id === targetBranchId ? { ...branch, headRevisionId: mergeRevision.id, updatedAt: createdAt } : branch) };
}

function textWords(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&\w+;/g, " ").trim().split(/\s+/).filter(Boolean);
}

function blockCount(html: string) {
  return (html.match(/<(?:h[1-6]|p|li|table|figure|blockquote)\b/gi) || []).length;
}

export function compareRevisions(left: MultiverseRevision, right: MultiverseRevision): RevisionComparison {
  const leftWords = textWords(left.document.html);
  const rightWords = textWords(right.document.html);
  const leftSet = new Set(leftWords.map((word) => word.toLowerCase()));
  const rightSet = new Set(rightWords.map((word) => word.toLowerCase()));
  const metadataChanges = (["title", "fileName", "language", "lmsProfile", "author", "description", "pageSetup"] as const).filter((key) => stableStringify(left.document[key]) !== stableStringify(right.document[key]));
  return { identical: left.contentHash === right.contentHash, wordsAdded: rightWords.filter((word) => !leftSet.has(word.toLowerCase())).length, wordsRemoved: leftWords.filter((word) => !rightSet.has(word.toLowerCase())).length, blocksAdded: Math.max(0, blockCount(right.document.html) - blockCount(left.document.html)), blocksRemoved: Math.max(0, blockCount(left.document.html) - blockCount(right.document.html)), metadataChanges };
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MULTIVERSE_DATABASE, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(MULTIVERSE_STORE)) request.result.createObjectStore(MULTIVERSE_STORE, { keyPath: "documentKey" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Multiverse storage could not be opened."));
    request.onblocked = () => reject(new Error("Multiverse storage is blocked by another tab."));
  });
}

async function withDocumentLock<T>(key: string, action: () => Promise<T>) {
  if (typeof navigator !== "undefined" && navigator.locks) return navigator.locks.request(`ultrapage-multiverse:${key}`, action);
  return action();
}

export async function loadUniverse(key: string): Promise<MultiverseUniverse | null> {
  const database = await openDatabase();
  try {
    const value = await new Promise<unknown>((resolve, reject) => { const request = database.transaction(MULTIVERSE_STORE, "readonly").objectStore(MULTIVERSE_STORE).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    return await verifyUniverse(value) ? value as MultiverseUniverse : null;
  } finally { database.close(); }
}

export async function saveUniverse(universe: MultiverseUniverse) {
  if (!(await verifyUniverse(universe))) throw new Error("The Multiverse integrity check failed.");
  return withDocumentLock(universe.documentKey, async () => {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => { const transaction = database.transaction(MULTIVERSE_STORE, "readwrite"); transaction.objectStore(MULTIVERSE_STORE).put(universe); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); });
    } finally { database.close(); }
  });
}

export async function updateUniverse(key: string, action: (current: MultiverseUniverse | null) => Promise<MultiverseUniverse>) {
  return withDocumentLock(key, async () => {
    const database = await openDatabase();
    try {
      const currentValue = await new Promise<unknown>((resolve, reject) => { const request = database.transaction(MULTIVERSE_STORE, "readonly").objectStore(MULTIVERSE_STORE).get(key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      const current = await verifyUniverse(currentValue) ? currentValue as MultiverseUniverse : null;
      const next = await action(current);
      if (next.documentKey !== key || !(await verifyUniverse(next))) throw new Error("The updated Multiverse failed its integrity check.");
      await new Promise<void>((resolve, reject) => { const transaction = database.transaction(MULTIVERSE_STORE, "readwrite"); transaction.objectStore(MULTIVERSE_STORE).put(next); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); });
      return next;
    } finally { database.close(); }
  });
}
