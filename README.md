# Travel Lite Template

A mobile-first, local-first **post-planning trip companion** for **one finalized itinerary → one GitHub Pages site**.

Travel Lite is not a trip planner. The planning has already happened. The traveller opens this page during the trip to answer, quickly:

- What am I doing now?
- What is next?
- What is today's schedule?
- What do I still need to remember/check?
- Where is this stop?
- Which map, restaurant, transit, booking, or operator app/site should I open next?

For specialist/live information, Travel Lite prefers **handoff over reimplementation**. Google Maps can handle reviews/navigation, destination-specific services can handle restaurant reviews, local transit tools can handle live timetables, and booking/operator pages can remain authoritative.

See [`HANDOFF_PRINCIPLE.md`](./HANDOFF_PRINCIPLE.md).

## Default views

- **Now** — current activity, next activity, trip-local time, progress, small weather context
- **Trip** — read-focused day itinerary + reminders
- **Map** — today's already-planned stops on MapLibre/OpenFreeMap + Google Maps handoff
- **Check** — to-dos + packing/checklists stored locally
- **More** — reservation/ticket/note/contact references and device-local note/settings

The bottom bar is controlled by `ui.bottomNav`, so unused views can be removed per trip.

## Optional tools

Place search (Photon), Wikipedia/Wikidata enrichment, and Overpass nearby discovery are implemented but **hidden by default**. Enable them only with:

```json
{
  "ui": {
    "enableExploreTools": true
  }
}
```

They are conveniences, not part of the normal travel flow. If long-term maintenance simplicity matters more, these are the first features to remove.

## Data/storage model

```text
trip.json                    finalized shared trip data
   ├── itinerary / lat-lng / reminders
   ├── reservations / tickets / useful links
   ├── optional modules
   └── service-worker + IndexedDB snapshot

IndexedDB                   device-local mutable state
   ├── checklist/todo completion
   ├── personal note
   ├── selected day/view/theme
   └── small runtime-provider caches

localStorage                fallback only
```

No application server, login, server database, or build step is required.

## External handoff links

Activities may include links to tools the traveller already uses:

```json
{
  "id": "d2-dinner",
  "title": "Dinner",
  "location": "Shinjuku, Tokyo",
  "externalLinks": [
    { "label": "Tabelog", "url": "https://tabelog.com/..." },
    { "label": "Reservation", "url": "https://..." }
  ]
}
```

Do not invent links. A coding agent should add them only when the source itinerary or research resolves a concrete useful destination.

Google Maps URLs are generated automatically for place details/reviews/navigation and do not require a key. An official Maps Embed API key is optional, not required.

## Weather

Open-Meteo provides small current/day weather context and is cached locally. Weather failure never blocks the itinerary. The public free hosted endpoint has its own usage/licensing limits; see [`PROVIDERS.md`](./PROVIDERS.md).

## Offline behavior

After the first successful visit, the app shell and trip snapshot remain available offline. Checklist/todo/personal-note state is stored in IndexedDB with localStorage fallback. External specialist apps/sites and live provider refreshes naturally require connectivity.

## Quick start

1. Replace `trip.json` with the finalized itinerary.
2. Prefer stable IDs and explicit `lat`/`lng` for real stops.
3. Add direct external links where they make the trip easier to use.
4. Push to `main`; GitHub Pages serves the repository root.
5. Open the site once online before travelling.

For local preview:

```bash
python3 -m http.server 8000
```

## Scope guardrail

Do not expand the base template into itinerary planning, drag/drop scheduling, route optimization, a review database, a live-transit engine, generic recommendations, collaboration, or account/server infrastructure.

See [`AGENTS.md`](./AGENTS.md) and [`TREK_CLIENT_PARITY.md`](./TREK_CLIENT_PARITY.md).

Travel Lite is AGPL-3.0-or-later. See `LICENSE` and `NOTICE.md` when adapting TREK code.
