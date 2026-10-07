import assert from "node:assert/strict";
import test from "node:test";
import { createCourseDigitalTwin, type CourseTwinInput } from "../lib/course-digital-twin.ts";

const healthy: CourseTwinInput = {
  title: "Accessible course",
  generatedAt: "2026-10-07T12:00:00.000Z",
  fingerprint: "UP-TEST",
  sourceBytes: 18_000,
  embeddedAssetBytes: 40_000,
  externalAssets: 0,
  fixedWidthElements: 0,
  longParagraphs: 0,
  accessibilityScore: 100,
  learningScore: 92,
  journeyScores: { keyboard: 100, "screen-reader": 95, reflow: 100, cognitive: 90 },
  lmsScores: { universal: 100, blackboard: 100, canvas: 100, moodle: 100, brightspace: 100 },
};

test("produces five deterministic deployment scenarios", () => {
  const result = createCourseDigitalTwin(healthy);
  assert.equal(result.scenarios.length, 5);
  assert.equal(result.status, "stable");
  assert.equal(result.fingerprint, "UP-TEST");
  assert.ok(result.scenarios.every((scenario) => scenario.totalSignals === 5));
});

test("blocks a weak LMS and inaccessible journey", () => {
  const result = createCourseDigitalTwin({
    ...healthy,
    lmsScores: { ...healthy.lmsScores, blackboard: 35 },
    journeyScores: { ...healthy.journeyScores, reflow: 30 },
  });
  const blackboard = result.scenarios.find((scenario) => scenario.lms === "blackboard");
  assert.equal(result.status, "critical");
  assert.equal(blackboard?.status, "critical");
  assert.ok(blackboard?.risks.some((risk) => risk.startsWith("Critical:")));
});

test("penalizes heavy content on a constrained network", () => {
  const result = createCourseDigitalTwin({ ...healthy, embeddedAssetBytes: 6_000_000, externalAssets: 4 });
  const constrained = result.scenarios.filter((scenario) => scenario.network === "constrained");
  assert.ok(constrained.every((scenario) => scenario.estimatedLoadMs > 8_000));
  assert.ok(constrained.every((scenario) => scenario.recommendations.some((recommendation) => recommendation.includes("Compress"))));
});
