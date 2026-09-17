# Architecture

Travel Lite is a **post-planning trip decision companion**, not a planner.

The normal workflow is:

```text
people + LLM + spreadsheets + maps + booking tools
                    ↓
             planning/discussion
                    ↓
                 trip.json
                    ↓
             Travel Lite site
                    ↓
     glance / remind / decide / handoff
```

The site should feel like a small travel dashboard made of itinerary cards, reminder cards, decision cards, maps, and links.

## Core product boundary

Travel Lite should answer these quickly:

- What am I doing now?
- What is next?
- What is the whole-trip/day overview?
- What must I remember/check?
- Is anything intentionally TBD?
- What pre-researched options/context help that decision?
- Where is this stop?
- Which specialist app/site should I open next?

Do **not** turn the base template into:

- an itinerary planner/editor
- drag/drop scheduling
- route optimization or turn-by-turn navigation
- a live-transit engine
- a ratings/review database
- a recommendation/discovery engine
- a collaboration/account backend
- cross-device synchronization

## Trip information hierarchy

The Trip view is intentionally **information first, actions second**.

```text
Trip
├── Overview
│   ├── daily summaries
│   ├── flexible highlights / activities
│   └── open shared decisions
└── Day
    ├── route at a glance
    ├── compact timeline
    ├── optional transfer context
    └── small specialist handoff actions
```

This avoids the anti-pattern where every itinerary row becomes a cluster of large buttons.

Default action budget per itinerary item:

- one small Google Maps action
- one overflow menu for secondary external/search links

`decision` and `infoCard` are content surfaces, not primary action buttons.

`routeSummary`, `highlights`, and `transferAfter` are static/vibe-time structures. They support scanability and decision-making but must not be used to imitate live routing or recommendations.

## Responsive composition

Travel Lite uses one data/state/runtime model, but **re-composes the same information** depending on available width.

```text
< 900px
phone
└── single-column content + bottom navigation

900–1399px
compact desktop / tablet landscape
├── persistent trip-day / reference rail
└── main content + horizontal primary navigation

>= 1400px
wide desktop
├── trip-day / reference rail
├── main content
└── trip context rail
    ├── trip overview
    ├── selected-day stops
    ├── reminders
    └── quick access
```

This is not three applications. The responsive shell may reveal information side by side on a wide display that the phone reaches by switching views, but it must reuse the same:

- `trip.json`
- view renderers
- IndexedDB/localStorage state
- decision semantics
- provider/handoff behavior

Do not create desktop-only business logic just because there is more space. Prefer CSS grid plus small shell/context helpers.

A useful principle is **collapse before squeeze**: if a viewport cannot comfortably hold a context panel, hide/collapse that panel instead of shrinking the main itinerary or map into an unusable strip.

## Appearance / theme

Appearance is a device-local preference with three modes:

- `system` — follows the operating system/browser preference
- `light`
- `dark`

Theme uses semantic CSS tokens (`--bg`, `--surface`, `--text`, `--muted`, `--line`, etc.). `trip.accent` is a trip-specific accent, not the product's fixed brand color.

The planned-stop map follows the effective theme by default:

- light → OpenFreeMap Liberty
- dark → OpenFreeMap Dark

A trip/fork may override `mapStyleLight` / `mapStyleDark` in provider configuration.

## Shared truth vs local state

This is the most important architectural invariant:

```text
trip.json    = shared truth
IndexedDB    = device-local mutable state
localStorage = fallback only
```

Because GitHub Pages has no shared synchronization backend:

- shared TBD decisions are informational/read-only in the generated page
- a shared decision is resolved only when shared `trip.json` contains `resolvedOptionId`
- `decision.mode: "personal"` may store a private preference on one device
- local state must never imply that another traveller sees the same state

## Runtime responsibilities

### Static/shared data

`trip.json` should contain stable facts prepared during vibe-time:

- itinerary and times
- places and coordinates
- day route summaries
- flexible trip highlights
- stable transfer context
- reminders
- shared TBD options
- reservations/tickets/reference links
- static place `infoCard` content
- Google Maps search shortcuts
- optional accent/map-style configuration

### Local mutable state

IndexedDB stores small user/device state:

- checklist completion
- todo completion
- personal decision preferences
- personal quick note
- selected view/day/theme
- latest trip snapshot
- small runtime-provider caches

### Small live context

Only information that meaningfully changes during the trip should normally be fetched at runtime. The base template currently keeps this deliberately small:

- weather via Open-Meteo
- map tiles/style via MapLibre/OpenFreeMap

Failure of these services must not block itinerary/reference use.

## Handoff-first design

Prefer specialist tools over rebuilding weaker copies inside Travel Lite.

Examples:

- reviews/photos/navigation → Google Maps
- restaurant research → Tabelog/local services
- live railway/transit → NAVITIME, Jorudan, operator app/site
- booking changes → original booking service
- ticket/live status → airline, rail, attraction operator

Use:

- `externalLinks` for concrete specialist pages
- `googleSearches` for lightweight Google Maps queries around a planned stop

Do not scrape or mirror specialist services.

## Static info cards

Background/context should usually be researched by the LLM/agent before deployment and written into `item.infoCard`.

This is preferable to runtime Wikipedia/Wikidata enrichment because it:

- works offline
- avoids entity-matching errors
- lets the agent curate only relevant facts
- reduces runtime dependencies

Source links should remain attached to the card.

## File responsibilities

```text
index.html             static shell
styles.css             base UI
runtime.css            runtime companion/map/info-card UI
desktop-theme.css      neutral theme tokens + legacy desktop shell overrides
trip-view.css          Trip overview / compact timeline / transfer UI
responsive-shell.css   three-stage responsive composition
app.js                 core views and trip rendering
trip-view.js           Trip overview and information-first day rendering
responsive-shell.js    derived day/context rails for wider viewports
storage.js             IndexedDB + localStorage fallback
runtime-features.js    weather + planned-stop MapLibre overview
runtime-google.js      Google Maps URL/embed helpers
runtime-handoff.js     external links, Google searches, decisions, info cards
runtime-providers.js   small live providers (weather + map config)
theme-shell.js         quick theme control + effective light/dark map style
sw.js                  PWA/offline cache
trip.json              shared trip data
manifest.webmanifest   installable PWA metadata
```

## TREK relationship

Travel Lite inherits useful **client-side travel patterns** from TREK: responsive desktop/mobile shells, current/next context, day itinerary, map, packing/todos, appearance modes, offline/PWA, and local storage patterns.

It deliberately drops TREK's server/multi-user scope. Source reuse is allowed under AGPL when applicable notices and modification obligations are preserved. See `NOTICE.md`.

Source reuse does not imply product-scope reuse. Prefer the smallest browser-native/static implementation that supports the companion workflow.

## Extension rule

Before adding a new capability, ask:

1. Is this useful during the trip after planning is mostly complete?
2. Can it be represented as static data, a small local state, or a specialist link?
3. Does it require shared synchronization? If yes, it does not belong in the base template without a real backend.
4. Does a mature specialist app already do it better? If yes, hand off instead.
5. Will the core site still work if the external service fails?
6. Can phone, compact desktop, and wide desktop share the same data/runtime logic?
7. Does the feature work in system/light/dark without encoding meaning only in color?
8. Does it improve information density without turning every row into actions?

If the answer pushes toward planning, synchronization, or a large provider integration, keep it out of the base template.
