/* Curralume Studio · © 2026 Eduardo Augusto García Rodríguez · Original contributions and integrations; third-party licenses preserved. */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const vendorDir = path.join(root, "public", "vendor");
const browserLibraries = [
  ["node_modules/mammoth/mammoth.browser.min.js", "mammoth.browser.min.js"],
  ["node_modules/docx/dist/index.iife.js", "docx.iife.js"],
  ["node_modules/pdfjs-dist/build/pdf.mjs", "pdf.mjs"],
  ["node_modules/pdfjs-dist/build/pdf.worker.mjs", "pdf.worker.mjs"],
];

await mkdir(vendorDir, { recursive: true });
for (const [source, destination] of browserLibraries) {
  await copyFile(path.join(root, source), path.join(vendorDir, destination));
}

console.log(`Synced ${browserLibraries.length} browser libraries to public/vendor.`);
