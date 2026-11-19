# Places — 「景點」頁 UI/UX

> Curated *place guide*, not the itinerary's list of every scheduled activity. Governed by [UIUX.md](../UIUX.md) P1.11, [SHARED.md](./SHARED.md), and [Trip Schema](../TRIP_SCHEMA.md) (“Place vs event vs break”, `infoCard`).

## 1. View modes, routes and page structure

- **All days** (`#places`) and **a selected day** (`#places/day/DATE`) are distinct Places view modes. `#places/item/ID` opens only an unambiguous source-backed detail. When a day is explicitly selected, update shared `state.selectedDate` so Trip and Transport follow it; Places All must **not** overwrite selectedDate with a fake “all-day” value.
- Primary list is a compact, scannable curated catalogue: verified venue name, short independent guide intro, place/area, appropriate link to detail and a clear Maps handoff. Avoid default long operational notes, overlarge action buttons and repeated labels.
- Detailed venue view is informative, not a copied schedule: title → concise “why it matters / what to see” → useful factual context (as researched) → sourced official site / trusted tourist guide / Maps → appropriately credited image when available. Essential on-site cautions can remain visible; optional deep notes expand.

## 2. Strict inclusion / type gate (P1)

| Canonical type | Places catalogue? | Reason |
| --- | --- | --- |
| `place / attraction / museum / landmark / nature / sight` | **Yes**, when an independently identifiable destination has trustworthy guide content | Shrine, temple, walking trail, museum, garden, park, landscape |
| `event` | **No** by itself | Festival, fireworks, market, live performance, illumination event; belongs to Trip as a timed activity |
| `break` | **No**, even with coordinates | Reading at riverbank, waiting, resting, routine hotel bath, “between shows” |
| `transport / stay / generic food` | **No** | Vehicle/transfer, overnight stay, unspecified meal are not attractions |
| researched named `restaurant` | Only when separately curated as a real venue under supported schema | Not any lunch slot |

- **Never promote by `location`, GPS pin, `mapQuery`, `infoCard` presence or map deep link alone.** The riverbank reading/waiting slot before Inagawa fireworks must stay a `break`, not a Places card. Fireworks themselves remain `event`, not an attraction entry.
- If the source type is wrong, correct the publishing `trip.json` type **without losing source item ID, time, order or notes**, and verify Trip still renders the time block.

## 3. Curated content, official links, photographs

- Each published venue should have venue-specific **`infoCard.summary`** explaining the destination, not “約 15:00–16:00｜停留 60 分鐘” or a restatement of `item.note`. Aim for short, concrete history/context/highlights with no invented fact.
- At least one verifiable first-party `infoCard.sourceLinks`: venue's genuine site, government, or official tourism organization. `infoCard.officialSite` is **only** the venue's own site; label regional tourism-board pages accurately. Do not assert current opening hours, price or availability as live if merely researched.
- Photographs are **optional**. Embed only a subject-matching image with documented source/rights and `imageAlt`, `imageSource`, `imageCredit`, `imageLicense` (and source URL); do not hotlink an arbitrary official-site photo or confuse search-result thumbnails with permission. For unknown/license-incomplete images, omit the image entirely and retain text + links.
- Official source links should be HTTPS/HTTP(S) safe, open the right location, and remain discoverable even when the image or map provider fails. Images must not force giant empty aspect-ratio placeholders.

## 4. Visual and accessibility details

- Card emphasis: venue → actual guide summary → contextual location / official web + Maps. Do not display a day-by-day duplicate of Trip. Avoid a weather strip if the user's Places view already clearly offers date selection? **When date selection is shown, use the shared strip, never a second independent selector**.
- Long venue names and images must reflow at 320/390/1100/1920px and 200% text; actions have readable labels, keyboard focus and sufficiently large targets. The all-days filter must not vanish in a Style Pack.

## 5. Acceptance

- `npm run test:places-curation` and `npm run test:places-curation:browser` plus `npm run test:uiux`, `npm run test:timeline`, ID integrity and responsive/style-pack browser tests.
- Negative cases: mapped `break` with coordinates, fireworks `event` and market with `mapQuery` excluded; published venue contains source-backed guide; image missing license excluded; all-days and day deep links/Back work; partial image failure preserves place and official links.
