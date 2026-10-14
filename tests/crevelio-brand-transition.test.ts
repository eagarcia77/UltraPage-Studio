import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL("../" + path, import.meta.url), "utf8");
const retiredProduct = ["Curralume", "Studio"].join(" ");
const owner = "Eduardo Augusto García Rodríguez";
const company = "ZENQAVIO Technologies";

test("CREVELIO is the consistent customer-facing product name across the app, exports and native LMS tools", async () => {
  const files = [
    "app/layout.tsx", "app/page.tsx", "app/help/layout.tsx", "app/help/page.tsx",
    "app/tools/page.tsx", "app/api/health/route.ts", "app/api/export/route.ts",
    "public/native-tools/manifest.json", "public/native-tools/estiloapa/index.html",
    "public/native-tools/txt-test-generator/index.html", "public/native-tools/qti-blackboard/index.html",
    "README.md", "COPYRIGHT.md", "public/favicon.svg",
  ];
  for (const p of files) {
    const text = await read(p);
    assert.ok(text.includes("CREVELIO"), p + " should use the new brand");
    assert.ok(!text.includes(retiredProduct), p + " must not display the previous brand");
  }
});

test("updated PWA branding reuses app identity while keeping old icon assets available", async () => {
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const sw = await read("public/sw.js");
  assert.equal(manifest.name, "CREVELIO");
  assert.equal(manifest.short_name, "CREVELIO");
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  assert.match(sw, /const VERSION = "crevelio-v85"/);
  for (const filename of ["crevelio-mark.svg", "crevelio-icon-192.png", "crevelio-icon-512.png"]) {
    await access(new URL("../public/brand/" + filename, import.meta.url));
    assert.ok(sw.includes("/brand/" + filename), "new brand asset missing from offline shell: " + filename);
  }
  await access(new URL("../public/brand/curralume-mark.svg", import.meta.url));
});

test("CREVELIO and ZENQAVIO documentation preserve creator copyright and commercial cautions", async () => {
  for (const p of ["README.md", "COPYRIGHT.md", "docs/CREVELIO_BRAND_2026-10-14.md"]) {
    const source = await read(p);
    assert.ok(source.includes("CREVELIO"));
    assert.ok(source.includes(company));
    assert.ok(source.includes(owner));
  }
  const decision = await read("docs/CREVELIO_BRAND_2026-10-14.md");
  assert.ok(decision.includes("**not** a formal trademark clearance"));
  assert.match(decision, /legacy icon aliases/);
  const npm = JSON.parse(await read("package.json"));
  const lock = JSON.parse(await read("package-lock.json"));
  assert.equal(npm.name, "crevelio");
  assert.equal(lock.name, npm.name);
  assert.equal(lock.packages[""].name, npm.name);
});

test("project imports retain legacy format identifiers so existing documents can still be opened", async () => {
  const main = await read("app/page.tsx");
  assert.match(main, /const DRAFT_KEY = "ultrapage-studio-draft-v1"/);
  assert.match(main, /project\.format !== "ultrapage-project"/);
  assert.match(main, /CREVELIO project restored/);
});
