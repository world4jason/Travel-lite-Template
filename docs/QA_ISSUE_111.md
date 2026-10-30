# Issue #111 — Places date-filter and native browser history QA

**Scope:** Stacked on #109's global-ID fail-closed branch, not on an old main. No change to the published Tokyo `trip.json`, five tabs, booking associations or A4/A5/ICS. **Do not merge this branch before #109.**

## Navigation policy

- `#places` is the All days list. `#places/day/YYYY-MM-DD` selects only a published day with Places entries. Invalid, stale and malformed routes fall back to `#places` without inventing a date.
- `#places/item/ITEM_ID` is a unique-ID-only detail. The #109 integrity gate still blocks ambiguous and unknown IDs, including via Back and Forward.
- Native clicks on date filters, Places cards, in-app Back and handoffs to Trip or Transport create browser History entries. Browser Back/Forward restores the prior list/date/detail or prior Trip/Transport visit. No artificial hash-only placeholder pages.
- Device-local filter is stored per trip ID as `places:date`, and never modifies `trip.json` or changes Trip's current day solely from Places filtering. Explicit direct date links override storage. A direct detail link preserves the last valid stored filter for the Back control.
- Legacy `#map`, `#check` and existing Trip/Transport routes are preserved. A 32-day itinerary renders a native select rather than clipped date chips. Offline PWA reload retains the local day filter.

## Browser acceptance evidence

Test file: `tests/issue111-places-history.spec.mjs`. It tests native `page.goBack()` / `page.goForward()`, explicit filter route validation, reload, per-trip storage isolation, 32-day select, 320/390/1100 responsive views, offline Service Worker, and #109 ID ambiguity safety.

**Actual developer QA on the authorized Mac:** focused `npx playwright test tests/issue111-places-history.spec.mjs --project=chromium` **16/16 PASS** (rerun after invalid-date URL canonicalization); `npm run test:mobile` **283 PASS, 16 opt-in skips, 0 FAIL**; separate `TRAVEL_LITE_FULL_STYLE_QA=1 npx playwright test tests/style-surface-matrix.spec.mjs --project=chromium` **16/16 suites = 240/240 smoke PASS**; `node --test tests/*.test.mjs` **61 PASS**, `npm run test:packs` **15 PASS**, `npm run test:styles` **20 PASS**, `npm run test:integrity` **PASS** on the unchanged published Tokyo source. All results are developer-run; independent Reviewer and owner Human Review are **NOT RUN**.

## Screenshot evidence

Real Playwright screenshots: [Day 2 selected (390px)](qa-issue111/places-filter-day2-390.png), [native Forward restored detail](qa-issue111/places-native-forward-detail-390.png), [32-day select (320px)](qa-issue111/places-32day-filter-320.png), and source-driven day-filter deep links at [320px](qa-issue111/places-deeplink-320.png), [390px](qa-issue111/places-deeplink-390.png), [1100px](qa-issue111/places-deeplink-1100.png). These are developer QA artifacts, not owner approval.

## Release gate

**Draft / DO NOT MERGE** until independent review of #109 and then #111, with a valid stacked diff, successful full tests and owner-approved history/date UX. After #109 is merged, retarget #111 to `main`, review diff again, merge, verify GitHub Pages, obtain owner Human Review, then close #111. Keep #109 OPEN pending its own review and deployment acceptance.


## Review follow-up — 2026-10-31

Independent source review found that an explicit `#places` link only reset the
filter during a history event. On a fresh document, hydration could restore Day 2
and silently rewrite the All days URL to that date.

A real Chromium negative regression reproduced this on the original `c163bfa`
runtime: **expected 3 cards, received 2**. The no-hash restoration control passed.
The router now applies the explicit All days route on initial load as well as
history navigation. No-hash visits still restore the device filter, and valid
date/detail links keep their existing precedence.

- `TRAVEL_LITE_TEST_PORT=4439 npx playwright test tests/issue111-places-history.spec.mjs --project=chromium`: **18 PASS / 0 FAIL** after the fix, including native Back/Forward, reload, offline PWA, legacy links, trip isolation, and both new cold-start cases.
- [Fresh All days route at 390px](qa-issue111/places-explicit-all-cold-start-390.png) is actual Chromium evidence, inspected alongside the 320/390/1100 filtered views. This is Agent visual QA, not owner sign-off.
- Service Worker shell cache changes to `shell-v47-places-explicit-route` so returning clients receive the corrected runtime.
- Full post-integration regression, renewed independent review and Pages evidence are recorded on PR #118. This targeted checkpoint does not waive them. Owner Human Review remains pending and #111 must remain open until that acceptance.
