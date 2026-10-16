# Pinned Five-Tab Navigation — Screenshot and Behavior Audit

Date: 2026-10-17. Scope: Travel-lite-Template Vintage Watercolor versus Editorial, published GitHub Pages and local tests.

## Why previous screenshots looked wrong

The Gallery used Playwright full-page screenshots. Stitched full-document screenshots draw fixed-position UI at its first viewport location while the rest of the document continues below it. This places the Now / Trip / Map / Check / More bar partway through a long image. It is a screenshot artifact, not proof that the production bar lost its fixed positioning.

## Live measurements

Actual published GitHub Pages was inspected with screenshots and computed DOM geometry before and after scrolling:

- Phone dimensions 320x568, 360x800, 390x844, 430x932: computed nav position fixed; bottom gap 14px before and after scrolling, with five visible buttons in both Editorial and Vintage.
- Landscape 844x390: same fixed positioning.
- Desktop 1100x900: computed position relative inside the desktop responsive shell header-adjacent row, intentionally not pinned to the bottom.
- No page JS errors in the observed runs.

## Screenshot QA correction (no production navigation change)

- Mobile long-page captures of Vintage Before/After/Day hide only the nav during the screenshot, using screenshot-only CSS visibility override, so the bar does not misleadingly appear mid-document.
- Separate viewport-only captures explicitly show the pinned bar: style-packs/previews/vintage-watercolor-bottom-nav-viewport.png and vintage-watercolor-bottom-nav-scrolled-viewport.png.
- The historical Before screenshot was recaptured from commit f12e937 with the same correction, preserving like-for-like art-direction comparison.
- No production CSS or JS, click behavior, tab order, trip.json, or navigation state is modified.

## Test contract

The new tests/bottom-nav-fixed.spec.mjs tests Editorial and Vintage at five viewport sizes, all five buttons and their hit areas, fixed bottom gap during scrolling, navigation among all five views, and the intentional wide-desktop header placement.

A real mobile-device displacement may still occur under a browser-specific viewport configuration not reproduced by Chromium emulation. In that case request a screenshot, the phone and browser/PWA mode, and scroll state; do not infer a CSS regression from a stitched screenshot alone.
