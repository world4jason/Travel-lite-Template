# `trip.json` guide

`trip.json` is the shared source of truth. A coding agent should normally adapt a new trip by changing this file first and leaving the application shell unchanged.

## Top-level shape

```json
{
  "trip": {},
  "ui": {},
  "providers": {},
  "highlights": [],
  "days": [],
  "todos": [],
  "checklists": [],
  "reservations": [],
  "costs": { "currency": "", "entries": [] },
  "notes": [],
  "files": [],
  "contacts": [],
  "journal": [],
  "links": []
}
```

Only include optional modules when useful for the trip.

## `trip`

Recommended fields:

```json
{
  "id": "tokyo-2026",
  "title": "Tokyo Autumn",
  "subtitle": "3 days",
  "startDate": "2026-10-03",
  "endDate": "2026-10-05",
  "timezone": "Asia/Tokyo",
  "updatedAt": "2026-09-17T16:10:00+08:00",
  "revision": "tokyo-2026-09-17-03",
  "homeLabel": "Tokyo, Japan",
  "center": { "lat": 35.6812, "lng": 139.7671 },
  "accent": "#4f6f5e",
  "themeColor": "#0b1020"
}
```

Rules:

- use `YYYY-MM-DD` dates
- use a valid IANA timezone
- change `trip.id` for a genuinely different trip so browser-local state does not collide
- set `updatedAt` / `revision` when publishing a new shared itinerary version; they describe shared content, not local checklist changes
- treat `accent` as trip decoration; important meaning must not depend on that color
- `accent` accepts only six-digit hex colors (for example `#4f6f5e`) that keep at least 4.5:1 contrast with white on accent-backed controls; unsupported/unsafe values fall back to `#4f6f5e`

### Optional trip cover

A cover is a progressive identity enhancement. Core trip information never depends on it.

```json
{
  "cover": {
    "src": "./assets/cover.webp",
    "alt": "Mountain valley seen from the morning trail",
    "focalPoint": "right"
  }
}
```

Rules:

- `src` may be a same-origin relative URL or an absolute `https://` URL
- protocol-relative URLs and `http:`, `javascript:`, `data:`, `blob:`, or other schemes are rejected
- `alt` must be a non-empty description; invalid/missing alt makes the whole cover invalid
- `focalPoint` is optional and limited to `center | top | bottom | left | right`; unknown values normalize to `center`
- cover failure collapses back to the canonical no-cover composition
- same-origin media can benefit from the existing runtime cache after first fetch; cross-origin HTTPS media is not guaranteed offline
- trip data cannot provide arbitrary CSS, HTML, fonts, motion code, or free-form visual presets; the only optional selection is the bounded `ui.visualStyle` enum described below

Do not accept arbitrary style names, URL-driven custom CSS, or styles inferred from a destination or `trip.type`.

### Optional curated Trip Overview artwork (publisher selection)

A person creating a trip may select **one to six actual itinerary source item IDs** as representative moments, including `event`, `place`, or `break`. Selection is not inferred from location popularity, city names or Places-only items. The publisher may attach **one to three reviewed images**:

```json
{
  "trip": {
    "overviewArtwork": {
      "subjectIds": ["d-fireworks", "d-yokai", "d-kumano", "d-onsen"],
      "images": [
        {
          "src": "./assets/overview/my-trip-cover.webp",
          "alt": "Illustrated travel montage of fireworks, yokai parade, forest trail and sea-facing cave bath",
          "styleId": "vintage-watercolor",
          "fit": "contain",
          "focalPoint": "center"
        }
      ]
    }
  }
}
```

- An optional **publisher-only** picker at [tools/overview-artwork-picker.html](../tools/overview-artwork-picker.html) reads the trip's true item IDs and exports a JSON *generation brief*, not a live edit, downloadable image or automatic image-model call.
- `subjectIds`: 1–6 unique IDs that already occur under `days[].items[]`. An invalid/missing subject causes the optional artwork to disappear, never a guessed place or a modified Timeline item.
- `images`: 0–3 entries; zero means no artwork. `src` and `alt` use the same safe URL and meaningful-text rules as `trip.cover`. Art should be local for offline reliability; same-origin paths recommended.
- `styleId` is optional: a matching installed Style Pack shows this variant; otherwise the website displays only a style-neutral image if supplied, or a no-image Overview. The viewer's style choice still changes the site's appearance, **not** the selected itinerary subjects.
- `fit`: `cover` (default) or `contain`. `focalPoint`: `center` (default), `top`, `bottom`, `left` or `right`. Never accept CSS, executable URLs, arbitrary style names or HTML from these fields.
- The compact Overview uses the existing source-led hierarchy and caps images at 178 CSS px. It does **not** change `trip.cover` in the shell, create a giant Hero, or duplicate the chronological itinerary. An image load failure must leave all real travel information accessible.
- Generate offline, verify truthfulness/rights, then publish images and JSON together. A montage illustrates selected memories, **not** a documentary photo of events occurring together.

### Publication state and research provenance (Issue #92)

Source existence, research date and publication/human acceptance are three separate concepts. No browser feature infers any of them from updatedAt, successful automated tests or a source URL.

Optional trip.publication: {state: 'draft' | 'reviewed' | 'final', humanGate: 'passed' | 'not-run' | 'waived'}. Only set reviewed / final / passed on explicit authoritative human action. If the owner waived real-import review, use humanGate: 'waived', not passed. This status remains authoritative source metadata, not a recurring on-screen banner. The public UI must not infer paid tickets or verified bookings from a source link or a draft state; relevant per-item unconfirmed timings, reservations and safety constraints must still be shown where actionable. See [UIUX P1.14](UIUX.md).

On individual transferAfter (and future Plan B alternatives), optional sourceLinks: [{label,url}] and checkedAt: YYYY-MM-DD describe a historical research snapshot. Neither confirms live provider status. The global trip.updatedAt is a publication timestamp, never a substitute for segment checkedAt.

More displays a collapsed Research Notes index only when source links exist, derived from transfers, Plan B, Essentials, infoCard and optional top-level researchNotes. Each researchNotes entry may specify category, title, checkedAt and sourceLinks; keep only brief contextual text rather than copied articles. No sources means no empty index.

Published GitHub Pages trip.json is public. Never insert passports, personal secrets, booking tokens or sensitive contact details. Always hand off real-time operations to official providers; an offline snapshot cannot verify live conditions.
## `ui`

Website `vintage-watercolor` is a released, bounded, optional built-in Style Pack. The 2026-10-25 owner acceptance is recorded in [#81](https://github.com/world4jason/Travel-lite-Template/issues/81) and [#113](https://github.com/world4jason/Travel-lite-Template/issues/113). All published trip data semantics stay unchanged; future changes still require their own review and acceptance.


```json
{
  "defaultView": "now",
  "theme": "light",
  "visualStyle": "editorial",
  "locale": "zh-TW",
  "labels": {
    "navNow": "現在",
    "navTrip": "行程"
  },
  "bottomNav": ["now", "trip", "map", "places", "more"]
}
```

- `theme` supports `system`, `light`, and `dark`
- `visualStyle`: optional `editorial` (default, supports Auto/Light/Dark), `storybook` (paper-white illustrated, light-only), `candy` (five-fill candy sticker variant, light-only), `risograph` (indigo print), `paper-collage` (layered cardstock), `naive-city` (hand-drawn gouache), `taiwan-poster` (mid-century screenprint), `field-stamp` (carved ink), or the six new packs `quiet-linocut`, `doodle-memory-grid`, `crayon-journal`, `painterly-editorial`, `geometric-print`, `quiet-acrylic`, plus `vintage-watercolor` (archival watercolor); all 14 opt-ins are light-only. Invalid values fall back to `editorial`. [Reviewed pack manifests](../style-packs/README.md).
- Arbitrary prompts and Style Brief files are **not** `ui.visualStyle` values. The [Style Prompt Lab](../style-generator/README.md) describes the offline, non-executable extraction step. Only Style Packs implemented and reviewed in code may become selectable.
- The publisher's `ui.visualStyle` is the shared **default**, not a compulsory choice for every traveller. **More → Appearance** lets a traveller select among sixteen visible looks (Editorial Light/Dark plus fourteen other packs) locally; the choice persists only on that device and per trip (key `<trip.id>:visualStyle`). **Follow trip default** removes it. Valid `?previewStyle=...` URLs have temporary precedence and do not change shared data. Nothing here permits arbitrary CSS or style IDs.
- Storybook, Candy, Naive City, Doodle Memory Grid and Crayon Journal request Huninn when available with safe fallback fonts; Candy adds a reviewed stylesheet overlay. Risograph uses an independent static print overlay. All packs cache their local assets offline. No arbitrary style name, URL or custom CSS can be loaded from `trip.json`.
- built-in shell/companion labels cover English and Traditional Chinese
- `labels` is optional and only overrides shell/companion copy; it is not a second itinerary translation
- the template normalizes `bottomNav` in memory to the fixed five destinations `["now", "trip", "map", "places", "more"]`; legacy arrays do not remove primary tabs or change the published source. `map` is Transport's internal ID, and `#check` remains a legacy checklist link.
- phone and desktop reuse the same view list and data

## `providers`

The base template only needs small runtime services:

```json
{
  "mapStyle": "https://tiles.openfreemap.org/styles/liberty",
  "mapStyleLight": "https://tiles.openfreemap.org/styles/liberty",
  "mapStyleDark": "https://tiles.openfreemap.org/styles/dark",
  "weatherEndpoint": "https://api.open-meteo.com/v1/forecast",
  "googleMapsEmbedKey": ""
}
```

`mapStyleLight` / `mapStyleDark` are optional overrides. The Google Maps embed key is optional; normal Google Maps handoff links do not require it.

## Travel Essentials (Issue #91)

An optional, read-only, collapsed reference section under More; it does not add a sixth bottom tab. Include only instructions already present in a trustworthy itinerary or explicitly researched before publication.

Top-level essentials is an array of objects with title (required), body or summary (plain text), category (e.g. Airport transfer / Local transit / Intercity / Tickets), optional dayDate (YYYY-MM-DD), optional checkedAt (YYYY-MM-DD) and sourceLinks [{label, url}]. HTTP(S) sources must be complete URLs; malformed or executable URLs are ignored. Entries that have no usable content are omitted.

Airport arrival, reusable transit ticket instructions and intercity boarding guidance belong here. A-to-B transition times belong in transferAfter and explicit alternatives in planB. Do not store the same conflicting fact in all three. No dynamic provider checks, live timetable claims, private booking secrets, auto-generated filler or runtime research.

With no essentials array the section does not render. All published instructions remain available offline, while external source links require a network connection. Checked dates identify historical research, not live verification.
## Trip overview highlights: `highlights`

Use `highlights` for flexible activities, seasonal events, backup ideas, or notable options that matter to the trip but are not fixed timeline stops.

```json
{
  "highlights": [
    {
      "id": "night-lights",
      "dateLabel": "Oct 3–5",
      "title": "Autumn illumination",
      "icon": "✦",
      "status": "optional",
      "note": "Use as an evening option if energy and weather are good.",
      "url": "https://..."
    }
  ]
}
```

Keep this section small. It is an overview/decision aid, not a recommendation feed.

## `days`

```json
{
  "id": "d1",
  "date": "2026-10-03",
  "label": "Day 1",
  "title": "Arrival & Shibuya",
  "note": "Keep the first afternoon light.",
  "routeLabel": "Arrival day",
  "routeSummary": ["Haneda", "Shibuya", "Ebisu"],
  "reminders": ["Check the hotel message before check-in."],
  "items": []
}
```

### Optional illustrated day marker

A day may supply an `illustration` key (for example `"city"` or `"boat"`) **only for Storybook's decorative image**. The base view ignores this artwork hint. Omitted or invalid values use a generic local icon. All icon keys are whitelisted in `storybook-decor.js`; never supply arbitrary URLs or CSS from itinerary data.

### Route summary
- Optional `day.shortTitle` is a shorter *published* title for the compact Overview, if the full title is long; do not invent one in the browser.
- Optional `day.overviewCue` is a source-backed concise operational note for the compact Overview (for example a confirmed activity start or critical reservation reminder). It is not a second schedule and is omitted when unavailable.
- Compact Overview automatically renders actual transport mode icons from `days[].items[]`. `mobility` is *not* required. Item counts mean itinerary entries, not tourist stops. Style Packs do not insert large generic trip illustration in this surface.


`routeSummary` is optional. If omitted, the Trip view derives a simple route from item titles. Use it when a shorter human-friendly route is more useful than raw stop names.

`routeLabel` is optional descriptive text such as `East Tokyo`, `Classic route`, or `Departure`.

Do not turn route summaries into live routing. Real-time transit/navigation stays in specialist apps.

### Reminders

Keep `day.reminders` short and operational. They can be strings or linkable objects:

```json
{
  "text": "Check live train status before leaving.",
  "url": "https://..."
}
```

## Immutable Chronological Itinerary Timeline

Every known-time source transport **leg**, visit, meal or event has its own `days[].items[]` row and `HH:MM–HH:MM` range. The displayed Trip Timeline groups adjacent legs within one door-to-door Journey into a single visible row, without deleting any source IDs, times or details. A booked or otherwise confirmed transport interval may **never** be represented solely by `transferAfter`; use `type: transport`. Follow [the mandatory UI/UX hierarchy](UIUX.md) and [the full invariant contract](CHRONOLOGICAL_TIMELINE_CONTRACT.md), use IANA timezones for cross-zone journeys, preserve source order, and run `npm run test:timeline`. No guessed durations, timestamps, end stations or coordinates.

### Optional `weatherLocation` and flight metadata

- `days[].weatherLocation`: optional public `{lat,lng,label}` to choose the appropriate **daily weather city/area**. If absent, only use a real coordinate from that day’s scheduled places/items; no fabricated coordinates. Weather uses live forecast for future dates or labelled historical model data for past dates (recent past_days or archive reanalysis). Missing weather means a clean date/title card with no fake icon, value, or dash; it is never a published itinerary fact.
- For `type: "transport", transportMode: "flight"`, optional `item.flight` provides **display metadata only**: `number`, `airline`, `origin: {code,terminal}`, `destination: {code,terminal}`, `arrivalTimezone` (IANA). Flight cards derive the schedule from `item.start` and `item.end`, which represent **the departure item's timezone**; they convert the end instant to `arrivalTimezone`, not a duplicated second timetable. Do not guess terminals or passenger booking details.
- Flight Overview and Transport card render only when source flight items exist. Never show a guessed arrival/updated status or confidential PNR.

### Grouped transport Journey and Google Maps route links

- `journeyId` (optional stable string), `journeyStart: true`, `journeyEnd: true` explicitly separate adjacent but different A→B journeys. Otherwise, consecutive source `type: transport` items until the next place/food/stay/event form one display Journey.
- Source Leg `from` and `to` (or `route: {from,to}`) should be verified place names. The UI may read an unambiguous published `A → B` title. For a complete Journey with verified endpoints, form `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=transit|walking|driving` using URL encoding. No GPS coordinates or API key required. No inferred via-points or live ETA.
- All original Leg IDs, order, times, notes and source URLs remain in the expandable transport detail. No duplicate canonical `mobility.legs` timetable.

### Optional curated venue name (Places only)

A planned visit's chronological `title` may describe an activity (e.g., `伏見稻荷大社參拜`); Places should instead display a concise researched location name. For independently researched `type: place|attraction|museum|landmark|nature|sight` items, an optional **source-authored** `venueName` stores that place name. `places-view.js` uses `venueName || title` for the Places index/detail headings, but the complete Trip Timeline preserves `title` (including actions), stable ID and timing. Do not invent a venue name from unverified itinerary text or remove words heuristically.

```json
{
  "id": "visit-shrine",
  "type": "place",
  "title": "伏見稻荷大社參拜、等候祭事",
  "venueName": "伏見稻荷大社",
  "infoCard": { "summary": "...", "sourceLinks": [] }
}
```

## Itinerary item

A timed item:

```json
{
  "id": "d1-sensoji",
  "start": "09:00",
  "end": "11:00",
  "title": "Senso-ji",
  "type": "place",
  "location": "Senso-ji, Tokyo",
  "lat": 35.7148,
  "lng": 139.7967,
  "note": "Arrive early if possible."
}
```

Rules:

- use stable IDs
- timed starts use local trip time in `HH:MM`
- provide `end` when possible so the Now reference window is more accurate
- resolve `lat`/`lng` during vibe-time for real planned stops when practical

### Optional travel mode / curated highlights / illustrations

For a genuinely source-supported leg, the item may include:

```json
{
  "transportMode": "train",
  "mustGo": true,
  "illustration": "train"
}
```

- `transportMode` must be an explicit `flight | drive | boat | train | bus | walk` known from the source. It displays a small label, not actual route optimization. Unknown modes are ignored.
- `mustGo: true` is **editor-selected emphasis**, never automatically inferred from a famous stop, paid booking, or location. It is not a proof of a reservation. Avoid labeling tentative options as confirmed plans.
- `illustration` is a **whitelisted decorative key**, not a URL. Allowed: `map`, `city`, `plane`, `car`, `train`, `boat`, `food`, `hotel`, `landmark`, `nature`, `sea`. It has no navigation/state meaning.

### Floating / TBD time

If the group intentionally has not assigned a time, use `start: "TBD"` or omit `start`:

```json
{
  "id": "d2-lunch",
  "start": "TBD",
  "title": "Lunch",
  "location": "Asakusa / Ueno"
}
```

Only valid `HH:MM` starts participate in previous / scheduled-now / next calculations. Floating items:

- are never interpreted as `00:00`
- never become the current timed activity
- stay visible in Trip and the Now `Flexible today` section

Do not invent a time solely to make the item fit the timeline.

### Optional static Plan B and Pocket Picks (Issue #90)

Only include alternatives when the source itinerary explicitly contains them, or the traveller asks for Plan B research. Keep the primary schedule unchanged and never automatically select a backup.

- Item alternatives: item.planB (array).
- Transfer alternatives: item.transferAfter.planB (array), below its main route connector.
- Day-wide alternatives: day.planB (array), collapsed above the timeline.
- Unattached curated options: top-level pocketPicks (array), collapsed in Trip overview. Do not silently convert highlights into options.
- Each alternative has a non-empty title (or label), and may include note, category (display-only), mode, url, sourceLinks [{label,url}], checkedAt in YYYY-MM-DD. Only complete HTTP(S) URLs are linkable.
- Preserve the source order. The UI is closed by default, and is absent when no named options exist. Options must not have triggers, whenToUse, recommendation scores, selected state, or local storage.
- A researched or checked date means a static reference, not verified current operating/booking availability. External providers are authoritative for live details.

Example: a day may have planB: [{title: 'Museum', category: 'place'}]; a transfer may have planB: [{title: 'Replacement shuttle', category: 'transport'}]; a trip may have pocketPicks: [{title: 'Local market'}]. These are sample labels only and must not be inserted into real trips without explicit source evidence.

Do not map Plan B into decision.options. Unresolved shared decisions and device-only personal preferences have different semantics.
### Transfer connector: `transferAfter`

Use `transferAfter` only for stable, pre-researched transition context between this stop and the next one.

```json
{
  "transferAfter": {
    "label": "Transfer",
    "mode": "Train / walk",
    "duration": "about 30 min",
    "summary": "Use the saved route; check live timing in the local transit app.",
    "url": "https://..."
  }
}
```

All fields are optional. Do not invent duration or live timetable data. If the exact transit plan is not known, omit it and let the user open their normal transit/map app.

### Evidence-bound transit estimate and reference leave-by (Issue #89)

Retain the legacy transferAfter fields mode, duration, summary and url. New structured estimates are optional; never parse a free-text duration into minutes.

Transfer sample: transferAfter.estimate = {minMinutes: 25, maxMinutes: 35, bufferMinutes: 15, basis: 'researched'}; transferAfter.sourceLinks = [{label: 'Operator', url: 'https://example.org/route'}]; transferAfter.checkedAt = '2026-09-01'. The next planned item can explicitly provide arrivalDeadline = '2026-10-03T14:00:00+09:00'. These are illustrative only.

- estimate.minMinutes and maxMinutes are non-negative integer door-to-door minutes (including source-backed walking, waiting and transfers), or estimate.minutes for exact durations. min <= max. Do not add implied wait/transfer overhead. Show the conservative range when provided, even if the timing cannot safely be calculated.
- Computing reference leave-by requires all of: a source-fixed/researched basis, valid explicit checkedAt, at least one valid source link, valid conservative maxMinutes, explicit bufferMinutes (including zero if intentionally set), and an explicit offset-qualified arrivalDeadline on the next item. A normal item.start is NOT an arrival deadline.
- The absolute-instant calculation is arrivalDeadline - maxMinutes - bufferMinutes, displayed in the departing item's effective IANA timezone. The deadline offset must match the destination item's timezone; invalid DST and ambiguous unsupported inputs are omitted. Overnight times are rendered with a date prefix.
- If an explicit scheduled preceding end exceeds the reference departure, show a gentle conflict/check notice. Do not claim an actual delay or auto-adjust the itinerary.
- Without complete evidence, do not render a reference leave-by, a fabricated 00:00, or a live traffic claim. Keep official handoff links and the last published static facts accessible offline.
## Action budget

Trip rows are information-first. The default item surface should expose at most:

- one small Google Maps action
- one overflow menu for secondary links

Do not turn every `externalLinks` / `googleSearches` entry into a large button. Decision cards and info cards are content, not primary actions.

## Specialist handoff: `externalLinks`

Use direct links when a known service/page is authoritative:

```json
{
  "externalLinks": [
    { "label": "Tabelog", "url": "https://tabelog.com/..." },
    { "label": "Reservation", "url": "https://..." },
    { "label": "Official site", "url": "https://..." }
  ]
}
```

Do not invent URLs.

## Google Maps query shortcuts: `googleSearches`

For lightweight nearby/ad-hoc search, link out instead of adding a discovery provider:

```json
{
  "googleSearches": [
    { "label": "Nearby restaurants", "query": "restaurants" },
    { "label": "Nearby cafes", "query": "cafe" }
  ]
}
```

The runtime scopes the search around the selected/planned stop when possible. In the Trip timeline these live under secondary-action overflow rather than as full-size buttons.

## Place vs event vs break — publishing semantics

- `type: "place"` means a **real destination worth a guide**, not a scheduled action. A venue/attraction must have independent identity and may carry a curated `infoCard`. Unknown facts must not be fabricated.
- `type: "event"` is an actual time-bound festival, market, ceremony or performance; it remains on the main Timeline, not in the Places catalogue.
- `type: "break"` is waiting for fireworks, reading at a riverside, resting or routine hotel bathing; it remains a scheduled Time-block, **not a place**. Keep the `location` and coordinates as transportation context without changing the category.
- Generic `food`, `transport`, `stay` and activities with coordinates do not automatically qualify. Only explicitly researched named `restaurant` venues may enter Places; a `mapQuery` is not a category.
- Prefer a short, venue-specific, sourced `infoCard.summary` and `infoCard.sourceLinks` for each public `place`. `infoCard.officialSite` is reserved for the venue's own website, not a government tourism listing. Images must be rights-cleared, accessible and credited. `item.note` is itinerary timing/practical info, never a substitute guide.

## Static place context: `infoCard`

Use this for stable background researched by the LLM/agent before deployment:

```json
{
  "infoCard": {
    "label": "Background",
    "title": "Senso-ji",
    "summary": "Short context useful while visiting.",
    "facts": ["A useful historical fact.", "A useful visit-context fact."],
    "image": "https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg?width=900",
    "imageAlt": "Short factual image description",
    "imageSource": "https://commons.wikimedia.org/wiki/File:Example.jpg",
    "imageCredit": "Photographer / Wikimedia Commons",
    "imageLicense": "CC BY 4.0",
    "officialSite": "https://the-venue.example/",
    "sourceLinks": [
      { "label": "Wikipedia", "url": "https://..." },
      { "label": "Official site", "url": "https://..." }
    ]
  }
}
```

Keep live facts such as current opening hours, live transit, ratings, or availability in specialist services rather than freezing them into the card unless the source itinerary intentionally does so.

## Shared TBD: `decision`

Use a decision card only when planning has already narrowed the question to a small set of concrete options.

```json
{
  "decision": {
    "label": "TBD",
    "prompt": "Eat in Asakusa, or move to Ueno first?",
    "context": "Choose based on hunger and crowds.",
    "options": [
      { "id": "asakusa", "label": "Eat in Asakusa", "note": "Less travel." },
      { "id": "ueno", "label": "Move to Ueno first", "note": "Eat near the afternoon stop." }
    ]
  }
}
```

Shared decisions are read-only. Do not use device-local state to pretend the group has resolved them.

After a group decision is authoritative:

```json
{
  "decision": {
    "resolvedOptionId": "ueno",
    "options": [
      { "id": "asakusa", "label": "Eat in Asakusa" },
      { "id": "ueno", "label": "Move to Ueno first" }
    ]
  }
}
```

### Personal preference

Only explicitly personal choices may write a local preference:

```json
{
  "decision": {
    "mode": "personal",
    "prompt": "Which optional stop do I prefer?",
    "options": [
      { "id": "a", "label": "Option A" },
      { "id": "b", "label": "Option B" }
    ]
  }
}
```

The UI must identify this as device-local, not shared state.

## Checklists and todos

Definitions live in `trip.json`; completion state is local. Never casually change checklist/todo IDs after users may have stored completion state.

## Reference modules

Useful read-only structures include `reservations`, `notes`, `files`, `contacts`, `links`, and optionally `costs` / `journal`. Omit empty/unneeded modules when generating a lightweight trip.

## Privacy and public hosting

GitHub Pages and a public repository are not a place for secrets. Do not commit passport numbers, passwords/tokens/API secrets, sensitive identifiers, or private booking credentials. Prefer links to authoritative/private systems rather than copying sensitive data into `trip.json`.


## Places navigation and admission references (MVP)

Primary destinations are Now, Trip, Transport, Places and More.
The Transport tab uses the internal map ID for compatibility with legacy
#map/day/DATE/stop/ID links. Old #check links still open a checklist;
the main interactive checklist now resides in More. Legacy bottomNav
values migrate in-memory and never delete personal checklist state.

Places route policy (#111): `#places` represents All days, `#places/day/YYYY-MM-DD`
represents a validated published day filter, and `#places/item/ITEM_ID` is
an ID-only detail route subject to #109 uniqueness validation. The date filter is device-only. Since Issue #129 the Places local key
`<trip.id>:places:mode` stores only `all`/`day`; an explicit Places day filter
updates the shared `<trip.id>:ui:selectedDate` also used by Trip/Transport.
The old `<trip.id>:places:date` is read **only to migrate All/Day mode** and
must never become a second selected-day truth. Neither selection edits
published `trip.json` or synchronizes to other travellers. Clicking list/date/detail uses browser history entries
so native Back/Forward replays published source facts; page reload and direct
date links restore valid selection. Invalid dates fall back to All days.
Direct detail links override the visible list while retaining the stored
filter for the in-app Back action. Handoffs to Trip/Transport set their source
date intentionally. Legacy `#map`, `#transport` and `#check` retain their
existing meanings. This is a Places UX contract, not a new backend or tab.

Places reuses published days[].items and optional item.infoCard only,
with a globally unique stable item ID across **every** `days[].items[]` record,
including transport, accommodation and other non-Places.

**Issue #109 fail-closed policy:** run `npm run test:integrity` (or pass a
destination trip.json path) before publishing. The deterministic audit lists
duplicate IDs and every conflicting source path, such as
`days[0].items[2]` and `days[1].items[0]`, without exposing booking payloads.
Legacy missing/empty IDs retain the existing generated fallback in memory;
collisions involving fallback IDs are still blocked. Do not silently rename
published IDs or deduplicate visits: bookmarks and linked records may use them.

An ambiguous ID-only Places/Trip/Transport link never resolves the first matching
venue. Places retains the original source cards but disables ambiguous details,
and displays a publisher warning with escaped source ID/path information.
`reservations[].itemId` / `itemIds` and `files[].itemId` / `itemIds` associations
are suppressed for ambiguous IDs; unmodified records remain in More. Trip can link directly
to #places/item/ITEM_ID. Unconfirmed meals without a researched venue,
transport segments and accommodation are excluded from Places.

An existing reservations[] or files[] object may optionally specify
itemId (string) or itemIds (array of strings) referencing an item.id.
This explicit relationship allows a Place to display entry documents and
booking status without fuzzy matching titles. An unlinked booking remains
in More and does not imply anything about entry requirements or availability.
No guide content or ticket status is synthesized at runtime.

A public GitHub Pages site is not private storage: never publish full
booking codes, personalized QR tickets, passports or signed private URLs.
Only safe, intentionally public HTTP(S) external links are shown.
See docs/NAV_PLACES_MVP.md for the usage/QA contract.
