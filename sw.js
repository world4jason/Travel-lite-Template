const CACHE = "travel-lite-shell-v19";
const RUNTIME_CACHE = "travel-lite-runtime-v1";
const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const INDEX = scopeUrl("./index.html");
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./runtime.css",
  "./desktop-theme.css",
  "./trip-view.css",
  "./responsive-shell.css",
  "./companion-ux.css",
  "./long-trip-nav.css",
  "./today-brief.css",
  "./bootstrap.js",
  "./storage.js",
  "./app.js",
  "./trip-view.js",
  "./runtime-providers.js",
  "./runtime-features.js",
  "./runtime-handoff.js",
  "./runtime-google.js",
  "./theme-shell.js",
  "./responsive-shell.js",
  "./companion-ux.js",
  "./timezone.js",
  "./long-trip-nav.js",
  "./today-brief.js",
  "./trip.json",
  "./manifest.webmanifest",
  "./icon.svg"
].map(scopeUrl);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE, RUNTIME_CACHE]);
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

async function trimCache(cacheName, maxEntries = 180) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((request) => cache.delete(request)));
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone());
      trimCache(cacheName).catch(() => {});
    }
    return response;
  }).catch(() => cached);
  return cached || refresh;
}

function markCachedResponse(response) {
  if (!response) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Travel-Lite-Source", "cache");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    const runtimeHosts = new Set(["cdn.jsdelivr.net", "tiles.openfreemap.org"]);
    if (runtimeHosts.has(url.hostname)) event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(INDEX, copy));
      return response;
    }).catch(() => caches.match(INDEX)));
    return;
  }

  if (url.pathname.endsWith("/trip.json")) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(async () => markCachedResponse(await caches.match(request))));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, CACHE));
});
