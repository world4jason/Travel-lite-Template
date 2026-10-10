# Travel Lite Template

A responsive, local-first **trip decision companion** for turning a mostly-planned itinerary into one static GitHub Pages site.

Planning happens beforehand with people, an LLM, spreadsheets, maps, bookings, or other specialist tools. Travel Lite is the compact result people carry during the trip.

**Live site:** https://world4jason.github.io/Travel-lite-Template/

## What it does

- **Now** — previous / scheduled-now / next reference window, later plans, floating TBDs, reminders, and weather
- **Trip** — whole-trip overview, daily route summary, compact timeline, highlights, and open decisions
- **Map** — numbered planned stops on MapLibre/OpenFreeMap with selected-stop emphasis and Google Maps handoff
- **Check** — todos and checklists stored on this device
- **More** — reservations, tickets, notes, contacts, links, and a local quick note
- **Responsive shell** — phone single-column/bottom nav; compact desktop day rail; wide desktop day rail + context-sensitive rail
- **Appearance** — `Auto` / `Light` / `Dark`, stored per device
- **Offline/PWA** — app shell and trip snapshot remain usable after the first successful load, with freshness status
- **Share / deep links** — share or copy the current read-only trip/day/map context without a backend

Travel Lite is **not** a planner, route optimizer, live-transit engine, review database, booking editor, or collaboration backend.

## Shared truth vs local state

```text
trip.json    = shared truth for everyone using the site
IndexedDB    = private state on this device
localStorage = fallback when IndexedDB is unavailable
```

Shared TBD decisions are read-only in the page. A group decision becomes authoritative only after `trip.json` is regenerated or updated. `decision.mode: "personal"` may store a personal preference locally.

## Day-of Now view

`Now` is a **schedule reference**, not GPS presence tracking.

```text
Previous
Scheduled now
Next
```

This deliberately keeps the immediately adjacent itinerary items visible so travellers can orient themselves when they are early, delayed, or between activities.

Only valid local `HH:MM` starts participate in the timed window. An item with `start: "TBD"` (or no start) stays visible as **Flexible today** and is never treated as midnight/current.

## Information-first Trip view

The Trip view is designed like an itinerary dashboard, not an action launcher:

```text
Overview
├── daily summaries
├── flexible highlights / activities
└── unresolved shared decisions

Day
├── route at a glance
├── compact timeline
├── optional transfer context
└── small specialist handoff actions
```

Each stop normally exposes only a small Google Maps action plus an overflow for secondary links. Large repeated `Trip map / Google Maps / Nearby...` button rows are intentionally avoided.

## Handoff-first

Use specialist tools for specialist jobs:

- reviews, photos, navigation → Google Maps
- restaurant-specific research → Tabelog or another local service
- live transit → NAVITIME, Jorudan, operator apps/sites, etc.
- booking changes → original booking service
- tickets/status → carrier or attraction operator

Activities can carry direct `externalLinks` and small `googleSearches` shortcuts. Stable place background can be prepared by the LLM/agent at vibe-time and stored as a static `infoCard` in `trip.json`.

## Responsive + theme behavior

Travel Lite uses **one data model, different information compositions**. Responsive design may rearrange, reveal, or collapse existing information, but must not fork trip data or business logic.

```text
< 900px
phone
└── single-column content + bottom navigation

900–1399px
compact desktop / tablet landscape
├── persistent trip-day rail
└── main content with horizontal primary navigation

>= 1400px
wide desktop
├── trip-day / reference rail
├── main content
└── context-sensitive rail
```

The wide right rail changes with the current view instead of repeating the same timeline everywhere:

- Now → previous/current/next, reminders, weather
- Trip overview → stats, open choices, reservations
- Trip day → weather, reminders, reservations, unresolved decisions
- Map → selected stop and specialist links
- Check → completion and important incomplete items
- More → device/offline freshness

Theme choices are `system`, `light`, and `dark`. The quick header control cycles them, while the full selector remains under **More → Appearance**. The trip accent is data-driven through `trip.accent`; it is decoration, not the product identity.

## Offline freshness

Use shared publish metadata when generating a trip:

```json
{
  "trip": {
    "updatedAt": "2026-09-17T16:10:00+08:00",
    "revision": "trip-2026-09-17-03"
  }
}
```

The header can then distinguish a fresh network copy from an IndexedDB fallback such as:

```text
Online · updated Sep 17, 16:10
Offline copy · updated Sep 17, 16:10
```

Checklist and personal-note changes are local state and do not change the shared trip revision.

## Share and deep links

The share button uses the Web Share API when available and falls back to copying the current URL.

Read-only URL hashes preserve context, for example:

```text
#now
#trip/overview
#trip/day/2026-10-04
#map/day/2026-10-04/stop/d2-ueno
#check
#more
```

These are navigation links, not collaborative editing sessions.

## Locale / labels

The base template keeps localization lightweight. Set a shell locale and optionally override individual labels:

```json
{
  "ui": {
    "locale": "zh-TW",
    "labels": {
      "navNow": "現在",
      "navTrip": "行程"
    }
  }
}
```

Built-in companion/shell labels cover English and Traditional Chinese; trip content itself remains whatever language the generating agent writes.

## Optional visual style: Storybook

Travel Lite now has two **site-level presentation styles**. The existing layout remains the default and still supports Auto / Light / Dark. The optional Storybook style adapts the illustrated Ishigaki experiment into **generic travel artwork**; it uses paper white, ink outlines, flat coral/yellow/blue/green colors, Huninn when available, illustrated day cards, a continuous daily timeline, optional mode/highlight tags, and gentle reduced-motion-aware animations.

For one-click comparison with the built-in Tokyo sample (without changing its data):

- [Editorial — original template](https://world4jason.github.io/Travel-lite-Template/#trip/overview)
- [Storybook — temporary preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=storybook#trip/overview)

To select Storybook permanently for a *generated trip*, set this in `trip.json`:

```json
{
  "ui": {
    "visualStyle": "storybook",
    "theme": "system"
  }
}
```

This is a snippet: retain the other existing `ui` and trip fields. Omit `visualStyle` or use `"editorial"` to retain the original look. Unknown values fall back to `editorial`. The trip data remains one source of truth, and there is no per-traveller style picker.

Optional, **explicitly supplied** presentation metadata:

```json
{
  "illustration": "train",
  "items": [
    {
      "id": "train-to-hotel",
      "start": "10:30",
      "title": "Train to the hotel",
      "transportMode": "train",
      "mustGo": true,
      "illustration": "train"
    }
  ]
}
```

Here, `illustration` at the day or item level uses a **safe built-in icon key** (`map`, `city`, `plane`, `car`, `train`, `boat`, `food`, `hotel`, `landmark`, `nature`, `sea`). The example combines a day-level illustration with an item. Only mark a stop `mustGo: true` when your trip's editor has explicitly prioritized it; it does **not** mean that a booking is confirmed. Declare `transportMode` only when your plans actually say `flight`, `drive`, `boat`, `train`, `bus` or `walk`—never infer route geometry or transport times from a stop's name.

The included illustration files are in `assets/storybook/` and are **destination-neutral**. When making a new trip, you can replace `assets/storybook/hero.svg` with a locally designed destination illustration without changing the data schema. Storybook uses **light only**, preserves the existing checklist/notes/offline features, and has **More → Motion** options: Follow device or Reduce motion. System `prefers-reduced-motion` always disables animation, even when the local option says Follow device.

Storybook's stylesheet is **disabled in Editorial**; its font is requested only in Storybook and never blocks page load. The URL query override is only for *previewing appearance* and does not rewrite `trip.json`, change group decisions, or store an alternate style preference.

## Style Prompt Lab — 將自然語言風格提示詞轉成 Style Brief

原本 `editorial`、`storybook` 是已經開發的 **Style Pack**。若你有不同用途的提示詞（插畫、明信片、Risograph、手刻印章、復古海報），可以先交給 [Style Prompt Lab](./style-generator/README.md) 拆解，不必自己預先知道 CSS 或 SVG。

- [使用者填空模板](./style-generator/templates/STYLE_REQUEST.md)
- [可交給 LLM 使用的 Style Extractor Prompt](./style-generator/STYLE_EXTRACTOR_PROMPT.md)
- [風格 JSON Schema](./style-generator/style.schema.json) 與 [六組實測範例](./style-generator/examples)
- `npm run validate:styles`、`npm run test:styles`：驗證六組範例與規格約束，不需要 API Key
- `npm run render:style-prompts`：把六份規格轉成[可重複填空的風格提示詞](./style-generator/generated-prompts)，仍不會修改網站 CSS

**重要：** 目前已完成的是六種風格的 **Style Brief 抽取／評估**，不是六套會自動生效的網站外觀。自訂名稱不會被當作 `ui.visualStyle` 使用；若要從 Style Brief 產生真正 Style Pack，需在下一階段建立 CSS／SVG、視覺預覽與功能回歸測試。沒有來源照片時，抽取器不會憑空猜測地標、實際照片顏色、招牌或來源文字。

## Quick start

1. Fork/use this repository as a base.
2. Replace `trip.json` with the output of your planning/discussion.
3. Keep stable IDs for days, activities, checklist items, todos, and decision options.
4. Add `lat`/`lng`, useful external links, reminders, TBD cards, and optional static info cards.
5. Use optional `highlights`, `routeSummary`, and `transferAfter` only when they make the trip easier to scan.
6. Set `trip.updatedAt` / `trip.revision` when publishing a new shared version.
7. Optionally set `ui.locale`, `trip.accent`, and provider map styles.
8. Push to `main`.

No build step, server, account system, or server database is required.

## GitHub Pages

This repository is a plain static site and includes `.nojekyll`, so GitHub Pages can publish the repository root directly.

Enable it once:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **`main`**.
4. Select folder **`/ (root)`**.
5. Click **Save**.

After that, pushes to `main` publish automatically. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Expected URL pattern:

```text
https://<github-user>.github.io/<repo-name>/
```

For this repository:

```text
https://world4jason.github.io/Travel-lite-Template/
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Documentation

- [`AGENTS.md`](./AGENTS.md) — concise rules for coding agents
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — product boundaries, runtime architecture, responsive shell, storage, handoff model
- [`docs/COMPANION_UX.md`](./docs/COMPANION_UX.md) — day-of Now/TBD/map/offline/share/locale interaction contract
- [`docs/TRIP_SCHEMA.md`](./docs/TRIP_SCHEMA.md) — how an LLM/agent should fill `trip.json`
- [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md) — development, PWA/cache, responsive/theme review, and acceptance checklist
- [`NOTICE.md`](./NOTICE.md) — TREK attribution/source-reuse notes

## Runtime services

- Map: MapLibre + OpenFreeMap (light/dark styles)
- Weather: Open-Meteo, cached locally
- Details/reviews/navigation: Google Maps URL handoff

External services are enhancements. The itinerary, reminders, checklist, reservations, and local notes should remain useful when they are unavailable.

## License

Travel Lite is AGPL-3.0-or-later. See `LICENSE` and `NOTICE.md` for attribution notes when adapting TREK code.
