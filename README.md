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

A static GitHub Pages site has no shared synchronization backend:

```text
trip.json   = shared truth everyone should see
IndexedDB   = this device's private/local state
```

Therefore:

- a shared TBD is read-only in the generated page
- the card may show 2–3 pre-discussed options, context, and links needed to decide
- a shared decision becomes authoritative only when `trip.json` is regenerated/updated with `resolvedOptionId`
- `decision.mode: "personal"` is the only case where a preference may be stored locally, clearly labelled **this device only**
- local state must never pretend that the group itinerary changed

## Default views

- **Now** — current activity, next activity, reminders, unresolved day-of decisions, trip-local time, small weather context
- **Trip** — read-focused daily itinerary; fixed, optional, and TBD items can coexist
- **Map** — today's already-planned stops on MapLibre/OpenFreeMap + Google Maps handoff
- **Check** — to-dos + packing/checklists stored locally
- **More** — reservation/ticket/note/contact references and device-local note/settings

The bottom bar is controlled by `ui.bottomNav`, so unused views can be removed per trip.

## Three kinds of trip information

```text
Fixed plan        → itinerary card
Need to remember  → reminder / checklist
Decide on the day → decision card with pre-discussed options
```

Shared decisions are informational until the shared file changes. Personal preferences may be device-local.

## Handoff-first

Travel Lite helps users **remember and decide**; specialized tools execute specialized jobs.

Examples:

- reviews/photos/navigation → Google Maps or the user's preferred map app
- Japan restaurant reviews → Tabelog link when known
- live train times/disruptions → NAVITIME, Jorudan, operator app/site, etc.
- reservation changes → original booking service
- ticket/status → attraction, airline, or rail operator

Activities can carry concrete `externalLinks`:

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

### Google Maps query handoff

For lightweight "what is nearby?" needs, do not call a discovery API. Let the agent add small Google Maps query shortcuts:

```json
{
  "title": "Dinner",
  "location": "Ebisu, Tokyo",
  "googleSearches": [
    { "label": "Nearby restaurants", "query": "restaurants" },
    { "label": "Nearby cafes", "query": "cafe" }
  ]
}
```

Travel Lite turns these into Google Maps search URLs scoped around the selected stop.

## Static info cards

Place context is prepared **during vibe-time**, not fetched at runtime. An LLM/agent may research Wikipedia, official sites, guide material, or other appropriate sources and write a compact card into `trip.json`:

```json
{
  "title": "Senso-ji",
  "infoCard": {
    "label": "Background",
    "title": "Senso-ji",
    "summary": "Short context useful while visiting.",
    "facts": ["One useful fact", "Another useful fact"],
    "sourceLinks": [
      { "label": "Wikipedia", "url": "https://en.wikipedia.org/..." },
      { "label": "Official site", "url": "https://..." }
    ]
  }
}
```

This keeps the card offline-capable and avoids runtime entity-matching mistakes. Live hours, reviews and navigation stay in specialist apps.

## Runtime providers

The base template intentionally has only two runtime infrastructure dependencies:

- **Weather:** Open-Meteo, cached in IndexedDB and allowed to fail silently
- **Map:** MapLibre + OpenFreeMap for planned-stop overview; Google Maps URLs remain the fallback/handoff

There is **no Photon, Overpass, Wikipedia or Wikidata runtime code** in the base template.

See [`PROVIDERS.md`](./PROVIDERS.md).

## Storage model

```text
trip.json                    shared planning output
   ├── itinerary / locations
   ├── reminders / shared TBD cards
   ├── resolved shared decisions
   ├── static info cards / source links
   ├── reservations / tickets / handoff links
   └── optional reference modules

IndexedDB                   private device-local state
   ├── checklist/todo completion
   ├── personal decision preferences only
   ├── personal note
   ├── selected day/view/theme
   ├── trip snapshot
   └── weather cache

localStorage                fallback only
```

No application server, login, server database, or build step is required.

## Offline behavior

After the first successful visit, the app shell and trip snapshot remain available offline. Checklist/todo/personal state is stored in IndexedDB with localStorage fallback. Static info cards remain readable offline. External specialist apps/sites and live weather refresh require connectivity.

## Quick start

1. Turn the output of planning/discussion into `trip.json`.
2. Preserve intentional TBDs as small decision cards instead of inventing an answer.
3. Resolve stable places and useful context during vibe-time.
4. Add concrete specialist links and optional Google Maps query shortcuts.
5. Push to `main`; GitHub Pages serves the repository root.
6. Open the site once online before travelling.

## Scope guardrail

Do not expand the base template into drag/drop itinerary planning, route optimization, review databases, live-transit engines, generic recommendations, runtime place discovery, collaboration, or account/server infrastructure.

See [`AGENTS.md`](./AGENTS.md), [`TREK_CLIENT_PARITY.md`](./TREK_CLIENT_PARITY.md), and [`HANDOFF_PRINCIPLE.md`](./HANDOFF_PRINCIPLE.md).

Travel Lite is AGPL-3.0-or-later. See `LICENSE` and `NOTICE.md` when adapting TREK code.
