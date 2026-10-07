export type TwinStatus = "stable" | "review" | "critical";
export type TwinLmsProfile = "universal" | "blackboard" | "canvas" | "moodle" | "brightspace";
export type TwinDevice = "desktop" | "tablet" | "mobile";
export type TwinNetwork = "campus" | "broadband" | "constrained";
export type TwinPerspective = "standard" | "keyboard" | "screen-reader" | "reflow" | "cognitive";

export type CourseTwinInput = {
  title: string;
  generatedAt: string;
  fingerprint: string;
  sourceBytes: number;
  embeddedAssetBytes: number;
  externalAssets: number;
  fixedWidthElements: number;
  longParagraphs: number;
  accessibilityScore: number;
  learningScore: number;
  journeyScores: Record<Exclude<TwinPerspective, "standard">, number>;
  lmsScores: Record<TwinLmsProfile, number>;
};

export type CourseTwinScenario = {
  id: string;
  label: string;
  lms: TwinLmsProfile;
  device: TwinDevice;
  network: TwinNetwork;
  perspective: TwinPerspective;
  score: number;
  status: TwinStatus;
  estimatedLoadMs: number;
  survivingSignals: number;
  totalSignals: number;
  risks: string[];
  recommendations: string[];
};

export type CourseDigitalTwinResult = {
  schema: "ultrapage-course-digital-twin/v1";
  generatedAt: string;
  title: string;
  fingerprint: string;
  score: number;
  status: TwinStatus;
  scenarios: CourseTwinScenario[];
  criticalScenarioIds: string[];
  systemicRisks: string[];
  notice: string;
};

type ScenarioDefinition = Omit<CourseTwinScenario, "score" | "status" | "estimatedLoadMs" | "survivingSignals" | "totalSignals" | "risks" | "recommendations">;

const scenarios: ScenarioDefinition[] = [
  { id: "blackboard-mobile-constrained", label: "Blackboard field learner", lms: "blackboard", device: "mobile", network: "constrained", perspective: "reflow" },
  { id: "canvas-keyboard-broadband", label: "Canvas keyboard navigator", lms: "canvas", device: "desktop", network: "broadband", perspective: "keyboard" },
  { id: "moodle-screen-reader-campus", label: "Moodle assistive reader", lms: "moodle", device: "desktop", network: "campus", perspective: "screen-reader" },
  { id: "brightspace-tablet-cognitive", label: "Brightspace focused study", lms: "brightspace", device: "tablet", network: "broadband", perspective: "cognitive" },
  { id: "universal-mobile-constrained", label: "Universal low-bandwidth learner", lms: "universal", device: "mobile", network: "constrained", perspective: "standard" },
];

const networkBytesPerSecond: Record<TwinNetwork, number> = {
  campus: 8_000_000,
  broadband: 1_500_000,
  constrained: 187_500,
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusFor(score: number, risks: string[]): TwinStatus {
  if (score < 60 || risks.some((risk) => risk.startsWith("Critical:"))) return "critical";
  return score < 82 || risks.length ? "review" : "stable";
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function createCourseDigitalTwin(input: CourseTwinInput): CourseDigitalTwinResult {
  const totalBytes = Math.max(0, input.sourceBytes + input.embeddedAssetBytes);
  const results = scenarios.map<CourseTwinScenario>((definition) => {
    const risks: string[] = [];
    const recommendations: string[] = [];
    const lmsScore = clamp(input.lmsScores[definition.lms]);
    const perspectiveScore = definition.perspective === "standard"
      ? clamp((input.accessibilityScore + input.learningScore) / 2)
      : clamp(input.journeyScores[definition.perspective]);
    const devicePenalty = definition.device === "mobile" ? Math.min(22, input.fixedWidthElements * 7) : definition.device === "tablet" ? Math.min(12, input.fixedWidthElements * 4) : 0;
    const cognitivePenalty = definition.perspective === "cognitive" ? Math.min(20, input.longParagraphs * 5) : 0;
    const estimatedLoadMs = Math.round(180 + totalBytes / networkBytesPerSecond[definition.network] * 1000 + input.externalAssets * (definition.network === "constrained" ? 420 : 110));
    const loadPenalty = estimatedLoadMs > 8_000 ? 30 : estimatedLoadMs > 4_000 ? 18 : estimatedLoadMs > 2_500 ? 8 : 0;

    if (lmsScore < 60) risks.push(`Critical: ${definition.lms} conversion loses essential signals.`);
    else if (lmsScore < 82) risks.push(`${definition.lms} output requires targeted review.`);
    if (perspectiveScore < 60) risks.push(`Critical: the ${definition.perspective} journey contains substantial barriers.`);
    else if (perspectiveScore < 82) risks.push(`The ${definition.perspective} journey needs review.`);
    if (devicePenalty) risks.push(`${input.fixedWidthElements} fixed-width element${input.fixedWidthElements === 1 ? "" : "s"} may obstruct ${definition.device} reflow.`);
    if (loadPenalty >= 18) risks.push(`${Math.round(totalBytes / 1024)} KB plus ${input.externalAssets} external asset${input.externalAssets === 1 ? "" : "s"} may delay constrained access.`);
    if (cognitivePenalty) risks.push(`${input.longParagraphs} dense paragraph${input.longParagraphs === 1 ? "" : "s"} may increase cognitive load.`);

    if (lmsScore < 82) recommendations.push(`Repair the ${definition.lms} preflight signals before publication.`);
    if (perspectiveScore < 82) recommendations.push(`Review the ${definition.perspective} evidence in Learner Simulator.`);
    if (devicePenalty) recommendations.push("Replace fixed pixel widths with responsive max-width or percentage sizing.");
    if (loadPenalty) recommendations.push("Compress embedded media and provide lightweight alternatives for slow connections.");
    if (cognitivePenalty) recommendations.push("Split dense paragraphs into titled, sequenced learning blocks.");

    const score = clamp(lmsScore * .42 + perspectiveScore * .38 + input.learningScore * .2 - devicePenalty - cognitivePenalty - loadPenalty);
    const totalSignals = 5;
    const survivingSignals = [lmsScore >= 82, perspectiveScore >= 82, devicePenalty === 0, loadPenalty === 0, cognitivePenalty === 0].filter(Boolean).length;
    return { ...definition, score, status: statusFor(score, risks), estimatedLoadMs, survivingSignals, totalSignals, risks: unique(risks), recommendations: unique(recommendations) };
  });

  const score = clamp(results.reduce((total, scenario) => total + scenario.score, 0) / results.length);
  const criticalScenarioIds = results.filter((scenario) => scenario.status === "critical").map((scenario) => scenario.id);
  const systemicRisks = unique(results.flatMap((scenario) => scenario.risks)).filter((risk) => results.filter((scenario) => scenario.risks.includes(risk)).length > 1);
  return {
    schema: "ultrapage-course-digital-twin/v1",
    generatedAt: input.generatedAt,
    title: input.title,
    fingerprint: input.fingerprint,
    score,
    status: criticalScenarioIds.length ? "critical" : score >= 82 && results.every((scenario) => scenario.status === "stable") ? "stable" : "review",
    scenarios: results,
    criticalScenarioIds,
    systemicRisks,
    notice: "This deterministic local simulation predicts structural risk. It does not reproduce proprietary LMS rendering or replace testing with learners and assistive technologies.",
  };
}
