const CACHE = "travel-lite-shell-v4";
const RUNTIME_CACHE = "travel-lite-runtime-v1";
const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const INDEX = scopeUrl("./index.html");
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./runtime.css",
  "./storage.js",
  "./app.js",
  "./runtime-providers.js",
  "./runtime-features.js",
  "./runtime-handoff.js",
  "./runtime-google.js",
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
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, CACHE));
});
