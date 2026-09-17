# Handoff-first product principle

Travel Lite is a trip companion, not an all-in-one travel super app.

The page should answer the small set of questions that are annoying to reconstruct while travelling:

- What am I doing now?
- What is next?
- What is the plan today?
- What did I need to remember or pack?
- Is there a small TBD I need to decide now?
- Where is this stop?
- Which external app/site should I open for authoritative/live detail?

## Prefer handoff over reimplementation

Do not rebuild mature destination-specific products inside Travel Lite.

Examples:

- ratings, reviews, opening details, photos, navigation → Google Maps or another map app
- Japan restaurant reviews/discovery → Tabelog when a concrete link is known
- live railway/transit timetable/disruption → traveller's preferred local transit/operator app
- restaurant booking → original booking/service page
- attraction tickets → official ticket/provider page
- airline/train live status → carrier/operator page or app

Travel Lite stores links to these services. It should not scrape, mirror, proxy, or become a weaker copy of them.

## Handoff hierarchy

1. **Shared trip data** (`trip.json`) — required and offline-capable.
2. **Small changing context** (weather) — fetched live and cached locally.
3. **Static researched context** (`infoCard`) — prepared by the LLM/agent during vibe-time.
4. **Ad-hoc search / nearby lookup** — Google Maps query links or user's specialist app.
5. **Authoritative/live specialist information** — hand off to the chosen app/site.

## Prefer links and queries over providers

A coding agent should prefer:

- `externalLinks` for concrete pages
- `googleSearches` for lightweight nearby/search handoff
- `infoCard` for researched background/context

over adding a new runtime API integration.

Example:

```json
{
  "id": "d2-dinner",
  "title": "Dinner",
  "location": "Shinjuku, Tokyo",
  "externalLinks": [
    { "label": "Tabelog", "url": "https://tabelog.com/..." },
    { "label": "Reservation", "url": "https://..." }
  ],
  "googleSearches": [
    { "label": "Nearby cafes", "query": "cafe" }
  ]
}
```

The link should point to a concrete useful destination whenever possible. Do not invent URLs or identifiers.
