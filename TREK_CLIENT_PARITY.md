# TREK client-side scope matrix

Travel Lite reuses useful **read-mostly, local-first travel-time** ideas from TREK. It does not target full TREK parity.

The trip is mostly planned before Travel Lite is generated. Small intentional TBDs may remain, but the template is a decision/reference companion, not a planner.

## Core base-template scope

| Capability | Travel Lite behavior |
| --- | --- |
| mobile shell / bottom navigation | mobile-first shell + safe areas |
| current / What's Next | derived `Now` view |
| day itinerary | read-focused `Trip` timeline |
| day reminders | concise operational reminders from `trip.json` |
| small TBD decisions | read-only shared cards; optional device-local personal preference |
| planned-place map | MapLibre/OpenFreeMap pins for itinerary stops |
| Google Maps handoff | reviews/details/navigation/search in the user's map app |
| weather | small Open-Meteo context card with local cache |
| static info cards | vibe-time researched context stored in `trip.json` |
| packing/checklists | definitions in `trip.json`, completion in IndexedDB |
| to-dos | definitions in `trip.json`, completion in IndexedDB |
| reservations | read-only structured reference |
| files/tickets | links to useful documents/pages |
| contacts | read-only travel contacts |
| personal quick note | device-local IndexedDB note |
| PWA/offline reads | service worker + trip snapshot |
| appearance | system/light/dark preference |
| specialist links | arbitrary `externalLinks` per activity |

## Shared-state boundary

```text
trip.json = shared truth
IndexedDB = private state on one device
```

- shared TBD cards do not allow a local click to resolve the group decision
- shared resolution requires `resolvedOptionId` in shared `trip.json`
- `decision.mode: "personal"` may record a device-local preference, explicitly labelled
- no local mutation may imply other travellers see the same result

This is a deliberate product boundary, not a missing collaboration feature.

## Simplifications relative to TREK

Travel Lite intentionally hands off or resolves data at vibe-time instead of porting these runtime capabilities:

| TREK-style capability | Travel Lite choice |
| --- | --- |
| place search / discovery | Google Maps query link or user’s specialist app |
| nearby POI exploration | Google Maps query link |
| Wikipedia/Wikidata enrichment | agent fills static `infoCard` during vibe-time |
| reviews / live place details | Google Maps / Tabelog / specialist service |
| transit planning | NAVITIME/Jorudan/operator/etc. |
| itinerary editing | out of scope |
| route optimization | out of scope |

## Optional data modules

These render only when data exists and may be omitted from a generated trip:

- costs
- journal
- contacts
- files/tickets
- notes
- general links
- official Google Maps iframe via configured browser key

## Intentionally not part of the base template

- itinerary planner/editor, drag/reorder, move-between-days, undo/redo
- shared mutation state without a synchronization backend
- route optimization or built-in turn-by-turn navigation
- live transit planner/timetable/disruption engine
- ratings/review scraping or mirrored Google/Tabelog content
- generic recommendation/discovery engine
- runtime Photon/Overpass/Wikipedia/Wikidata lookup
- GPX/KML planning workflows
- multi-user accounts/roles/invitations
- WebSocket collaboration/chat/polls/reactions
- cross-device state sync
- server file uploads/storage backends
- booking confirmation extraction
- admin panel/backups/notifications
- plugin runtime/registry
- MCP server/OAuth scopes
- server audit logs

## Source reuse rule

Travel Lite is AGPL-3.0-or-later. TREK client source may be copied/adapted when useful, provided applicable copyright/license notices and meaningful modification notices are preserved.

Source reuse is not a reason to copy product scope. Prefer the smallest implementation that supports the travel-time decision companion workflow.
