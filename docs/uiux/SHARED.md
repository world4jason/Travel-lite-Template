# Shared UI/UX — Shell, layout, typography, navigation, and acceptance

> **Normative P0/P1 page supplement.** Read [UIUX.md](../UIUX.md) first. This document governs every page (Now / Trip / Transport / Places / More), every supported Style Pack, and inherited trip sites. [Style Surface Contract](../STYLE_SURFACE_CONTRACT.md) is the CSS/geometry implementation reference; this document describes the product-facing result.

## 1. Ownership / source of truth

- Five fixed primary destinations, in order: **Now / Trip / Transport / Places / More**. The internal `map` route still means Transport; preserve legacy `#map` / `#check` and existing published deep links. No separate Weather, Flights, Tickets, or Settings sixth tab.
- `trip.json`, in particular `days[].items[]`, is the sole canonical scheduled itinerary. Derived projections must not change time, order, ID, source, or timezone. IndexedDB/localStorage holds device-local preferences only, never an imagined group decision.
- Route and selected-day semantics: Trip / Transport / Places share `state.selectedDate`; Trip Overview and Places All are independent **view modes**, not dates; Transport is day-only. Handle Back/Forward, refresh, cross-tab handoff, deep links, unknown IDs, and migrated hashes predictably.
- Source provenance and user trust beat decoration. Never make a snapshot appear to be live GPS, weather observation, transit availability, booking, ticket, or verified route. No invented coordinates, station names, times, photos, schedules, or status.

## 2. Information architecture and content economy

- Above the fold: context (date / day / section) → primary answer or action → necessary time, status, source. Long notes, alternate trains, background research and optional Plan B belong in accessible progressive disclosure. Never hide the whole Trip Day timeline.
- **Do not generate redundant helper copy:** no generic eyebrow, slogan, filler subtitle, duplicate category label, repeated footer summary, repeated instructions, or page-by-page recitation of the product contract. Examples to remove from the visible UI: “依實走順序串起交通與遊覽” and “依時間排列：景點、交通、餐飲皆為獨立時段”. Keep specific disruptions, ticket constraints, checked dates and genuinely decision-critical warnings.
- Avoid repeating a title as a location, a walking duration as a second explanatory sentence, or the same weather/route text in both title and helper label. Preserve original source fields; deduplicate **rendered presentation only**.
- Every control must have a real, discoverable purpose. Do not use a “More” or collapsible group as a dumping ground for essential current information; do not turn every secondary reference URL into a primary-sized button.

## 3. Responsive shell contract

| Available viewport | Layout / behavior |
| --- | --- |
| < 900 CSS px | Single reading column, five-tab bottom navigation; date strip may scroll horizontally by itself |
| 900–1399 CSS px | Persistent date/day rail + primary content and desktop navigation; no overlapping or truncated content |
| ≥ 1400 CSS px | Context-sensitive right rail in addition to day rail and primary content; right rail must vary by active page, not duplicate the main timeline |

- **Test widths:** 320, 390, 980, 1024, 1100, 1280, 1440, 1920 CSS px; repeat key cases with **200% text zoom** and long Chinese / Japanese place names, full station names, multiline times and links. No page-wide horizontal scrolling or missing controls. Intentional horizontal scrolling is confined to the date strip or an intrinsically spatial map, never the whole layout.
- Treat inner widths as actual available space, not viewport width: `min-width:0` on Grid/Flex children, `minmax(0,1fr)` for flexible tracks, text wrapping and `box-sizing:border-box` for framed components. Avoid fixed widths, width-plus-padding overflow, negative margins, absolute elements crossing frame, and CSS selector specificity collisions. **Never “fix” clipping using `overflow:hidden`, smaller text, or obscured content.**
- Bordered cards: text's **measured** distance from visible left/right interior border ≥ **12 CSS px**, 16px recommended. Map Workspace is a special paired frame/inset role: a framed theme needs nonzero `--ui-map-workspace-frame` and `--ui-map-workspace-padding` (≥12px; recommended 16–24px); unframed themes must not inherit accidental panel borders. Map tiles may clip within the map canvas, but headings, station lists and controls may not.
- In Storybook, Trip timeline item is **one column**, with time above its content. Journey-specific CSS must not override a theme's global item grid. Desktop sidebars, surface geometry and safe areas are independently tested; static token presence is insufficient.

## 4. Visual language, iconography and accessibility

- Theme/Style Packs may change typography, colors, illustration, line, shadow, texture, radius and animation, **not** page hierarchy, semantics, data fields, accessibility, routes or main actions. Light/dark/system where supported; avoid semantic meaning in color alone.
- **Trip Overview exception (P1.12):** large theme artwork and pseudo-element Hero, day, Highlight and Open Decision stickers are forbidden regardless of Style Pack. Optional Highlights are collapsed by default and expand as a compact source-backed list, never a generic sticker gallery. Preserve compact content-first overview; source-backed imagery belongs in actual Places content, not a repeated neutral nine-grid. `overview-compact.css` is intentionally a later, shared layout contract.
- **Appearance (P1.13):** one Style Picker, which already includes Editorial Light and Editorial Dark; no redundant System/Dark/Light control below. New Template defaults to Light. Preserve separate device-only motion controls for animated themes and existing deliberate style preferences.
- Functional icons come from allowlisted local `ui-icons.js` **semantic SVG**. Train ≠ subway ≠ funicular/cable car ≠ bus; walking uses **footprints**; external map action uses a generic map pin. No odd font glyphs (`⌖`, `◫`, `≋`, text emoji) as icon substitutes, and no unofficial Google brand-logo imitation.
- Focus must be visibly distinguishable; all actions, day cards, expanders, maps links and deep links work by keyboard. Use text labels/accessible names and state announcements rather than color or symbol alone; do not steal focus on weather updates. Aim for ≥44×44 CSS px primary touch controls (project standard, stricter than WCAG 2.2 AA minimum with exceptions). Respect reduced motion and ≥200% text.
- Images require meaningful alt text, nonblocking loading, a stable aspect ratio / sensible fallback; content and controls remain usable when a photo or external tile fails. No externally sourced image without documented right to embed.

## 5. External services / data / failure modes

- Static itinerary and date navigation remain usable offline. External maps, weather, image hosts and service providers are enhancements only; provide clear, nonmisleading fallback and label stale caches.
- Maps URLs use official `api=1` parameters, encoded place names, known origin/destination and an appropriate travel mode; Google Maps output may differ from the planned schedule and is not live confirmation.
- Published GitHub Pages content is public. No booking reference, QR ticket, passport, traveller identity or other private data in public `trip.json`, markup or images.
- The weather/date strip is governed by [WEATHER.md](./WEATHER.md). It is a shared component on Trip / Transport / Places, **not** a separate page.

## 6. Mandatory Acceptance / 驗收清單

1. Read `AGENTS.md` → full `docs/UIUX.md` → this file → changed page's specification → `WEATHER.md` when touching dates/weather → relevant Schema/Timeline/Surface contract. Kansai-specific changes additionally read `docs/UIUX_KANSAI.md`.
2. Verify date deep links and browser history; prove that pages project source data without inventing values.
3. Run `npm run test:uiux`, `npm run test:timeline` and `npm run lint:uiux`; use `npm run test:uiux:geometry`, `npm run test:trip-layout:browser` and page-specific browser tests when UI/CSS changes. Verify all applicable Style Packs and offline/PWA after asset changes.
4. Capture actual rendered browser dimensions, including framed inset and no clipping; **PASS / FAIL / NOT RUN** must be factual. A documentation-only change does **not** mean the browser was visually verified.

References: [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [W3C target size enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).
