# Issue #113 — Style Surface / Padding / Border QA

**Owner acceptance: OPEN.** Scope: two confirmed Risograph surfaces, Vintage Transport, and cross-pack visual QA. This report is intentionally an **incomplete verification record**, not a claim of browser PASS. Branch: `fix/113-vintage-riso-surface-spacing`. The targeted fixes are proposed in code, but have **not yet been validated on the full application in Chromium**.

## Geometry and cascade findings (source inspection, not computed-style measurements)

| Priority | Real issue / confirmed source | Narrow repair | Browser verification |
|---|---|---|---|
| P0 | Vintage Transport: `vintage-watercolor-theme.css` applies a border to `.runtime-map-panel` through a high-specificity `:is(...,.panel,.runtime-map-panel,...)` selector, while `runtime.css` and the old local override set `padding:0`. A full perimeter therefore crowds the title, transfer row and map. | Scope the map panel as borderless utility chrome via `.runtime-map-panel.map-panel` (specificity matches the earlier compound selector). Keep a 16px inset for mobile headings, Published transfers and chips; keep `.map-stage` full-width. Distinct fine separators replace stacked frames. | NOT RUN |
| P0 | Risograph More: `styles.css` gives `.info-row/.file-row/.text-card` horizontal padding zero; `risograph-theme.css` added full outlines. The inner rectangle crowds `Stay`, title and row text. | Remove full borders from reading rows, retain single top-rule dividers, omit duplicate first-row rule; `Stay` receives 9px inset and 10px gap before title. Standalone map selection retains a 16px inset. | NOT RUN |
| P0 | Risograph Trip: `trip-view.css` removes inline padding/borders on endpoints and route steps; the local pack added ink outlines but no inset. | Remove START/END and step outlines; preserve typographic route and ink number markers, with 8px inter-item gap and 24px number blocks. | NOT RUN |

**Structural correction now included:** the shared renderers add constant `data-surface-role` annotations (no new style-dependent behavior), and `surface-contract.css` loaded last owns paired `--ui-reading-row-*` tokens. Storybook-derived styles retain matched framed rows, Risograph uses open editorial rows; interactive Map now uses a separate workspace role. See [STYLE_SURFACE_CONTRACT.md](./STYLE_SURFACE_CONTRACT.md). These additional architectural changes also require full regression; **not proven safe by source inspection alone**. `trip.json`, map coordinates, legacy routes, export functions and the five-tab IA remain unchanged.

## Structural recurrence prevention (not yet browser-verified)

- `data-surface-role`: `map-workspace`, `transport-context`, `section`, `reading-row`, `route-endpoints`, `route-step`. Roles remain fixed regardless of the selected pack.
- `surface-contract.css` is loaded after every pack; reading-row borders, matching padding, radii, fills and separators share atomic CSS tokens. Risograph and Storybook provide distinct values without changing DOM.
- `tests/style-surface-contract.test.mjs`: static role/asset/token guard — **NOT RUN**.
- `tests/style-surface-role.spec.mjs`: default Chromium 16-appearance live geometry guard — **NOT RUN**.
- `tests/style-semantic-parity.spec.mjs`: default Chromium cross-pack source facts and route/booking/transport parity — **NOT RUN**.
- `tests/style-surface-padding.spec.mjs`: focused 320/390/1100px browser verification — **NOT RUN**.
- `tests/style-surface-matrix.spec.mjs`: opt-in 240-state sweep — **NOT RUN**.

This is an incremental contract, not an unsupported claim that every legacy selector has been migrated. Future migration of all Map/Route materials remains subject to screenshots and separate review.

## Full appearance × tab × viewport matrix

**Viewport order:** 320×568, 390×844, 1100×900. The 240 cells below represent **16 appearance choices × 5 fixed tabs × 3 baseline viewports**. `NOT RUN` means the browser state was **not observed**; it must never be converted to PASS from static source review. The automated matrix captures actual route visits and document overflow when run, but human image inspection, focus, long text and nested-frame design still require separate review.

| Appearance | Now 320 | Now 390 | Now 1100 | Trip 320 | Trip 390 | Trip 1100 | Transport 320 | Transport 390 | Transport 1100 | Places 320 | Places 390 | Places 1100 | More 320 | More 390 | More 1100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Editorial Light | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Editorial Dark | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Storybook | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Candy | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Risograph Zine | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Paper Collage | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Naive City | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Taiwan Poster | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Field Stamp | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Quiet Linocut | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Doodle Memory Grid | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Crayon Journal | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Painterly Editorial | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Geometric Print | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Quiet Acrylic | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Vintage Watercolor | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

### Critical additional states / gaps

| Surface or criterion | Status | Evidence required |
|---|---|---|
| Vintage Day 2 Transport header, Published transfers collapsed/open, chips, map controls | NOT RUN | Browser computed geometry, 320/390/1100 screenshots, focus and map operation |
| Risograph Reservations, Stay → hotel; Costs, Trip notes, Files & tickets | NOT RUN | Real panel screenshots, expanded rows and long CJK/English strings |
| Risograph Day Route START/END, 1–3 and two-digit numbered steps | NOT RUN | Actual Chromium screenshots and 320px stress state |
| Other 14 Style Pack geometries (no homogenization) | NOT RUN | 16-look human screenshot review and ranked new failures |
| 768/820 and 1600px rail/modal breakpoints | NOT RUN | Extended visual sampling |
| 200% text zoom, keyboard focus, Escape, tap targets, forced colors, reduced motion | NOT RUN | Accessibility/browser checks |
| PWA offline and previewStyle switches | NOT RUN | Full Chromium suite and real app rerender |
| A4/A5/ICS non-regression, Vintage A5 print | NOT RUN | Node + export/print Playwright smoke |
| PR independent code/visual review | NOT RUN | Review comments or audit log |
| Main merge and GitHub Pages verification | NOT RUN | Merge SHA, deployed build and screenshots |
| Owner Human Visual Review, #81 and #113 acceptance | NOT RUN | Explicit owner response only |

## Reproducible actual-browser evidence

Run from the repair branch in a machine with the full repository and installed Chromium. Playwright never reuses an unrelated server; its own `tests/serve.mjs` hosts the app.

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

The focused spec saves actual element screenshots named `vintage-transport-{before,after}.png`, `risograph-reservations-{before,after}.png`, and `risograph-day-route-{before,after}.png` in Playwright test artifacts for 320, 390 and 1100 widths. Baseline mode changes only the server's repository root; no synthetic CSS overrides or Photoshop-derived evidence. **No screenshot is attached or claimed to exist at this checkpoint.**

## Execution and release gate

- Static code review: source-level cascade inspected, exact selectors identified and narrow CSS patch authored; **not an independent reviewer PASS**.
- Node syntax/unit tests: **NOT RUN** (no executable full repository checkout available in this connected GitHub session).
- Targeted Chromium Playwright: **NOT RUN**.
- Full 240-state Chromium QA: **NOT RUN**.
- Human visual QA and GitHub Pages release: **NOT RUN**.

**Release decision:** a focused repair PR should use **`Refs #113`**, not `Fixes #113`. Keep #113 and #81 **OPEN**, with no merge or Human Visual Review sign-off until tests, screenshot comparison and independent review are recorded. If a new style fails review, attach a screenshot and a narrowly scoped follow-up fix rather than applying a generic global border override.
