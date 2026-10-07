import assert from "node:assert/strict";
import test from "node:test";
import { CONTINUITY_CAPSULE_FORMAT, createContinuityCheckpoint, createRecoveryCapsule, documentKey, newestRecoveryCheckpoint, sha256, stableStringify, verifyContinuityCheckpoint, verifyRecoveryCapsule, type ContinuityDocument, type RecoveryCapsule } from "../lib/temporal-continuity.ts";

const document: ContinuityDocument = {
  html: "<h1>Module One</h1><p>Welcome.</p>",
  title: "Module One",
  fileName: "Module-One.html",
  language: "en-US",
  lmsProfile: "blackboard",
  author: "Eduardo Augusto García Rodríguez",
  description: "Course module",
  pageSetup: { size: "letter", orientation: "portrait", margin: "normal" },
};

test("stable serialization is independent of object key order", () => {
  assert.equal(stableStringify({ beta: 2, alpha: { delta: 4, gamma: 3 } }), stableStringify({ alpha: { gamma: 3, delta: 4 }, beta: 2 }));
});

test("content identity does not depend on checkpoint time", async () => {
  const first = await createContinuityCheckpoint(document, "2026-10-07T12:00:00.000Z", "first");
  const second = await createContinuityCheckpoint(document, "2026-10-07T12:05:00.000Z", "second");
  assert.equal(first.contentHash, second.contentHash);
  assert.notEqual(first.recoveryHash, second.recoveryHash);
});

test("checkpoint verification detects modified recovery content", async () => {
  const checkpoint = await createContinuityCheckpoint(document, "2026-10-07T12:00:00.000Z", "checkpoint");
  assert.equal(await verifyContinuityCheckpoint(checkpoint), true);
  checkpoint.document.html = "<h1>Modified without re-signing</h1>";
  assert.equal(await verifyContinuityCheckpoint(checkpoint), false);
});

test("recovery capsule verifies every checkpoint and its envelope", async () => {
  const checkpoint = await createContinuityCheckpoint(document, "2026-10-07T12:00:00.000Z", "checkpoint");
  const capsule = await createRecoveryCapsule([checkpoint], "2026-10-07T13:00:00.000Z");
  const result = await verifyRecoveryCapsule(capsule);
  assert.equal(result.valid, true);
  assert.equal(result.capsule?.format, CONTINUITY_CAPSULE_FORMAT);
});

test("capsule verification rejects envelope tampering and normalizes document keys", async () => {
  const checkpoint = await createContinuityCheckpoint(document, "2026-10-07T12:00:00.000Z", "checkpoint");
  const capsule = await createRecoveryCapsule([checkpoint], "2026-10-07T13:00:00.000Z");
  capsule.exportedAt = "2026-10-08T13:00:00.000Z";
  assert.equal((await verifyRecoveryCapsule(capsule)).valid, false);
  assert.equal(documentKey(document), "module-one.html");
  assert.equal(documentKey({ fileName: "INTRO.html" }), "intro.html");
});

test("capsule verification rejects malformed runtime fields even with recomputed hashes", async () => {
  const checkpoint = await createContinuityCheckpoint(document, "2026-10-07T12:00:00.000Z", "checkpoint");
  const forged = { ...checkpoint, createdAt: 123 } as unknown as typeof checkpoint;
  const forgedBase = { id: forged.id, documentKey: forged.documentKey, createdAt: forged.createdAt, contentHash: forged.contentHash, document: forged.document };
  forged.recoveryHash = await sha256(stableStringify(forgedBase));
  const base = { format: CONTINUITY_CAPSULE_FORMAT, version: 1 as const, exportedAt: "2026-10-07T13:00:00.000Z", checkpoints: [forged] };
  const capsule = { ...base, capsuleHash: await sha256(stableStringify(base)) } as RecoveryCapsule;
  assert.equal((await verifyRecoveryCapsule(capsule)).valid, false);
});

test("capsule recovery selects its newest checkpoint, not a newer local timeline", async () => {
  const older = await createContinuityCheckpoint({ ...document, title: "Older" }, "2026-10-06T12:00:00.000Z", "older");
  const newestInCapsule = await createContinuityCheckpoint({ ...document, title: "Recovered" }, "2026-10-07T12:00:00.000Z", "recovered");
  const capsule = await createRecoveryCapsule([older, newestInCapsule]);
  assert.equal(newestRecoveryCheckpoint(capsule)?.document.title, "Recovered");
});
