# Travel Lite Template

A responsive, local-first **trip decision companion** for turning a mostly-planned itinerary into one static GitHub Pages site.

Planning happens beforehand with people, an LLM, spreadsheets, maps, bookings, or other specialist tools. Travel Lite is the compact result people carry during the trip.

**Live site:** https://world4jason.github.io/Travel-lite-Template/

## What it does

- **Now** — previous / scheduled-now / next reference window, later plans, floating TBDs, reminders, and weather
- **Trip** — whole-trip overview, daily route summary, compact timeline, highlights, and open decisions
- **Map** — numbered planned stops on MapLibre/OpenFreeMap with selected-stop emphasis and Google Maps handoff
- **Check** — todos and checklists stored on this device
- **More** — reservations, tickets, notes, contacts, links, and a local quick note
- **Responsive shell** — phone single-column/bottom nav; compact desktop day rail; wide desktop day rail + context-sensitive rail
- **Appearance** — `Auto` / `Light` / `Dark`, stored per device
- **Offline/PWA** — app shell and trip snapshot remain usable after the first successful load, with freshness status
- **Share / deep links** — share or copy the current read-only trip/day/map context without a backend

Travel Lite is **not** a planner, route optimizer, live-transit engine, review database, booking editor, or collaboration backend.

## Shared truth vs local state

```text
trip.json    = shared truth for everyone using the site
IndexedDB    = private state on this device
localStorage = fallback when IndexedDB is unavailable
```

Shared TBD decisions are read-only in the page. A group decision becomes authoritative only after `trip.json` is regenerated or updated. `decision.mode: "personal"` may store a personal preference locally.

## Day-of Now view

`Now` is a **schedule reference**, not GPS presence tracking.

```text
Previous
Scheduled now
Next
```

This deliberately keeps the immediately adjacent itinerary items visible so travellers can orient themselves when they are early, delayed, or between activities.

Only valid local `HH:MM` starts participate in the timed window. An item with `start: "TBD"` (or no start) stays visible as **Flexible today** and is never treated as midnight/current.

## Information-first Trip view

The Trip view is designed like an itinerary dashboard, not an action launcher:

```text
Overview
├── daily summaries
├── flexible highlights / activities
└── unresolved shared decisions

Day
├── route at a glance
├── compact timeline
├── optional transfer context
└── small specialist handoff actions
```

Each stop normally exposes only a small Google Maps action plus an overflow for secondary links. Large repeated `Trip map / Google Maps / Nearby...` button rows are intentionally avoided.

## Handoff-first

Use specialist tools for specialist jobs:

- reviews, photos, navigation → Google Maps
- restaurant-specific research → Tabelog or another local service
- live transit → NAVITIME, Jorudan, operator apps/sites, etc.
- booking changes → original booking service
- tickets/status → carrier or attraction operator

Activities can carry direct `externalLinks` and small `googleSearches` shortcuts. Stable place background can be prepared by the LLM/agent at vibe-time and stored as a static `infoCard` in `trip.json`.

## Responsive + theme behavior

Travel Lite uses **one data model, different information compositions**. Responsive design may rearrange, reveal, or collapse existing information, but must not fork trip data or business logic.

```text
< 900px
phone
└── single-column content + bottom navigation

900–1399px
compact desktop / tablet landscape
├── persistent trip-day rail
└── main content with horizontal primary navigation

>= 1400px
wide desktop
├── trip-day / reference rail
├── main content
└── context-sensitive rail
```

The wide right rail changes with the current view instead of repeating the same timeline everywhere:

- Now → previous/current/next, reminders, weather
- Trip overview → stats, open choices, reservations
- Trip day → weather, reminders, reservations, unresolved decisions
- Map → selected stop and specialist links
- Check → completion and important incomplete items
- More → device/offline freshness

Theme choices are `system`, `light`, and `dark`. The quick header control cycles them, while the full selector remains under **More → Appearance**. The trip accent is data-driven through `trip.accent`; it is decoration, not the product identity.

## Offline freshness

Use shared publish metadata when generating a trip:

```json
{
  "trip": {
    "updatedAt": "2026-09-17T16:10:00+08:00",
    "revision": "trip-2026-09-17-03"
  }
}
```

The header can then distinguish a fresh network copy from an IndexedDB fallback such as:

```text
Online · updated Sep 17, 16:10
Offline copy · updated Sep 17, 16:10
```

Checklist and personal-note changes are local state and do not change the shared trip revision.

## Share and deep links

The share button uses the Web Share API when available and falls back to copying the current URL.

Read-only URL hashes preserve context, for example:

```text
#now
#trip/overview
#trip/day/2026-10-04
#map/day/2026-10-04/stop/d2-ueno
#check
#more
```

These are navigation links, not collaborative editing sessions.

## Locale / labels

The base template keeps localization lightweight. Set a shell locale and optionally override individual labels:

```json
{
  "ui": {
    "locale": "zh-TW",
    "labels": {
      "navNow": "現在",
      "navTrip": "行程"
    }
  }
}
```

Built-in companion/shell labels cover English and Traditional Chinese; trip content itself remains whatever language the generating agent writes.

## Quick start

1. Fork/use this repository as a base.
2. Replace `trip.json` with the output of your planning/discussion.
3. Keep stable IDs for days, activities, checklist items, todos, and decision options.
4. Add `lat`/`lng`, useful external links, reminders, TBD cards, and optional static info cards.
5. Use optional `highlights`, `routeSummary`, and `transferAfter` only when they make the trip easier to scan.
6. Set `trip.updatedAt` / `trip.revision` when publishing a new shared version.
7. Optionally set `ui.locale`, `trip.accent`, and provider map styles.
8. Push to `main`.

No build step, server, account system, or server database is required.

## GitHub Pages

This repository is a plain static site and includes `.nojekyll`, so GitHub Pages can publish the repository root directly.

Enable it once:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **`main`**.
4. Select folder **`/ (root)`**.
5. Click **Save**.

After that, pushes to `main` publish automatically. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Expected URL pattern:

```text
https://<github-user>.github.io/<repo-name>/
```

For this repository:

```text
https://world4jason.github.io/Travel-lite-Template/
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Documentation

- [`AGENTS.md`](./AGENTS.md) — concise rules for coding agents
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — product boundaries, runtime architecture, responsive shell, storage, handoff model
- [`docs/COMPANION_UX.md`](./docs/COMPANION_UX.md) — day-of Now/TBD/map/offline/share/locale interaction contract
- [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md) — how an LLM/agent should fill `trip.json`
- [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md) — development, PWA/cache, responsive/theme review, and acceptance checklist
- [`NOTICE.md`](./NOTICE.md) — TREK attribution/source-reuse notes

## Runtime services

- Map: MapLibre + OpenFreeMap (light/dark styles)
- Weather: Open-Meteo, cached locally
- Details/reviews/navigation: Google Maps URL handoff

External services are enhancements. The itinerary, reminders, checklist, reservations, and local notes should remain useful when they are unavailable.

## License

Travel Lite is AGPL-3.0-or-later. See `LICENSE` and `NOTICE.md` for attribution notes when adapting TREK code.
