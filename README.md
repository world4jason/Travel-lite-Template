# Travel Lite Template

A responsive, local-first **trip decision companion** for turning a mostly-planned itinerary into one static GitHub Pages site.

Planning happens beforehand with people, an LLM, spreadsheets, maps, bookings, or other specialist tools. Travel Lite is the compact result people carry during the trip.

**Live site:** https://world4jason.github.io/Travel-lite-Template/

## What it does

- **Now** — current activity, next activity, reminders, weather, and open TBDs
- **Trip** — whole-trip overview, daily route summary, compact timeline, highlights, and open decisions
- **Map** — planned stops on MapLibre/OpenFreeMap with Google Maps handoff
- **Check** — todos and checklists stored on this device
- **More** — reservations, tickets, notes, contacts, links, and a local quick note
- **Responsive shell** — phone bottom navigation; desktop left navigation with a wider content area
- **Appearance** — `Auto` / `Light` / `Dark`, stored per device
- **Offline/PWA** — app shell and trip snapshot remain usable after the first successful load

Travel Lite is **not** a planner, route optimizer, live-transit engine, review database, or collaboration backend.

## Shared truth vs local state

```text
trip.json    = shared truth for everyone using the site
IndexedDB    = private state on this device
localStorage = fallback when IndexedDB is unavailable
```

Shared TBD decisions are read-only in the page. A group decision becomes authoritative only after `trip.json` is regenerated or updated. `decision.mode: "personal"` may store a personal preference locally.

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

Travel Lite uses **one data model, different shells**.

- phone: compact bottom navigation and touch-first layout
- desktop (`>= 900px`): sticky left navigation and a wider dashboard/content surface
- no duplicated desktop/mobile data or business logic

Theme choices are `system`, `light`, and `dark`. The quick header control cycles them, while the full selector remains under **More → Appearance**. The trip accent is data-driven through `trip.accent`; it is decoration, not the product identity.

The planned-stop map also follows the effective light/dark theme by default using OpenFreeMap styles.

## Quick start

1. Fork/use this repository as a base.
2. Replace `trip.json` with the output of your planning/discussion.
3. Keep stable IDs for days, activities, checklist items, todos, and decision options.
4. Add `lat`/`lng`, useful external links, reminders, TBD cards, and optional static info cards.
5. Use optional `highlights`, `routeSummary`, and `transferAfter` only when they make the trip easier to scan.
6. Optionally set `trip.accent` and provider map styles for the trip identity.
7. Push to `main`.

No build step, server, account system, or server database is required.

## GitHub Pages

This repository is a plain static site and includes `.nojekyll`, so GitHub Pages can publish the repository root directly.

Enable it once:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **`main`**.
4. Select folder **`/ (root)`**.
5. Click **Save**.

After that, pushes to `main` publish automatically. GitHub supports publishing directly from a branch root when no custom build process is needed. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

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
