# Agent instructions

Travel Lite is a **post-planning travel decision companion** for GitHub Pages. The trip has already been discussed and mostly planned before this template is generated. The traveller opens it during the trip to quickly check what is happening now, what is next, reminders, tickets/notes, any small unresolved choices, and where to hand off to a specialist app.

It is intentionally **not a trip planner** and must not grow into an all-in-one travel super app.

## Product invariant

The default experience should answer these questions in a few seconds:

1. `Now` — What am I doing now? What is next? What must I remember? Is there a useful weather context?
2. `Trip` — What is today's already-discussed schedule? Which items are fixed, optional, or still TBD?
3. `Map` — Where are today's planned stops? Open the user's normal map app for details/navigation/reviews.
4. `Check` — What still needs to be done/packed?
5. `More` — Where are my reservation/ticket/note/contact links?

`ui.bottomNav` may hide unused views. Do not introduce a backend merely to support a small trip.

## Decision-support rule

A trip may still contain small decisions that were intentionally left open during planning. Represent those as **decision cards**, not as a planner/editor.

Use `item.decision` when the planning discussion has already narrowed the choice to a small number of concrete options:

```json
{
  "id": "d2-lunch",
  "title": "Lunch",
  "decision": {
    "prompt": "Eat before moving, or head to Kichijoji first?",
    "context": "Choose based on crowd and energy.",
    "options": [
      { "id": "a", "label": "Eat here", "note": "Less transit." },
      { "id": "b", "label": "Move first", "note": "Eat near the afternoon stop." }
    ]
  }
}
```

The selected option is device-local state in IndexedDB. It does **not** rewrite, reorder, or reschedule the itinerary. Do not add a generic itinerary editor to support this.

Good decision-card examples:
- lunch option A vs B after considering weather/crowd/energy
- indoor vs outdoor optional stop
- take the scenic route vs direct route
- choose which already-researched restaurant to use

Bad uses:
- open-ended destination planning
- searching hundreds of recommendations
- drag/drop scheduling
- automatically rebuilding the day's itinerary

## Handoff-first rule

Prefer a link to the authoritative/specialist app over rebuilding its functionality.

Examples:

- ratings/reviews/opening details/photos/navigation -> Google Maps or the traveller's chosen map app
- destination-specific restaurant reviews -> direct link such as Tabelog when supplied by the itinerary
- live train/transit times/disruptions -> local timetable/transit app or operator site
- reservations -> original booking page
- attraction tickets -> official/provider page
- airline/train status -> carrier/operator page

Activities may use `externalLinks` for these handoffs. Do not scrape or mirror specialist services.

## Data/storage boundaries

- `trip.json` is the shared, version-controlled source of truth.
- IndexedDB is the preferred device-local store for checklist/todo state, decision selections, personal notes, UI state, snapshots, and small runtime caches.
- localStorage is only a fallback when IndexedDB is unavailable.
- The service worker caches the app shell, `trip.json`, and bounded runtime assets.
- Never put secrets, passport data, private credentials, or sensitive booking codes in a public repository.

## Default change strategy

When given a finalized or mostly-final itinerary, PDF, spreadsheet, notes, or a planning-chat result:

1. Normalize it into `trip.json`.
2. Preserve stable IDs for days, activities, todos, checklists, and decision options.
3. Resolve stable locations at vibe-time: prefer explicit `lat`/`lng`, title, address/location, and useful external links.
4. Preserve intentional ambiguity as small `decision` cards or TBD labels instead of inventing a decision.
5. Keep the app shell stable.
6. Add only trip-reference modules that have real data (`reservations`, `notes`, `files`, `contacts`, links). Optional modules such as costs/journal should be omitted when unused.
7. Use runtime providers only for small changing context such as weather. Discovery helpers are optional and off by default.
8. Do not introduce auth, SSR, a server database, paid services, secret API keys, itinerary-planning workflows, route optimizers, or live-transit engines unless explicitly requested for a fork.

## Trip data rules

- Dates: `YYYY-MM-DD`.
- Activity times: local trip time, `HH:MM`.
- Prefer explicit `end` times so `Now` can determine the active activity.
- Every day and activity should have a stable `id`.
- Prefer `lat`/`lng` for real places; runtime geocoding is not required for normal use.
- `day.reminders` contains concise day-of reminders; do not bury operational reminders in long prose.
- For Google Maps handoff, use `googlePlaceId` when known; otherwise title + address/location is preferred over coordinates alone.
- `externalLinks` should point to concrete useful pages and must never be invented.
- Checklist, todo, and decision-option IDs must remain stable or local state may reset.
- Change `trip.id` for a genuinely different trip so local browser state is isolated.

## Runtime-provider rules

### Weather
- Default: Open-Meteo.
- Cache responses in IndexedDB; failure must never break itinerary rendering.
- Forecast UI disappears gracefully outside the returned forecast window.

### Optional explore tools
- Photon place search, Wikipedia/Wikidata enrichment, and Overpass nearby POIs are **not part of the default travel flow**.
- They render only when `ui.enableExploreTools === true`.
- Keep them user-triggered, cached, and provider-replaceable.
- Never let optional discovery make the template harder to use or maintain.

### Maps and Google
- Default map overview: MapLibre + OpenFreeMap for already-planned stops.
- Google Maps URL is the normal reviews/details/navigation handoff and requires no key.
- Official Maps Embed API remains optional.

## Scope boundary

Do not add these to the base template:

- itinerary planning/editor workflow, drag/drop scheduling, undo/redo planning
- route optimization or a built-in navigation engine
- ratings/review database or scraping
- live transit timetable/disruption engine
- generic recommendation engine
- accounts, permissions, real-time collaboration, cross-device sync
- server uploads, booking extraction, plugins, MCP server, admin panel

A specialist link is usually the correct solution.

## Acceptance checks

- `trip.json` and `manifest.webmanifest` are valid JSON.
- `node --check` passes for all local JavaScript files.
- Core views render without any runtime provider succeeding.
- `ui.enableExploreTools` defaults to false/absent and no discovery UI appears by default.
- Map view still offers external map handoff if MapLibre fails.
- Checklist/todo/decision/personal-note state survives reload via IndexedDB (or localStorage fallback).
- The app opens after a reload with network disabled once loaded successfully online.
- Layout remains usable at 320px width; touch targets stay approximately 44px or larger.
- The project remains deployable as plain static files on GitHub Pages.
