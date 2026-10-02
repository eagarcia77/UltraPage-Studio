import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRED_GROUPS = ['File', 'Document', 'Authoring', 'Review', 'Report', 'Preview', 'Export'];
const EXPECTED_TOOLS = [
  { id: 'estiloapa', name: 'EstiloAPA', html: 'public/native-tools/estiloapa/index.html', expectedRibbonAreas: 3 },
  { id: 'txt-test-generator', name: 'TXT Test Generator', html: 'public/native-tools/txt-test-generator/index.html', expectedRibbonAreas: 1 },
  { id: 'qti-blackboard', name: 'QTI 2.1 Blackboard', html: 'public/native-tools/qti-blackboard/index.html', expectedRibbonAreas: 3 },
];

function read(relativePath) {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function fail(message) {
  failures.push(message);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function collectMatches(html, regex) {
  const values = [];
  for (const match of html.matchAll(regex)) values.push(match[1]);
  return values;
}

const failures = [];
const warnings = [];
const manifestPath = 'public/native-tools/manifest.json';

if (!existsSync(path.join(ROOT, manifestPath))) {
  fail(`Missing ${manifestPath}`);
} else {
  const manifest = JSON.parse(read(manifestPath));
  if (manifest?.policy?.sourceRepositoriesAreModified !== false) {
    fail('Manifest must preserve sourceRepositoriesAreModified=false.');
  }
  if (!manifest?.audit?.ribbonUnified) {
    warnings.push('Manifest audit.ribbonUnified is not true.');
  }
  for (const tool of EXPECTED_TOOLS) {
    if (!manifest.tools?.some((entry) => entry.id === tool.id)) {
      fail(`Manifest is missing tool ${tool.id}.`);
    }
  }
}

for (const tool of EXPECTED_TOOLS) {
  const absolute = path.join(ROOT, tool.html);
  if (!existsSync(absolute)) {
    fail(`${tool.name}: missing ${tool.html}`);
    continue;
  }

  const html = read(tool.html);
  const ids = collectMatches(html, /\bid=["']([^"']+)["']/gi);
  const duplicateIds = duplicateValues(ids);
  if (duplicateIds.length) fail(`${tool.name}: duplicate HTML ids: ${duplicateIds.join(', ')}`);

  const buttons = collectMatches(html, /<button\b[^>]*(?:aria-label|title|data-command|id)=["']([^"']+)["'][^>]*>/gi);
  const duplicateButtons = duplicateValues(buttons.map((value) => value.trim().toLowerCase()));
  if (duplicateButtons.length) fail(`${tool.name}: duplicate button identifiers: ${duplicateButtons.join(', ')}`);

  const missingGroups = REQUIRED_GROUPS.filter((group) => !html.toLowerCase().includes(group.toLowerCase()));
  if (missingGroups.length) warnings.push(`${tool.name}: ribbon groups not found literally: ${missingGroups.join(', ')}`);

  if (/validate bank/i.test(html) && /run preflight/i.test(html)) {
    fail(`${tool.name}: Validate bank still appears alongside Run preflight.`);
  }

  if (!/aria-label|aria-labelledby|role=/i.test(html)) {
    warnings.push(`${tool.name}: limited accessibility landmarks detected.`);
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  requiredGroups: REQUIRED_GROUPS,
  checkedTools: EXPECTED_TOOLS.map((tool) => tool.id),
  failures,
  warnings,
  status: failures.length === 0 ? 'passed' : 'failed',
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  process.exitCode = 1;
}
