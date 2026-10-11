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

## Visual Style Packs — 14 Packs / 15 appearances

Travel Lite ships **14 reviewed Style Packs (15 visible appearances)**: Editorial Light/Dark are two modes of the same pack, while thirteen other packs have their own visual languages. The publisher chooses the shared default; travellers may override only the appearance on their own device. Every pack preserves one itinerary, navigation, map, checklist, deep links and offline application. [See Style Pack implementation notes and source evidence](./style-packs/README.md).

For one-click comparison with the built-in Tokyo sample (without changing its data):

- [Editorial — original template](https://world4jason.github.io/Travel-lite-Template/#trip/overview)
- [Storybook — illustrated notebook](https://world4jason.github.io/Travel-lite-Template/?previewStyle=storybook#trip/overview)
- [Candy Geometry — rounded sticker art](https://world4jason.github.io/Travel-lite-Template/?previewStyle=candy#trip/overview)
- [Risograph Zine — paper and indigo ink](https://world4jason.github.io/Travel-lite-Template/?previewStyle=risograph#trip/overview)
- [Paper Collage — layered cut paper](https://world4jason.github.io/Travel-lite-Template/?previewStyle=paper-collage#trip/overview)
- [Naive City Sketch — illustrated neighbourhood](https://world4jason.github.io/Travel-lite-Template/?previewStyle=naive-city#trip/overview)
- [Taiwan Retro Poster — screenprint editorial](https://world4jason.github.io/Travel-lite-Template/?previewStyle=taiwan-poster#trip/overview)
- [Field Stamp — hand-carved field notes](https://world4jason.github.io/Travel-lite-Template/?previewStyle=field-stamp#trip/overview)
- [Quiet Linocut — 版刻詩意](https://world4jason.github.io/Travel-lite-Template/?previewStyle=quiet-linocut#trip/overview)
- [Doodle Memory Grid — 九格塗鴉](https://world4jason.github.io/Travel-lite-Template/?previewStyle=doodle-memory-grid#trip/overview)
- [Crayon Journal — 蠟筆日記](https://world4jason.github.io/Travel-lite-Template/?previewStyle=crayon-journal#trip/overview)
- [Painterly Editorial — 柔彩筆觸](https://world4jason.github.io/Travel-lite-Template/?previewStyle=painterly-editorial#trip/overview)
- [Geometric Print — 硬邊幾何](https://world4jason.github.io/Travel-lite-Template/?previewStyle=geometric-print#trip/overview)
- [Quiet Acrylic — 極簡細線壓克力](https://world4jason.github.io/Travel-lite-Template/?previewStyle=quiet-acrylic#trip/overview)
- **Editorial Dark**: choose it directly in More → Appearance (the same Editorial pack, dark color mode).

**You can also switch directly in the website:** open **More → Appearance / 外觀**, select one of **15 appearance choices** (Editorial Light/Dark plus 13 other Style Packs), or press **Follow trip default / 跟隨行程預設** to clear your personal preference. Switching is instant and does not reload or alter the public itinerary. Your selection is saved locally, per trip, in IndexedDB (with a localStorage fallback). A whitelisted `?previewStyle=...` sharing link temporarily overrides the device preference until you select or reset a style.

To select a published Style Pack default for a *generated trip*, set `ui.visualStyle` to one of `editorial`, `storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster`, `field-stamp`, `quiet-linocut`, `doodle-memory-grid`, `crayon-journal`, `painterly-editorial`, `geometric-print`, `quiet-acrylic`. Editorial Light/Dark are `ui.theme` modes, not extra Style Pack IDs. Example:

```json
{
  "ui": {
    "visualStyle": "storybook",
    "theme": "system"
  }
}
```

This is a snippet: retain the other existing `ui` and trip fields. Omit `visualStyle` or use `"editorial"` to retain the original publisher default. Unknown values fall back to `editorial`. The trip data remains one source of truth: each traveller can pick among the fourteen reviewed packs locally without changing the publisher-selected default.

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

Style Pack CSS is **disabled unless the site chooses that whitelisted pack**. Candy inherits Storybook's timeline and swaps tokens/illustrations; Risograph uses independent print-typography and texture CSS. Huninn is only requested for packs whose typography requires it and never blocks page load. The URL query override is only an appearance preview; it does not rewrite `trip.json`, group decisions or local preferences.

## Style Prompt Lab — 將自然語言風格提示詞轉成 Style Brief

目前有十四套可使用、已驗收的 **Style Pack**，其中十二種源自兩批原始提示詞（另有 Editorial 和 Megan Storybook）。使用者可切換十五種外觀（Editorial Light/Dark 分別顯示）。若你有不同用途的提示詞（插畫、明信片、Risograph、手刻印章、復古海報），可以先交給 [Style Prompt Lab](./style-generator/README.md) 拆解，不必自己預先知道 CSS 或 SVG。

- [使用者填空模板](./style-generator/templates/STYLE_REQUEST.md)
- [可交給 LLM 使用的 Style Extractor Prompt](./style-generator/STYLE_EXTRACTOR_PROMPT.md)
- [風格 JSON Schema](./style-generator/style.schema.json) 與 [十二組實測範例](./style-generator/examples)
- `npm run validate:styles`、`npm run test:styles`：驗證十二份風格 Brief 與規格約束，不需要 API Key
- `npm run render:style-prompts`：把十二份規格轉成[可重複填空的風格提示詞](./style-generator/generated-prompts)
- `npm run test:packs`：驗證十二個由提示詞實作出的 Style Pack 的來源對應、SVG、紙雕／印刷材質語法與文字對比。
- [新提示詞 E2E 驗收步驟](./style-generator/NEXT_PROMPT_E2E.md)：明確區分 style reference／實際目的地資料，再完成兩站視覺、資料與部署驗收。

**重要：** 十二份來源 Style Brief 仍是 `brief-only` 的**視覺規格**；真正能在網頁選取的是經審核的 CSS、SVG 與 Manifest。第二批八段輸入先去重，兩段歸到既有 Risograph，其餘六段獨立實作。沒有來源照片時，不假裝對原照忠實或量得真實 HEX。[第二批去重與規則拆解](./style-generator/batches/2026-10-11-editorial-posters.md)。

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
