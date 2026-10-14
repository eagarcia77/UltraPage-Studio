import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

const read = (name: string) => readFile(new URL("../" + name, import.meta.url), "utf8");

function workerHarness(source: string) {
  const handlers = new Map<string, (event: any) => void>();
  let offline = false;
  let refuseCache = false;
  const cached = new Map<string, string>();
  const writes: string[] = [];
  const self = {
    location: { origin: "https://studio.example" },
    addEventListener(name: string, callback: (event: any) => void) { handlers.set(name, callback); },
    skipWaiting() {},
    clients: { claim() {} }
  };
  const caches = {
    async match(request: any) {
      const key = typeof request === "string" ? request : new URL(request.url).pathname;
      const old = cached.get(key);
      return old === undefined ? undefined : new Response(old);
    },
    async open(_name: string) {
      return {
        async put(request: Request, response: Response) {
          if (refuseCache) throw new Error("Storage quota exceeded");
          writes.push(new URL(request.url).pathname);
          cached.set(new URL(request.url).pathname, await response.text());
        }
      };
    },
    async keys() { return []; },
    async delete(_key: string) { return true; }
  };
  const fetch = async (request: Request) => {
    if (offline) throw new Error("Network unavailable");
    return new Response("Fresh " + new URL(request.url).pathname, { status: 200 });
  };
  runInNewContext(source, { self, caches, fetch, Request, Response, URL, console });
  const onFetch = handlers.get("fetch");
  assert.ok(onFetch, "Service worker must handle fetches");
  return {
    cached, writes,
    offline(value: boolean) { offline = value; },
    failCache(value: boolean) { refuseCache = value; },
    async request(path: string) {
      const request = new Request("https://studio.example" + path);
      let response: Promise<Response> | undefined;
      onFetch({ request, respondWith(result: Promise<Response>) { response = result; } });
      assert.ok(response, "Service worker must respond for " + path);
      return (await response).text();
    }
  };
}

test("all native editor assets prefer current server files to outdated offline shell cache", async () => {
  const sw = await read("public/sw.js");
  assert.match(sw, /const VERSION = "crevelio-v85"/);
  assert.match(sw, /if \(url\.pathname\.startsWith\("\/native-tools\/"\)\) \{\s*[\s\S]*?event\.respondWith\(networkFirst\(request\)\)/);
  const h = workerHarness(sw);
  for (const path of [
    "/native-tools/estiloapa/index.html",
    "/native-tools/txt-test-generator/index.html",
    "/native-tools/txt-test-generator/txt-layout.css",
    "/native-tools/qti-blackboard/index.html",
    "/native-tools/qti-blackboard/qti-layout.css"
  ]) {
    h.cached.set(path, "Outdated " + path);
    assert.equal(await h.request(path), "Fresh " + path);
    assert.ok(h.writes.includes(path), "Latest response must replace cached copy: " + path);
  }
});

test("cached native tool remains readable offline and optional cache failures do not block it online", async () => {
  const h = workerHarness(await read("public/sw.js"));
  const path = "/native-tools/qti-blackboard/index.html";
  h.cached.set(path, "Offline saved editor");
  h.offline(true);
  assert.equal(await h.request(path), "Offline saved editor");
  h.offline(false);
  h.failCache(true);
  assert.equal(await h.request(path), "Fresh " + path, "Storage quota failure must not break a live editor");
});

test("tool route checks are accessible on demand instead of occupying the editor screen permanently", async () => {
  const tsx = await read("app/tools/page.tsx");
  const css = await read("app/globals.css");
  assert.match(tsx, /<details className="native-tools-diagnostics">/);
  assert.match(tsx, /<summary>/);
  assert.match(tsx, /\{passed\}\/\{tools\.length\} tool routes verified/);
  assert.match(tsx, /Check routes again/);
  assert.match(tsx, /These checks confirm that each tool URL responds/);
  assert.doesNotMatch(tsx, /Full native tools audit|Shared Ribbon groups|Native, traceable copies/);
  assert.match(tsx, /role="tablist"/);
  assert.match(tsx, /role="tabpanel"/);
  assert.match(tsx, /<iframe/);
  assert.match(tsx, /Open full screen/);
  assert.match(css, /\.native-tools-diagnostics > summary:focus-visible/);
  assert.match(css, /@media \(max-width: 760px\)/);
});

test("native tool offline precache and explicit source links remain available", async () => {
  const sw = await read("public/sw.js");
  for (const asset of [
    "/native-tools/estiloapa/index.html",
    "/native-tools/txt-test-generator/index.html",
    "/native-tools/qti-blackboard/index.html",
    "/native-tools/estiloapa/ultrapage-theme.css",
    "/native-tools/txt-test-generator/txt-layout.css",
    "/native-tools/qti-blackboard/qti-layout.css"
  ]) {
    assert.ok(sw.includes('"' + asset + '"'), "Precached essential file missing: " + asset);
  }
  const hub = await read("app/tools/page.tsx");
  for (const fragment of ["/native-tools/estiloapa/index.html", "/native-tools/txt-test-generator/index.html", "/native-tools/qti-blackboard/index.html"]) {
    assert.ok(hub.includes(fragment));
  }
});
