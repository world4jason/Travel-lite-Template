# Travel Lite Template

A mobile-first, local-first **trip decision companion** for **one mostly-planned itinerary → one GitHub Pages site**.

Travel Lite is not a trip planner. Planning happens beforehand with people, an LLM, spreadsheets, maps, bookings, or whatever tools fit the trip. The generated site is the compact result everyone carries during the trip.

It should answer, quickly:

- What am I doing now?
- What is next?
- What is today's discussed plan?
- What must I remember or check?
- Is anything intentionally TBD today?
- What are the already-researched options for that decision?
- Where is this stop?
- Which specialist app/site should I open next?

Think **infographic + info cards + small dashboard**, not itinerary editor.

## Shared truth vs local state

This distinction is a core invariant because a static GitHub Pages site has no shared synchronization backend:

```text
trip.json   = shared truth everyone should see
IndexedDB   = this device's private/local state
```

Therefore:

- a shared TBD is read-only in the generated page
- the card may show 2–3 pre-discussed options, context, and links needed to decide
- a shared decision becomes authoritative only when `trip.json` is regenerated/updated with `resolvedOptionId`
- `decision.mode: "personal"` is the only case where a choice may be stored locally; the UI labels it **Personal preference · this device only**
- local state must never pretend that the group itinerary has been changed

This avoids different travellers silently ending up with conflicting "resolved" itineraries.

## Default views

- **Now** — current activity, next activity, reminders, unresolved day-of decisions, trip-local time, small weather context
- **Trip** — read-focused daily itinerary; fixed, optional, and TBD items can coexist
- **Map** — today's already-planned stops on MapLibre/OpenFreeMap + specialist map handoff
- **Check** — to-dos + packing/checklists stored locally
- **More** — reservation/ticket/note/contact references and device-local note/settings

The bottom bar is controlled by `ui.bottomNav`, so unused views can be removed per trip.

## Three kinds of trip information

```text
Fixed plan        → itinerary card
Need to remember  → reminder / checklist
Decide on the day → decision card with pre-discussed options
```

Shared decision example:

```json
{
  "id": "d2-lunch",
  "title": "Lunch",
  "decision": {
    "prompt": "Eat before moving, or head to Kichijoji first?",
    "context": "Choose based on crowd and energy.",
    "options": [
      { "id": "here", "label": "Eat here", "note": "Less transit." },
      { "id": "move", "label": "Move first", "note": "Eat near the afternoon stop." }
    ]
  }
}
```

After the group decides, the generated/shared data can become:

```json
{
  "decision": {
    "resolvedOptionId": "move",
    "options": [
      { "id": "here", "label": "Eat here" },
      { "id": "move", "label": "Move first" }
    ]
  }
}
```

## Handoff-first

Travel Lite should help users decide and remember; specialized tools should execute specialized jobs.

Examples:

- reviews/photos/navigation → Google Maps or the user's preferred map app
- Japan restaurant reviews → Tabelog link when known
- live train times/disruptions → NAVITIME, Jorudan, operator app/site, etc.
- reservation changes → original booking service
- ticket/status → attraction, airline, or rail operator

Activities can carry arbitrary concrete `externalLinks`:

```json
{
  "title": "Dinner",
  "externalLinks": [
    { "label": "Tabelog", "url": "https://tabelog.com/..." },
    { "label": "Reservation", "url": "https://..." }
  ]
}
```

Do not invent URLs. See [`HANDOFF_PRINCIPLE.md`](./HANDOFF_PRINCIPLE.md).

## Optional explore tools

Photon place search, Wikipedia/Wikidata enrichment, and Overpass nearby discovery are implemented but **hidden by default**:

```json
{
  "ui": {
    "enableExploreTools": false
  }
}
```

They are conveniences, not part of the normal travel flow. They are also the first candidates to remove if maintenance simplicity matters more.

## Storage model

```text
trip.json                    shared planning output
   ├── itinerary / locations
   ├── reminders / shared TBD cards
   ├── resolved shared decisions
   ├── reservations / tickets / links
   └── optional reference modules

IndexedDB                   private device-local state
   ├── checklist/todo completion
   ├── personal decision preferences only
   ├── personal note
   ├── selected day/view/theme
   ├── trip snapshot
   └── small provider caches

localStorage                fallback only
```

No application server, login, server database, or build step is required.

## Weather

Open-Meteo supplies small current/day weather context and is cached locally. Weather failure never blocks the itinerary. See [`PROVIDERS.md`](./PROVIDERS.md) for provider limits and replacement points.

## Offline behavior

After the first successful visit, the app shell and trip snapshot remain available offline. Checklist/todo/personal state is stored in IndexedDB with localStorage fallback. External specialist apps/sites and live provider refreshes require connectivity.

## Quick start

1. Turn the output of planning/discussion into `trip.json`.
2. Preserve intentional TBDs as small decision cards instead of inventing an answer.
3. Prefer stable IDs and explicit `lat`/`lng` for planned stops.
4. Add concrete specialist links where useful.
5. Push to `main`; GitHub Pages serves the repository root.
6. Open the site once online before travelling.

## Scope guardrail

Do not expand the base template into drag/drop itinerary planning, route optimization, review databases, live-transit engines, generic recommendations, collaboration, or account/server infrastructure.

See [`AGENTS.md`](./AGENTS.md), [`TREK_CLIENT_PARITY.md`](./TREK_CLIENT_PARITY.md), and [`HANDOFF_PRINCIPLE.md`](./HANDOFF_PRINCIPLE.md).

Travel Lite is AGPL-3.0-or-later. See `LICENSE` and `NOTICE.md` when adapting TREK code.
