# Travel Lite Navigation & Places MVP — Five-round Agent QA

Date: 2026-10-17. Agent code, browser and visual review only. This is **not** five independent human reviewers.

## Round 1 — Source/data contract: PASS
- Verified project architecture, user-approved IA, existing source normalization and GitHub issues #82, #104, #105.
- Created five stable destinations: Now / Trip / Transport / Places / More.
- Kept internal legacy map IDs/hashes; Places uses the published itinerary, not a discovery API or a second planning database.
- Excluded transport/accommodation/undefined meals from Places. Only explicit itemId/itemIds links associate reservations and files with a planned stop. Never guess confirmation, ticket or QR availability.

## Round 2 — Cross-page behavior & persistence: PASS
- Tested L0 Places by-day list and L1 infoCard details, Trip→Place ID→Trip/day, #places/item/ID deep-link and reload.
- Preserved old #map/day/date/stop/ID and #check bookmarks.
- Moved checklists to More without renaming device-only storage keys. Stored checkmarks and old local selected Check view migrate safely to More.

## Round 3 — Responsive & visual acceptance: PASS (after corrections)
- Actual 320/390/844-landscape/1100/1600px screenshots and Playwright.
- First test caught 32-day overflow: using native select for >7 relevant dates; otherwise day chips.
- First enlarged-font test caught long label Transport causing 320px overflow. Fixed tab layout with minmax(0,1fr) and wrap.
- Reviewed screenshots from 390px Places L0, L1, Transport, More and 1100px Places. All 15 existing style packs tested for layout integrity.

## Round 4 — Security, truthfulness & offline: PASS
- XSS/JS URL negative fixtures are escaped/blocked. A synthetic non-private pending booking sample is explicitly linked by itemId.
- Same-name-but-unlinked booking never appears in a place detail. No guide/no places gives safe fallback.
- Offline first-load PWA keeps Places and Transport scripts and data available. No hidden service or invented rural timetable is claimed.

## Round 5 — Regression and change boundary: PASS
- Node: 67/67 passing via node --test tests/*.test.mjs style-generator/tests/*.test.mjs.
- Chromium: 172/172 passing via npx playwright test --project=chromium --workers=2 --reporter=line.
- Supplemental booking screenshot specimen test: Places suite 16/16 passing.
- Earlier failures were outdated test assumptions that still clicked the old Check bottom tab; changed style navigation tests to Places and independently retained old #check tests.
- JS syntax and staged diff whitespace checks performed before merge. No GitHub Actions workflow or other travel repositories changed.
- Tokyo sample trip facts untouched; only the ui.bottomNav list changed.
- Six real browser screenshots stored under style-packs/previews/ia-places-mobile.png, ia-place-detail-mobile.png, ia-place-entry-synthetic-mobile.png, ia-transport-mobile.png, ia-more-checklists-mobile.png, and ia-places-desktop.png. The third contains synthetic examples, never a real booking.

## Constraints and remaining gates
- Transport is the existing MapLibre map + static published transfer summaries; full rural bus station/service calendars belong to #104/#105.
- Multi-section richly illustrated Guide/A5 expansion belongs to #82.
- Public static deployment is NOT a private ticket vault. Keep personalized QR, signed booking tokens, passports out of public trip.json.
- Manual real-trip import acceptance: NOT RUN / previously owner-waived, not PASS.
- Post-deployment Human Visual Review: PENDING until owner looks at the live updated Pages site.

Recommendation: release this bounded working MVP, then refine Guide/transit separately using actual source-backed trips.
