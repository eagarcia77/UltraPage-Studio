import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeServerHtml } from "../lib/server-html-security.ts";

test("removes executable markup and event handlers", () => {
  const html = sanitizeServerHtml('<p onclick="steal()">Safe</p><script>alert(1)</script><img src="x" onerror="steal()">');
  assert.match(html, /<p>Safe<\/p>/);
  assert.doesNotMatch(html, /script|onclick|onerror/i);
});

test("rejects executable URLs and unsafe CSS", () => {
  const html = sanitizeServerHtml('<a href="javascript:alert(1)">Open</a><p style="background:url(javascript:alert(1))">Text</p>');
  assert.doesNotMatch(html, /javascript:/i);
  assert.doesNotMatch(html, /style=/i);
});

test("preserves safe links and embedded images", () => {
  const html = sanitizeServerHtml('<a href="https://example.edu/page">Course</a><img src="data:image/png;base64,iVBORw0KGgo=">');
  assert.match(html, /https:\/\/example\.edu\/page/);
  assert.match(html, /data:image\/png;base64/);
});
