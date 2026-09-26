const VERSION = "ultrapage-v10";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const APP_SHELL = [
  "/",
  "/tools",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/brand/ultrapage-mark.svg",
  "/brand/ultrapage-icon-192.png",
  "/brand/ultrapage-icon-512.png",
  "/brand/apple-touch-icon.png",
  "/native-tools/ultrapage-native-theme.css",
  "/native-tools/estiloapa/index.html",
  "/native-tools/estiloapa/styles.css",
  "/native-tools/estiloapa/scrollbar-v31.css",
  "/native-tools/estiloapa/ultrapage-theme.css",
  "/native-tools/estiloapa/app.js",
  "/native-tools/estiloapa/edit-stability-v348.js",
  "/native-tools/estiloapa/enhancements.js",
  "/native-tools/estiloapa/pdf-smart.js",
  "/native-tools/estiloapa/apa-table-v29.js",
  "/native-tools/estiloapa/module-profile.js",
  "/native-tools/estiloapa/thesis-profile.js",
  "/native-tools/estiloapa/thesis-alignment.js",
  "/native-tools/estiloapa/apa-editor-v30.js",
  "/native-tools/estiloapa/list-normalizer-v31.js",
  "/native-tools/estiloapa/table-figure-v32.js",
  "/native-tools/estiloapa/pdf-original-media-v33.js",
  "/native-tools/estiloapa/reference-audit-v30.js",
  "/native-tools/estiloapa/apa-editor-export-v30.js",
  "/native-tools/estiloapa/thesis-html.js",
  "/native-tools/estiloapa/thesis-docx.js",
  "/native-tools/estiloapa/html-enhance.js",
  "/native-tools/estiloapa/docx-enhance.js",
  "/native-tools/txt-test-generator/index.html",
  "/native-tools/txt-test-generator/img/LOGO-INTER-SG-HORIZONTAL_sticker.png",
  "/native-tools/txt-test-generator/img/ucan-logo.png",
  "/native-tools/txt-test-generator/Guía_Generador_Exámenes_Blackboard_Ultra_Simplificada.pdf",
  "/native-tools/qti-blackboard/index.html",
  "/native-tools/qti-blackboard/img/LOGO-INTER-SG-HORIZONTAL_sticker.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (request.mode === "navigate" ? caches.match("/") : Response.error());
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response);
      }
    }).catch(() => {});
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/native-tools/") ||
    url.pathname.startsWith("/_next/static/") ||
    ["style", "script", "font", "image"].includes(request.destination)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
