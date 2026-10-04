import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import * as cheerio from "cheerio";

const root = process.cwd();
const html = await readFile(path.join(root, "public/native-tools/qti-blackboard/index.html"), "utf8");
const $ = cheerio.load(html);
const inlineScripts = $("script:not([src])").map((_, element) => $(element).html() || "").get();
const source = inlineScripts.at(-1) || "";
const core = source.slice(0, source.indexOf("let validationTimer = null;"));
const sandbox = { console, Blob, TextEncoder, Uint8Array, Uint32Array, DataView, Date, setTimeout, clearTimeout };
vm.createContext(sandbox);
vm.runInContext(`${core}\nglobalThis.__qtiAudit = { parseQuestionBlock, buildPackage, buildMoodleGift, toCanvasItems, createZipBlob };`, sandbox);
const api = sandbox.__qtiAudit;
const blocks = [
  `MC 1. Select one\nA. Wrong\n*B. Correct`,
  `MA 2. Select two\n*A. First\n*B. Second\nC. Wrong`,
  `TF 3. Statement\n*A. True\nB. False`,
  `FIB 4. Complete _____\n*answer\n*alternate`,
  `ESSAY 5. Explain the concept.`
];
const items = blocks.map((block, index) => ({ ...api.parseQuestionBlock(block, index), points: 2.5 }));
const files = api.buildPackage(items);

const failures = [];
const fail = (message) => failures.push(message);
if (Object.keys(files).length !== 6) fail(`expected 6 Blackboard package files, found ${Object.keys(files).length}`);
const manifest = cheerio.load(files["imsmanifest.xml"], { xmlMode: true });
if (manifest("resource").length !== 5) fail("manifest does not contain five item resources");
manifest("resource").each((_, resource) => {
  const href = manifest(resource).attr("href");
  if (!href || !files[href]) fail(`manifest resource is missing referenced file ${href || "(empty)"}`);
});
Object.entries(files).filter(([name]) => name.startsWith("items/")).forEach(([name, xml]) => {
  const item = cheerio.load(xml, { xmlMode: true });
  if (item("assessmentItem").length !== 1) fail(`${name} is not a QTI assessmentItem`);
  if (item('outcomeDeclaration[normalMaximum="2.5"]').length !== 1) fail(`${name} is missing points metadata`);
  if (item("responseProcessing").length) fail(`${name} includes optional responseProcessing that Blackboard skips`);
});
const multiple = cheerio.load(files["items/item2.xml"], { xmlMode: true });
if (multiple('responseDeclaration[cardinality="multiple"] correctResponse value').length !== 2) fail("MA item does not declare two correct responses with multiple cardinality");
if (multiple('choiceInteraction[maxChoices="2"]').length !== 1) fail("MA item does not limit choices to the expected count");
const gift = api.buildMoodleGift(items);
if (!gift.includes("~%50.00000%First") || !gift.includes("{TRUE}") || !gift.includes("=answer")) fail("Moodle GIFT conversion is missing MA, TF, or FIB syntax");
const canvasItems = api.toCanvasItems(items);
if (canvasItems.map((item) => item.type).join(",") !== "MC,MA,TF,FIB,ESS") fail("Canvas type mapping is incorrect");
const zipBytes = new Uint8Array(await api.createZipBlob(files).arrayBuffer());
if (zipBytes[0] !== 0x50 || zipBytes[1] !== 0x4b) fail("Blackboard package is not a ZIP archive");

if (failures.length) {
  console.error(`QTI 2.1 audit failed with ${failures.length} finding(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("✓ QTI 2.1 audit passed: MC/MA/TF/FIB/Essay parsing, Blackboard-safe response declarations, no optional responseProcessing, QTI 2.1 XML, points, manifest references, ZIP signature, Moodle GIFT, and Canvas mapping");
