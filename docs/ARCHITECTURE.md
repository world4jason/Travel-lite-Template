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
- What is today's plan?
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

## Responsive shell

Travel Lite uses one data/state model with different presentation shells.

```text
trip.json + local state
        ↓
 shared rendering/runtime
        ↓
 ┌───────────────┬────────────────┐
 │ phone shell   │ desktop shell  │
 │ bottom nav    │ left nav       │
 │ touch-first   │ wider dashboard│
 └───────────────┴────────────────┘
```

The breakpoint is intentionally simple: desktop layout starts at `900px`.

This is **not** two applications. Do not fork view logic, data loading, storage, or decision semantics by form factor. Prefer CSS/layout changes and small shell helpers.

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
desktop-theme.css      responsive desktop shell + neutral theme tokens
app.js                 core views and trip rendering
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
6. Can phone and desktop share the same data/runtime logic?
7. Does the feature work in system/light/dark without encoding meaning only in color?

If the answer pushes toward planning, synchronization, or a large provider integration, keep it out of the base template.
