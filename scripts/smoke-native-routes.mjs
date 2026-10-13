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
  console.log("✓ Short native URLs resolve to standalone editors in production build");
} finally {
  if (child.exitCode === null) {
    await new Promise((resolve) => {
      child.once("exit", resolve);
      child.kill("SIGTERM");
    });
  }
}
