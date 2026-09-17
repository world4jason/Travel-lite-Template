# Acceptance checklist

Travel Lite base-template acceptance after runtime discovery removal.

## Code / data

- [x] `trip.json` and `manifest.webmanifest` parse as valid JSON.
- [x] All local JavaScript passes syntax checking.
- [x] No Photon, Overpass, Wikipedia/Wikidata runtime fetch code remains.
- [x] Shared TBDs cannot be resolved locally; only `decision.mode: personal` writes a personal preference.
- [x] Service worker cache version is bumped so old discovery JavaScript is not kept as the active shell.
- [x] Static GitHub Pages deployment remains build-free.

## Product / UI

- [x] `Now` provides current/next, reminders, shared TBD context, Google handoffs, and weather when available.
- [x] `Trip` stays read-focused and renders handoff links, Google Maps query links, shared decisions, and static info cards.
- [x] `Map` shows only already-planned stops and retains Google Maps handoff if MapLibre fails.
- [x] `Check` keeps checklist/todo state device-local in IndexedDB with localStorage fallback.
- [x] `More` remains read/reference oriented.
- [x] Runtime provider failure does not block the itinerary/reference flow.
- [x] 390px mobile Chromium smoke: 18/18 checks passed with external requests intentionally blocked; 0 page errors.

## Review note

The local browser smoke intentionally blocked all external requests to verify graceful fallback. A live visual smoke against the deployed `github.io` URL could not be executed from this session because live web/browser access is disabled in the environment. The static/browser-tested artifact and GitHub Pages source are otherwise acceptance-complete.
