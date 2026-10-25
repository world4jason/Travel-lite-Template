# Issue #113 — actual Chromium before/after specimens

**Source:** Playwright Chromium 153.0.8010.12 via `tests/style-surface-padding.spec.mjs` against two local Git worktrees. This directory contains original browser element screenshots (PNG), not fabricated DOM mocks or Photoshop edits.

- **Before:** `main` at `5fa8d195ed57b5bca5fd253a20a3616e89fde452`.
- **After:** PR #115 working branch `fix/113-vintage-riso-surface-spacing` (review the PR commit history for the latest branch SHA).
- **Dimensions:** 320×568, 390×844, 1100×900. Screenshots crop to each rendered semantic surface, so the PNG's intrinsic width/height can differ from viewport size.
- **Map:** both runs use locally pinned real MapLibre JS/CSS and a tile-free test map style, preserving pan/zoom controls and markers without external tile/CDN nondeterminism.
- **Evidence:** `comparison-390.png` is a side-by-side contact sheet of the underlying unmodified screenshots, not a substitute for the raw images.
- **Scope:** automated geometry checks have run; visual Human Review and post-release inspection remain separate approval gates.

| Surface | 320px | 390px | 1100px |
| --- | --- | --- | --- |
| Vintage Watercolor / Transport | [Before](vintage-transport-320-before.png) / [After](vintage-transport-320-after.png) | [Before](vintage-transport-390-before.png) / [After](vintage-transport-390-after.png) | [Before](vintage-transport-1100-before.png) / [After](vintage-transport-1100-after.png) |
| Risograph / Reservations | [Before](risograph-reservations-320-before.png) / [After](risograph-reservations-320-after.png) | [Before](risograph-reservations-390-before.png) / [After](risograph-reservations-390-after.png) | [Before](risograph-reservations-1100-before.png) / [After](risograph-reservations-1100-after.png) |
| Risograph / Day Route | [Before](risograph-day-route-320-before.png) / [After](risograph-day-route-320-after.png) | [Before](risograph-day-route-390-before.png) / [After](risograph-day-route-390-after.png) | [Before](risograph-day-route-1100-before.png) / [After](risograph-day-route-1100-after.png) |
| Risograph / Costs | [Before](risograph-costs-320-before.png) / [After](risograph-costs-320-after.png) | [Before](risograph-costs-390-before.png) / [After](risograph-costs-390-after.png) | [Before](risograph-costs-1100-before.png) / [After](risograph-costs-1100-after.png) |
| Storybook / Costs (derived-pack regression) | [Before](storybook-costs-320-before.png) / [After](storybook-costs-320-after.png) | [Before](storybook-costs-390-before.png) / [After](storybook-costs-390-after.png) | [Before](storybook-costs-1100-before.png) / [After](storybook-costs-1100-after.png) |

## Additional keyboard expansion evidence

The native Published transfers disclosure was focused and expanded using **Enter**, and its two saved transit legs were verified in real Chromium at all three widths. Expanded before/after browser screenshots:

| Viewport | Before | After |
| --- | --- | --- |
| 320×568 | [Before](vintage-transport-expanded-320-before.png) | [After](vintage-transport-expanded-320-after.png) |
| 390×844 | [Before](vintage-transport-expanded-390-before.png) | [After](vintage-transport-expanded-390-after.png) |
| 1100×900 | [Before](vintage-transport-expanded-1100-before.png) | [After](vintage-transport-expanded-1100-after.png) |

The Risograph Reservations section was also tested with native keyboard collapse and re-expand; after reopening, Shibuya hotel remained visible.

## Full cross-pack specimen gallery

The 390px Chromium viewport gallery comprises one five-tab contact sheet per appearance: `matrix-<appearance>-390.png`. Every frame is a real app screenshot, **not a design mockup**. The full 240-state machine-readable smoke results are in [QA_STYLE_SURFACE_MATRIX_2026-10-25.json](../../../docs/QA_STYLE_SURFACE_MATRIX_2026-10-25.json).

The source audit also discovered mobile navigation becoming in-flow in Risograph and Taiwan Poster. Compare [Risograph before](nav-before-risograph-390.png) / [after](nav-after-risograph-390.png) and [Taiwan Poster before](nav-before-taiwan-poster-390.png) / [after](nav-after-taiwan-poster-390.png). The new 16-look test asserts computed `position: fixed` and stable bounds after scrolling.

### 16 appearances / five-tab browser screenshot gallery (390×844 each)

Each screenshot sheet includes **Now / Trip / Transport / Places / More** in that order. These specimens were visually inspected by the implementing developer to identify obvious element collisions, typography clipping and misplaced navigation. Human owner and independent reviewer acceptance remain separate gates.

- [Editorial Light](matrix-editorial-light-390.png) · [Editorial Dark](matrix-editorial-dark-390.png)
- [Storybook](matrix-storybook-390.png) · [Candy](matrix-candy-390.png)
- [Risograph Zine](matrix-risograph-390.png) · [Paper Collage](matrix-paper-collage-390.png)
- [Naive City](matrix-naive-city-390.png) · [Taiwan Poster](matrix-taiwan-poster-390.png)
- [Field Stamp](matrix-field-stamp-390.png) · [Quiet Linocut](matrix-quiet-linocut-390.png)
- [Doodle Memory Grid](matrix-doodle-memory-grid-390.png) · [Crayon Journal](matrix-crayon-journal-390.png)
- [Painterly Editorial](matrix-painterly-editorial-390.png) · [Geometric Print](matrix-geometric-print-390.png)
- [Quiet Acrylic](matrix-quiet-acrylic-390.png) · [Vintage Watercolor](matrix-vintage-watercolor-390.png)

## 200% text-only zoom — reviewer P1 regression and fix

At 320×568, original Risograph/Storybook/Vintage navigation split labels mid-word and overlapped the final itinerary card; the fixed layout preserves readable five-tab navigation, keyboard access and dynamically clears the bottom content. [Reviewer-before and developer-after screenshots](text-zoom/README.md), including 390px after cases. All 16 appearances were tested at both widths (32/32 Chromium passes). The owner/independent approval remains pending.

## Independent review points

Compare the rendered text-to-ink gap, not just declaration names. The before specimen confirms boxed text collisions in Risograph and a crowded outer map perimeter in Vintage; the after specimen opens functional rows and route labels, and retains intentional colored/printed identity. The Costs fixture deliberately contains mixed CJK/English plus an unbroken token; after correction currency amounts must remain one line even when item names wrap.

**Do not label cross-style visual acceptance PASS solely because the 240-state smoke matrix passed.** See `docs/QA_STYLE_SURFACE_PADDING_2026-10-24.md` for exact test levels and remaining gates.
