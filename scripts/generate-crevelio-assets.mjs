/** CREVELIO first-party vector icon generation. © 2026 Eduardo Augusto García Rodríguez. */
import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = join(root, "public", "brand");
const file = join(directory, "crevelio-mark.svg");
const vector = await readFile(file);
const source = vector.toString("utf8");
if (!source.includes("<title id=\"title\">CREVELIO</title>") || !source.includes("m202 229 61 71 95-107")) {
  throw new Error("Invalid CREVELIO master icon: refuse to overwrite PWA assets.");
}
await mkdir(directory, { recursive: true });
for (const [name, size] of [["crevelio-icon-192.png", 192], ["crevelio-icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(vector, { density: 192 }).resize(size, size).png({ compressionLevel: 9 }).toFile(join(directory, name));
}
console.log("CREVELIO vector-derived PWA and Apple icons verified (192, 512, 180).");
