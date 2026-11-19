# Trip — 「行程」頁 UI/UX

> Page-specific **P0 Chronological Itinerary Timeline + Time-blocked Schedule**. Read [UIUX.md](../UIUX.md), [SHARED.md](./SHARED.md), [Timeline Contract](../CHRONOLOGICAL_TIMELINE_CONTRACT.md), and [Trip Schema](../TRIP_SCHEMA.md) first.

## 1. Two distinct modes: Overview and Day

- **Overview** is a distinct view mode, never a synthetic date. First present a readable journey/day overview with dates, daily titles, concise route summary, accommodation or genuine unresolved decisions where supplied. Optional source-backed highlights and **flight overview** appear only when relevant; no generic filler sections. All overview cards open the correct day.
- **P1.12 Compact Overview is mandatory across styles:** a short title/date/count cover followed by dense daily cards (day number/date, subject, published route, actual transport SVG and only source-backed cues). Label `days[].items[]` totals as itinerary items, not stops. Neither a large decorative grid/doodle nor a Kansai-only `mobility` field may become an overview prerequisite. No repeated right-rail counts; keep working day deep links, flight and genuine decisions.
- **Optional highlights below Overview:** the `highlights[]` section must default to an accessible collapsed `<details>` list, labelled for the active locale. Keep all source-authored dates, choices, conditions and safety notes available after expand. Do not render large featured cards or unrelated decorative SVG stickers. Apply the same no-sticker contract to `Open decisions` cards, but keep genuinely unresolved choices discoverable. Browser regression checks must open optional details and assert that theme `::after` artwork stays `none`.
- **Day** begins with selected date, real day title, compact route at a glance and necessary warnings, then the **complete visible main timeline**. The date/weather strip uses [WEATHER.md](./WEATHER.md) and the single `state.selectedDate`.
- Day source order is **`days[].items[]`**. Do not sort, optimize, interpolate gaps, guess missing duration or manufacture travel time in the browser. Separate source types remain same-level scheduled blocks: `place`/`attraction`, `event`, `food`, `stay`, `break`, and door-to-door `transport` Journey.

## 2. Timeline / time blocks (immutable P0)

- One chronological visual sequence of **transport → activity/venue/meal/break → transport** according to the published items. Known start/end display as `HH:MM–HH:MM`; if an endpoint is missing, display only known values plus explicit TBD (not a made-up range). Estimated/“約” and timetable references must be visibly qualified when source says so.
- Source Leg: every published `type: transport` retains ID, original start/end, mode, stations, notes, checkedAt, source links and order. In the **main Trip timeline**, consecutive transport legs in one complete A→B move display as **one Journey card**, with all walking/transfers/trains/buses in accessible expandable details; avoid a repeated row for each connection and avoid duplicating any leg.
- Split Journeys at a true destination/activity/intervening time block or source `journeyId` / `journeyStart` / `journeyEnd` boundary. Do not combine two unrelated A→B moves because the modes are both railway, and do not make intermediate station transfers appear as separate featured sightseeing stops.
- All meaningful scheduled **waiting/reading/rest** periods are `break`, not Places. Festivals, fireworks, markets and performances are `event` unless an independently researched destination exists as its own entity. Keep them in the timeline even when excluded from Places.
- Important source warning (last train, ticket time, seasonal condition, access/entry limitation) appears where it affects the decision. Long day notes, research and optional Plan B are available behind descriptive `details`; generic repeated day notes must not render as helper subtitles.
- Timezone-aware absolute comparisons across midnight and borders; preserve original displayed local clocks for flights. Do not infer actual check-in, boarding, arrival or “visited” status from the planned time.

## 3. Journey action / links

- When a grouped Journey's **published, trusted origin and destination** exist, its A→B title or obvious adjacent map action opens an encoded Google Maps `/maps/dir/?api=1&origin=...&destination=...&travelmode=...` link. Pure walking = `walking`; urban/mixed public transit = `transit`; car = `driving`. No coordinates/API key needed if trusted station/place names are available.
- Google's calculated route or live offering is **not** the published planned schedule. Missing endpoint, flight segment or ambiguous route: retain route text and a conservative location/search or provider handoff instead of fabricating a surface journey.
- Flight detail is a projection of the **same** `type: transport` / `transportMode: flight` source item; Overview summarizes known flight number/airports/times and Transport owns the expanded detail. No duplicate flight timetable or public booking code.

## 4. Rendering / layout

- One primary content column per item; particularly Storybook uses **time above full-width content**, never a universal three-column override. Keep long journey names, multiline times and expanded transfer details inside the framed card with ≥12 CSS px inner safe inset.
- Hierarchy: time + primary stop/Journey name → essential mode/status → selective details/actions. Avoid a second “Transport / 步行” mini-title, an “依實走順序…” paragraph, duplicate location, repeated duration or an empty decorative summary.
- Readable on 320/390/980/1100/1440/1920px and 200% text. Unfolded main timeline must remain visible and keyboard-readable even when map/weather/image fails.

## 5. Acceptance

- **Overview-specific:** `npm run test:overview` + `npm run test:overview:browser`, including compact Hero size, decorative `::before/::after` absence, all style themes, 320/390/980/1100/1440/1920 and 200% text, correct day navigation, truthful labels and no duplicate sidebar stats.

- `npm run test:timeline`, `npm run test:journey`, `npm run test:trip-layout`, `npm run test:uiux`; with UI/style changes also `npm run test:journey:browser`, `npm run test:trip-layout:browser` and `npm run test:uiux:geometry`.
- Test a multi-leg Japan rail transfer, walk-only Journey, back-to-back separate Journeys, event/break in-between, unknown leg time, cross-border flight, long Japanese stations, Storybook 200% and desktop clipping. Verify A→B Maps URL and per-leg disclosure are accurate.
