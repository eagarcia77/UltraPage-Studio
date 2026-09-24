import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const importedAt = new Date().toISOString();
const manifestPath = path.join(root, "public/native-tools/manifest.json");

const apaAssets = [
  "index.html",
  "styles.css",
  "scrollbar-v31.css",
  "app.js",
  "edit-stability-v348.js",
  "enhancements.js",
  "pdf-smart.js",
  "apa-table-v29.js",
  "module-profile.js",
  "thesis-profile.js",
  "thesis-alignment.js",
  "apa-editor-v30.js",
  "list-normalizer-v31.js",
  "table-figure-v32.js",
  "pdf-original-media-v33.js",
  "reference-audit-v30.js",
  "apa-editor-export-v30.js",
  "thesis-html.js",
  "thesis-docx.js",
  "html-enhance.js",
  "docx-enhance.js"
];

const sources = [
  ...apaAssets.map((asset) => ({
    toolId: "estiloapa",
    url: `https://raw.githubusercontent.com/eagarcia77/estiloAPA/main/${asset}`,
    destination: `public/native-tools/estiloapa/${asset}`,
    theme: asset === "index.html" ? "ultrapage-theme.css" : null
  })),
  {
    toolId: "txt-test-generator",
    url: "https://raw.githubusercontent.com/eagarcia77/CTEL-SG/main/index_generator.html",
    destination: "public/native-tools/txt-test-generator/index.html",
    theme: "../ultrapage-native-theme.css"
  },
  {
    toolId: "qti-blackboard",
    url: "https://raw.githubusercontent.com/eagarcia77/CTEL-SG/main/QTI21_BlackboardV3.html",
    destination: "public/native-tools/qti-blackboard/index.html",
    theme: "../ultrapage-native-theme.css"
  }
];

function addTheme(html, href) {
  if (!href || html.includes(href)) return html;
  const tag = `  <link rel="stylesheet" href="${href}" data-ultrapage-native-theme>\n`;
  return /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${tag}</head>`)
    : `${tag}${html}`;
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: { "User-Agent": "UltraPage-Studio-native-tools-sync" }
  });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${source.url}: ${response.status} ${response.statusText}`);
  }

  const original = await response.text();
  const output = addTheme(original, source.theme);
  const destination = path.join(root, source.destination);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, output, "utf8");

  return {
    toolId: source.toolId,
    destination: source.destination,
    sourceUrl: source.url,
    sourceSha256: sha256(original),
    copiedSha256: sha256(output)
  };
}

const results = [];
for (const source of sources) {
  results.push(await fetchSource(source));
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.syncedAt = importedAt;
manifest.lastSync = {
  workflow: ".github/workflows/sync-native-tools.yml",
  sourceRepositoriesModified: false,
  files: results
};
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`Synchronized ${results.length} native-tool files at ${importedAt}.`);
