# Travel Lite Template

A tiny, mobile-first trip companion designed for **one itinerary → one GitHub Pages site**.

It intentionally keeps the product surface small:

- **Now** — current activity, next activity, trip-local time, daily progress
- **Trip** — day tabs + compact itinerary timeline
- **Check** — reusable checklists persisted in `localStorage`

There is no backend, login, database, build tool, or framework. The trip itself lives in `trip.json`.

## Why this shape

Travel Lite borrows high-level mobile travel UX ideas (current/next context, bottom navigation, day plans) but is implemented from scratch as a static site. It is intended to stay easy for humans and coding agents to modify.

## Quick start

1. Edit `trip.json`.
2. Commit and push.
3. In **Settings → Pages → Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)` after this prototype is merged.

The repository includes `.nojekyll`, so GitHub Pages can serve the static files directly without a build step.

For local preview, use any tiny static server instead of opening `index.html` with `file://`:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Data model

The important file is `trip.json`:

```json
{
  "trip": {
    "id": "my-trip-2026",
    "title": "My Trip",
    "startDate": "2026-10-03",
    "endDate": "2026-10-06",
    "timezone": "Asia/Tokyo",
    "accent": "#2563eb"
  },
  "days": [
    {
      "date": "2026-10-03",
      "label": "Day 1",
      "title": "Arrival",
      "items": [
        {
          "start": "14:00",
          "end": "15:00",
          "title": "Hotel check-in",
          "location": "Shibuya",
          "mapsUrl": "https://maps.google.com/..."
        }
      ]
    }
  ],
  "checklists": []
}
```

`Now` is derived from the itinerary plus the trip timezone; it is not a separate data set.

## Vibe-coding rule of thumb

For a new trip, prefer changing **only `trip.json`** and optional visual tokens in `styles.css`. Keep the app shell stable unless the product behavior genuinely needs to change.

See [`AGENTS.md`](./AGENTS.md) for guardrails.
