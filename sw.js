// Both Travel-lite-Template and Megan-trip live on the same github.io origin.
// Prefix CacheStorage with the SW scope: each project keeps its own offline
// shell/runtime, and activating one cannot delete the other's cache.
const CACHE_PREFIX = "travel-lite:" + new URL(self.registration.scope).pathname
  .replace(/[^a-z0-9]/gi, "-") + ":";
const CACHE = CACHE_PREFIX + "shell-v59-compact-overview";
const RUNTIME_CACHE = CACHE_PREFIX + "runtime-v1";
const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const INDEX = scopeUrl("./index.html");
const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./runtime.css",
  "./desktop-theme.css",
  "./trip-view.css?v=20261118-chronological-v1",
  "./responsive-shell.css",
  "./companion-ux.css",
  "./places-view.css?v=20261119-places-v1",
  "./long-trip-nav.css",
  "./date-navigation.css?v=20261118-history-v2",
  "./flight-overview.css?v=20261118-weatherstrip-v1",
  "./uiux-guard.css?v=20261118-inset-v1",
  "./journey-groups.css?v=20261119-trip-grid-v2",
  "./overview-compact.css?v=20261119-overview-compact-v1",
  "./today-brief.css",
  "./style-settings.css",
  "./export.css",
  "./journey-trust.css",
  "./journey-transit.css",
  "./storybook-theme.css",
  "./candy-theme.css?v=20261118-map-insets-v1",
  "./risograph-theme.css?v=20261119-map-role-v2",
  "./paper-collage-theme.css?v=20261118-map-insets-v1",
  "./naive-city-theme.css?v=20261118-map-insets-v1",
  "./taiwan-poster-theme.css?v=20261118-map-insets-v1",
  "./field-stamp-theme.css?v=20261118-map-insets-v1",
  "./quiet-linocut-theme.css?v=20261118-map-insets-v1",
  "./doodle-memory-grid-theme.css?v=20261118-map-insets-v1",
  "./crayon-journal-theme.css?v=20261118-map-insets-v1",
  "./painterly-editorial-theme.css?v=20261118-map-insets-v1",
  "./geometric-print-theme.css?v=20261118-map-insets-v1",
  "./quiet-acrylic-theme.css?v=20261118-map-insets-v1",
  "./vintage-watercolor-theme.css?v=20261119-map-role-v2",
  "./surface-contract.css?v=20261119-map-role-v2",
  "./site-scope.js",
  "./bootstrap.js",
  "./storage.js",
  "./item-identity.js",
  "./ui-icons.js?v=20261118-journey-v1",
  "./journey-groups.js?v=20261118-journey-v1",
  "./app.js?v=20261118-icons-v1",
  "./trip-view.js?v=20261119-trip-grid-v2",
  "./runtime-providers.js?v=20261118-history-v2",
  "./runtime-features.js?v=20261118-icons-v1",
  "./runtime-handoff.js",
  "./places-view.js?v=20261119-places-v1",
  "./transport-overview.js",
  "./runtime-google.js",
  "./theme-shell.js",
  "./responsive-shell.js",
  "./companion-ux.js",
  "./timezone.js",
  "./long-trip-nav.js",
  "./date-navigation.js?v=20261119-trip-grid-v2",
  "./flight-overview.js?v=20261118-weatherstrip-v1",
  "./today-brief.js?v=20261119-trip-grid-v2",
  "./journey-trust.js",
  "./journey-transit.js",
  "./storybook-motion.js",
  "./storybook-decor.js",
  "./export-core.js",
  "./export-ui.js",
  "./trip.json",
  "./assets/storybook/hero.svg",
  "./assets/storybook/map.svg",
  "./assets/storybook/city.svg",
  "./assets/storybook/plane.svg",
  "./assets/storybook/car.svg",
  "./assets/storybook/train.svg",
  "./assets/storybook/boat.svg",
  "./assets/storybook/food.svg",
  "./assets/storybook/hotel.svg",
  "./assets/storybook/landmark.svg",
  "./assets/storybook/nature.svg",
  "./assets/storybook/sea.svg",
  "./assets/candy/boat.svg",
  "./assets/candy/car.svg",
  "./assets/candy/city.svg",
  "./assets/candy/food.svg",
  "./assets/candy/hero.svg",
  "./assets/candy/hotel.svg",
  "./assets/candy/landmark.svg",
  "./assets/candy/map.svg",
  "./assets/candy/nature.svg",
  "./assets/candy/plane.svg",
  "./assets/candy/sea.svg",
  "./assets/candy/train.svg",
  "./assets/risograph/grain.svg",
  "./assets/risograph/hero.svg",
  "./assets/risograph/marker.svg",
  "./assets/paper-collage/hero.svg",
  "./assets/paper-collage/marker.svg",
  "./assets/paper-collage/street.svg",
  "./assets/naive-city/hero.svg",
  "./assets/naive-city/marker.svg",
  "./assets/taiwan-poster/hero.svg",
  "./assets/taiwan-poster/marker.svg",
  "./assets/field-stamp/hero.svg",
  "./assets/field-stamp/marker.svg",
  "./assets/quiet-linocut/hero.svg",
  "./assets/quiet-linocut/marker.svg",
  "./assets/doodle-memory-grid/hero.svg",
  "./assets/doodle-memory-grid/marker.svg",
  "./assets/crayon-journal/hero.svg",
  "./assets/crayon-journal/marker.svg",
  "./assets/painterly-editorial/hero.svg",
  "./assets/painterly-editorial/marker.svg",
  "./assets/geometric-print/hero.svg",
  "./assets/geometric-print/marker.svg",
  "./assets/quiet-acrylic/hero.svg",
  "./assets/quiet-acrylic/marker.svg",
  "./assets/vintage-watercolor/hero.svg",
  "./assets/vintage-watercolor/marker.svg",
  "./assets/vintage-watercolor/frame-corner-bl.svg",
  "./assets/vintage-watercolor/frame-corner-br.svg",
  "./assets/vintage-watercolor/frame-corner-tl.svg",
  "./assets/vintage-watercolor/frame-corner-tr.svg",
  "./assets/vintage-watercolor/divider-ornament.svg",

  "./manifest.webmanifest",
  "./icon.svg"
].map(scopeUrl);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE, RUNTIME_CACHE]);
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && !keep.has(key))
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
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
