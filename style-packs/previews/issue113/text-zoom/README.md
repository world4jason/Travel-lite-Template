# PR #115 — 200% text-only zoom regression evidence

**Finding:** independent reviewer at original PR head `5341197` found fixed five-column mobile navigation splitting `Transport`/`Places` and concealing the final Trip item by 10–22px at 320×568 with `html {font-size:200% !important;}`. The original three layout bugs were accepted at normal text size.

**Source and method:** The *before* screenshots below are copied unchanged from the reviewer's real Chromium evidence at `/private/tmp/issue115-reviewer-zoom-end-<style>.png` on the authorized Mac. The *after* screenshots are unchanged Chromium Playwright `page.screenshot()` captures from `tests/style-text-zoom.spec.mjs` on the repair branch. The before and after 320px captures use the same 320×568 viewport and 200% root font size (32px). No imagery is generated or retouched. `comparison-320-200.png` merely arranges the six originals side-by-side.

[Before and after 320px contact sheet](comparison-320-200.png)

| Style | Reviewer BEFORE (320px) | AFTER (320px) | AFTER (390px) |
| --- | --- | --- | --- |
| Risograph | [Original](320-200-before-risograph.png) | [Fixed](320-200-after-risograph.png) | [Fixed](390-200-after-risograph.png) |
| Storybook | [Original](320-200-before-storybook.png) | [Fixed](320-200-after-storybook.png) | [Fixed](390-200-after-storybook.png) |
| Vintage Watercolor | [Original](320-200-before-vintage-watercolor.png) | [Fixed](320-200-after-vintage-watercolor.png) | [Fixed](390-200-after-vintage-watercolor.png) |

## Observed acceptance

`npx playwright test tests/style-text-zoom.spec.mjs --project=chromium` — **32/32 real-browser PASS**, all 16 appearance choices (Editorial Light/Dark + 14 packs) × 320×568/390×568, with `html {font-size:200% !important;}`.

- All five tabs remain named Now, Trip, Transport, Places, More, with no arbitrary intra-word splitting.
- Each button is at least 44×44px; actual keyboard Tab traverses all five, and clicking More opens its panel.
- ResizeObserver measures the real responsive nav height and the scrollable shell reserves that height plus safe-area bottom offset, so the final Trip card is visible at maximum scroll.
- Lowest measured last-card-to-nav clearance: **33.5625px** (required at least 12px). Largest observed nav height: **148px**.
- Restoring normal 100% root text brings navigation back to a single row, with dynamically updated bottom padding.
- No document-wide horizontal overflow across the tested appearances and widths.

[Machine-readable measured geometry for all 32 cases](../../../../docs/QA_STYLE_TEXT_ZOOM_2026-10-25.json). The 240-state regular-font-size matrix remains [separate evidence](../../../../docs/QA_STYLE_SURFACE_MATRIX_2026-10-25.json).

**Approval boundary:** These are independent source screenshots and automated browser evidence; final Reviewer sign-off on the updated commit, postmerge GitHub Pages verification and owner Human Visual Review are **NOT RUN**. PR remains Draft, #113/#81 OPEN.
