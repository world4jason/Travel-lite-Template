# Travel Lite Template

A mobile-first, offline-ready trip companion for **one itinerary → one GitHub Pages site**.

Travel Lite keeps the deployment model intentionally small: no server, login, framework, build step, or API key is required. Repository data lives in `trip.json`; browser-local state lives in IndexedDB with a localStorage fallback.

## Views

- **Now** — current activity, next activity, trip-local time, progress, map preview
- **Trip** — day tabs + complete itinerary timeline
- **Map** — embedded Google Maps for the selected day/place
- **Check** — to-dos + packing/checklists
- **More** — reservations, costs, trip notes, file/ticket links, contacts, journal, links, personal note, appearance

The bottom bar is data-driven through `ui.bottomNav`, so a trip can hide views it does not need.

## Storage model

```text
trip.json                      versioned shared trip data
     │
     ├── fetch / service-worker cache
     └── IndexedDB snapshot    offline fallback

IndexedDB                     device-local mutable state
├── checklist completion
├── todo completion
├── personal note
├── selected day/view
└── theme preference

localStorage                  fallback only when IndexedDB is unavailable
```

After the first successful visit, the service worker precaches the app shell and `trip.json`. Google Maps embeds still need network access; the itinerary itself remains available offline.

## TREK-inspired static client scope

Travel Lite is a clean-room implementation of travel UI patterns rather than a TREK source-code fork.

Supported as static/client-only counterparts:

- day plans and current/next context
- places and embedded maps
- day notes
- reservations display
- costs display
- packing lists and to-dos with local completion state
- files/tickets as static links
- journal entries
- installable/offline PWA shell
- IndexedDB local state + cached trip snapshot
- mobile bottom navigation and safe-area layout
- light/dark/system appearance

Intentionally server-side/out of scope: accounts, permissions, real-time collaboration, uploads, booking extraction, live place search/enrichment, route optimization, live weather, transit APIs, plugins, MCP/AI, cross-device sync, or server-backed mutation replay.

## Google Maps

No Maps JavaScript SDK or API key is required. Each itinerary item can use any of:

```json
{
  "location": "Senso-ji, Tokyo",
  "mapQuery": "Senso-ji Tokyo",
  "lat": 35.7148,
  "lng": 139.7967,
  "mapsUrl": "https://www.google.com/maps/...",
  "mapEmbedUrl": "https://www.google.com/maps?...&output=embed"
}
```

`mapEmbedUrl` wins when present; otherwise Travel Lite derives an iframe URL from latitude/longitude, `mapQuery`, `location`, or title.

## Quick start

1. Edit `trip.json`.
2. Commit and push to `main`.
3. GitHub Pages serves the repository root directly.
4. Open the page once online before travel so the PWA shell and trip snapshot are cached.

For local preview:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Vibe-coding rule

For a new trip, prefer changing only `trip.json` and optionally visual tokens in `styles.css`. Keep stable IDs for checklist/todo items so local state survives itinerary edits.

See [`AGENTS.md`](./AGENTS.md) for implementation guardrails.
