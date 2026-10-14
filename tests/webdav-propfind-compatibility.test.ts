import assert from "node:assert/strict";
import test from "node:test";
import { inspectWebDavTarget, parseDepthZeroDavMetadata } from "../app/api/webdav/inspection.ts";
import { canSafelyReplaceWebDav, conditionalWebDavHeaders } from "../app/api/webdav/overwrite-guard.ts";

const url = new URL("https://example.edu/bbcswebdav/courses/test/documento.html");
const httpDate = "Wed, 14 Oct 2026 12:00:00 GMT";
const webdavXml = (props: string, status = 200) => `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:"><d:response><d:href>/bbcswebdav/courses/test/documento.html</d:href>
<d:propstat><d:prop>${props}</d:prop><d:status>HTTP/1.1 ${status} OK</d:status></d:propstat>
</d:response></d:multistatus>`;

function mockFetch(...responses: Response[]) {
  const calls: Array<{ method: string; headers: Headers; redirect?: RequestRedirect; body?: BodyInit | null }> = [];
  const fake = (async (_url: URL | string | Request, init?: RequestInit) => {
    calls.push({
      method: init?.method || "GET",
      headers: new Headers(init?.headers),
      redirect: init?.redirect,
      body: init?.body,
    });
    const next = responses.shift();
    if (!next) throw new Error("Unexpected additional remote request");
    return next;
  }) as typeof fetch;
  return { fake, calls };
}

test("standard HEAD + strong ETag returns without a second request", async () => {
  const { fake, calls } = mockFetch(new Response(null, {
    status: 200, headers: { ETag: '"abc-1"', "Last-Modified": httpDate },
  }));
  const remote = await inspectWebDavTarget(url, "Basic test", fake);
  assert.deepEqual(remote, { exists: true, etag: '"abc-1"', lastModified: httpDate });
  assert.deepEqual(conditionalWebDavHeaders(remote, { overwrite: true, expectedETag: '"abc-1"' }), {
    "If-Match": '"abc-1"',
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "HEAD");
  assert.equal(calls[0].redirect, "manual");
});

test("HEAD 405 falls back to safe WebDAV PROPFIND Depth:0", async () => {
  const { fake, calls } = mockFetch(
    new Response(null, { status: 405 }),
    new Response(webdavXml("<d:getetag>&quot;rev-7&quot;</d:getetag><d:getlastmodified>" + httpDate + "</d:getlastmodified>"), { status: 207 }),
  );
  const remote = await inspectWebDavTarget(url, "Basic test", fake);
  assert.equal(remote.etag, '"rev-7"');
  assert.equal(canSafelyReplaceWebDav(remote), true);
  assert.deepEqual(calls.map((call) => call.method), ["HEAD", "PROPFIND"]);
  assert.equal(calls[1].headers.get("Depth"), "0");
  assert.equal(calls[1].headers.get("Authorization"), "Basic test");
  assert.match(String(calls[1].body), /getetag/);
  assert.equal(calls[1].redirect, "manual");
});

test("HEAD 501 can fall back to Last-Modified when ETag is weak", async () => {
  const { fake } = mockFetch(
    new Response(null, { status: 501 }),
    new Response(webdavXml("<getetag>W/&quot;weak-1&quot;</getetag><getlastmodified>" + httpDate + "</getlastmodified>"), { status: 207 }),
  );
  const remote = await inspectWebDavTarget(url, "Basic test", fake);
  assert.deepEqual(conditionalWebDavHeaders(remote, {
    overwrite: true, expectedLastModified: httpDate,
  }), { "If-Unmodified-Since": httpDate });
});

test("HEAD without usable metadata uses PROPFIND rather than pretending it is safe", async () => {
  const { fake, calls } = mockFetch(
    new Response(null, { status: 200 }),
    new Response(webdavXml("<d:getetag>&quot;found&quot;</d:getetag>"), { status: 207 }),
  );
  const remote = await inspectWebDavTarget(url, "Basic test", fake);
  assert.equal(remote.etag, '"found"');
  assert.equal(calls.length, 2);
});

test("missing remote resource stays create-only when PROPFIND returns 404", async () => {
  const { fake } = mockFetch(new Response(null, { status: 405 }), new Response(null, { status: 404 }));
  const remote = await inspectWebDavTarget(url, "Basic test", fake);
  assert.deepEqual(remote, { exists: false, etag: null, lastModified: null });
  assert.deepEqual(conditionalWebDavHeaders(remote, {}), { "If-None-Match": "*" });
});

test("missing version validators never authorize replacing a remote file", async () => {
  const { fake } = mockFetch(
    new Response(null, { status: 405 }),
    new Response(webdavXml("<d:getetag/>"), { status: 207 }),
  );
  const remote = await inspectWebDavTarget(url, "Basic test", fake);
  assert.equal(remote.exists, true);
  assert.equal(canSafelyReplaceWebDav(remote), false);
  assert.throws(() => conditionalWebDavHeaders(remote, { overwrite: true }), /Save under another name/);
});

test("authentication, malformed metadata and redirects fail closed", async () => {
  for (const code of [401, 403, 302, 500]) {
    const { fake, calls } = mockFetch(new Response(null, { status: code }));
    await assert.rejects(() => inspectWebDavTarget(url, "Basic test", fake));
    assert.equal(calls.length, 1);
  }
  const { fake: malformed } = mockFetch(
    new Response(null, { status: 405 }),
    new Response("<d:multistatus/>", { status: 207 }),
  );
  await assert.rejects(() => inspectWebDavTarget(url, "Basic test", malformed), /incomplete/);
  assert.throws(() => parseDepthZeroDavMetadata(webdavXml("<d:getetag/>", 404)), /did not confirm/);
});

test("oversized metadata responses are rejected without permitting a write", async () => {
  const { fake } = mockFetch(
    new Response(null, { status: 405 }),
    new Response(webdavXml("<d:getetag/>"), { status: 207, headers: { "Content-Length": "70000" } }),
  );
  await assert.rejects(() => inspectWebDavTarget(url, "Basic test", fake), /too much WebDAV metadata/);
});
