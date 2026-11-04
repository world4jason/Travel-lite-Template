# Issue #129 — C (Check) automated evidence and human review gates

**Scope:** Travel-lite-template shared Trip / Transport / Places date navigation.
**Branch:** `feat/unified-date-navigation-129`
**Change status:** candidate for independent review, **NOT merged**.

## P — Plan (completed)

- [Issue #129](https://github.com/world4jason/Travel-lite-Template/issues/129) has the product invariants, 3 alternatives with trade-offs and signed-off P gate comment.
- The single date is `state.selectedDate`; Trip Overview and Places All are independent per-view modes. Transport has no Overview.
- Cross-view changes are via one common navigator and thin adapters; no second timetable or new trip data schema.

## D — Do (implementation ready for QA)

- Added `date-navigation.js`, `date-navigation.css` and relevant runtime hooks, mode migration and documentation.
- Keeps five tabs, desktop Trip sidebar, URL aliases and read-only travel data. Includes Service Worker cache bump.
- Existing historical tests updated where the prior Places-isolated date expectation was deliberately superseded.

## C — Automated tests

| Check | Result | Evidence / command |
|---|---|---|
| Dedicated shared date transitions/fixtures, 15 pack geometries, keyboard, 200% zoom | **PASS — 23/23** | `npx playwright test tests/issue129-unified-date-navigation.spec.mjs --project=chromium` |
| Full Chromium regression including existing app & style matrix | **PASS — 340/340; 16 intentionally skipped** | `npx playwright test --project=chromium`; 356 collected. Skipped tests retain their original skip metadata. |
| Export core | **PASS — 11/11** | `node --test tests/export-core.test.mjs` |
| Style generator | **PASS — 20/20** | `npm run test:styles` |
| Style pack manifests | **PASS — 15/15** | `npm run test:packs` |
| Duplicate item ID integrity | **PASS** | `node scripts/check-item-ids.mjs` |
| Syntax / whitespace | **PASS** | `node --check date-navigation.js`; related JS files; `git diff --check` |
| Cross-repo style parity | **NOT RUN** | `npm run test:style-parity` requires an external `MEGAN_LOCAL_REPO`; no valid reference path supplied. This test is not part of the navigation acceptance criteria. |
| Live GitHub Pages + installed PWA | **NOT RUN** | No template deployment prior to three human gates. |
| Real Android human touch/visual acceptance | **NOT RUN** | Must be performed by designated human reviewer(s). |

15 screenshots (3 views × overview/day combinations × phone/desktop profiles) in `docs/qa/issue129/`; all use synthetic public fixture data, not personal travel information.

## Three **distinct human reviewers** × three **sequential** rounds — required, not yet executed

| Round | Assigned human | What to verify | Evidence / decision |
|---|---|---|---|
| R1 — Frontend interaction/accessibility | **UNASSIGNED / PENDING** | 320/390 Android/mobile, label/controls, touch targets, keyboard/ARIA, selected day, overview, no overlap | GitHub review by named human account; screenshots + device + PASS/FAIL |
| R2 — Architecture/data/history | **UNASSIGNED / PENDING** | One date truth, mode separation, Back/Forward/reload/deep links, offline/persistence, old fixture compatibility | Second distinct named human account; PR findings + PASS/FAIL |
| R3 — Product Owner/human visual | **UNASSIGNED / PENDING** | Product coherence across three screens, Trip 11-day overview retained, Places all expanded, Transport no fabricated overview; real device | Third distinct named human account; explicit acceptance + PASS/FAIL |

**NO AI persona or automated test is counted as a human.** No merge, deploy claim or Issue close before all three rounds PASS and Owner approval. Review findings must be addressed and affected suites rerun; review results documented in this file and PR. If reviewer identities are unknown, request names instead of inventing accounts.

## A — Act (pending)

Document findings and resolution in this file/Issue, rerun checks, secure all three human passes, then merge → deploy → verify GitHub Pages & installed PWA → close Issue with evidence.
