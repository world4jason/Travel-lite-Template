# Travel Lite Template

A mobile-first, local-first trip companion for **one itinerary → one GitHub Pages site**.

Travel Lite is meant to be inherited by coding agents and vibe-coded per trip. There is no application server, login, build step, or server database. Versioned trip content lives in `trip.json`; mutable browser state and provider caches live in IndexedDB with a localStorage fallback.

The project is AGPL-3.0-or-later. See `LICENSE` and `NOTICE.md` for attribution guidance when porting code from TREK.

## Views

- **Now** — current activity, next activity, trip-local time, progress, live weather, Google Maps handoff
- **Trip** — day tabs + complete itinerary timeline + day forecast
- **Map** — MapLibre/OpenFreeMap interactive map, place search, public-data enrichment, nearby POI explore
- **Check** — to-dos + packing/checklists stored locally
- **More** — reservations, costs, trip notes, file/ticket links, contacts, journal, links, personal note, appearance

The bottom bar is data-driven through `ui.bottomNav`, so a trip can hide views it does not need.

## Data/storage model

```text
trip.json                         versioned shared trip data
   │
   ├── itinerary / lat-lng / notes / bookings / costs
   ├── provider configuration
   ├── service-worker cache
   └── IndexedDB snapshot         offline fallback

IndexedDB                        device-local mutable/cache layer
├── checklist + todo completion
├── personal note
├── selected day/view + theme
├── last trip snapshot
├── weather cache
├── place-search cache
├── Wikipedia/Wikidata cache
└── nearby POI cache

localStorage                     fallback only when IndexedDB is unavailable
```

## Runtime providers

Default no-secret stack:

| Capability | Default provider | Notes |
| --- | --- | --- |
| Interactive map | MapLibre + OpenFreeMap | no account/key; static hosting friendly |
| Weather | Open-Meteo | current + up to 16-day forecast |
| Place search | Photon / OpenStreetMap | submit-to-search; cached; public demo has no SLA |
| Place knowledge | Wikipedia + Wikidata | summary, thumbnail, structured public metadata |
| Nearby POI | Overpass API | explicit user-triggered search + cache |
| Ratings/reviews/navigation | Google Maps URL | opens Google Maps; no key required |
| Google iframe | Maps Embed API | optional; requires a restricted browser key + billing account |

See [`PROVIDERS.md`](./PROVIDERS.md) for provider policies and replacement points.

## Google Maps strategy

Google is used as a **handoff for ratings, reviews, place details and navigation**, not as the default map renderer.

Travel Lite builds a Maps URL from place name/address first, because that gives Google Maps the best chance to open the actual listing and its rating/reviews. If `googlePlaceId` is present it is included for precision.

```json
{
  "title": "Senso-ji",
  "location": "2 Chome-3-1 Asakusa, Taito City, Tokyo",
  "lat": 35.7148,
  "lng": 139.7967,
  "googlePlaceId": "optional-google-place-id"
}
```

An official Google iframe is optional:

```json
{
  "providers": {
    "googleMapsEmbedKey": ""
  }
}
```

Keep it empty by default. If a trip owner enables the Maps Embed API, use an HTTP-referrer-restricted browser key for that GitHub Pages origin.

## Vibe-time vs runtime

Prefer resolving stable information while generating the site:

```text
PDF / spreadsheet / notes
          ↓
     coding agent
          ↓
  normalize + enrich
          ↓
       trip.json
  title / address / lat/lng
  optional wiki/wikidata IDs
  static notes / reservations
          ↓
     GitHub Pages
```

Runtime APIs are for information that changes or for ad-hoc exploration:

- weather
- temporary place search
- nearby POIs
- public knowledge refresh
- Google Maps ratings/reviews/navigation handoff

A trip should still remain useful when those external providers are unavailable.

## Example provider config

```json
{
  "providers": {
    "mapStyle": "https://tiles.openfreemap.org/styles/liberty",
    "weatherEndpoint": "https://api.open-meteo.com/v1/forecast",
    "photonEndpoint": "https://photon.komoot.io/api/",
    "overpassEndpoint": "https://overpass-api.de/api/interpreter",
    "wikipediaLanguage": "zh",
    "googleMapsEmbedKey": ""
  }
}
```

All endpoints are replaceable so a future fork can self-host Photon/Overpass or use another provider without changing the view architecture.

## Offline behavior

After the first successful visit:

- app shell and `trip.json` are cached
- latest trip snapshot remains in IndexedDB
- provider JSON responses use IndexedDB caches
- MapLibre/OpenFreeMap runtime assets are cached opportunistically with a bounded service-worker cache
- itinerary/checklists/notes remain useful offline even when live weather/search cannot refresh

## Quick start

1. Edit or replace `trip.json`.
2. Prefer giving itinerary items stable IDs and `lat`/`lng`.
3. Commit and push to `main`.
4. GitHub Pages serves the repository root directly.
5. Open the page once online before travel.

For local preview:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Vibe-coding rule

For a normal new trip, change `trip.json` first. Keep the static shell stable. Add/port client capabilities only when they are broadly reusable by future trips.

See [`AGENTS.md`](./AGENTS.md) for implementation guardrails.
