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
- use valid IANA timezone names such as `Asia/Taipei`, `Europe/Rome`, or `Atlantic/Reykjavik`
- `trip.timezone` is the **default**, not a promise that every day of a multi-country trip uses the same local clock
- change `trip.id` for a genuinely different trip so browser-local state does not collide
- set `updatedAt` / `revision` when publishing a new shared itinerary version; they describe shared content, not local checklist changes
- treat `accent` as trip decoration; important meaning must not depend on that color

### Timezone hierarchy

For multi-country travel, timezone resolution is:

```text
item.timezone
    ↓ fallback
day.timezone
    ↓ fallback
trip.timezone
```

Example:

```json
{
  "trip": { "timezone": "Europe/Vienna" },
  "days": [
    {
      "date": "2026-08-25",
      "timezone": "Asia/Taipei",
      "items": [
        { "start": "23:10", "title": "Flight from Taipei" }
      ]
    },
    {
      "date": "2026-09-25",
      "timezone": "Asia/Taipei",
      "items": [
        { "start": "05:30", "title": "Arrive in Taipei" }
      ]
    }
  ]
}
```

Keep the source-local clock time and attach the correct timezone. Do not convert itinerary clocks into the generating machine's timezone.

Use `item.timezone` only when one item genuinely uses a different local clock from the rest of its day. `item.date` may override the containing day date for that special case.

## `ui`

```json
{
  "defaultView": "now",
  "theme": "system",
  "locale": "zh-TW",
  "labels": {
    "navNow": "現在",
    "navTrip": "行程"
  },
  "bottomNav": ["now", "trip", "map", "check", "more"]
}
```

- `theme` supports `system`, `light`, and `dark`
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
  "timezone": "Asia/Tokyo",
  "label": "Day 1",
  "title": "Arrival & Shibuya",
  "subtitle": "Keep the first afternoon light.",
  "routeLabel": "Arrival day",
  "routeSummary": ["Haneda", "Shibuya", "Ebisu"],
  "reminders": ["Check the hotel message before check-in."],
  "items": []
}
```

### Route summary

`routeSummary` is optional. If omitted, the Trip view derives a simple route from item titles. For generated trips, build it in this priority order:

1. explicit route/sequence from the source itinerary
2. source day subtitle or route field when it clearly expresses the sequence
3. normalized item titles
4. day title only as the last fallback

`routeLabel` is optional descriptive text such as `East Tokyo`, `Classic route`, or `Departure`.

Do not fabricate a more specific route than the source supports, and do not turn route summaries into live routing. Real-time transit/navigation stays in specialist apps.

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
- timed starts use the **local clock for the resolved item/day timezone** in `HH:MM`
- provide `end` when possible so the Now reference window is more accurate
- resolve `lat`/`lng` during vibe-time for real planned stops when practical
- if an item needs a different local date/timezone from its day, use `item.date` / `item.timezone` rather than silently converting the clock

### Floating / TBD time

If the group intentionally has not assigned a time, or the source only gives sequence without a reliable clock, use `start: "TBD"` or omit `start`:

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
- on a fully untimed day, contribute to the Now **Today brief** instead of producing empty schedule cards

Do not invent a time solely to make the item fit the timeline.

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

## Long-trip navigation

No extra schema is required. On phone, trips longer than 12 days automatically replace the full day-chip strip with a compact day selector plus previous/next and Today navigation when applicable.

The selector uses the same `days[]` data, selected date, and deep-link state as the desktop day rail.

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
