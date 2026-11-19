# Transport — 「交通」頁 UI/UX

> Page-specific supplement to [UIUX.md](../UIUX.md) P0.1a / P0.4 / P0.5 / P1.7–P1.9, [SHARED.md](./SHARED.md), [Trip](./TRIP.md) and [Timeline Contract](../CHRONOLOGICAL_TIMELINE_CONTRACT.md).

## 1. Scope and hierarchy

- **One selected day only**; there is no Transport-wide Overview merely to match Trip/Places. Follow the shared date/weather strip and `state.selectedDate`; respect deep links and browser history.
- First answer: where the planned transport starts/ends, which mode, scheduled/reference times, critical boarding/transfer constraints and how to open directions. Then, if source-backed, display station/stop list, map reference, expanded legs, Plan B and provider links.
- Transport is a different *reading projection* of the same `days[].items[]`; never maintain a second timetable in `mobility.legs`, create missing legs, transform a suggested departure into a confirmed timetable or replace the Trip canonical timeline.

## 2. Journey and transfer grouping

- **One door-to-door A→B movement = one primary Journey**, including continuous walking, subway, railway, bus or funicular transfers. The original independent Leg items, IDs, modes, source times and boarding details survive in an expandable step list, in original order.
- Distinguish actual service and transfer from two unrelated Journeys. An important destination, meal, venue, performance, explicit `journeyId` or source boundary breaks the group. “同一次交通只是轉車” must not produce multiple top-level journey cards.
- Short summary for a Journey: verified A → B, source-supported time window, mode(s), and one clearly named Maps/directions action. Detailed steps: each trusted stop, platform/line or approximate timetable **only when published and traceable**; unknown stays TBD.
- Pure walking uses **footprints** SVG, subway uses subway, rail uses train, cable car/funicular uses its own semantic SVG, Maps uses a generic map pin. Never confusing Unicode glyphs or a counterfeit Google logo.

## 3. Map and external navigation

- Known station/place names suffice for Google Maps **directions**: `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=transit`; use `walking` for walk-only, `driving` for car-only. Percent-encode params. Add waypoints only when source-authorized and platform limits are considered; never require GPS coordinates or an API key.
- Google Maps is external **route planning**, not guaranteed to preserve selected train or departure. Reference timetable, service alert and checked date may be displayed only with honest labels. Flights/long-distance service not expressible as surface directions use an official source or destination search instead.
- MapLibre pins: **only verified scheduled coordinates**, ordered by published itinerary. No pin at guessed centroid and no invented route polyline. When no coordinates/map tiles, keep named stops, timeline-derived steps and external Maps link accessible.
- Map Workspace **border and padding are paired** Style Pack tokens: framed `--ui-map-workspace-frame` ⇒ same-theme nonzero `--ui-map-workspace-padding` ≥12px; unframed Editorial/Risograph/Vintage stay intentionally open. `box-sizing:border-box` and `min-width:0`; never accidentally inherit `.panel` border via CSS cascade. Visible heading, route, stations and controls keep 12px measured inner inset even if map tiles clip independently.
- At compact/wide desktop, test both open and closed details, long names, horizontal date strip, side rail and embedded map. Never hide clipped text with overflow rules or smaller type.

## 4. Flights, alternatives and failure

- Source `transportMode:flight` projects date-specific airport codes, source times/number and **only published** terminal, airline or arrival timezone; no PNR, passenger ID or invented live status.
- Optional Plan B is researched **static, explicit and manual**. No automatic route optimization, rebooking, weather-triggered reroute or guessed last train.
- Offline: itinerary, station names, timetable reference and known alternatives work; failure of map tiles/navigation provider does not blank the page.

## 5. Acceptance

- `npm run test:journey`, `npm run test:transport` when present, `npm run test:timeline`, `npm run lint:map-insets`, `npm run test:uiux`; UI changes add `npm run test:journey:browser`, `npm run test:map-insets:browser` and `npm run test:uiux:geometry`.
- Browser matrix 320/390/1024/1280/1440/1920px plus 200% text; test on all Style Packs, specifically framed Storybook and deliberately unframed themes. Assert actual computed border/padding/text-to-border distance, no horizontal clipping, Maps A→B and preserved leg expansion.
- [Google Maps URLs reference](https://developers.google.com/maps/documentation/urls/get-started).
