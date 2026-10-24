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

## Five-tab information architecture

Now/Trip/Transport/Places/More are stable tasks. Transport is the
existing MapLibre/spatial view (internal ID map), not live trip routing.
Places is a read-only index and detail for existing itinerary items,
not another itinerary database or search engine. More holds the local
preparation checklist and non-core tools; the legacy #check route remains.
All screens project one published trip dataset, without duplicate bookings
or transit data. Optional admission references use explicit item IDs.

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

### Optional site-level style (2026-10 decision)

The existing Editorial composition remains the **default**, with its regular `system` / `light` / `dark` themes. Thirteen explicitly opt-in, whitelisted `ui.visualStyle` values (`storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster`, `field-stamp`, `quiet-linocut`, `doodle-memory-grid`, `crayon-journal`, `painterly-editorial`, `geometric-print`, `quiet-acrylic`) render the same trip content as light-only notebook, rounded sticker art or risograph print layouts. Missing or invalid selections normalize to `editorial`.

The publisher chooses the **shared default** in `trip.json`. Travellers can switch among exactly fourteen reviewed Style Packs via **More → Appearance**; this is a **per-trip, device-local** display preference saved in TravelLiteStorage, not collaborative editing. A valid `?previewStyle=<built-in-style-id>` sharing link takes temporary precedence over that local preference; the next normal visit uses the saved local choice. Selecting/resetting in More clears the URL preview override while preserving any hash deep link. **Follow trip default** clears the device selection. This is a bounded picker, not a style editor, marketplace, automatic destination choice, or generator of executable CSS.

- Appearance selection uses a **native modal dialog** appended outside `#view-root`: compact More row → mobile bottom sheet or desktop right drawer. The renderer preserves the dialog node while `renderMore()` refreshes the underlying settings, avoiding focus/scroll loss on continuous desktop previews. The dialog never writes to shared `trip.json` and its DOM is not read from untrusted Style Briefs.
- `storybook-theme.css` is entirely disabled on Editorial trips; this protects existing CSS tokens and responsive layouts.
- `storybook-decor.js` maps whitelisted `illustration` keys to local generic SVGs, never arbitrary script/URL content or inferred title keywords.
- `trip-view.js` shares the same content/actions and only changes markup composition for the optional illustrated timeline.
- `storybook-motion.js` stores a **per-trip, device-local** motion preference; browser/OS `prefers-reduced-motion` remains authoritative.
- All thirteen non-Editorial packs use light surfaces. Storybook/Candy/Paper/Naive/Crayon Journal have reduced-motion-aware light animation, while Risograph/Taiwan Poster/Field Stamp are static. Editorial retains device theme changes and the light/dark map behavior. Candy extends Storybook with five-fill artwork and accessible ink exceptions; Risograph uses its own print layout. Paper, Naive, Taiwan Poster and Stamp have distinct materials and source-grounded graphic constraints.
- No style or local choice may change routes/timing, booking truth, privacy, checklist state, hash links or provider/handoff boundaries. Rapidly finishing a checklist save after navigation must not rerender the old checklist over the new view.
- **Surface role geometry (Issue #113):** semantic `data-surface-role` annotations are stable across packs. The late-loaded `surface-contract.css` owns reading-row frame/divider/inset/radius/fill via paired `--ui-reading-row-*` tokens; the pack still chooses its distinct aesthetic. A map workspace is **not** a generic `.panel` card. See [STYLE_SURFACE_CONTRACT.md](./STYLE_SURFACE_CONTRACT.md) for role ownership, visual invariants and staged migration. The role annotations do not add any style-specific JS behavior.

## Shared truth vs local state

This is the most important architectural invariant:

```text
trip.json    = shared truth
IndexedDB    = device-local mutable state, scoped to this site's base URL
localStorage = fallback only, also scoped to this site's base URL
```

Browser storage is origin-based, not GitHub Pages repository-path-based. Two sites on
`world4jason.github.io` can access the same origin's IndexedDB/localStorage.
`site-scope.js` derives a canonical deployment base URL from its own script URL.
`storage.js` uses a separate IndexedDB database per deployed site; its
localStorage fallback, the freshness timestamp in `bootstrap.js`, and the
Storyboard motion preference use that same site scope. `trip.id` is still
used within a site for per-trip local choices, but is **not** the storage
isolation boundary. Browser origin isolation is not a security boundary
between mutually untrusted sites on the same hostname; this prevents
accidental cross-site state collisions.

Existing pre-scoping data (`travel-lite` IndexedDB and old unscoped
localStorage keys) lacks trustworthy site provenance and is **never
implicitly migrated**. Upgrading a deployed legacy site can therefore require
re-entering device-only checks/notes/preferences once; existing legacy stores
are not deleted by this migration. When offline, an unavailable site-scoped
snapshot should show an error rather than another trip's data. A fresh online
visit creates a trusted site-scoped snapshot for later offline use.

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

### Enhancement layer initialisation

Enhancement scripts (`companion-ux.js`, `responsive-shell.js`, `theme-shell.js`, `long-trip-nav.js`) load with `defer` after `app.js`. `app.js` loads trip data, hydrates stored view/date, renders once, then sets `state.ready = true` and dispatches `travel-lite-ready`. A layer that needs trip data initialises with:

```js
if (state?.ready) init();
else window.addEventListener("travel-lite-ready", init, { once: true });
```

Do not poll `state.data` with a timeout: a slow or offline `trip.json` load can outlast it and silently skip initialisation. MutationObservers on `#view-root` or `data-theme` remain the mechanism for re-rendering after later view or theme changes.

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
