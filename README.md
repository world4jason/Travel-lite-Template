# Travel Lite Template

> 把已經排好的旅行，變成同行者能在手機上快速查看的行程網站。  
> **Plan elsewhere. Travel with clarity.**

Travel Lite turns a **mostly-planned itinerary** (spreadsheet, PDF, notes, or an LLM-assisted plan) into a **read-only, offline-ready trip companion** hosted as a static site on GitHub Pages. Its job is to answer **what's scheduled now, what's next, what should I remember, and where do I go?** — not to plan the trip again.

**[Try the trip overview](https://world4jason.github.io/Travel-lite-Template/#trip/overview)** · [View all visual styles](./style-packs/README.md) · [Trip data guide](./docs/TRIP_SCHEMA.md)

> **Demo note:** The bundled Tokyo example is dated **October 3–5, 2026**. Outside those dates, the [Now view](https://world4jason.github.io/Travel-lite-Template/#now) correctly shows the trip as completed. Use **Trip overview** to explore the sample itinerary.

## Why this exists

Most trip plans already live across chats, documents, spreadsheets, maps, and bookings. Once a trip starts, other travelers usually need a **simple reference**, not another planning workflow.

```text
Existing itinerary / PDF / spreadsheet / discussion
                      ↓
        Human or agent prepares trip.json
                      ↓
           One static Travel Lite site
                      ↓
     Check now · See the day · Open Maps
```

A travel companion can be generated for a different destination by changing **trip data and optional assets**, without rebuilding the application.

## What works today

| View | On the trip, it helps you… |
| --- | --- |
| **Now** | See the previous / scheduled-now / next items, today's reminders, weather, and flexible/TBD activities |
| **Trip** | Scan all days, follow the planned stop order, read transfers, highlights, and open decisions |
| **Map** | See the planned stops and open a selected place in Google Maps for navigation |
| **Check** | Tick off a personal packing list and tasks **on this device** |
| **More** | Find reservations, references, and a personal note; export the trip as A4/A5 printable pages or an `.ics` calendar |

Also included:

- **Works on phone and desktop:** touch-first bottom navigation on phones; contextual day/reference rails on larger screens.
- **Offline/PWA:** after a successful first visit, the app shell and last loaded trip snapshot can remain available without network access. Weather, fresh map tiles, and external booking sites may still need internet.
- **Read-only sharing:** share a link to the trip, a specific day, or a planned map stop; no sign-in or collaboration backend.
- **Multi-country trips:** day/item timezone overrides for correct schedule reference.
- **Appearance:** 14 reviewed Style Packs (15 selectable appearances, including Editorial Light/Dark), plus English / Traditional Chinese interface labels. See [styles and previews](./style-packs/README.md).

**Travel Lite is not:** a trip planner/editor, navigation engine, live transit tracker, booking manager, reviews database, or real-time group chat. It links to specialist tools rather than rebuilding them.

## Quick start: publish your own trip

1. **Fork or use this repository as a template.** Keep the static app files.
2. **Prepare your itinerary** in a spreadsheet, text, PDF, or chat. Have a person or coding agent convert it into [`trip.json`](./trip.json), following [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md) and [`AGENTS.md`](./AGENTS.md).
3. **Replace the sample `trip.json`** with your trip. Give it a unique `trip.id`; use actual dates, original local times, valid IANA timezones where needed, and stable IDs for days and stops. Add coordinates, reservations, reminders, and links **only when the source supports them**.
4. **Preview** locally using the command below, then confirm the first day, a day without exact times, map handoffs, and mobile readability.
5. **Publish on GitHub Pages:** go to **Settings → Pages → Deploy from a branch → `main` → `/ (root)`**, then share your published URL.

```bash
# Run in the repository root; no build or backend required
python3 -m http.server 8000
# Open http://localhost:8000
```

For this repository the site is [world4jason.github.io/Travel-lite-Template](https://world4jason.github.io/Travel-lite-Template/). Your fork will normally publish at `https://YOUR-USERNAME.github.io/YOUR-REPO/`. See [GitHub Pages deployment instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

**Agent handoff tip:** Ask your agent to *normalize the source itinerary into `trip.json` without inventing times, places, booking statuses, transit routes, or resolved decisions; keep the app shell unchanged unless there is a reusable bug*. The [schema](./docs/TRIP_SCHEMA.md), [source normalization rules](./docs/SOURCE_NORMALIZATION.md), and [agent instructions](./AGENTS.md) are the source of truth.

## Shared trip data vs personal device state

```text
trip.json     → shared, published read-only itinerary
IndexedDB     → your device's checks, preferences, quick note, and cached trip
localStorage  → local fallback
```

A group's shared TBD decision stays unresolved until the published data says otherwise. A personal preference or checked packing item does **not** sync with other travelers.

**Privacy:** A public GitHub Pages site and its `trip.json` are not private. Do not publish passport numbers, secrets, private documents, full booking credentials, or anything you would not want publicly accessible. Device-local notes and checklist completion should not be presented as shared information.

**Time accuracy:** `Now` is a **published schedule reference**, not GPS presence detection. Only valid time entries participate in the timed sequence. A `TBD` or missing start stays flexible, and a fully untimed day gets a **Today Brief** instead of fabricated schedule times. Multi-timezone precedence is `item.timezone → day.timezone → trip.timezone`.

## Personalize the trip, not the app

You can set a default style and interface language with optional values in your existing `trip.json`:

```json
{
  "ui": {
    "defaultView": "now",
    "locale": "zh-TW",
    "visualStyle": "editorial",
    "theme": "system"
  }
}
```

This is a **partial example**; retain your trip's other fields. Travelers can change the appearance on their own device from **More → Appearance**. On phones, the style picker is a bottom sheet; on desktop it is a drawer. Personal style choices do not rewrite shared trip data.

For a full gallery, style IDs, preview links, optional illustration metadata, and implementation details, see:

- [Style Packs: all 14 packs / 15 appearances](./style-packs/README.md)
- [Style Prompt Lab: turn visual prompts into reviewed style briefs](./style-generator/README.md)

## Export your trip: PDF / booklet / calendar

Open **More → Export / 匯出** to take a snapshot of the *published, read-only* trip:

- **A4 itinerary:** opens a dedicated print preview. Choose **Print / Save PDF** in the new tab and use your browser's print-to-PDF or printer.
- **A5 booklet:** same workflow, with a cover, trip-at-a-glance page, and separate day sections. Long days may span several printed pages rather than shrinking to illegible text.
- **Calendar (.ics):** downloads scheduled events for importing into Apple Calendar, Google Calendar, or Outlook. Choose **None** or a **30-minute-before** alarm. Events without fixed start times (TBD) are skipped and counted in the status text.

**Important limits:** PDF and imported calendar files are **snapshots**. Re-importing an ICS may duplicate events; importing does not keep future edits in sync. Reminder delivery depends on the receiving calendar. A5 is sequential reading order, **not** duplex booklet imposition. Mobile browsers may need permission to open a new tab for print preview.

Exports use the same published `trip.json` as the website. A4/A5 print **published itinerary text (including `item.note`) and selected confirmed-booking summary fields as supplied**, without automatic secret/token scrubbing. **Remove private credentials, tokens, and other sensitive material before publishing `trip.json`**; both the public site and printed copies can expose it. Device-local personal notes and checklist completion are not included. No map-image provider or online fonts are needed to print text.

Implementation: `export-core.js` (print/ICS functions), `export-ui.js` (More actions), `export.css` (screen launcher). Run:

```bash
npm run test:export            # RFC 5545, DST, text folding and print-model checks
npm run test:mobile            # existing UI + export popup/download/PDF smoke tests
```

Related work: [#70 A4/A5/ICS](https://github.com/world4jason/Travel-lite-Template/issues/70). **Maps remain MapLibre**; [#74](https://github.com/world4jason/Travel-lite-Template/issues/74) compared Leaflet's markers/polylines without changing the engine.

## Development and reference docs

| Document | Use it for |
| --- | --- |
| [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md) | All supported fields and examples for generating a new trip |
| [`docs/SOURCE_NORMALIZATION.md`](./docs/SOURCE_NORMALIZATION.md) | Converting source itineraries faithfully into concise stop data |
| [`docs/TIMEZONE.md`](./docs/TIMEZONE.md) | Multi-timezone interpretation and cross-date travel |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Static architecture, data boundary, storage, and handoff rules |
| [`docs/COMPANION_UX.md`](./docs/COMPANION_UX.md) | Now / Trip / Map behavior, offline states, and responsive UX |
| [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md) | Local development, cache updates, and regression checks |
| [`AGENTS.md`](./AGENTS.md) | Guardrails for coding agents |
| [`NOTICE.md`](./NOTICE.md) | Attribution and reused-source notes |

To run the existing local test suite (Node.js tooling is **for development only**):

```bash
npm install
npx playwright install chromium
npm run test:mobile
npm run validate:styles
npm run test:styles
npm run test:packs
```

Core runtime integrations: **MapLibre + OpenFreeMap** for planned-stop maps, **Open-Meteo** for weather, and **Google Maps links** for place details/navigation. The core trip and stored notes should stay useful if an external service fails.

## License

**AGPL-3.0-or-later.** See [LICENSE](./LICENSE) and [NOTICE](./NOTICE.md) for source attribution and obligations when adapting TREK-related code.
