import assert from "node:assert/strict";
import test from "node:test";
import { CONTINUITY_CAPSULE_FORMAT, createContinuityCheckpoint, createRecoveryCapsule, documentKey, stableStringify, verifyContinuityCheckpoint, verifyRecoveryCapsule, type ContinuityDocument } from "../lib/temporal-continuity.ts";

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
});
