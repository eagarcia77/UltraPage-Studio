import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const nativeRoutes = [
  "/native-tools/estiloapa/",
  "/native-tools/estiloapa",
  "/native-tools/estiloapa/index.html",
  "/native-tools/txt-test-generator/",
  "/native-tools/qti-blackboard/",
];

async function findPort() {
  const socket = createServer();
  await new Promise((resolve, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

async function waitForServer(origin, child, getLog) {
  const expires = Date.now() + 30000;
  while (Date.now() < expires) {
    if (child.exitCode !== null) throw new Error(`Next.js exited early: ${getLog()}`);
    try {
      const response = await fetch(origin + "/tools", { signal: AbortSignal.timeout(2500) });
      if (response.ok) return;
    } catch {
      // Next.js is still starting up; retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Next.js did not start within 30 seconds: ${getLog()}`);
}

const port = await findPort();
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [
  "node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port),
], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
let logs = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => { logs = (logs + chunk.toString()).slice(-8000); });
}
try {
  await waitForServer(origin, child, () => logs);
  for (const route of nativeRoutes) {
    const response = await fetch(origin + route, { signal: AbortSignal.timeout(8000) });
    assert.equal(response.status, 200, `${route} returned HTTP ${response.status}`);
    assert.match(response.headers.get("content-type") || "", /text\/html/);
    const html = await response.text();
    assert.ok(html.toLowerCase().includes("<!doctype html>"), `${route}: missing HTML doctype`);
    if (route.includes("/estiloapa")) {
      assert.match(html, /<title>APA7 Academic Formatter<\/title>/);
      assert.match(html, /id="preview"/);
    }
    console.log(`✓ Native route ${route}: HTTP 200`);
  }
  const txtLayout = await fetch(origin + "/native-tools/txt-test-generator/txt-layout.css", {
    signal: AbortSignal.timeout(8000)
  });
  assert.equal(txtLayout.status, 200, "TXT Generator's self-contained mobile layout is not served");
  assert.match(txtLayout.headers.get("content-type") || "", /text\/css/);
  assert.match(await txtLayout.text(), /#quizContent/);
  console.log("✓ TXT Generator local mobile CSS: HTTP 200");
  const qtiLayout = await fetch(origin + "/native-tools/qti-blackboard/qti-layout.css", {
    signal: AbortSignal.timeout(8000)
  });
  assert.equal(qtiLayout.status, 200, "QTI 2.1 mobile layout is not served");
  assert.match(qtiLayout.headers.get("content-type") || "", /text\/css/);
  const qtiCss = await qtiLayout.text();
  assert.match(qtiCss, /qti-example-details/);
  assert.match(qtiCss, /minmax\(0, 1fr\)/);
  console.log("✓ QTI 2.1 local mobile CSS: HTTP 200");


  const helpResponse = await fetch(origin + "/help", { signal: AbortSignal.timeout(8000) });
  assert.equal(helpResponse.status, 200, "CREVELIO Help Center is not reachable");
  assert.match(helpResponse.headers.get("content-type") || "", /text\/html/);
  const helpHtml = await helpResponse.text();
  assert.ok(helpHtml.includes('help-search-input'), "Help search control is missing from the rendered page");
  assert.ok(helpHtml.includes('Centro de ayuda'), "Spanish Help content was not server-rendered");
  assert.ok(helpHtml.includes('© 2026 Eduardo Augusto García Rodríguez'), "Owner attribution is missing from Help");
  console.log("✓ CREVELIO bilingual Help Center: HTTP 200");
  console.log("✓ Short native URLs resolve to standalone editors in production build");
} finally {
  if (child.exitCode === null) {
    await new Promise((resolve) => {
      child.once("exit", resolve);
      child.kill("SIGTERM");
    });
  }
}
