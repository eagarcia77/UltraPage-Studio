export const CONTINUITY_DATABASE = "ultrapage-temporal-continuity-v1";
export const CONTINUITY_STORE = "checkpoints";
export const CONTINUITY_CAPSULE_FORMAT = "ultrapage-recovery-capsule";
export const CONTINUITY_CAPSULE_VERSION = 1;
export const CONTINUITY_CHECKPOINT_LIMIT = 50;

export type ContinuityDocument = {
  html: string;
  title: string;
  fileName: string;
  language: "es-PR" | "en-US";
  lmsProfile: string;
  author: string;
  description: string;
  pageSetup: { size: string; orientation: string; margin: string };
};

export type ContinuityCheckpoint = {
  id: string;
  documentKey: string;
  createdAt: string;
  contentHash: string;
  recoveryHash: string;
  document: ContinuityDocument;
};

export type RecoveryCapsule = {
  format: typeof CONTINUITY_CAPSULE_FORMAT;
  version: typeof CONTINUITY_CAPSULE_VERSION;
  exportedAt: string;
  checkpoints: ContinuityCheckpoint[];
  capsuleHash: string;
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stableValue(entry)]));
  }
  return value;
}

export function stableStringify(value: unknown) {
  return JSON.stringify(stableValue(value));
}

export async function sha256(value: string) {
  if (!globalThis.crypto?.subtle) throw new Error("SHA-256 is unavailable in this browser context.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function documentKey(document: Pick<ContinuityDocument, "fileName">) {
  return document.fileName.trim().toLocaleLowerCase() || "untitled-document";
}

export async function createContinuityCheckpoint(document: ContinuityDocument, createdAt = new Date().toISOString(), id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`): Promise<ContinuityCheckpoint> {
  const contentHash = await sha256(stableStringify(document));
  const checkpointBase = { id, documentKey: documentKey(document), createdAt, contentHash, document };
  return { ...checkpointBase, recoveryHash: await sha256(stableStringify(checkpointBase)) };
}

export async function verifyContinuityCheckpoint(checkpoint: ContinuityCheckpoint) {
  if (!checkpoint || typeof checkpoint !== "object" || typeof checkpoint.document?.html !== "string") return false;
  const contentHash = await sha256(stableStringify(checkpoint.document));
  if (contentHash !== checkpoint.contentHash || documentKey(checkpoint.document) !== checkpoint.documentKey) return false;
  const checkpointBase = { id: checkpoint.id, documentKey: checkpoint.documentKey, createdAt: checkpoint.createdAt, contentHash: checkpoint.contentHash, document: checkpoint.document };
  return await sha256(stableStringify(checkpointBase)) === checkpoint.recoveryHash;
}

export async function createRecoveryCapsule(checkpoints: ContinuityCheckpoint[], exportedAt = new Date().toISOString()): Promise<RecoveryCapsule> {
  const base = { format: CONTINUITY_CAPSULE_FORMAT, version: CONTINUITY_CAPSULE_VERSION, exportedAt, checkpoints } as const;
  return { ...base, capsuleHash: await sha256(stableStringify(base)) };
}

export async function verifyRecoveryCapsule(value: unknown): Promise<{ valid: boolean; capsule?: RecoveryCapsule; reason?: string }> {
  if (!value || typeof value !== "object") return { valid: false, reason: "The recovery capsule is not an object." };
  const capsule = value as RecoveryCapsule;
  if (capsule.format !== CONTINUITY_CAPSULE_FORMAT || capsule.version !== CONTINUITY_CAPSULE_VERSION || !Array.isArray(capsule.checkpoints) || typeof capsule.exportedAt !== "string" || typeof capsule.capsuleHash !== "string") {
    return { valid: false, reason: "The recovery capsule format or version is not supported." };
  }
  if (!capsule.checkpoints.length || capsule.checkpoints.length > CONTINUITY_CHECKPOINT_LIMIT) return { valid: false, reason: "The recovery capsule contains an invalid number of checkpoints." };
  const base = { format: capsule.format, version: capsule.version, exportedAt: capsule.exportedAt, checkpoints: capsule.checkpoints };
  if (await sha256(stableStringify(base)) !== capsule.capsuleHash) return { valid: false, reason: "The recovery capsule fingerprint does not match its contents." };
  for (const checkpoint of capsule.checkpoints) {
    if (!(await verifyContinuityCheckpoint(checkpoint))) return { valid: false, reason: "A checkpoint failed its SHA-256 integrity check." };
  }
  return { valid: true, capsule };
}

function openContinuityDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CONTINUITY_DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CONTINUITY_STORE)) {
        const store = database.createObjectStore(CONTINUITY_STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("documentKey", "documentKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("The continuity database could not be opened."));
    request.onblocked = () => reject(new Error("The continuity database is blocked by another tab."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("The continuity operation failed."));
  });
}

export async function listContinuityCheckpoints(): Promise<ContinuityCheckpoint[]> {
  const database = await openContinuityDatabase();
  try {
    const transaction = database.transaction(CONTINUITY_STORE, "readonly");
    const checkpoints = await requestResult(transaction.objectStore(CONTINUITY_STORE).getAll()) as ContinuityCheckpoint[];
    return checkpoints.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } finally { database.close(); }
}

export async function storeContinuityCheckpoint(checkpoint: ContinuityCheckpoint): Promise<{ stored: boolean; checkpoints: ContinuityCheckpoint[] }> {
  if (!(await verifyContinuityCheckpoint(checkpoint))) throw new Error("The checkpoint failed its integrity check.");
  const existing = await listContinuityCheckpoints();
  if (existing[0]?.contentHash === checkpoint.contentHash && existing[0]?.documentKey === checkpoint.documentKey) return { stored: false, checkpoints: existing };
  const database = await openContinuityDatabase();
  try {
    const transaction = database.transaction(CONTINUITY_STORE, "readwrite");
    const store = transaction.objectStore(CONTINUITY_STORE);
    store.put(checkpoint);
    existing.slice(CONTINUITY_CHECKPOINT_LIMIT - 1).forEach((entry) => store.delete(entry.id));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("The checkpoint transaction failed."));
      transaction.onabort = () => reject(transaction.error || new Error("The checkpoint transaction was aborted."));
    });
  } finally { database.close(); }
  return { stored: true, checkpoints: [checkpoint, ...existing].slice(0, CONTINUITY_CHECKPOINT_LIMIT) };
}

export async function importRecoveryCapsule(capsule: RecoveryCapsule) {
  const verification = await verifyRecoveryCapsule(capsule);
  if (!verification.valid) throw new Error(verification.reason || "The recovery capsule is invalid.");
  const database = await openContinuityDatabase();
  try {
    const transaction = database.transaction(CONTINUITY_STORE, "readwrite");
    const store = transaction.objectStore(CONTINUITY_STORE);
    capsule.checkpoints.forEach((checkpoint) => store.put(checkpoint));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("The recovery capsule could not be imported."));
      transaction.onabort = () => reject(transaction.error || new Error("The recovery capsule import was aborted."));
    });
  } finally { database.close(); }
  const all = await listContinuityCheckpoints();
  const databaseForPruning = await openContinuityDatabase();
  try {
    const transaction = databaseForPruning.transaction(CONTINUITY_STORE, "readwrite");
    all.slice(CONTINUITY_CHECKPOINT_LIMIT).forEach((checkpoint) => transaction.objectStore(CONTINUITY_STORE).delete(checkpoint.id));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Imported checkpoints could not be pruned."));
      transaction.onabort = () => reject(transaction.error || new Error("Checkpoint pruning was aborted."));
    });
  } finally { databaseForPruning.close(); }
  return all.slice(0, CONTINUITY_CHECKPOINT_LIMIT);
}
