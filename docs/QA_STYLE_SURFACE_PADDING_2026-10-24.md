# Issue #113 — Style Surface / Padding / Border QA

**Owner acceptance: OPEN.** Scope: two confirmed Risograph surfaces, Vintage Transport, and cross-pack visual QA. Automated browser tests now passed; Human Review and live Pages verification are pending. Branch: `fix/113-vintage-riso-surface-spacing`. The targeted fixes and previous 240-state automated Chromium smoke matrix **were executed on the application**, as detailed below; the reviewer-required 200% text-only zoom gate has now passed **32/32** cases on real Chromium, while independent review of this new head and owner Human Visual Review remain pending.

## Historical pre-Chromium developer checkpoint (superseded by the tested results below)

- **P1-A FIXED IN CODE, BROWSER NOT RUN:** the shared `sideBorderViolations` guard checks each horizontal side independently, including border-inline/side-only frames and inward-painted outlines. A *real injected CSS negative control* has been added to `tests/style-surface-role.spec.mjs` (Chromium NOT RUN). The same pure helper has a Node regression file `tests/style-surface-guards.test.mjs`.
- **P1-B FIXED IN CODE, BROWSER NOT RUN:** `findUnpairedSurfaceFrames` includes shorthand, side/inline borders, inward outlines, and checks actual horizontal padding values (e.g. `13px 0` is unsafe). The shared contract now owns both `reading-row` and `cost-summary` atomically. The original default Tokyo fixture hides Costs because it has no entries, so the browser specs inject real Costs rows.
- **Additional cross-pack defect found by static inspection:** eight packs grouped `.more-section > summary` with `.cost-total`, assigning a complete Cost border but retaining `padding:9px 0 14px` or inheriting unrelated padding. Paper Collage, Taiwan Poster, Quiet Linocut, Doodle Memory Grid, Crayon Journal, Painterly Editorial, Geometric Print and Quiet Acrylic now provide distinct `--ui-cost-summary-*` tokens, preserving their existing ink/fill/radius while pairing the border with 16px inline content inset. Storybook-derived and Risograph costs are also explicitly tokenized.
- **P2-D/E TESTS ENHANCED:** semantic parity now exercises source clocks vs illustrated `Time TBD`/Editorial `TBD`, actions, keyboard menu access and transfer order. Real More → Appearance picker stress now covers Storybook → Risograph → Vintage → Editorial Dark/Light → Storybook and Cost token reset. The dual DOM refactor remains #116.
- **Executed (limited):** 4/4 pure-helper negative guard cases passed in a V8 isolated JavaScript run using the same GitHub-committed helper source; static source lint scanned all 14 pack files with **0 unpaired reading-row/Costs declarations reported**; updated JS/test code syntax-parsed in V8. **None of this is a Node repository test or a computed-style browser PASS.**
- **Still NOT RUN:** `node --test`, the repo's Playwright suite, 240 browser states, screenshot evidence, keyboard focus in a real browser, MapLibre/online/offline, PDF/ICS and Human Review. **Merge remains blocked** until execution evidence and independent re-review are attached.

## Release status update — P1 source defects repaired, code and Chromium tests executed

On **2026-10-25**, real Node and Playwright/Chromium acceptance work was performed using Remote Desktop Commander on the authorized Mac. **240 automated browser-state smoke checks PASS**, but *not* 240 individual manual visual approvals. The original confirmed three surfaces now have actual before/after screenshots at all three sizes. The implementation also fixed a newly detected long-label / currency vertical-wrap issue and a nav positioning regression in **Risograph** and **Taiwan Poster**. See machine-readable matrix JSON and the screenshots linked below. The final independent reviewer and owner post-Pages Human Review remain **NOT RUN**, so PR #115 stays Draft and #113/#81 stay OPEN.

## Geometry and cascade findings (source findings followed by real computed-style/browser evidence below)

| Priority | Real issue / confirmed source | Narrow repair | Browser verification |
|---|---|---|---|
| P0 | Vintage Transport: `vintage-watercolor-theme.css` applies a border to `.runtime-map-panel` through a high-specificity `:is(...,.panel,.runtime-map-panel,...)` selector, while `runtime.css` and the old local override set `padding:0`. A full perimeter therefore crowds the title, transfer row and map. | Scope the map panel as borderless utility chrome via `.runtime-map-panel.map-panel` (specificity matches the earlier compound selector). Keep a 16px inset for mobile headings, Published transfers and chips; keep `.map-stage` full-width. Distinct fine separators replace stacked frames. | PASS (actual 320/390/1100 Chromium geometry + screenshots) |
| P0 | Risograph More: `styles.css` gives `.info-row/.file-row/.text-card` horizontal padding zero; `risograph-theme.css` added full outlines. The inner rectangle crowds `Stay`, title and row text. | Remove full borders from reading rows, retain single top-rule dividers, omit duplicate first-row rule; `Stay` receives 9px inset and 10px gap before title. Standalone map selection retains a 16px inset. | PASS (actual 320/390/1100 Chromium geometry + screenshots) |
| P0 | Risograph Trip: `trip-view.css` removes inline padding/borders on endpoints and route steps; the local pack added ink outlines but no inset. | Remove START/END and step outlines; preserve typographic route and ink number markers, with 8px inter-item gap and 24px number blocks. | PASS (actual 320/390/1100 Chromium geometry + screenshots) |

**Structural correction now included:** the shared renderers add constant `data-surface-role` annotations (no new style-dependent behavior), and `surface-contract.css` loaded last owns paired `--ui-reading-row-*` tokens. Storybook-derived styles retain matched framed rows, Risograph uses open editorial rows; interactive Map now uses a separate workspace role. See [STYLE_SURFACE_CONTRACT.md](./STYLE_SURFACE_CONTRACT.md). These additional architectural changes also require full regression; **not proven safe by source inspection alone**. `trip.json`, map coordinates, legacy routes, export functions and the five-tab IA remain unchanged.

## Structural recurrence prevention (browser-tested for the scoped roles)

- `data-surface-role`: `map-workspace`, `transport-context`, `selected-stop`, `section`, `reading-row`, `route-endpoints`, `route-step`. Roles remain fixed regardless of the selected pack.
- `surface-contract.css` is loaded after every pack; reading-row borders, matching padding, radii, fills and separators share atomic CSS tokens. Risograph and Storybook provide distinct values without changing DOM.
- `tests/style-surface-contract.test.mjs`: static role/asset/token guard — **PASS** (Node suite 56/56).
- `tests/style-surface-role.spec.mjs`: default Chromium 16-appearance live geometry guard — **PASS** (18/18).
- `tests/style-semantic-parity.spec.mjs`: default Chromium cross-pack source facts and route/booking/transport parity — **PASS** (45/45 across three repeats).
- `tests/style-surface-padding.spec.mjs`: focused 320/390/1100px browser verification — **PASS** (16/16 + 15 baseline browser captures).
- `tests/style-surface-matrix.spec.mjs`: opt-in 240-state sweep — **PASS** (240/240 smoke; visual sign-off pending).

This is an incremental contract, not an unsupported claim that every legacy selector has been migrated. Future migration of all Map/Route materials remains subject to screenshots and separate review.

## Full appearance × tab × viewport matrix

**Viewport order:** 320×568, 390×844, 1100×900. The 240 cells below represent **16 appearance choices × 5 fixed tabs × 3 baseline viewports**. **All 240 states were executed on Chromium with locally pinned real MapLibre and passed the automated tab/component/overflow smoke assertions.** The 80 viewport specimens (16 appearances × five tabs at 390×844) were captured for visual review; source records are in [QA_STYLE_SURFACE_MATRIX_2026-10-25.json](QA_STYLE_SURFACE_MATRIX_2026-10-25.json). **PASS (smoke) does NOT mean visual/Human Review PASS**: detailed text inset, contrast, focus, interactive targets and material design need their own evidence.

| Appearance | Now 320 | Now 390 | Now 1100 | Trip 320 | Trip 390 | Trip 1100 | Transport 320 | Transport 390 | Transport 1100 | Places 320 | Places 390 | Places 1100 | More 320 | More 390 | More 1100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Editorial Light | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Editorial Dark | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Storybook | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Candy | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Risograph Zine | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Paper Collage | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Naive City | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Taiwan Poster | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Field Stamp | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Quiet Linocut | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Doodle Memory Grid | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Crayon Journal | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Painterly Editorial | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Geometric Print | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Quiet Acrylic | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |
| Vintage Watercolor | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) | PASS (smoke) |

### Critical additional states / gaps

| Surface or criterion | Status | Evidence required |
|---|---|---|
| Vintage Day 2 Transport header, Published transfers collapsed/open, chips, map controls | PASS (Chromium 320/390/1100) | Browser computed geometry, 320/390/1100 screenshots, focus and map operation |
| Risograph Reservations, Stay → hotel; Costs, Trip notes, Files & tickets | PASS (Chromium targeted) | Real panel screenshots, expanded rows and long CJK/English strings |
| Risograph Day Route START/END, 1–3 and two-digit numbered steps | PASS (Chromium targeted) | Actual Chromium screenshots and 320px stress state |
| Other 14 Style Pack geometries (no homogenization) | PASS (developer 390px specimen scan); independent Review NOT RUN | 16-look human screenshot review and ranked new failures |
| 768/820 and 1600px rail/modal breakpoints | PASS (existing responsive browser smoke) | Extended visual sampling |
| 200% text-only zoom 320/390px, 16 looks, five nav labels, focus/taps, last-card clearance | PASS (32/32 real Chromium) | [Measured geometry & screenshots](QA_STYLE_TEXT_ZOOM_2026-10-25.json) |
| Forced colors and other non-targeted accessibility settings | NOT RUN | Separate focused browser/accessibility acceptance |
| PWA offline and previewStyle switches | PASS (existing full Chromium suite) | Full Chromium suite and real app rerender |
| A4/A5/ICS non-regression, Vintage A5 print | PASS (browser regression; real ICS imports NOT RUN) | Node + export/print Playwright smoke |
| PR independent code/visual review | NOT RUN on latest browser-verified head | Review comments or audit log |
| Main merge and GitHub Pages verification | NOT RUN | Merge SHA, deployed build and screenshots |
| Owner Human Visual Review, #81 and #113 acceptance | NOT RUN | Explicit owner response only |

## Reproducible actual-browser evidence

Executed on the authorized Mac in two isolated Git worktrees. Playwright never reuses an unrelated server; its own `tests/serve.mjs` hosts the app. The commands below can reproduce the results on another machine.

```sh
npm install
npx playwright install chromium

# BEFORE: use the PR test harness against the actual original main checkout.
git worktree add ../Travel-lite-Template-113-main main
TRAVEL_LITE_TEST_SITE_ROOT="../Travel-lite-Template-113-main" TRAVEL_LITE_QA_BASELINE=1 \
  npx playwright test tests/style-surface-padding.spec.mjs --project=chromium
# Save these test-results somewhere outside test-results BEFORE another run clears them.

# AFTER: the same real-app DOM + computed-style checks on this branch.
npx playwright test tests/style-surface-padding.spec.mjs --project=chromium

# Optional full 240-state browser sweep. JSON matrix attachments are per style.
TRAVEL_LITE_FULL_STYLE_QA=1 \
  npx playwright test tests/style-surface-matrix.spec.mjs --project=chromium

# Existing suites, before merge:
npm run test:mobile
node --test tests/*.test.mjs
npm run test:packs
npm run test:styles
npm run test:style-parity
```

The focused spec saves actual element screenshots named `vintage-transport-{before,after}.png`, `risograph-reservations-{before,after}.png`, and `risograph-day-route-{before,after}.png` in Playwright test artifacts for 320, 390 and 1100 widths. Baseline mode changes only the server's repository root; no synthetic CSS overrides or Photoshop-derived evidence. **Actual Chromium screenshots are committed under `style-packs/previews/issue113/` in this PR.**

## Reviewer re-review — P1 text-only 200% zoom (Chromium VERIFIED, 2026-10-25)

**New independent review finding:** at 320×568, fixed five-column mobile navigation made words such as `Transport` and `Places` split within letters, and the last Trip card was overlapped by 10–22px in Storybook, Vintage Watercolor and Risograph. The earlier 240-state smoke matrix did not test text-only scaling.

**Fix:** shared `surface-contract.css` changes the *functional mobile navigation layout* to intrinsic-width flex-wrap at large text sizes; the source remains the same five tabs (Now, Trip, Transport, Places, More), with full words, ≥44px-wide and ≥44px-tall buttons. A small `ResizeObserver` in `app.js` updates the CSS-only shell clearance token `--mobile-nav-block-size` from the real nav box size. Padding includes the actual nav height, safe-area bottom offset and a 20px margin. Text enlargement is **not clamped**. On returning to regular font size the nav returns to a single row; the new Playwright test verifies this. Service Worker cache bumped to `shell-v43-text-zoom-nav-clearance` so offline clients fetch new JS/CSS.

**Real execution:** `npx playwright test tests/style-text-zoom.spec.mjs --project=chromium` **32/32 PASS** (all 16 appearances, including Editorial Dark, at 320×568 and 390×568; 200% root computed font size 32px). Minimum measured gap between final Trip card and nav top at maximum scroll: **33.5625px** (required ≥12). Maximum nav height **148px**; minimum real button width **44px**, height **54px**. All words remain on one line inside their buttons, actual keyboard Tab and click navigation function, and no document horizontal overflow was observed. [Machine-readable computed geometry](QA_STYLE_TEXT_ZOOM_2026-10-25.json), [reviewer original and corrected browser captures](../style-packs/previews/issue113/text-zoom/README.md).

**Verdict:** P1 text-resize defect **resolved in developer code/Chromium QA**, but new head **NOT YET INDEPENDENTLY APPROVED**. GitHub Pages verification, owner Human Review and forced-colors checks remain NOT RUN. PR #115 stays Draft; #113 and #81 remain OPEN.

## Execution and release gate — real Mac Chromium, 2026-10-25

- **PASS / Node:** `node --test tests/*.test.mjs` **56/56**; `npm run test:packs` **15/15**; `npm run test:styles` **20/20**.
- **PASS / original main screenshot baseline:** `TRAVEL_LITE_TEST_SITE_ROOT=/Users/world4jason/Projects/Travel-lite-Template-QA115-main TRAVEL_LITE_QA_BASELINE=1 npx playwright test tests/style-surface-padding.spec.mjs --project=chromium` **15 passed, 1 intentionally skipped**. Baseline `main` commit `5fa8d195` and Chromium actual map controls/markers checked.
- **PASS / final three-width targeted geometric & disclosure screenshots:** `npx playwright test tests/style-surface-padding.spec.mjs --project=chromium` **16/16**, includes long mixed CJK/English, no vertical currency stacks, real MapLibre controls and expanded Vintage transfers + Risograph keyboard disclosure. Refer to [actual before/after screenshot index](../style-packs/previews/issue113/README.md).
- **PASS / structural role and mobile nav:** `npx playwright test tests/style-surface-role.spec.mjs --project=chromium` **18/18**. Includes 16 pack computed-role checks, deliberate side-border/negative-outline failure injections, real style picker and fixed-bottom navigation on scroll. Visual inspection caught actual P1 regression in Risograph **and Taiwan Poster**: their decorative `:is(...,.bottom-nav,...) { position:relative }` overwrote shared fixed mobile navigation. Both selectors have been corrected, before/after 390px screenshots recorded.
- **PASS / semantic time/action parity:** `npx playwright test tests/style-semantic-parity.spec.mjs --project=chromium --repeat-each=3` **45/45**. Wait for actual async Trip DOM and navigate to More via real tab activation, avoiding racy early text reads and hash-only transitions.
- **PASS / 240 browser states:** `TRAVEL_LITE_FULL_STYLE_QA=1 npx playwright test tests/style-surface-matrix.spec.mjs --project=chromium` **16/16 suites, each 15 states; 240/240 PASS (smoke)**. A real MapLibre instance must expose controls. Actual 390px screenshots for all 80 appearance/tab combinations are under `style-packs/previews/issue113/matrix-*-390.png` (five-tab per-style contact sheets).
- **Visual inspection by implementing agent:** inspected all **16 five-tab 390px screenshot composites** (80 actual viewport specimens), the raw three-width before/after screenshot contact sheet, and additional keyboard expanded-state evidence. This is a developer inspection, **not** independent reviewer or owner sign-off. Fixed *additional* Costs amount digit-wrap in Storybook/Risograph, and two mobile bottom-nav positioning defects. Independent reviewer inspection of **all** 16 style gallery and owner Human Review: **NOT RUN**.
- **Node/Chromium environment:** macOS ARM64 authorized Desktop Commander; Node 26.8.2; Playwright 1.63.0 / Chromium 153.0.8010.12; MapLibre pinned 6.10.0 served locally with tile-free test style. No real-world route/tile claims.
- **PASS / complete Chromium suite including 200% text zoom:** `npm run test:mobile` **255 passed, 16 intentionally skipped**, 0 failures (new zoom test contains 32 real cases: 16 appearances × 320/390px). Targeted expansion and geometry checks were rerun separately **16/16 passed** after adding the final disclosure assertions; the 240-state matrix likewise ran **240/240** after fixing both navigation regressions.
- **Release gate:** independent review of **latest commit** and owner Human Visual Review **NOT RUN**; **not merged**, GitHub Pages release check **NOT RUN**. #113 and #81 stay OPEN. No automatic close/merge from smoke checks.

**Release decision:** a focused repair PR should use **`Refs #113`**, not `Fixes #113`. Keep #113 and #81 **OPEN**, with no merge or Human Visual Review sign-off until tests, screenshot comparison and independent review are recorded. If a new style fails review, attach a screenshot and a narrowly scoped follow-up fix rather than applying a generic global border override.
