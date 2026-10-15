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

## `ui`

```json
{
  "defaultView": "now",
  "theme": "system",
  "visualStyle": "editorial",
  "locale": "zh-TW",
  "labels": {
    "navNow": "現在",
    "navTrip": "行程"
  },
  "bottomNav": ["now", "trip", "map", "check", "more"]
}
```

- `theme` supports `system`, `light`, and `dark`
- `visualStyle`: optional `editorial` (default, supports Auto/Light/Dark), `storybook` (paper-white illustrated, light-only), `candy` (five-fill candy sticker variant, light-only), `risograph` (indigo print), `paper-collage` (layered cardstock), `naive-city` (hand-drawn gouache), `taiwan-poster` (mid-century screenprint), `field-stamp` (carved ink), or the six new packs `quiet-linocut`, `doodle-memory-grid`, `crayon-journal`, `painterly-editorial`, `geometric-print`, `quiet-acrylic`; all opt-ins are light-only. Invalid values fall back to `editorial`. [Reviewed pack manifests](../style-packs/README.md).
- Arbitrary prompts and Style Brief files are **not** `ui.visualStyle` values. The [Style Prompt Lab](../style-generator/README.md) describes the offline, non-executable extraction step. Only Style Packs implemented and reviewed in code may become selectable.
- The publisher's `ui.visualStyle` is the shared **default**, not a compulsory choice for every traveller. **More → Appearance** lets a traveller select among fifteen visible looks (Editorial Light/Dark plus thirteen other packs) locally; the choice persists only on that device and per trip (key `<trip.id>:visualStyle`). **Follow trip default** removes it. Valid `?previewStyle=...` URLs have temporary precedence and do not change shared data. Nothing here permits arbitrary CSS or style IDs.
- Storybook, Candy, Naive City, Doodle Memory Grid and Crayon Journal request Huninn when available with safe fallback fonts; Candy adds a reviewed stylesheet overlay. Risograph uses an independent static print overlay. All packs cache their local assets offline. No arbitrary style name, URL or custom CSS can be loaded from `trip.json`.
- built-in shell/companion labels cover English and Traditional Chinese
- `labels` is optional and only overrides shell/companion copy; it is not a second itinerary translation
- unused views may be removed from `bottomNav`
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

## Static place context: `infoCard`

Use this for stable background researched by the LLM/agent before deployment:

```json
{
  "infoCard": {
    "label": "Background",
    "title": "Senso-ji",
    "summary": "Short context useful while visiting.",
    "facts": ["A useful historical fact.", "A useful visit-context fact."],
    "image": "https://...",
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
