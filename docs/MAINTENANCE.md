# Maintenance guide

This document is for future humans and coding agents maintaining the template itself.

For normal trip generation, prefer changing only `trip.json`. Change application code only when the behavior should be reusable across many future trips.

## Local preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

Do not rely on opening `index.html` directly with `file://`; the app fetches `trip.json` and uses Service Worker/PWA behavior.

## Validation

At minimum, before merging template changes:

```bash
node --check app.js
node --check storage.js
node --check runtime-providers.js
node --check runtime-features.js
node --check runtime-google.js
node --check runtime-handoff.js
node --check theme-shell.js
node --check sw.js
```

Also parse:

- `trip.json`
- `manifest.webmanifest`

## Product acceptance

The base template should continue to satisfy:

- `Now` shows current/next context without requiring live providers
- reminders remain concise and visible
- shared TBD cards cannot be resolved locally
- `decision.mode: "personal"` clearly remains device-local
- `Trip` is read-focused rather than an editor
- `Map` only shows already-planned stops
- Google Maps/external handoff remains available if the interactive map fails
- `Check` persists completion in IndexedDB with localStorage fallback
- `More` remains reference-oriented
- provider failure never blocks core itinerary/reference use
- phone layout remains usable on a narrow viewport
- desktop layout uses the wider surface without becoming a separate application
- `system`, `light`, and `dark` all remain readable
- switching theme does not lose local state
- the map follows the effective theme unless explicitly overridden

## Responsive-shell review

Test at least one phone and one desktop viewport after shell/layout changes.

Suggested minimum:

```text
390 × 844   phone
1440 × 900  desktop
```

Verify:

- phone keeps the bottom navigation
- desktop uses the left navigation at `>= 900px`
- the same views/data appear on both form factors
- no feature exists only because of duplicated desktop/mobile business logic
- map and timeline widths remain usable
- safe-area/mobile touch targets remain intact

## Theme review

Appearance is a local preference. Verify all three modes:

- `system`
- `light`
- `dark`

Theme styling should come from semantic tokens rather than scattered hard-coded colors. `trip.accent` may tint buttons/status elements, but should not become a fixed product identity or the sole carrier of meaning.

The quick header control and **More → Appearance** must remain consistent with the same stored theme value.

## PWA / Service Worker rule

`sw.js` precaches the application shell.

When changing cached shell files or behavior in a way that existing clients must refresh, bump the shell cache name, for example:

```js
const CACHE = "travel-lite-shell-v7";
```

If this is forgotten, returning users may continue seeing stale JavaScript/CSS until the old cache is replaced.

Keep runtime caching bounded. Do not turn the Service Worker into an unbounded map/download cache without an explicit storage-management design.

## Storage compatibility

Stable IDs are part of the data contract.

Changing these can reset local state:

- `trip.id`
- checklist IDs
- checklist item IDs
- todo IDs
- personal decision item/option IDs

Only change them intentionally.

`trip.json` is shared truth; IndexedDB is never shared truth.

## URL/content safety

Any URL rendered from trip data should be validated before use.

Current handoff/info-card code allows expected safe protocols and rejects unexpected protocols. Preserve that behavior when adding new link surfaces.

Never commit secrets or require secret API keys in the base static template.

## Runtime provider policy

The base template intentionally keeps runtime providers small:

- Open-Meteo for weather
- OpenFreeMap/MapLibre for planned-stop map rendering
- Google Maps URLs for handoff

Do not reintroduce generic place search, POI discovery, or runtime encyclopedia enrichment by default. Prefer:

- `googleSearches`
- `externalLinks`
- vibe-time `infoCard` generation

If a fork needs a larger provider integration, keep it fork-specific unless it clearly benefits the generic post-planning companion use case.

## GitHub Pages

The repository is intended to publish directly from:

```text
branch: main
folder: /(root)
```

There is no build output directory. `.nojekyll` is intentional.

When changing paths, remember the app is deployed under a repository subpath such as:

```text
/Travel-lite-Template/
```

Use relative asset URLs unless there is a strong reason not to.

## Code review checklist

Before merge, review for:

### Scope

- Does this help people during travel after planning is mostly complete?
- Is this turning into planner/editor/discovery/sync functionality?
- Could a specialist link solve it more simply?

### Shared/local correctness

- Does any IndexedDB mutation look like shared state?
- Can two travellers on different devices safely see different local states without confusion?
- Are shared decisions only resolved by shared data?

### Offline/fallback

- Does the core UI still work if weather/map/CDN calls fail?
- Is `trip.json` still available from the local snapshot after a successful prior load?
- Did a shell change require a Service Worker cache bump?

### UX

- Is `Now` still glanceable rather than dense?
- Are repeated cards/actions avoided?
- Are touch targets mobile-friendly?
- Does desktop use width effectively without adding extra product scope?
- Do light/dark/system all preserve contrast and hierarchy?
- Are optional modules hidden when their data is absent?

### Security/privacy

- Are dynamic links sanitized?
- Are secrets absent from public files?
- Are private booking credentials avoided?

## When to update documentation

- schema change → update `docs/TRIP_SCHEMA.md`
- product/architecture boundary change → update `docs/ARCHITECTURE.md`
- maintenance/test/deployment change → update this file
- agent behavior/conventions change → update root `AGENTS.md`
- human-facing setup or feature change → update root `README.md`

Do not add one-off review notes or historical discussion documents to the template root. Use issues/PR history for that context.
