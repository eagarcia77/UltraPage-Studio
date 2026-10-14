import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const read = (path: string) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("CREVELIO vector mark has an original C/V shape rather than the retired orbit-and-star", async () => {
  const symbol = await read("public/brand/crevelio-mark.svg");
  const favicon = await read("public/favicon.svg");
  const lockup = await read("public/brand/crevelio-lockup.svg");
  assert.ok(symbol.includes("<title id=\"title\">CREVELIO</title>"));
  assert.match(symbol, /m202 229 61 71 95-107/);
  assert.doesNotMatch(symbol, /four-point light|four-point star/i);
  assert.ok(favicon.includes("CREVELIO C and ascending V"));
  assert.ok(lockup.includes("BY ZENQAVIO TECHNOLOGIES"));
  assert.ok(lockup.includes("CREVELIO"));
});

test("PWA and Apple PNGs are rasterized from the same CREVELIO SVG master", async () => {
  for (const [file, width] of [
    ["public/brand/crevelio-icon-192.png", 192],
    ["public/brand/crevelio-icon-512.png", 512],
    ["public/brand/apple-touch-icon.png", 180],
  ] as const) {
    const meta = await sharp(new URL("../" + file, import.meta.url).pathname).metadata();
    assert.equal(meta.format, "png", file);
    assert.equal(meta.width, width, file);
    assert.equal(meta.height, width, file);
  }
  const pkg = JSON.parse(await read("package.json"));
  assert.match(pkg.scripts.pretest, /generate-crevelio-assets\.mjs/);
  assert.match(pkg.scripts.prebuild, /generate-crevelio-assets\.mjs/);
  assert.match(pkg.scripts.predev, /generate-crevelio-assets\.mjs/);
});

test("current PWA and website use the custom CREVELIO assets and keep existing install identity", async () => {
  const sw = await read("public/sw.js");
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const layout = await read("app/layout.tsx");
  const readme = await read("README.md");
  assert.match(sw, /crevelio-v85/);
  assert.match(sw, /brand\/crevelio-lockup\.svg/);
  assert.ok(manifest.icons.some((icon: { src: string }) => icon.src === "/brand/crevelio-icon-192.png"));
  assert.ok(manifest.icons.some((icon: { src: string }) => icon.src === "/brand/crevelio-icon-512.png"));
  assert.equal(manifest.id, "/");
  assert.equal(manifest.scope, "/");
  assert.match(layout, /crevelio-icon-512\.png/);
  assert.match(layout, /apple-touch-icon\.png/);
  assert.match(readme, /crevelio-lockup\.svg/);
});
