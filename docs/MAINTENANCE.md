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
node --check bootstrap.js
node --check app.js
node --check trip-view.js
node --check responsive-shell.js
node --check companion-ux.js
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

## Repeatable mobile layout regression

The repository includes a local Playwright/Chromium layout harness. It does not depend on GitHub Actions.

One-time setup:

```bash
npm install
npx playwright install chromium
```

Run the mobile/read-only companion matrix:

```bash
npm run test:mobile
```

Use the headed variant for visual review:

```bash
npm run test:mobile:headed
```

The harness serves the repository on `127.0.0.1:4317` and never reuses an existing server, so an unrelated local dev server cannot be tested by mistake. If that port is busy, pick another:

```bash
TRAVEL_LITE_TEST_PORT=4400 npm run test:mobile
```

The harness freezes time against an isolated 32-day stress fixture and covers:

- 320 / 360 / 375 / 390 / 430 phone widths
- 820 tablet portrait
- 1100 compact desktop
- 1600 wide desktop
- Now / Trip / Map / Check / More
- long-trip navigation
- fully untimed Today Brief
- long mixed-language/generated strings: every `title` / `label` / `location` / `prompt` / `subtitle` / `name` / `note` in the fixture carries an unbroken token, so a new component cannot escape coverage by having short sample text
- responsive deep-link persistence
- enlarged-text reflow

The primary invariant is that the document shell never becomes wider than the viewport. Explicit component-level horizontal rails remain allowed.

A second invariant covers controls: every visible interactive element (links, buttons, selects, summaries, inputs) must lie horizontally inside the viewport and must not overlap another control in the same layer. Fixed/sticky chrome and the absolutely positioned body of an open `<details>` popover count as their own layers; only the known horizontal rails (`.day-tabs`, `.place-chips`, `.trip-route-steps`) are exempt, so vertically scrolling desktop rails are still checked. Every overflow menu and info card in the fixture is opened and checked explicitly, because left-edge clipping does not create document overflow. Each control is also scrolled to the viewport centre and must be the `elementFromPoint` target at its own centre: fixed/sticky chrome covering it is a failure, and only an open `<details>` popover may cover it. A permanent negative test covers content with an oversized fixed bottom nav and with a sticky layer, and adds a control that can never be scrolled into view, and expects each to fail.

The harness serves MapLibre from the pinned `maplibre-gl` devDependency instead of the CDN, answers map style requests with a minimal local style (tiles are blocked), and checks the Map view only after a real map has initialised; a silent fallback fails the run. The fallback message has its own test, and the Map is rechecked after selecting another stop. When `runtime-features.js` moves to a new MapLibre version, bump the devDependency to the same version; the spec refuses to run if they differ.

## Product acceptance

The base template should continue to satisfy:

- `Now` shows **previous / scheduled-now / next** as a reference window
- early/delayed travellers can see adjacent scheduled items without pretending GPS presence is known
- only valid `HH:MM` starts participate in time calculations
- missing/`TBD` start times remain floating and never become midnight/current
- reminders and floating/TBD items remain visible
- shared TBD cards cannot be resolved locally
- `decision.mode: "personal"` clearly remains device-local
- traveller-facing text does not mention `trip.json` or implementation instructions
- `Trip` opens with a whole-trip overview rather than a wall of stop actions
- Trip overview summarizes days, optional highlights, and unresolved shared decisions
- a selected day shows route-at-a-glance + compact timeline
- transfer context is static/pre-researched and never presented as live transit
- itinerary rows keep an action budget: small map action + optional overflow, not repeated large buttons
- `Map` only shows already-planned stops and numbers markers in itinerary order
- selected map stop is visually distinct
- no route optimization/live routing is introduced
- Google Maps/external handoff remains available if the interactive map fails
- phone Map can use most of the remaining viewport without breaking bottom-nav safe areas
- `Check` persists completion in IndexedDB with localStorage fallback
- `More` remains reference-oriented
- provider failure never blocks core itinerary/reference use
- header distinguishes network data from an offline snapshot when possible
- Web Share/copy-link preserves current read-only context
- deep links can restore Now / Trip overview / Trip day / Map stop / Check / More
- simple `ui.locale` / `ui.labels` customization does not fork trip data
- phone layout remains usable on a narrow viewport
- compact desktop reveals a persistent day rail without squeezing the main view
- wide desktop context rail changes with the active view rather than duplicating the same stops everywhere
- `system`, `light`, and `dark` all remain readable
- switching theme does not lose local state
- the map follows the effective theme unless explicitly overridden

## Companion-UX review

After changing day-of behavior, test these cases explicitly:

### Timed window

Use a fixture/current time where the day contains at least three timed items.

Verify:

- previous points to the nearest earlier timed item
- scheduled-now is only set inside the scheduled window
- next is the next timed item, including the first item of a later day when today is finished
- later items do not duplicate the next item

### Floating/TBD

Use an item with either no `start` or `start: "TBD"`.

Verify:

- it does not become current
- it does not count as 00:00
- it remains visible in Flexible today / Trip
- shared decisions remain unresolved unless `resolvedOptionId` is present

### Offline freshness

Test both:

1. successful network `trip.json` load
2. failed `trip.json` network load after a prior successful snapshot

Verify the header distinguishes `Online` from `Offline copy` and retains the published `updatedAt` context.

### Deep links / share

Test direct loads for at least:

```text
#now
#trip/overview
#trip/day/<date>
#map/day/<date>/stop/<id>
#check
#more
```

Verify sharing/copying the current URL preserves the selected read-only context.

## Trip-view review

After changing Trip rendering, test both the Overview and at least one populated day.

Verify:

- Overview has clear day-level hierarchy before detailed stops
- route summaries do not invent routing facts
- `highlights` stay small and useful rather than becoming a recommendation feed
- open shared decisions remain visibly unresolved
- Google Maps is a small handoff, not the visual focus of each stop
- `externalLinks` / `googleSearches` live under overflow unless they are true primary information
- `decision` and `infoCard` remain content surfaces
- `transferAfter` appears between the correct stops and disappears cleanly when absent
- a dense item still scans well on mobile

## Responsive-shell review

Responsive changes must be tested across all three compositions, not just one phone and one desktop.

Suggested minimum:

```text
390 × 844    phone
1100 × 900   compact desktop / tablet landscape
1600 × 900   wide desktop
```

Verify:

### Phone `< 900px`

- single-column content
- bottom navigation remains available and safe-area friendly
- Trip keeps its own Overview / day chips because no persistent day rail exists
- Map can expand vertically without desktop rails leaking into the layout

### Compact desktop `900–1399px`

- persistent left trip-day/reference rail is visible
- right context rail is hidden
- primary navigation is horizontal above the main content
- Trip day chips are hidden because the persistent day rail replaces them
- clicking a day in the rail updates the same Trip renderer/state used on phone

### Wide desktop `>= 1400px`

- left trip-day/reference rail, main content, and right context rail are all visible
- right rail content matches the active view
- Now rail does not duplicate Trip-day context
- Map rail shows selected-stop details rather than the whole timeline
- Check rail shows completion/incomplete items

Across all sizes:

- do not duplicate data loading/storage/decision semantics by breakpoint
- prefer collapsing a context panel over squeezing the main itinerary/map
- map and timeline widths remain usable
- resizing does not lose selected day, checklist state, theme, or deep-link context

## Theme review

Appearance is a local preference. Verify all three modes:

- `system`
- `light`
- `dark`

Theme styling should come from semantic tokens rather than scattered hard-coded colors. `trip.accent` may tint buttons/status elements, but should not become a fixed product identity or the sole carrier of meaning.

The quick header control and **More → Appearance** must remain consistent with the same stored theme value.

## Mobile reflow / overflow acceptance

For phone-facing template changes, validate the page shell at **320 / 360 / 375 / 390 / 430 CSS px**.

- readable page content must reflow without document-level horizontal scrolling
- explicit horizontal rails such as day chips / route chips may scroll inside their own component
- long generated titles, place names, URLs, and mixed CJK/Latin strings must wrap rather than widen the page
- check `document.documentElement.scrollWidth <= window.innerWidth` on Now, Trip, Check, More, and the non-map shell around Map
- full-bleed mobile surfaces must derive their negative margin from `--shell-gutter`; do not hard-code a different gutter
- do not use page-level overflow clipping as the only fix for an overflowing child

## PWA / Service Worker rule

`sw.js` precaches the application shell.

When changing cached shell files or behavior in a way that existing clients must refresh, bump the shell cache name, for example:

```js
const CACHE = "travel-lite-shell-v10";
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

Current handoff/info-card/trip-view/companion code allows expected safe protocols and rejects unexpected protocols. Preserve that behavior when adding new link surfaces.

Never commit secrets or require secret API keys in the base static template.

## Runtime provider policy

The base template intentionally keeps runtime providers small:

- Open-Meteo for weather
- OpenFreeMap/MapLibre for planned-stop map rendering
- Google Maps URLs for handoff

Do not reintroduce generic place search, POI discovery, runtime encyclopedia enrichment, live transit, or route optimization by default. Prefer:

- `googleSearches`
- `externalLinks`
- vibe-time `infoCard` generation
- static `routeSummary` / `transferAfter`

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
- Does the user understand whether they are looking at a network or offline copy?
- Did a shell change require a Service Worker cache bump?

### UX

- Is `Now` glanceable and useful when the group is early/delayed?
- Does Trip communicate information before actions?
- Are repeated cards/actions avoided?
- Are touch targets mobile-friendly?
- Does each breakpoint use its available space intentionally rather than merely scaling the same layout?
- Does the wide rail add context rather than duplicate the main view?
- Do light/dark/system all preserve contrast and hierarchy?
- Are optional modules hidden when their data is absent?

### Security/privacy

- Are dynamic links sanitized?
- Are secrets absent from public files?
- Are private booking credentials avoided?

## When to update documentation

- schema change → update `docs/TRIP_SCHEMA.md` or `docs/COMPANION_UX.md` when the contract is specifically day-of UX
- product/architecture boundary change → update `docs/ARCHITECTURE.md`
- maintenance/test/deployment change → update this file
- agent behavior/conventions change → update root `AGENTS.md`
- human-facing setup or feature change → update root `README.md`

Do not add one-off review notes or historical discussion documents to the template root. Use issues/PR history for that context.
