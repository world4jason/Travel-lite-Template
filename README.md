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
| **More** | Find shared reference information such as reservations, notes, links and contacts, plus device-local quick notes |

Also included:

- **Works on phone and desktop:** touch-first bottom navigation on phones; contextual day/reference rails on larger screens.
- **Offline/PWA:** after a successful first visit, the app shell and last loaded trip snapshot can remain available without network access. Weather, fresh map tiles, and external booking sites may still need internet.
- **Read-only sharing:** share a link to the trip, a specific day, or a planned map stop; no sign-in or collaboration backend.
- **Multi-country trips:** day/item timezone overrides for correct schedule reference.
- **Appearance:** 14 reviewed Style Packs (15 selectable appearances, including Editorial Light/Dark), plus English / Traditional Chinese interface labels. See [styles and previews](./style-packs/README.md).

**Travel Lite is not:** a trip planner/editor, navigation engine, live transit tracker, booking manager, reviews database, or real-time group chat. It links to specialist tools rather than rebuilding them.

## Create a trip site with an AI agent (copy & paste)

**No coding required from the traveler.** Give a coding agent access to the itinerary and a GitHub account authorized to create the destination repository. Replace the **itinerary** and **destination repository** placeholders below, then paste the whole prompt into your agent.

### 繁體中文｜直接複製給 Agent

```text
請幫我把以下「已規劃好的行程」製作成獨立的 Travel Lite 旅遊網站，
並發佈到 GitHub Pages。請實際完成，而不只是提供操作教學。

來源模板：https://github.com/world4jason/Travel-lite-Template
行程資料：<貼上行程全文、檔案路徑，或可讀取的 PDF／Excel／網頁網址>
目標 Repository：<https://github.com/OWNER/TRIP-REPO.git>
網站語言：繁體中文（如原始行程另有要求，以原始要求為準）

請依序執行：
1. 先讀來源模板的 AGENTS.md、docs/TRIP_SCHEMA.md、
   docs/SOURCE_NORMALIZATION.md、docs/TIMEZONE.md。
2. 在目標位置建立全新的 Repository：若來源已啟用 GitHub Template，
   優先使用模板；否則複製程式到獨立的新 Repo。確認 git remote 指向
   目標 Repo，不要修改或 Push 到 world4jason/Travel-lite-Template。
   若目標 Repo 已有其他內容，先確認，禁止直接覆蓋。
3. 從提供的行程來源產生新 trip.json，取代東京示範行程。
   保留真實的日期、當地時間、景點順序、住宿和交通資訊；
   未提供的時間維持 TBD，不得臆造路線、座標、費用或訂位狀態。
   跨國旅程依 item → day → trip 設定有效時區；使用穩定的 ID。
4. 維持既有唯讀網站的功能與外觀架構。優先只修改 trip.json
   及確實需要的行程圖片／素材；保留 LICENSE、NOTICE.md。
   公開網站不得上傳護照、密碼、完整訂位憑證或其他敏感資料。
5. 先驗證行程內容、手機與桌面顯示、地圖外部連結、
   沒有固定時間的日子，以及現有回歸測試（可執行時）。
6. Push 到目標 Repo 的 main，設定 GitHub Pages 使用
   main / (root)，等待發佈並實際開啟網站，確認可正常讀取。
   若無權限建立 Repo 或啟用 Pages，說明阻礙並提供剩餘步驟，
   不可宣稱已部署成功。

完成後請回覆：GitHub Repo URL、GitHub Pages URL、
驗收結果、未確認或缺少的行程資訊。不要順便新增規劃器、
登入／同步後端、即時導航或其他不在此需求內的功能。
```

<details>
<summary>English — copy/paste agent prompt</summary>

```text
Create a NEW Travel Lite trip companion from the planned itinerary below
and publish it to GitHub Pages. Perform the work, not just explain it.

Source: https://github.com/world4jason/Travel-lite-Template
Itinerary: <paste itinerary text, accessible file path, PDF/Excel, or URL>
Destination repository: <https://github.com/OWNER/TRIP-REPO.git>
Interface locale: zh-TW unless the itinerary asks for another locale

1. Read AGENTS.md, docs/TRIP_SCHEMA.md, docs/SOURCE_NORMALIZATION.md,
   and docs/TIMEZONE.md in the source repository before changing files.
2. Create an independent repository at the destination. Use GitHub's
   template workflow if the source is enabled as a template; otherwise
   copy the source into a NEW repository. Verify the git remote points
   to the destination. Never push to the original template. Do not
   overwrite an existing destination repository without confirmation.
3. Replace the Tokyo demo in trip.json with a source-faithful version of
   the supplied itinerary. Keep original dates, local times, stop order,
   and confirmed facts. Leave unknown times as TBD; do not invent
   coordinates, transfers, fares, booking status, or resolved decisions.
   Use stable IDs and item → day → trip timezone precedence.
4. Preserve the existing read-only site, LICENSE, and NOTICE.md.
   Prefer changing trip.json and only genuinely needed trip assets.
   Never publish secrets, passport data, or full booking credentials.
5. Validate itinerary content, phone/desktop layout, external map links,
   untimed days, and available regression tests.
6. Push to the destination's main branch, configure GitHub Pages to
   deploy from main / (root), and verify the live URL loads correctly.
   If permissions block creation/deployment, report the exact blocker
   and remaining steps rather than claiming success.

Finish with: destination GitHub repository URL, live GitHub Pages URL,
validation evidence, and unresolved/missing itinerary information.
Do not add a planner, backend, user accounts, live navigation, or
other out-of-scope functionality.
```

</details>

**GitHub template note:** The **Use this template** button and `gh repo create --template` work only after the source repository owner enables **Settings → General → Template repository**. Until then, create a separate destination repo and copy the source files; don't push changes to this repo. See [GitHub's template repository guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository).

**Security and deployment:** A public GitHub Pages site may expose everything committed to `trip.json`. Don't include passports, passwords, private booking tokens, or sensitive personal documents. [GitHub Pages publishing setup](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) may require repository permissions. The agent must verify the published site before reporting deployment as complete.

## Quick start: publish your own trip

1. **Create an independent destination repository.** If the source is enabled as a GitHub template, use **Use this template**; otherwise copy the source files into a new repo. Don't push trip-specific data back to this repository.
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

## Planned, not shipped yet

The following are **open GitHub issues, not features currently available in the live site**:

- [#70 Export features](https://github.com/world4jason/Travel-lite-Template/issues/70), split into [#71 A4 printable itinerary/PDF](https://github.com/world4jason/Travel-lite-Template/issues/71), [#72 A5 page-by-page travel booklet](https://github.com/world4jason/Travel-lite-Template/issues/72), and [#73 iCalendar `.ics` export](https://github.com/world4jason/Travel-lite-Template/issues/73).
- [#74 Leaflet vs MapLibre evaluation](https://github.com/world4jason/Travel-lite-Template/issues/74). The live map **currently uses MapLibre**, not Leaflet.

These are intentionally small, incremental extensions that keep GitHub Pages static deployment and the read-only trip model.

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
