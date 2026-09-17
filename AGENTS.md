# Agent instructions

Travel Lite is a **post-planning travel decision companion** for GitHub Pages. The trip has already been discussed and mostly planned before this template is generated.

It is intentionally **not a trip planner** and must not grow into an all-in-one travel super app.

## Product invariant

The default experience should answer these questions in a few seconds:

1. `Now` — What am I doing now? What is next? What must I remember? Is there useful weather context?
2. `Trip` — What is today's already-discussed schedule? Which items are fixed, optional, or still TBD?
3. `Map` — Where are today's planned stops? Open the user's normal map app for details/navigation/reviews.
4. `Check` — What still needs to be done/packed?
5. `More` — Where are my reservation/ticket/note/contact links?

## Shared-state rule

```text
trip.json = shared truth
IndexedDB = private state on one device
```

Shared TBDs are **read-only** in the generated site. A shared choice becomes authoritative only when `resolvedOptionId` is written into shared `trip.json`.

Only `decision.mode: "personal"` may store a device-local preference. The UI must label that state as local/personal and never imply other travellers see it.

## Decision-support rule

Use `item.decision` only when planning has already narrowed the choice to a small number of concrete options. Do not add a generic itinerary editor.

Good examples:
- lunch option A vs B after considering weather/crowd/energy
- indoor vs outdoor optional stop
- choose one of two already-researched restaurants

Bad examples:
- open-ended destination planning
- searching hundreds of recommendations
- drag/drop scheduling
- automatically rebuilding the day

## Handoff-first rule

Prefer an authoritative/specialist app over rebuilding its functionality.

- ratings/reviews/photos/navigation → Google Maps or the traveller's map app
- destination-specific restaurant reviews → direct Tabelog/etc. link when known
- live train/transit → local timetable/operator app/site
- reservations → original booking page
- ticket/status → carrier/operator/provider page

Use `externalLinks` for concrete destinations. Do not scrape or mirror specialist services.

For lightweight nearby lookup, use `googleSearches` to generate Google Maps search URLs. Do not add a runtime discovery provider.

## Vibe-time enrichment

Resolve stable information before deployment:

- `lat` / `lng`
- title and human-readable location
- useful official/specialist links
- compact `infoCard` context
- `infoCard.sourceLinks`

Wikipedia, Wikidata, official sites, guide material, or other sources may be used by the coding agent **during research**. Do not fetch or entity-match them at runtime in the base template.

## Data/storage boundaries

- `trip.json` is shared, version-controlled truth.
- IndexedDB stores checklist/todo state, personal decision preferences, personal notes, UI state, trip snapshots, and small weather caches.
- localStorage is fallback only.
- The service worker caches the app shell, `trip.json`, and bounded map/runtime assets.
- Never put secrets, passport data, credentials, or sensitive booking codes in a public repository.

## Default change strategy

When given a finalized or mostly-final itinerary, PDF, spreadsheet, notes, or a planning-chat result:

1. Normalize it into `trip.json`.
2. Preserve stable IDs for days, activities, todos, checklists, and decision options.
3. Resolve stable locations and context at vibe-time.
4. Preserve intentional ambiguity as small shared decision cards instead of inventing a decision.
5. Add direct handoff links and optional Google Maps query shortcuts where useful.
6. Keep the app shell stable.
7. Add optional reference modules only when real data exists.
8. Do not introduce auth, SSR, server databases, secret API keys, planning workflows, route optimizers, live-transit engines, runtime discovery APIs, or shared local mutations.

## Trip data rules

- Dates: `YYYY-MM-DD`.
- Activity times: trip-local `HH:MM`.
- Prefer explicit `end` times so `Now` can determine the active activity.
- Every day/activity/decision option should have a stable `id`.
- Prefer `lat`/`lng` for real places.
- `day.reminders` contains concise day-of reminders.
- `externalLinks` must be concrete and not invented.
- `googleSearches` contains only `{label, query}` and hands off to Google Maps.
- `infoCard` contains static, sourced context useful during the visit; do not put live operational facts there unless explicitly marked as non-live.
- Change `trip.id` for a genuinely different trip.

## Runtime-provider rules

### Weather
- Default: Open-Meteo.
- Cache in IndexedDB.
- Failure must never block itinerary rendering.
- Hide forecast UI gracefully outside the returned forecast window.

### Map
- Planned-stop overview: MapLibre + OpenFreeMap.
- Google Maps URL is the normal reviews/details/navigation/search handoff.
- Official Maps Embed API remains optional.

### No runtime discovery in base
Do not add Photon, Overpass, Wikipedia/Wikidata runtime lookups, generic nearby recommendation APIs, or equivalent discovery providers to the base template. Use vibe-time research or specialist-app links instead.

## Scope boundary

Do not add these to the base template:

- itinerary planning/editor workflow
- route optimization or built-in navigation
- ratings/review database or scraping
- live transit timetable/disruption engine
- generic recommendation/discovery engine
- shared mutation state without a real sync backend
- accounts, permissions, collaboration, cross-device sync
- server uploads, booking extraction, plugins, MCP server, admin panel

## Acceptance checks

- `trip.json` and `manifest.webmanifest` are valid JSON.
- `node --check` passes for all local JavaScript files.
- Core views render without weather or map providers succeeding.
- No runtime Photon/Overpass/Wikipedia/Wikidata code remains.
- Map view still offers Google Maps handoff if MapLibre fails.
- Shared TBDs cannot be resolved in IndexedDB.
- Personal preferences/checklist/todo/note state survives reload via IndexedDB (or localStorage fallback).
- The app opens after a reload with network disabled once loaded successfully online.
- Layout remains usable at 320px width; touch targets stay approximately 44px or larger.
- The project remains deployable as plain static files on GitHub Pages.
