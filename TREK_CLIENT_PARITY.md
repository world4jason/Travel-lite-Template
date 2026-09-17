# TREK client-side parity roadmap

Travel Lite targets the useful **single-user / static / local-first** parts of TREK while intentionally dropping server and collaboration assumptions.

This is an implementation guide for future coding agents, not a promise that every TREK feature belongs in a static trip page.

## Implemented

| TREK client capability | Travel Lite static/local equivalent |
| --- | --- |
| mobile shell / bottom navigation | mobile-first five-view shell + safe-area layout |
| day plans | `trip.json` day/activity timeline |
| current / What's Next | `Now` current + next derivation |
| interactive map | MapLibre GL + OpenFreeMap |
| place markers | itinerary coordinates + map markers |
| place search | Photon / OpenStreetMap runtime search |
| place enrichment | Wikipedia + Wikidata + Wikimedia image/website fields |
| POI explore | explicit Overpass nearby category search |
| weather | Open-Meteo current + day forecast |
| Google Maps handoff | ratings/reviews/details/navigation URL; optional official embed |
| day notes | static day/item notes |
| packing lists | `trip.json` definitions + IndexedDB completion |
| to-dos | `trip.json` definitions + IndexedDB completion |
| reservations | static structured display |
| costs | static structured entries + totals |
| files / tickets | public/static links |
| journal | static entries |
| appearance | system/light/dark local preference |
| offline trip reads | service worker shell + IndexedDB trip snapshot |
| local mutation storage | IndexedDB with localStorage fallback |

## Next client-only ports

These are good candidates because they do not intrinsically require accounts or a trusted backend.

### Planner editing

- drag/reorder activities within a day
- move activities across days
- undo/redo
- store local itinerary overrides in IndexedDB
- export the locally edited itinerary as JSON so a coding agent can commit it back to `trip.json`

### Routes

- draw route lines between day stops
- Google Maps / CoMaps route handoff
- optional client-side nearest-neighbour + 2-opt ordering
- optional OSRM public/self-hosted adapter with caching and graceful fallback

### Offline maps

- explicit "Download this trip map" action
- prefetch style + glyphs + a bounded vector-tile region
- storage usage display and clear-offline-map action
- follow TREK's principle of explicit trip-scoped prefetch rather than unbounded background caching

### Import / export

- GPX export
- ICS export
- client-side GPX/KML/KMZ import where practical
- JSON import/export for Travel Lite itself

### Travel details

- structured flight/train legs
- accommodation spanning multiple days
- richer reservation types/status
- currency conversion adapter with frozen rate snapshots
- client-side budget charts

### Journal/local media

- device-local journal editing
- optional local image attachments stored in IndexedDB/File System Access where supported
- export bundle rather than server upload

## Intentionally not ported

These belong to TREK's multi-user/server product, not the Travel Lite template:

- accounts / password / OIDC / passkeys / 2FA
- roles / permissions / invitations
- WebSocket real-time collaboration
- shared chat, polls, reactions
- server file uploads/storage backends
- trusted booking confirmation extraction
- cross-device state sync
- admin panel
- server backups
- server notifications
- plugin child processes / registry
- MCP server / OAuth scopes
- server audit logs

## Source reuse rule

Travel Lite is AGPL-3.0-or-later. TREK client source may be copied/adapted when useful, but future agents must preserve applicable copyright/license notices, document meaningful modifications, and avoid copying server coupling that is unnecessary for the static architecture.

When behavior can be implemented more simply with browser-native APIs, prefer the smaller local-first implementation over importing a large TREK dependency graph.
