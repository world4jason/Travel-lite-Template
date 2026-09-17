# Agent instructions

Travel Lite is a static, data-driven GitHub Pages travel companion intended to be inherited by coding agents. It supports rich client-side behavior without becoming a server application.

## Product invariant

Primary views are:

1. `Now` — derived current/next context + live weather
2. `Trip` — complete itinerary + per-day forecast
3. `Map` — MapLibre/OpenFreeMap + search/enrichment/nearby explore
4. `Check` — local to-dos and checklists
5. `More` — optional static trip modules and device-local note/settings

`ui.bottomNav` may hide unused views. Do not introduce a backend merely to support a small trip.

## Data/storage boundaries

- `trip.json` is the shared, version-controlled source of truth.
- IndexedDB is the preferred device-local store for mutable UI state and runtime-provider caches.
- localStorage is only a fallback when IndexedDB is unavailable.
- The service worker caches the app shell, `trip.json`, and a bounded set of map/runtime assets.
- Never put secrets, passport data, private credentials, or sensitive booking codes in a public repository.
- Google Maps ratings/reviews/navigation should normally be a Maps URL handoff, not scraped or duplicated.

## Default change strategy

When given a new itinerary, PDF, spreadsheet, or notes:

1. Normalize it into `trip.json`.
2. Preserve stable IDs for days, activities, todos, and checklist items.
3. Resolve stable locations at vibe-time: prefer explicit `lat`/`lng` plus human-readable `title` and `location`.
4. Keep the app architecture unchanged unless behavior genuinely needs to change.
5. Add optional static modules (`reservations`, `costs`, `notes`, `files`, `contacts`, `journal`, `links`) only when data exists.
6. Use runtime providers only for changing/ad-hoc data: weather, temporary place search, nearby discovery, public knowledge refresh.
7. Do not introduce auth, SSR, a server database, paid services, or secret API keys unless explicitly requested.

## Trip data rules

- Dates: `YYYY-MM-DD`.
- Activity times: local trip time, `HH:MM`.
- Prefer explicit `end` times so `Now` can determine the active activity.
- Every day and activity should have a stable `id`.
- Prefer `lat`/`lng` for every real place; runtime geocoding is a fallback, not the primary data model.
- For Google Maps detail/reviews handoff, use `googlePlaceId` when known; otherwise title + address/location is preferred over coordinates alone.
- Checklist and todo IDs must remain stable or local completion state will reset.
- Change `trip.id` for a genuinely different trip so local browser state is isolated.

## Runtime-provider rules

### Weather
- Default: Open-Meteo.
- Cache responses in IndexedDB; live data failure must never break itinerary rendering.
- Forecast UI should disappear gracefully when the target date is outside the returned forecast window.

### Place search
- Default: Photon public demo for low-volume, user-triggered queries.
- Do **not** implement aggressive typeahead against the public demo.
- Cache search results and keep the endpoint replaceable/self-hostable.
- Search results are runtime previews unless an agent intentionally writes them into `trip.json`.

### Place enrichment
- Prefer Wikipedia/Wikidata/Wikimedia-compatible public metadata.
- Treat proximity matches as suggestions, not guaranteed identity matches.
- Static facts worth keeping should be written back to `trip.json` during vibe-time when possible.

### Nearby POI
- Default: Overpass.
- Query only on explicit user action (`Explore this area` / category button), not every pan/zoom.
- Cache results; keep categories and endpoint configurable.

### Maps and Google
- Default interactive renderer: MapLibre with OpenFreeMap style.
- Google Maps URL is the default reviews/details/navigation exit and requires no key.
- Official Maps Embed API is optional through `providers.googleMapsEmbedKey`; never require it for the template to work.
- If an embed key is used, it must be a browser key restricted by HTTP referrer to the deployed origin.

## TREK compatibility target

Travel Lite may copy/adapt TREK client-side code under AGPL when the copied code's notices/license obligations are preserved. Prefer reusable static/local-first counterparts for day plans, maps, notes, reservations, costs, packing, todos, file links, journal, current/next, PWA/offline, IndexedDB, appearance, place search/enrichment, and weather.

Server/multi-user concerns remain intentionally out of scope: accounts, permissions, real-time collaboration, server uploads, trusted booking extraction, cross-device sync, plugins, MCP server, or server-backed mutation replay.

## Acceptance checks

- `trip.json` and `manifest.webmanifest` are valid JSON.
- `node --check app.js`, `storage.js`, `sw.js`, `runtime-providers.js`, `runtime-features.js`, and `runtime-google.js` pass.
- All configured views render with sample data.
- Map view still gives Google Maps links if MapLibre/CDN/provider requests fail.
- Weather/search/enrichment failures degrade to static itinerary instead of blocking the app.
- Checklist/todo/personal-note state survives reload through IndexedDB (or localStorage fallback).
- The app still opens after a reload with network disabled once it has loaded successfully online.
- Layout remains usable at 320px width; touch targets stay approximately 44px or larger.
- The project remains deployable as plain static files on GitHub Pages.
