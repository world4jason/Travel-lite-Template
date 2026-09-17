# Agent instructions

Travel Lite is a static, data-driven travel companion for GitHub Pages.

## Product invariant

The primary navigation is intentionally small:

1. `Now` — derived current/next context
2. `Trip` — complete itinerary
3. `Check` — local checklist state

Do not turn the template into a travel-planning SaaS.

## Default change strategy

When given a new itinerary, PDF, spreadsheet, or notes:

1. Normalize the itinerary into `trip.json`.
2. Preserve the existing app architecture.
3. Change `styles.css` only when destination-specific visual treatment is desired.
4. Do not introduce a backend, auth, database, SSR, API keys, or paid services unless explicitly requested.
5. Keep all links safe for a public GitHub Pages repository; never commit secrets or private booking codes.

## Data rules

- Every day uses `YYYY-MM-DD`.
- Activities use 24-hour `HH:MM` local trip time.
- Prefer explicit `end` times so `Now` can determine the active activity.
- `mapsUrl` is optional.
- Checklist item IDs must remain stable or local completion state will reset.
- Change `trip.id` for a genuinely different trip to isolate localStorage state.

## Acceptance checks

- `trip.json` is valid JSON.
- `node --check app.js` passes.
- All three views render with the sample data.
- The layout remains usable at 320px width.
- Touch targets remain approximately 44px or larger.
- The project remains deployable as plain static files on GitHub Pages.
