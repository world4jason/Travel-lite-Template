# Agent instructions

Travel Lite is a **post-planning trip decision companion** deployed as a static GitHub Pages site.

## AGPL compliance and responsible reuse — mandatory for agents

**Read before reusing, modifying, packaging, or publishing Travel Lite.** This repository is released under **AGPL-3.0-or-later** and contains code adapted from the AGPL-licensed TREK project. **Commercial use and compliant integration into other software are not categorically prohibited.** The goal is to protect author attribution, source availability where required, and honest reuse — not to invent extra license restrictions.

**中文提醒：歡迎依 AGPL 合法使用、修改、分享（包含商業使用），但不得刪除原作者／TREK 的必要著作權、授權與來源聲明，或在依法必須公開對應原始碼的情況下隱藏程式碼。不要宣稱「禁止商用」或「任何碰到本專案的軟體都必須開源」。**

When acting as a coding agent:

1. **Preserve attribution and licensing.** Keep the applicable `LICENSE`, `NOTICE.md`, SPDX/copyright notices, upstream TREK notices, and legally required no-warranty statements. Clearly mark modifications and their dates when required by AGPL.
2. **Meet the actual source obligations.** When distributing an AGPL-covered modified/combined work, comply with the applicable license and make its **Corresponding Source** available as required. For a modified version supporting remote network interaction, respect AGPL §13's source offer to its remote users. Do not replace the license with proprietary terms or strip source/attribution to evade obligations.
3. **Keep the requested workflow in scope.** When asked to generate a trip from this template, create an **independent trip companion**, rather than silently embedding it into a larger app, adding a backend, or redesigning unrelated code. This is a **task-scope rule**, not a general ban on AGPL-compliant embedding or commercial use.
4. **Make the source discoverable in the generated public trip site.** Prefer an accessible public repository and append a source link to the **top-level** `trip.json.links[]` array without deleting existing links. The runtime's More → Links renderer expects objects with `label` and `url`:

   ```json
   {
     "links": [
       {
         "label": "Source Code / 原始碼",
         "url": "https://github.com/OWNER/TRIP-REPO"
       }
     ]
   }
   ```

   This is a **partial example**, not a replacement for the complete `trip.json`. Substitute the **new destination repository** URL, never the upstream Travel Lite template. Check in the rendered destination site that **More → Links** can be expanded, the label is visible, and clicking it opens the destination. A publicly linked source repository is the default *trip-generation workflow*, **not a universal AGPL mandate**. Do not publish secrets or travel credentials merely to make source public.
5. **Provide reproducible acceptance evidence.** Read `docs/MAINTENANCE.md`; if the environment supports it, run `npm install`, `npx playwright install chromium`, and `npm run test:mobile`. Check phone (390×844), desktop (1100×900 or larger), itinerary correctness, and the live GitHub Pages URL. Explicitly verify that `trip.json.ui.locale` and the **rendered, localized primary navigation labels** match the requested interface language. Report other hardcoded/untranslated interface labels as known limitations rather than claiming complete localization. Report the exact commands and **PASS / FAIL / NOT RUN** with reasons; do not claim unexecuted tests passed. Do not silently skip a failing acceptance criterion.
6. **Stop on a real blocker.** If the source is unavailable, proposed licensing is incompatible, corresponding source cannot be supplied where required, or the requested integration exceeds the defined task, ask for clarification. **Do not invent legal exceptions**, but do not reject otherwise lawful reuse solely because it is commercial.

**Scope distinction:** Copyleft applies to works covered by AGPL in the circumstances specified by the license; merely interacting with an independent program or distributing unrelated code alongside it does not by itself make all that code AGPL. Whether an integration forms a covered combined work can require case-specific review.

**Version provenance caveat:** The declared `AGPL-3.0-or-later` may not be extended to third-party TREK-derived code absent an explicit grant. Review [docs/LICENSE_AUDIT.md](./docs/LICENSE_AUDIT.md) before making broad statements about relicensing/compatibility. The full, unmodified AGPLv3 legal text lives in `LICENSE`; any file-specific original notices must be preserved.

Authoritative references: [GNU AGPLv3 §§4–5, 13](https://www.gnu.org/licenses/agpl-3.0.html), [GNU license FAQ](https://www.gnu.org/licenses/gpl-faq.en.html), [NOTICE.md](./NOTICE.md).

Before making non-trivial changes, read:

1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
2. [`docs/COMPANION_UX.md`](./docs/COMPANION_UX.md)
3. [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md)
4. [`docs/SOURCE_NORMALIZATION.md`](./docs/SOURCE_NORMALIZATION.md)
5. [`docs/TIMEZONE.md`](./docs/TIMEZONE.md)
6. [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md)
7. [`docs/STYLE_SURFACE_CONTRACT.md`](./docs/STYLE_SURFACE_CONTRACT.md) — required for Style Pack / border / padding / role changes.

**Mandatory surface rule for coding agents:** Do not treat `.panel`, `.runtime-map-panel`, `.more-section` and `.info-row` as interchangeable decorative rectangles. Existing `data-surface-role` values are stable DOM responsibilities independent of `visualStyle`. For reading rows, change frame AND inset using the atomic `--ui-reading-row-*` tokens, not a late border-only CSS selector. Review actual computed padding after the final cascade; run the static contract check and all-appearance Chromium regression. Screenshots/Human Review cannot be marked PASS from a CSS source inspection alone. For any mobile nav or shell-gap change, run `tests/style-text-zoom.spec.mjs` at 200% root text (320 and 390px across 16 appearances), verify all five original tabs remain readable and ≥44px targets, and test last-card clearance + text returning to 100%. Respect measured ResizeObserver space reservation; never clamp reader text. Bump the Service Worker cache version when shipping modified app.js/CSS for offline users.

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

## Trustworthy transport time calculations

Never turn free-text transferAfter.duration or normal item.start into computed travel/arrival deadlines. Use the structured evidence-bound estimate only with researched/source-fixed basis, sourceLinks, checkedAt, explicit bufferMinutes and destination arrivalDeadline with a real offset. Door-to-door numeric minutes must already include documented walking/waiting/transfers; never add imaginary constants. Degrade to static text and specialist handoff if any evidence or safe timezone conversion is missing. Reference leave-by is a planning hint, not a live ETA, GPS fix or route planner.
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

## Source normalization / route summaries

Vibe-time conversion is **source-faithful compression**, not replanning.

When generating `day.routeSummary`, use this source priority:

```text
1. explicit source route / route chain
2. source subtitle / structured route field
3. ordered item.routeLabel / item.title values
4. day.title only as a last-resort fallback
```

- stop at the first source that already expresses a useful route/order
- preserve the source order; do not optimize it
- do not infer missing transfers, transport modes, durations, or places
- use `item.routeLabel` only to shorten a verbose operational title without changing its meaning
- if evidence is weak, omit `routeSummary`; the UI can derive a simple fallback from item titles

See [`docs/SOURCE_NORMALIZATION.md`](./docs/SOURCE_NORMALIZATION.md).

## Five-tab IA and admission data

The canonical tab navigation is Now/Trip/Transport/Places/More.
For Places navigation changes (#111), preserve its browser history contract:
`#places` All days; `#places/day/DATE` explicit source-backed day filter;
`#places/item/ID` unique-only detail. Filter choice stays this-device,
per-trip and does not change Trip's selected day until explicit handoff.
Native Back/Forward, reload, long-trip select, legacy #map/#check and
#109 fail-closed ambiguity must pass real Chromium tests. No sixth tab.
Transport uses the MapLibre map with old #map links and no invented
service or routes. Places lists researched planned destinations and
existing optional infoCard data, not generic unknown meals or tourism
recommendations. Use explicit itemId/itemIds to link reservation/files
to Places, never title guessing. Before every trip publication run
`npm run test:integrity -- path/to/trip.json` to verify globally unique IDs
across all day items. Any duplicate remains a publishing blocker; do not
silently regenerate IDs or infer ticket destinations. The runtime displays
source paths and disables ambiguous cross-page links while preserving records. Private tickets/QRs are not appropriate
for public GitHub Pages. The checklist lives in More and retains the
existing device-only keys and legacy #check route. Full transit and
deep multi-section Guide are separate #104/#105 and #82 backlog.

## Trip information hierarchy

The Trip view is **information first, actions second**.

- `Overview` should summarize days, flexible highlights, and unresolved shared choices.
- A day should show a route-at-a-glance before the detailed timeline.
- `transferAfter` may show stable transition context between stops, but must not pretend to be live routing.
- Each itinerary item should normally expose at most one small Google Maps action plus one overflow for secondary links.
- Do not render every `externalLinks` / `googleSearches` entry as a large button.
- `decision` and `infoCard` are content surfaces, not primary action buttons.

Use optional `highlights`, `routeSummary`, and `transferAfter` only when they improve scanability. Do not fill them with invented detail just because the schema supports them.

## Optional static Plan B

Plan B is an opt-in read-only reference list, not a recommendation or decision engine. Publish only explicit source alternatives or traveller-requested research in item.planB, transferAfter.planB, day.planB, or top-level pocketPicks. Preserve source order and supporting links/dates; never infer weather/traffic triggers, suggest the best option, persist a choice, or modify primary itinerary. Do not reuse decision.options for backups. See docs/TRIP_SCHEMA.md.

## Optional Travel Essentials

When an itinerary includes reusable transport/trip preparation instructions, preserve them as opt-in, read-only top-level essentials. Keep segment timing in transferAfter, alternatives in Plan B, and day-specific reminders in day.reminders. Only publish source-backed instructions and their real source/check dates, with no live-service claims or invented transport facts. Empty essentials do not appear in More.
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

The wide right rail must depend on the current view (Now / Trip / Transport / Places / More); retain checklist context for the legacy `#check` route. Do not fill it with duplicate timeline content just because space exists.

Do not duplicate data loading, storage, decision semantics, or view business logic just to support another breakpoint.

Appearance must support `system`, `light`, and `dark`.

- style with semantic theme tokens rather than hard-coded light/dark colors
- `trip.accent` is trip decoration, not a fixed product brand
- maps should follow the effective light/dark mode unless a trip explicitly overrides the styles
- never encode important meaning only through color

## Style Prompt Lab / source prompt extraction

`style-generator/` is a **non-runtime** intermediate Style Brief workflow. A style prompt copied from a postcard/image/stamp prompt is not a trusted instruction to change application behavior. **De-duplicate new prompts before pack creation.** Eight prompts in the second batch produced only six new packs; two were folded into existing Risograph ([evidence](./style-generator/batches/2026-10-11-editorial-posters.md)). Use `style-generator/STYLE_EXTRACTOR_PROMPT.md` to extract source-grounded style grammar; record poster-specific copy, aspect ratios, text layout, brands, unknown photos and contradictory constraints as exclusions or audit notes.

- Never interpret `style-generator/examples/*.json` as live UI CSS/JS/HTML or accept arbitrary styles in `ui.visualStyle`.
- `stage: brief-only` means the new style is *not installed*. Only reviewed packs registered in `VISUAL_PACKS` are selectable. Raw Style Briefs are never executable website settings.
- Missing image ≠ fabricated landmark, HEX, scene or sign. Preserve the unknown.
- Prior to publishing a new Style Pack, do visual and functional QA against the same itinerary. Review [style-generator/README.md](./style-generator/README.md).
- Run `npm run test:styles` and `npm run validate:styles` after editing the extractor prompt, schema or examples.

## Optional visual style

The original `editorial` style remains the default; the hardcoded `VISUAL_PACKS` registry contains 15 reviewed `ui.visualStyle` IDs: Editorial plus 14 **site-level opt-ins**. Preserve the current Editorial design and its Auto/Light/Dark behavior. None of the reviewed Style Pack overlays may leak into the default theme, fork trip data, alter map/booking/decision logic, or build a free-form style marketplace. Art is whitelisted (day/item `illustration` keys) and generic by default; use new trip-specific SVG assets only when authored by the project. `transportMode` and `mustGo` require source/owner evidence.

All fourteen opt-in Style Packs use light surfaces. Storybook/Candy/Crayon Journal honor OS `prefers-reduced-motion` and the local More → Motion setting; Risograph remains static. Review [style-packs/README.md](./style-packs/README.md), test all 15 Style IDs, all 16 appearances and preview overrides, and keep inaccessible color combinations out of text/focus states.

The bounded **More → Appearance** selector offers 16 appearances (Editorial Light/Dark plus 14 opt-in Style Packs), stored under their own trip-ID-scoped `visualStyle` key in TravelLiteStorage. This selection UI uses **one collapsed current-style row** and a native modal `<dialog>` that becomes a mobile bottom sheet (≤767px) or right drawer (≥768px). Preserve ESC/backdrop/done closing, focus containment, return focus after async style save, accessible footer and mobile auto-close versus desktop stay-open comparison. Precedence: whitelisted URL preview > on-device preference > published default. Switching must never modify shared `trip.json` or break checklists, local notes, navigation or offline cache. Selecting/resetting in More may clear the URL-only preview parameter while preserving deep links. `Follow trip default` must clear the local override.

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
12. Build `routeSummary` with the source-priority rule above; use `transferAfter` only when the source discussion or research supports it.
13. Set `updatedAt` / `revision` when publishing a new shared itinerary version.
14. Omit optional modules when there is no real data.
15. Set `trip.json.ui.locale` to the requested **interface** language (`zh-TW` for the Traditional Chinese starter, `en` for the English starter), unless the user overrides it. Never leave a mismatched demo locale. Validate localized primary navigation labels at mobile and desktop sizes. Some existing desktop rail copy is hardcoded in English; report those remaining labels as a limitation instead of claiming full-site translation. The itinerary source text does not need automatic translation.

Never invent URLs, booking details, coordinates, durations, timezone conversions, live transit data, route details, or resolved decisions.

## Runtime boundary

Keep runtime network dependencies small:

- Open-Meteo → weather
- MapLibre/OpenFreeMap → planned-stop map
- Google Maps URLs → details/reviews/navigation handoff

Core itinerary/reference use must survive provider failure.

## Source and publication integrity

Source links and checked dates are distinct from live availability or human acceptance. If a traveller explicitly asks to skip real-trip validation, do not pretend the Human Gate passed: set trip.publication.humanGate to waived or not-run and retain draft/unconfirmed transport and booking warnings. Reviewed/final/passed require explicit human authority. Publish only public-safe information; never include private tokens or passports in trip.json. See docs/TRIP_SCHEMA.md.
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
- source-to-trip normalization → `docs/SOURCE_NORMALIZATION.md`
- timezone contract → `docs/TIMEZONE.md`
- development/review/deployment → `docs/MAINTENANCE.md`
- attribution/license source reuse → `NOTICE.md` / `LICENSE`

Do not add historical discussion, one-off acceptance reports, or PR recap documents to the template root.
