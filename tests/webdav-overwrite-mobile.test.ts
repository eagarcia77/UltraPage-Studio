import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canSafelyReplaceWebDav,
  conditionalWebDavHeaders,
  isStrongWebDavETag,
  WebDavWriteConflict,
} from "../app/api/webdav/overwrite-guard.ts";

const missing = { exists: false, etag: null, lastModified: null };
const versioned = { exists: true, etag: '"revision-1"', lastModified: "Wed, 14 Oct 2026 12:00:00 GMT" };
const dated = { exists: true, etag: null, lastModified: "Wed, 14 Oct 2026 12:00:00 GMT" };

test("new WebDAV files use an atomic create-only condition", () => {
  assert.deepEqual(conditionalWebDavHeaders(missing, {}), { "If-None-Match": "*" });
  assert.deepEqual(conditionalWebDavHeaders(missing, { overwrite: true }), { "If-None-Match": "*" });
});

test("existing files require explicit replace confirmation", () => {
  assert.throws(() => conditionalWebDavHeaders(versioned, {}), WebDavWriteConflict);
  assert.throws(() => conditionalWebDavHeaders(versioned, { overwrite: false, expectedETag: '"revision-1"' }), WebDavWriteConflict);
});

test("strong ETag replacement is conditional on the inspected version", () => {
  assert.equal(isStrongWebDavETag('"revision-1"'), true);
  assert.equal(isStrongWebDavETag('W/"weak"'), false);
  assert.deepEqual(conditionalWebDavHeaders(versioned, { overwrite: true, expectedETag: '"revision-1"' }), { "If-Match": '"revision-1"' });
  assert.throws(() => conditionalWebDavHeaders(versioned, { overwrite: true, expectedETag: '"revision-old"' }), /changed since/);
});

test("Last-Modified fallback guards servers without a strong ETag", () => {
  assert.deepEqual(conditionalWebDavHeaders(dated, { overwrite: true, expectedLastModified: dated.lastModified }),
    { "If-Unmodified-Since": dated.lastModified });
  assert.throws(() => conditionalWebDavHeaders(dated, { overwrite: true, expectedLastModified: "Wed, 14 Oct 2026 11:00:00 GMT" }), WebDavWriteConflict);
  const weak = { ...dated, etag: 'W/"weak"' };
  assert.deepEqual(conditionalWebDavHeaders(weak, { overwrite: true, expectedLastModified: dated.lastModified }),
    { "If-Unmodified-Since": dated.lastModified });
});

test("missing validators prevent unsafe replacements", () => {
  const noValidator = { exists: true, etag: null, lastModified: null };
  assert.equal(canSafelyReplaceWebDav(noValidator), false);
  assert.equal(canSafelyReplaceWebDav(versioned), true);
  assert.equal(canSafelyReplaceWebDav(dated), true);
  assert.throws(() => conditionalWebDavHeaders(noValidator, { overwrite: true }), /Save under another name/);
});

test("both API and editor enforce remote inspections and write consent", async () => {
  const route = await readFile(new URL("../app/api/webdav/route.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(route, /action === "inspect"/);
  const inspection = await readFile(new URL("../app/api/webdav/inspection.ts", import.meta.url), "utf8");
  assert.match(route, /from "\.\/inspection"/);
  assert.match(inspection, /method: "HEAD"/);
  assert.match(inspection, /method: "PROPFIND"/);
  assert.match(route, /conditionalWebDavHeaders\(snapshot, body\)/);
  assert.match(route, /\[409, 412, 423, 428\]/);
  assert.match(route, /headers: \{ Authorization: authorization, "Content-Type": contentType, \.\.\.writeConditions \}/);
  assert.match(page, /const inspectRemoteFile = async/);
  assert.match(page, /action: "inspect"/);
  assert.match(page, /window\.confirm/);
  assert.match(page, /expectedETag: version\.etag/);
  assert.match(page, /expectedLastModified: version\.lastModified/);
  assert.match(page, /const writeConsent =/);
});

test("iPhone WebDAV dialog is contained without hiding essential controls", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Content Collection: safe, usable controls/);
  assert.match(css, /width: min\(680px, calc\(100vw - 24px\)\) !important/);
  assert.match(css, /max-height: calc\(100dvh - 24px\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /font-size: 16px/);
});
