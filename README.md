# Travel Lite Template

> 把已經排好的旅行，變成同行者能在手機上快速查看的行程網站。  
> **Plan elsewhere. Travel with clarity.**

Travel Lite turns a **mostly-planned itinerary** (spreadsheet, PDF, notes, or an LLM-assisted plan) into a **read-only, offline-ready trip companion** hosted as a static site on GitHub Pages. Its job is to answer **what's scheduled now, what's next, what should I remember, and where do I go?** — not to plan the trip again.

## Create a trip site with an AI agent (copy & paste)

Replace the itinerary and destination repository placeholders, then paste the prompt into your coding agent. Detailed workflow and validation rules live in [AGENTS.md](./AGENTS.md).

### 繁體中文｜直接複製給 Agent

```text
請幫我把以下「已規劃好的行程」製作成獨立的 Travel Lite 旅遊網站，
並發佈到 GitHub Pages。請實際完成，而不只是提供操作教學。

來源模板：https://github.com/world4jason/Travel-lite-Template
行程資料：<貼上行程全文、檔案路徑，或可讀取的 PDF／Excel／網頁網址>
目標 Repository：<https://github.com/OWNER/TRIP-REPO.git>
網站語言：繁體中文（如原始行程另有要求，以原始要求為準）
```

<details>
<summary>English — copy/paste agent prompt</summary>

```text
Create a NEW Travel Lite trip companion from the planned itinerary below
and publish it to GitHub Pages. Perform the work, not just explain it.

Source: https://github.com/world4jason/Travel-lite-Template
Itinerary: <paste itinerary text, accessible file path, PDF/Excel, or URL>
Destination repository: <https://github.com/OWNER/TRIP-REPO.git>
Interface locale: en (change to zh-TW for Traditional Chinese)
```

</details>

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

## Five-tab navigation MVP

The bottom destinations are Now / Trip / Transport / Places / More.
Transport reuses the MapLibre view (old #map deep links still work) and
surfaces published transfer notes, not live route predictions. Places
lists only planned venues/activities and existing source-backed context.
A Place can show an entry/booking reference only when explicitly linked
by a stable item ID. Longer Guides remain separate backlog #82.

Checklists moved to More -> Preparation & checklists, retaining the same
device-local progress; old #check links still work. Never commit private
QR tickets, full order references or signed confidential documents to the
public trip site. See [MVP data/navigation contract](./docs/NAV_PLACES_MVP.md) for migration boundaries.

**Real browser previews:** [Places mobile](./style-packs/previews/ia-places-mobile.png) · [Place details](./style-packs/previews/ia-place-detail-mobile.png) · [Explicit linked booking (synthetic test data)](./style-packs/previews/ia-place-entry-synthetic-mobile.png) · [Transport mobile](./style-packs/previews/ia-transport-mobile.png) · [More checklists](./style-packs/previews/ia-more-checklists-mobile.png) · [Places desktop](./style-packs/previews/ia-places-desktop.png).

## What works today

| View | On the trip, it helps you… |
| --- | --- |
| **Now** | See the previous / scheduled-now / next items, today's reminders, weather, and flexible/TBD activities |
| **Trip** | Scan all days, follow the planned stop order, read transfers, highlights, and open decisions |
| **Transport** | View the planned spatial map and saved transfer context; specialist services handle live routes and schedules |
| **Places** | Browse published attractions and optional place guides, linked entry and reservation references |
| **More** | Preparation & checklists (device-only), bookings, files, personal notes, exports and appearance |

Also included:

- **Works on phone and desktop:** touch-first bottom navigation on phones; contextual day/reference rails on larger screens.
- **Offline/PWA:** after a successful first visit, the app shell and last loaded trip snapshot can remain available without network access. Weather, fresh map tiles, and external booking sites may still need internet.
- **Read-only sharing:** share a link to the trip, a specific day, or a planned map stop; no sign-in or collaboration backend.
- **Multi-country trips:** day/item timezone overrides for correct schedule reference.
- **Appearance:** 14 reviewed Style Packs (15 selectable appearances, including Editorial Light/Dark), plus English / Traditional Chinese interface labels. See [styles and previews](./style-packs/README.md).

**Travel Lite is not:** a trip planner/editor, navigation engine, live transit tracker, booking manager, reviews database, or real-time group chat. It links to specialist tools rather than rebuilding them.

## Quick start: publish your own trip

**GitHub template note:** The **Use this template** button and `gh repo create --template` work only after the source repository owner enables **Settings → General → Template repository**. Until then, create a separate destination repo and copy the source files; don't push changes to this repo. See [GitHub's template repository guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository).

**Security and deployment:** A public GitHub Pages site may expose everything committed to `trip.json`. Don't include passports, passwords, private booking tokens, or sensitive personal documents. [GitHub Pages publishing setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) may require repository permissions. The agent must verify the published site before reporting deployment as complete.


1. **Create an independent destination repository and keep the source discoverable.** For a published trip generated through this workflow, prefer a public source repo with a link from the site. If this repository is enabled as a GitHub template, use **Use this template**; otherwise copy the source files into a new repo. Never push trip-specific data to the original source repository.
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
IndexedDB     → this trip site's device-local checks, preferences, notes and cached trip
localStorage  → site-scoped local fallback and small preferences
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

**ICS compatibility notice / 行事曆相容性提醒:** Automated RFC 5545, parser, timezone/DST and download checks were recorded for the MVP, but **real imports into Apple Calendar, Google Calendar or Outlook have NOT been manually verified**. The owner explicitly **waived this Human Gate for the MVP release; result: NOT RUN (accepted risk), not PASS** ([#73](https://github.com/world4jason/Travel-lite-Template/issues/73)). **After importing, check the event dates, local times, time zones and reminders in your calendar before relying on them.** 中文：實際匯入 Apple／Google／Outlook 行事曆尚未經人工驗收，請先核對日期、時間、時區及提醒。這不代表日曆功能已通過真實 App 相容性測試。

Exports use the same published `trip.json` as the website. A4/A5 print **published itinerary text (including `item.note`) and selected confirmed-booking summary fields as supplied**, without automatic secret/token scrubbing. **Remove private credentials, tokens, and other sensitive material before publishing `trip.json`**; both the public site and printed copies can expose it. Device-local personal notes and checklist completion are not included. No map-image provider or online fonts are needed to print text.

Implementation: `export-core.js` (print/ICS functions), `export-ui.js` (More actions), `export.css` (screen launcher). Run:

```bash
npm run test:export            # RFC 5545, DST, text folding and print-model checks
npm run test:mobile            # existing UI + export popup/download/PDF smoke tests
```

Related work: [#70 A4/A5/ICS](https://github.com/world4jason/Travel-lite-Template/issues/70). **Maps remain MapLibre**; [#74](https://github.com/world4jason/Travel-lite-Template/issues/74) compared Leaflet's markers/polylines without changing the engine.

**Map engine:** [#74 Leaflet vs MapLibre evaluation](https://github.com/world4jason/Travel-lite-Template/issues/74) is **complete**; the decision was to retain MapLibre. No Leaflet migration is planned.

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

> **開源使用原則（AGPL-3.0-or-later）**：歡迎依法使用、修改、分享及商業使用 Travel Lite。**不得移除原作者與 TREK 的必要著作權／授權聲明，也不得在 AGPL 要求提供原始碼時將受涵蓋的作品改成閉源。**修改、散布及透過網路提供修改版時，請依 AGPL 履行相應義務。
>
> 與其他 App／網站整合**不是一律禁止**，但必須先確認受 AGPL 涵蓋的範圍及授權相容性；單純與獨立程式互動不代表所有程式都必須開源。讓 Agent 建立新旅行網站時，請保留授權資訊並提供原始碼連結。詳見 [AGENTS.md](./AGENTS.md) 與 [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html)。

Travel Lite is available under **[AGPL-3.0-or-later](./LICENSE)**. Reuse — **including commercial use** — is allowed when the applicable terms are followed. Preserve copyright/attribution and license notices (including [TREK-related notices](./NOTICE.md)); for covered modified/combined works and qualifying network interactions, comply with the relevant **Corresponding Source** obligations. Merely interacting with unrelated software does not automatically impose AGPL on that software. The requirements depend on the actual work and how it is shared or used.

See [GNU AGPLv3 §§4–5, 13](https://www.gnu.org/licenses/agpl-3.0.html) and the [GNU license FAQ](https://www.gnu.org/licenses/gpl-faq.en.html) for the authoritative terms. The Agent prompt above describes **one standalone trip-generation workflow**, not extra legal restrictions on AGPL recipients.
