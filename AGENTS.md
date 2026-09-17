# Agent instructions

Travel Lite is a **post-planning trip decision companion** deployed as a static GitHub Pages site.

Before making non-trivial changes, read:

1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
2. [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md)
3. [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md)

## Core invariant

```text
trip.json    = shared truth
IndexedDB    = this device only
localStorage = fallback only
```

Never make device-local state look like a shared group decision.

Shared TBDs are read-only unless `trip.json` contains `resolvedOptionId`. Only `decision.mode: "personal"` may persist a local preference.

## Product scope

The default experience should help a traveller answer quickly:

- What am I doing now?
- What is next?
- What must I remember/check?
- Is anything intentionally TBD?
- What pre-researched context/options help that decision?
- Where is this stop?
- Which specialist app/site should I open next?

Do not turn the base template into:

- an itinerary planner/editor
- drag/drop scheduling
- route optimization/navigation
- a live-transit engine
- a review/recommendation database
- generic place/POI discovery
- collaboration/account/sync infrastructure

Prefer specialist handoff links over rebuilding mature tools.

## Default trip-generation workflow

When given a planning result, PDF, spreadsheet, notes, or chat transcript:

1. Normalize it into `trip.json`.
2. Keep the application shell unchanged unless reusable behavior genuinely needs to change.
3. Preserve stable IDs.
4. Resolve stable places at vibe-time (`title`, `location`, `lat`, `lng`).
5. Add concise `day.reminders` for operational reminders.
6. Preserve small shared TBDs as `decision` cards instead of inventing an answer.
7. Use `externalLinks` for concrete Tabelog/booking/operator/transit/etc. pages.
8. Use `googleSearches` for lightweight Google Maps queries rather than adding discovery APIs.
9. Use static `infoCard` content for researched place background.
10. Omit optional modules when there is no real data.

Never invent URLs, booking details, coordinates, or resolved decisions.

## Runtime boundary

Keep runtime network dependencies small:

- Open-Meteo → weather
- MapLibre/OpenFreeMap → planned-stop map
- Google Maps URLs → details/reviews/navigation handoff

Core itinerary/reference use must survive provider failure.

## Privacy

This is designed for static/public hosting. Do not put secrets, credentials, passport data, private tokens, or sensitive booking credentials in repository files.

## Code changes

If changing template code rather than trip data:

- keep it static-host friendly
- avoid server/backend requirements
- keep links sanitized
- preserve offline fallbacks
- preserve mobile usability
- bump the Service Worker shell cache version when cached shell behavior/assets materially change

Follow the repeatable review checklist in [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md).

## Documentation ownership

- human setup/features → `README.md`
- agent rules → `AGENTS.md`
- architecture/scope → `docs/ARCHITECTURE.md`
- trip data contract → `docs/TRIP_SCHEMA.md`
- development/review/deployment → `docs/MAINTENANCE.md`
- attribution/license source reuse → `NOTICE.md` / `LICENSE`

Do not add historical discussion, one-off acceptance reports, or PR recap documents to the template root.
