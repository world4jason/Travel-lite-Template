# TREK client-side scope matrix

Travel Lite reuses useful **single-user, post-planning, local-first** ideas from TREK. It does not target full TREK parity.

The itinerary is assumed to be finalized before Travel Lite is generated. This document exists to stop future coding agents from expanding the base template into a planner.

## Core base-template scope

| Capability | Travel Lite behavior |
| --- | --- |
| mobile shell / bottom navigation | mobile-first shell + safe areas |
| current / What's Next | derived `Now` view |
| day itinerary | read-focused `Trip` timeline |
| planned-place map | MapLibre/OpenFreeMap pins for itinerary stops |
| Google Maps handoff | reviews/details/navigation in the user's normal map app |
| weather | small Open-Meteo context card with local cache |
| day/activity notes | static reminders from `trip.json` |
| packing/checklists | definitions in `trip.json`, completion in IndexedDB |
| to-dos | definitions in `trip.json`, completion in IndexedDB |
| reservations | read-only structured reference |
| files/tickets | links to useful documents/pages |
| contacts | read-only travel contacts |
| personal quick note | device-local IndexedDB note |
| PWA/offline reads | service worker + trip snapshot |
| appearance | system/light/dark preference |
| external specialist links | arbitrary `externalLinks` per activity |

## Optional, implemented, off by default

These capabilities are complete enough to use but are not part of the default travel flow. They appear only when explicitly enabled or when the data/module is present.

| Capability | Default | Reason |
| --- | --- | --- |
| Photon place search | hidden (`ui.enableExploreTools !== true`) | useful fallback, but travellers usually use their map app |
| Wikipedia/Wikidata enrichment | hidden with explore tools | optional context, not operational trip data |
| Overpass nearby POI explore | hidden with explore tools | discovery is not the purpose of the template |
| official Google Maps iframe | off unless key supplied | normal Maps URL handoff is simpler |
| costs | shown only when data exists | useful for some trips, not core |
| journal | shown only when data exists | optional memory feature, not core |

If maintenance cost becomes undesirable, the optional discovery providers are the first candidates to remove from the base template.

## Intentionally not part of the base template

Do not port these merely because TREK supports them:

- itinerary planner/editor, drag/reorder, move-between-days, undo/redo
- route optimization or built-in turn-by-turn/navigation
- live transit planner/timetable/disruption engine
- ratings/review database, scraping, or mirrored Google/Tabelog content
- generic recommendation/discovery engine
- GPX/KML import workflows intended for planning
- multi-user accounts, roles, permissions, invitations
- WebSocket collaboration, chat, polls, reactions
- cross-device state sync
- server file uploads/storage backends
- booking confirmation extraction
- admin panel, backups, notifications
- plugin runtime/registry
- MCP server / OAuth scopes
- server audit logs

For live/specialist information, add a handoff link to the service the traveller already trusts.

## Source reuse rule

Travel Lite is AGPL-3.0-or-later. TREK client source may be copied/adapted when useful, provided applicable copyright/license notices and meaningful modification notices are preserved.

Source reuse is not a reason to copy product scope. Prefer the smallest implementation that supports the post-planning companion workflow.
