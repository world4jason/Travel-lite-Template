# `trip.json` guide

`trip.json` is the shared source of truth. A coding agent should normally adapt a new trip by changing this file first and leaving the application shell unchanged.

## Top-level shape

```json
{
  "trip": {},
  "ui": {},
  "providers": {},
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
  "homeLabel": "Tokyo, Japan",
  "center": { "lat": 35.6812, "lng": 139.7671 },
  "accent": "#2563eb",
  "themeColor": "#0b1020"
}
```

Rules:

- use `YYYY-MM-DD` dates
- use a valid IANA timezone
- change `trip.id` for a genuinely different trip so browser-local state does not collide

## `ui`

```json
{
  "defaultView": "now",
  "theme": "system",
  "bottomNav": ["now", "trip", "map", "check", "more"]
}
```

Unused views may be removed from `bottomNav` for simpler trips.

## `providers`

The base template only needs small runtime services:

```json
{
  "mapStyle": "https://tiles.openfreemap.org/styles/liberty",
  "weatherEndpoint": "https://api.open-meteo.com/v1/forecast",
  "googleMapsEmbedKey": ""
}
```

The Google Maps embed key is optional. Normal Google Maps handoff links do not require it.

## `days`

```json
{
  "id": "d1",
  "date": "2026-10-03",
  "label": "Day 1",
  "title": "Arrival & Shibuya",
  "note": "Keep the first afternoon light.",
  "reminders": [
    "Check the hotel message before check-in."
  ],
  "items": []
}
```

### Reminders

Keep `day.reminders` short and operational. They appear as day-of reminder cards.

They can be strings or linkable objects:

```json
{
  "text": "Check live train status before leaving.",
  "url": "https://..."
}
```

## Itinerary item

Common fields:

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
- times use local trip time in `HH:MM`
- provide `end` when possible so the `Now` view can derive the current activity
- resolve `lat`/`lng` during vibe-time for real planned stops when practical

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

The runtime scopes the search around the selected/planned stop when possible.

## Static place context: `infoCard`

Use this for stable background researched by the LLM/agent before deployment:

```json
{
  "infoCard": {
    "label": "Background",
    "title": "Senso-ji",
    "summary": "Short context useful while visiting.",
    "facts": [
      "A useful historical fact.",
      "A useful visit-context fact."
    ],
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
    "context": "Choose based on hunger and crowd.",
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

Definitions live in `trip.json`; completion state is local.

```json
{
  "todos": [
    { "id": "esim", "label": "Activate eSIM", "dueDate": "2026-10-02", "priority": "high" }
  ],
  "checklists": [
    {
      "id": "packing",
      "title": "Packing",
      "items": [
        { "id": "passport", "label": "Passport" },
        { "id": "charger", "label": "Phone charger" }
      ]
    }
  ]
}
```

Never casually change checklist/todo IDs after users may have stored completion state.

## Reference modules

Useful read-only structures include:

- `reservations`
- `notes`
- `files`
- `contacts`
- `links`
- optionally `costs`
- optionally `journal`

Omit empty/unneeded modules when generating a lightweight trip.

## Privacy and public hosting

GitHub Pages and a public repository are not a place for secrets.

Do not commit:

- passport numbers
- passwords/tokens/API secrets
- sensitive personal identifiers
- private booking credentials/codes that should not be public

Prefer links to authoritative/private systems rather than copying sensitive data into `trip.json`.
