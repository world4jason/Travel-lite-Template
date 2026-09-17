# Agent instructions

Travel Lite is a static, data-driven GitHub Pages travel companion. It intentionally supports rich client-side behavior without becoming a server application.

## Product invariant

Primary views are:

1. `Now` — derived current/next context
2. `Trip` — complete itinerary
3. `Map` — embedded Google Maps for itinerary places
4. `Check` — local to-dos and checklists
5. `More` — optional static trip modules and device-local note/settings

`ui.bottomNav` may hide unused views. Do not introduce a backend merely to support a small trip.

## Data/storage boundaries

- `trip.json` is the shared, version-controlled source of truth.
- IndexedDB is the preferred device-local store for mutable UI state.
- localStorage is only a fallback when IndexedDB is unavailable.
- The service worker caches the app shell and `trip.json` for offline reads.
- Google Maps is embedded with an iframe; do not add a Maps JavaScript SDK or API key by default.
- Never put secrets, full booking codes, passport data, or private credentials in a public repository.

## Default change strategy

When given a new itinerary, PDF, spreadsheet, or notes:

1. Normalize it into `trip.json`.
2. Preserve stable IDs for days, activities, todos, and checklist items.
3. Keep the app architecture unchanged unless behavior genuinely needs to change.
4. Add optional static modules (`reservations`, `costs`, `notes`, `files`, `contacts`, `journal`, `links`) only when data exists.
5. Do not introduce auth, SSR, a server database, paid services, or API keys unless explicitly requested.

## Trip data rules

- Dates: `YYYY-MM-DD`.
- Activity times: local trip time, `HH:MM`.
- Prefer explicit `end` times so `Now` can determine the active activity.
- Every day and activity should have a stable `id`.
- Map lookup priority: `mapEmbedUrl` → `lat/lng` → `mapQuery` → `location` → `title`.
- Checklist and todo IDs must remain stable or local completion state will reset.
- Change `trip.id` for a genuinely different trip so local browser state is isolated.

## Client-side parity target

Prefer a static/client-only equivalent when practical for TREK-like features: day plans, maps, notes, reservations, costs, packing, todos, file links, journal, current/next, PWA/offline, IndexedDB, appearance, and mobile shell. Features that intrinsically require a trusted server or multi-user sync stay out of scope.

## Acceptance checks

- `trip.json` and `manifest.webmanifest` are valid JSON.
- `node --check app.js`, `node --check storage.js`, and `node --check sw.js` pass.
- All configured views render with sample data.
- Checklist/todo/personal note state survives reload through IndexedDB (or localStorage fallback).
- The app still opens after a reload with network disabled once it has been loaded successfully online.
- Map iframe uses Google Maps embed and does not require an API key.
- The layout remains usable at 320px width; touch targets stay approximately 44px or larger.
- The project remains deployable as plain static files on GitHub Pages.
