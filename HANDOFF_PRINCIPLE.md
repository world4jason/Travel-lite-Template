# Handoff-first product principle

Travel Lite is a trip companion, not an all-in-one travel super app.

The page should answer the small set of questions that are annoying to reconstruct while travelling:

- What am I doing now?
- What is next?
- What is the plan today?
- What did I need to remember or pack?
- Where is this stop?
- Which external app/site should I open for the authoritative/live detail?

## Prefer handoff over reimplementation

Do not rebuild mature destination-specific products inside Travel Lite.

Examples:

- ratings, reviews, opening details, photos, navigation -> Google Maps or another map app
- Japan restaurant reviews/discovery -> Tabelog when the itinerary provides a direct link
- live railway/transit timetable and disruption information -> the traveller's preferred local transit app/site (for example Jorudan or NAVITIME in Japan)
- restaurant booking -> the original booking/service page
- attraction tickets -> the official ticket/provider page
- airline/train live status -> carrier/operator page or app

Travel Lite may store and display links to these services. It should not scrape, mirror, proxy, or try to become a weaker copy of them.

## Runtime provider hierarchy

1. **Core trip data** (`trip.json`) — required and offline-capable.
2. **Small changing context** (weather) — useful enough to fetch live and cache locally.
3. **Optional discovery helpers** (place search, public knowledge, nearby POIs) — opt-in convenience only.
4. **Authoritative/live specialist information** — hand off to the user's chosen app/site.

## Default UI rule

The default experience must stay simple. Optional discovery tools are hidden unless `ui.enableExploreTools` is explicitly enabled.

A coding agent should prefer adding an `externalLinks` entry to an activity over adding a new provider integration.

Example:

```json
{
  "id": "d2-dinner",
  "title": "Dinner",
  "location": "Shinjuku, Tokyo",
  "externalLinks": [
    { "label": "Tabelog", "url": "https://tabelog.com/..." },
    { "label": "Reservation", "url": "https://..." }
  ]
}
```

The link should point to a concrete useful destination whenever possible. Do not invent URLs or identifiers.
