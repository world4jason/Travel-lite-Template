# Agent instructions

Travel Lite is a **post-planning trip decision companion** deployed as a static GitHub Pages site.

Before making non-trivial changes, read:

1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
2. [`docs/COMPANION_UX.md`](./docs/COMPANION_UX.md)
3. [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md)
4. [`docs/TIMEZONE.md`](./docs/TIMEZONE.md)
5. [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md)

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

- What was the previous scheduled item?
- What is scheduled now?
- What is next?
- What must I remember/check?
- What is the trip/day overview?
- Is anything intentionally TBD/floating today?
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
- booking/expense editing
- planner undo/redo

Prefer specialist handoff links over rebuilding mature tools.

## Now / time semantics

`Now` is a **schedule reference**, not location tracking.

- show previous / scheduled-now / next so early or delayed travellers can orient themselves
- say **Scheduled now**, not “you are here”
- only valid `HH:MM` starts participate in time calculations
- `start: "TBD"` or missing `start` is floating and must never become 00:00/current
- floating items stay visible under Flexible today / Trip
- additional future items may be shown after the three-item reference window

## Timezone semantics

Multi-country trips may override the default trip timezone without adding planner UI.

```text
item.timezone
→ day.timezone
→ trip.timezone
```

- use valid IANA timezone identifiers
- interpret each `day.date` in the day timezone
- interpret each timed item in its effective item/day/trip timezone
- compare timed items as absolute instants, not raw `HH:MM` strings across countries
- preserve source-local clock times; do not invent converted flight schedules
- keep `TBD` / missing times floating
- prefer separate departure/arrival entries when transport crosses dates/zones

See [`docs/TIMEZONE.md`](./docs/TIMEZONE.md).

## Trip information hierarchy

The Trip view is **information first, actions second**.

- `Overview` should summarize days, flexible highlights, and unresolved shared choices.
- A day should show a route-at-a-glance before the detailed timeline.
- `transferAfter` may show stable transition context between stops, but must not pretend to be live routing.
- Each itinerary item should normally expose at most one small Google Maps action plus one overflow for secondary links.
- Do not render every `externalLinks` / `googleSearches` entry as a large button.
- `decision` and `infoCard` are content surfaces, not primary action buttons.

Use optional `highlights`, `routeSummary`, and `transferAfter` only when they improve scanability. Do not fill them with invented detail just because the schema supports them.

## Map invariant

Map is a read-only spatial reference for **already planned stops**.

- number markers in itinerary order
- emphasize the selected stop
- keep Google Maps / specialist handoff
- do not add route optimization, transport-mode editing, live rerouting, or place discovery
- only render real route geometry if a fork supplies trusted geometry prepared outside the base template

## Responsive + appearance invariant

Responsive design may **rearrange, reveal, or collapse the same information**, but must not fork trip data or business logic by form factor.

```text
< 900px
phone
└── single-column content + bottom navigation

900–1399px
compact desktop / tablet landscape
├── persistent trip-day rail
└── main content + horizontal primary navigation

>= 1400px
wide desktop
├── trip-day / reference rail
├── main content
└── context-sensitive rail
```

The wide right rail must depend on the current view (Now / Trip / Map / Check / More). Do not fill it with duplicate timeline content just because space exists.

Do not duplicate data loading, storage, decision semantics, or view business logic just to support another breakpoint.

Appearance must support `system`, `light`, and `dark`.

- style with semantic theme tokens rather than hard-coded light/dark colors
- `trip.accent` is trip decoration, not a fixed product brand
- maps should follow the effective light/dark mode unless a trip explicitly overrides the styles
- never encode important meaning only through color

## Offline / share / locale

- show whether the traveller is seeing a network copy or an offline snapshot
- prefer `trip.updatedAt` / `trip.revision` as shared publish metadata
- deep links select read-only context (`#trip/day/...`, `#map/day/.../stop/...`)
- Web Share / copy-link is allowed; collaborative editing sessions are not
- shell labels may use `ui.locale` and `ui.labels`; do not introduce a heavy i18n framework unless a fork truly needs it
- traveller-facing UI must not say “update trip.json” or expose implementation jargon

## Default trip-generation workflow

When given a planning result, PDF, spreadsheet, notes, or chat transcript:

1. Normalize it into `trip.json`.
2. Keep the application shell unchanged unless reusable behavior genuinely needs to change.
3. Preserve stable IDs.
4. Resolve stable places at vibe-time (`title`, `location`, `lat`, `lng`).
5. Preserve source-local dates/times; set `day.timezone` / `item.timezone` only when the source crosses timezone boundaries or explicitly requires an override.
6. Add concise `day.reminders` for operational reminders.
7. Preserve small shared TBDs as `decision` cards instead of inventing an answer.
8. Use `externalLinks` for concrete Tabelog/booking/operator/transit/etc. pages.
9. Use `googleSearches` for lightweight Google Maps queries rather than adding discovery APIs.
10. Use static `infoCard` content for researched place background.
11. Use `highlights` for flexible/seasonal activities that belong in the trip overview but are not fixed timeline stops.
12. Use `routeSummary` / `transferAfter` only when the source discussion or research supports them.
13. Set `updatedAt` / `revision` when publishing a new shared itinerary version.
14. Omit optional modules when there is no real data.

Never invent URLs, booking details, coordinates, durations, timezone conversions, live transit data, or resolved decisions.

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
- preserve phone, compact-desktop, and wide-desktop usability
- verify system/light/dark appearance
- keep Trip/Now scanability high and repeated actions low
- test direct deep links and resize without losing selected day/theme/local state
- test multi-timezone date rollover when changing time semantics
- bump the Service Worker shell cache version when cached shell behavior/assets materially change

Follow the repeatable review checklist in [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md).

## Documentation ownership

- human setup/features → `README.md`
- agent rules → `AGENTS.md`
- architecture/scope → `docs/ARCHITECTURE.md`
- day-of interaction contract → `docs/COMPANION_UX.md`
- trip data contract → `docs/TRIP_SCHEMA.md`
- timezone contract → `docs/TIMEZONE.md`
- development/review/deployment → `docs/MAINTENANCE.md`
- attribution/license source reuse → `NOTICE.md` / `LICENSE`

Do not add historical discussion, one-off acceptance reports, or PR recap documents to the template root.
