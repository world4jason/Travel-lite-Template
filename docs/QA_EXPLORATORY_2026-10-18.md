# Travel Lite — Exploratory QA 2026-10-18

Independent exploratory review of public Pages after PR #108 and source code, Chromium journeys. This does not replace physical iOS Safari/Android testing.

## Browser journeys
- Places date filter → detail → in-app Back → refresh; native browser Back after opening detail.
- Places day filter persistence; Check keyboard activation and device-local persistence after tab switching.
- Deep-linked Transport selected stop followed by day switching.
- Transport transfer list: two real described travel legs and no generic hotel rest note.
- Source-backed entry/booking and URL guard behavior; duplicate item IDs across different days.
- 320px long CJK place title; zero-day and transport-only fallback.
- Places → Transport → Places and stable hash.

## Findings

### Fixed in this follow-up: duplicate source item IDs create ambiguous admission associations
Published item IDs must be unique across the trip. Previously Places resolved duplicate IDs to the first matching place. Reservations or files using that ID could appear linked to the wrong visit. The new guard displays a source warning and suppresses all automatically linked reservations/files when any itinerary item shares that ID, without deleting data. Actual source-side normalization should validate uniqueness before publishing. One new negative Playwright test covers the failure.

### Later follow-up (Issue #111, stacked after #109; pending merge)

Draft #111 now adopts native browser History entries for Places list/date/detail,
per-trip stored day filters, validated direct `#places/day/DATE` links,
Back/Forward/reload, and explicit Trip/Transport handoffs. New real Chromium
acceptance tests are recorded separately in `docs/QA_ISSUE_111.md`. The
following historical observations were accurate when first recorded on
2026-10-18; they are not evidence of a regression on the new branch.

### Observed, not fixed: native Back semantics
Travel Lite intentionally synchronizes route hashes via history.replaceState. Native browser Back can leave Travel Lite, rather than navigate a Place detail → Places list. The in-app Back control functions. Changing the browser history behavior requires an explicit navigation-wide design decision, not a silent UX patch.

### Observed, not fixed: Place date filter persistence
Place date filters are ephemeral and reset to All days on browser refresh. This does not corrupt source data, but can inconvenience longer journeys. A date-aware deep link and coordination with Trip's selected-day state require separate refinement.

### Transient asynchronous state
Immediate same-frame inspection sometimes observed the old URL hash after Places Back and Transport date switch. After a settled 400ms replay, both routes synchronized correctly. Thus no sustained URL mismatch was reproduced.

## Test and publication boundaries
- New Places regression with duplicate item ID warning and blocked association: 17/17 targeted browser tests PASS.
- Full regression results are recorded in the final PR; do not claim before verification.
- Service Worker shell version was updated to refresh offline source behavior.
- Not run: physical iOS Safari / Android/PWA safe-area test, full manual import, private personalized tickets, real sparse rural bus schedules.
- Pending independently: #82 rich Guide; #104/#105 source-backed transit stops, departures and service-day exceptions.