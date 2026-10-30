# Travel Lite — reviewed Style Packs

Travel Lite's **functional template** remains shared: Now / Trip / Transport / Places / More, deep links, itinerary/timezone facts, notes, tickets, maps, and offline behavior. `#map` and `#check` remain legacy deep links, not primary tabs. A Style Pack changes only visual representation and permitted illustration assets.

**Structural Style Pack contract:** see [Surface Role Contract](../docs/STYLE_SURFACE_CONTRACT.md). In particular, adding a visible border without matching content inset is a regression, not a stylistic choice. New style work must satisfy role geometry and the 16-appearance browser gate before publication.

> **Vintage Watercolor released and owner-accepted — 2026-10-25:** the [art direction](../docs/VINTAGE_WATERCOLOR_STYLE_BRIEF.md) is implemented with original SVG assets, screenshots and a bounded whitelisted ID. [#81](https://github.com/world4jason/Travel-lite-Template/issues/81) and [#113](https://github.com/world4jason/Travel-lite-Template/issues/113) record owner acceptance after [PR #115](https://github.com/world4jason/Travel-lite-Template/pull/115) merged and its GitHub Pages deployment succeeded. This is release-level acceptance, not 240 manual aesthetic reviews or completion of the remaining [#116](https://github.com/world4jason/Travel-lite-Template/issues/116) architecture work. Reference booklet contributes visual language only, never its itinerary content. A5 print is separately #80; #79 and #88 retain their own open acceptance items.

## Frame & Ornament Grammar

Vintage Watercolor 新增原創四角植物卷草 SVG、內外雙層細框與章節裝飾分隔，並有印刷版對應。完整的 [十五種 Style Pack 框線適配稽核](../docs/STYLE_FRAME_GRAMMAR_AUDIT.md) 說明哪些適合剪紙層邊、印章斷線、貼紙描邊，以及哪些應維持極簡，不會把花框套用到所有風格。

## Built-in styles

| `ui.visualStyle` | Status | Layout and materials | Live preview (same Tokyo sample) |
| --- | --- | --- | --- |
| `editorial` | Stable default | Editorial Atlas; Auto / Light / Dark | [Editorial](https://world4jason.github.io/Travel-lite-Template/#trip/overview) |
| `storybook` | Stable opt-in | Ink outlined paper-white illustrations, Huninn, gentle motion | [Storybook](https://world4jason.github.io/Travel-lite-Template/?previewStyle=storybook#trip/overview) |
| `candy` | Phase 2, reviewed prototype | Rounded five-fill sticker art, big soft-radius cards and timeline | [Candy](https://world4jason.github.io/Travel-lite-Template/?previewStyle=candy#trip/overview) |
| `risograph` | Phase 2, reviewed prototype | Single-ink editorial print, halftone skyline, paper grain, no motion | [Risograph](https://world4jason.github.io/Travel-lite-Template/?previewStyle=risograph#trip/overview) |
| `paper-collage` | Reviewed | layered cardstock, paper fibers, contact shadows | [Paper Collage](https://world4jason.github.io/Travel-lite-Template/?previewStyle=paper-collage#trip/overview) |
| `naive-city` | Reviewed | 1950s-inspired wobbly ink, imperfect city gouache and lots of sky | [Naive City](https://world4jason.github.io/Travel-lite-Template/?previewStyle=naive-city#trip/overview) |
| `taiwan-poster` | Reviewed | warm yellow, navy architecture, vermilion print accent, poster typography | [Taiwan Poster](https://world4jason.github.io/Travel-lite-Template/?previewStyle=taiwan-poster#trip/overview) |
| `field-stamp` | Reviewed | hand-carved missing ink, rustic stamp forms and field-notes typography | [Field Stamp](https://world4jason.github.io/Travel-lite-Template/?previewStyle=field-stamp#trip/overview) |
| `quiet-linocut` | Reviewed · second prompt batch | Quiet Linocut — 版刻詩意 | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=quiet-linocut#trip/overview) |
| `doodle-memory-grid` | Reviewed · second prompt batch | Doodle Memory Grid — 九格塗鴉 | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=doodle-memory-grid#trip/overview) |
| `crayon-journal` | Reviewed · second prompt batch | Crayon Journal — 蠟筆日記 | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=crayon-journal#trip/overview) |
| `painterly-editorial` | Reviewed · second prompt batch | Painterly Editorial — 柔彩筆觸 | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=painterly-editorial#trip/overview) |
| `geometric-print` | Reviewed · second prompt batch | Geometric Print — 硬邊幾何 | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=geometric-print#trip/overview) |
| `quiet-acrylic` | Reviewed · second prompt batch | Quiet Acrylic — 極簡細線壓克力 | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=quiet-acrylic#trip/overview) |
| `vintage-watercolor` | Released · owner accepted 2026-10-25 (#81/#113) | Archival paper, botanical flourishes and generic ink-wash landscape. No new travel facts | [Preview](https://world4jason.github.io/Travel-lite-Template/?previewStyle=vintage-watercolor#trip/overview) |

Set the published default for a generated trip by adding `"visualStyle": "candy"` or `"risograph"` inside `trip.json → ui`. Visitors can switch among fifteen built-in Style Packs from **More → Appearance / 外觀**, saving a **per-trip device-only** preference without modifying `trip.json`. Use **Follow trip default** to remove that preference. A whitelisted `?previewStyle=...` URL overrides the device choice for that link's visit, without saving it. Precedence: valid URL preview > saved per-trip device choice > publisher's `ui.visualStyle` > Editorial. Unknown pack IDs never execute custom CSS, HTML or scripts.

### Switch in More / Appearance

Open **More → Appearance / 外觀**. The page now shows only the **current visual style**, with one "Change" trigger. It opens a native HTML `<dialog>` containing **16 choices** (Editorial Light/Dark plus fourteen opt-in Style Packs). At 767px and below it renders as a **bottom sheet**, scrolling the options while keeping header/footer reachable; selecting auto-closes to reveal the new page appearance. On tablets/desktops (≥768px), it renders a **right-side drawer**, remaining open for consecutive live comparisons. Both modes support Escape, close button, backdrop click, keyboard focus containment/return and OS reduced-motion. Styles persist per trip on this device. **Follow trip default** clears the local choice. [See the mobile bottom-sheet screenshot](./previews/style-picker-mobile-sheet.png). Styles from a `?previewStyle=...` link are temporary and override the saved device choice only for that visit. Choosing or resetting inside More clears the URL-only override without losing the current page.

### Responsive Style Picker screenshots

These are real browser captures from Playwright at mobile/desktop viewports, not promotional mockups.

- [Phone: collapsed More setting](./previews/style-picker-mobile-compact.png) · [Bottom sheet open](./previews/style-picker-mobile-sheet.png) · [Bottom sheet scrolled to later styles](./previews/style-picker-mobile-scrolled.png)
- [Desktop: collapsed More setting](./previews/style-picker-desktop-compact.png) · [Right drawer open](./previews/style-picker-desktop-drawer.png)

## Verified screenshots (same Tokyo Autumn data)

These are **real Playwright browser captures**, not mockups or AI-generated screenshots. The pages show the exact same trip facts and contain no reference-photo reconstruction.

| Pack | 390px mobile | Desktop | Detailed day |
| --- | --- | --- | --- |
| Candy Geometry | [Overview](./previews/candy-overview-mobile.png) | [Overview](./previews/candy-overview-desktop.png) | [Day timeline](./previews/candy-day-mobile.png) |
| Risograph Zine | [Overview](./previews/risograph-overview-mobile.png) | [Overview](./previews/risograph-overview-desktop.png) | [Day timeline](./previews/risograph-day-mobile.png) |
| Paper Collage | [Overview](./previews/paper-collage-mobile.png) | [Overview](./previews/paper-collage-desktop.png) | — |
| Naive City Sketch | [Overview](./previews/naive-city-mobile.png) | [Overview](./previews/naive-city-desktop.png) | — |
| Taiwan Retro Poster | [Overview](./previews/taiwan-poster-mobile.png) | [Overview](./previews/taiwan-poster-desktop.png) | — |
| Field Stamp | [Overview](./previews/field-stamp-mobile.png) | [Overview](./previews/field-stamp-desktop.png) | — |

## What is actually generated from Style Briefs?

Candy and Risograph were the **first implementation experiment** for [Style Prompt Lab](../style-generator/README.md). They are deliberately different types of work, even though their input comes from the same extractor workflow.

### Candy Geometry: token + asset variation

[Source Brief](../style-generator/examples/candy-geometry.json) → [reviewed manifest](./candy/manifest.json) → [CSS overlay](../candy-theme.css) + [five-color SVG assets](../assets/candy/).

- Inherits the validated Storybook layout and day timeline; swaps card surfaces/geometry, fills and every decorative SVG.
- The five *illustration fills* chosen at implementation time are **mint #BBE8D4, peach #FFC1B3, butter #FFE5A5, sky #ACDAF4, milk #FFF9EF**. These are design choices, **not photo-sampled or user-provided HEX values**.
- Source prompt's "only five colors" clashes with making long dynamic website text readable. Text, focus indicators and structural card boundaries use **contrast ink #34424C** as a deliberate, documented accessibility exception. All 12 decorative SVGs use exactly the five fills. Every illustration is locally reviewed to avoid gradients, harsh polygons and extra fill colors.
- Bouncy day changes and gentle floating decorations inherit system `prefers-reduced-motion` and the locally saved More → Motion control.

### Risograph Zine: independent print material language

[Source Brief](../style-generator/examples/risograph-zine.json) → [reviewed manifest](./risograph/manifest.json) → [independent CSS](../risograph-theme.css) + [generic print assets](../assets/risograph/).

- Distinct serif display headings, mechanical microtype, ruled editorial columns, minimal rounded corners, halftone silhouettes, a light ink grain overlay, static composition.
- Indigo ink **#293C57** on aged ivory **#F7F1E4**. Generic, symbolic architecture gets a *single small* vermilion print accent **#C95B41**. Real source-photo color fidelity is **not claimed** (no reference photo was supplied).
- Accessibility adjustment: small vermilion editorial text uses a slightly darker **#A84732**; the brighter accent remains decorative only.
- The prompt's fixed slogan, two-panel ratio and "original colored landmark" rule remain image-only constraints; they are not interpreted as true trip facts. No made-up publisher, city landmarks, or captions appear in the website.
- Print visuals are static by design. No extra animation is introduced, and system reduced motion always remains respected.

## Architecture and source-of-truth boundary

```text
source style prompt (untrusted)
    ↓ LLM extraction + human review
Style Brief (brief-only, JSON)
    ↓ explicit architecture/art-direction decisions
Reviewed pack manifest + local CSS + local SVG
    ↓ registration in built-in VISUAL_PACKS whitelist
runtime previewStyle or ui.visualStyle
    ↓
existing functional app with unchanged trip.json facts
```

Neither brief nor manifest is dynamically parsed by browsers. Manifests are for humans and validation; only statically shipped and audited local CSS links are toggled. Importantly, **this experiment does not implement an automated LLM-to-CSS execution agent**. The CSS, SVG, review and acceptance checks were carried out in the codebase.

## Validation

```bash
npm install
npm run test:styles       # prompts/briefs only
npm run test:packs        # manifest ↔ brief ↔ assets, five SVG fill checks, WCAG contrast checks
npm run test:mobile       # all mobile/desktop views, sixteen appearance choices and offline
MEGAN_LOCAL_REPO=/path/to/Megan-trip npm run test:style-parity # two-site parity
```

Browser tests: [`tests/phase2-packs.spec.mjs`](../tests/phase2-packs.spec.mjs) and [`tests/nine-looks.spec.mjs`](../tests/nine-looks.spec.mjs). They compare styles using **the same trip**, verify existing pack isolation, semantic timeline, offline assets, reduced motion, cross-device responsiveness and all five views.

When adding the next pack, do not merely append an arbitrary `visualStyle` from an LLM. Create a reviewed pack/manifest, honor source-photo uncertainty and ship local assets, add an explicit registry entry plus a new CSS link, then run the complete regression suite.


## Four additional styles: the remaining source prompts

The following four source briefs are now represented by actual, reviewed CSS/SVG Style Packs rather than only fill-in prompts:

| Brief → Pack | Implementation approach | Evidence boundary |
| --- | --- | --- |
| [Layered Paper Collage](../style-generator/examples/paper-collage.json) → [manifest](./paper-collage/manifest.json) | feather-light stacked cardstock, locally designed cutout masks/contact shadows and editorial typography | The source prompt's photographed pose/subject and tiny poster labels are **asset-only**, not web data |
| [Naive City Sketch](../style-generator/examples/naive-city-sketch.json) → [manifest](./naive-city/manifest.json) | hand-wobbled navy contours, matte gouache-like fields, crooked ordinary street and generous paper sky | No identifiable invented landmark or photographed people; human style descriptions are illustrative only |
| [Taiwan Retro Poster](../style-generator/examples/taiwan-retro-poster.json) → [manifest](./taiwan-poster/manifest.json) | reference-informed honey/indigo/brick screenprint palette, large travel scene, oversized **real trip title**, restrained editorial small type | The four user-supplied Taiwanese posters are **style references only**. Their exact signs, towns, year, brand and layouts are never embedded in the website |
| [Field Stamp](../style-generator/examples/field-stamp.json) → [manifest](./field-stamp/manifest.json) | uneven carved ink, 2–4 spot colors, broken dry strokes and field-note typography | No fabricated location, travel record number or site photo transformation |

All four are whitelisted in `VISUAL_PACKS`. Their reference portraits/signs are **not travel facts**. Unlike the original photo-to-postcard tasks, these Site Style Packs use generic decorative vector art and leave place names, dates and descriptions to the site's authentic `trip.json`.

### Cross-project parity acceptance

Shared runtime files and pack CSS must be **byte-identical** between the published template and a generated trip such as [Megan-trip](https://github.com/world4jason/Megan-trip). Only the original travel data, manifest, app icon, title and optional destination-specific artwork should differ.

Run (with both clones available):

```bash
MEGAN_LOCAL_REPO=../Megan-trip node scripts/verify-style-parity.mjs
```

This checks SHA-256 of shared code plus browser-computed text/font/surface/border tokens on the **same fifteen appearance choices** in two real, different trips. A site-scoped service-worker cache prefix prevents two GitHub Pages project sites on the same `github.io` origin from deleting each other's caches.


## Second unknown-prompt batch (2026-10-11)

Eight different photo/poster prompts were first [deduplicated and stripped of photo-output constraints](../style-generator/batches/2026-10-11-editorial-posters.md). Two were appropriately mapped to existing Risograph; six required genuine new material / layout grammar. The six new packs each have a source-valid [Style Brief](../style-generator/examples), deterministic generated editable prompt, reviewed manifest, local CSS/SVG and real browser screenshots. No actual source destination photo was provided, so illustrations are **generic** and color HEX values are explicitly new design proposals.

| New Style Pack | Mobile | Desktop | Day timeline |
| --- | --- | --- | --- |
| Quiet Linocut — 版刻詩意 | [Mobile](./previews/quiet-linocut-mobile.png) | [Desktop](./previews/quiet-linocut-desktop.png) | [Day](./previews/quiet-linocut-day-mobile.png) |
| Doodle Memory Grid — 九格塗鴉 | [Mobile](./previews/doodle-memory-grid-mobile.png) | [Desktop](./previews/doodle-memory-grid-desktop.png) | [Day](./previews/doodle-memory-grid-day-mobile.png) |
| Crayon Journal — 蠟筆日記 | [Mobile](./previews/crayon-journal-mobile.png) | [Desktop](./previews/crayon-journal-desktop.png) | [Day](./previews/crayon-journal-day-mobile.png) |
| Painterly Editorial — 柔彩筆觸 | [Mobile](./previews/painterly-editorial-mobile.png) | [Desktop](./previews/painterly-editorial-desktop.png) | [Day](./previews/painterly-editorial-day-mobile.png) |
| Geometric Print — 硬邊幾何 | [Mobile](./previews/geometric-print-mobile.png) | [Desktop](./previews/geometric-print-desktop.png) | [Day](./previews/geometric-print-day-mobile.png) |
| Quiet Acrylic — 極簡細線壓克力 | [Mobile](./previews/quiet-acrylic-mobile.png) | [Desktop](./previews/quiet-acrylic-desktop.png) | [Day](./previews/quiet-acrylic-day-mobile.png) |

**Next-step gate:** only style descriptors matter when ingesting a photo-to-poster prompt: do not accept exact source photo content, 3:4/50-50 layout, fake caption or fixed date/brand as website requirements. See [the repeatable E2E workflow](../style-generator/NEXT_PROMPT_E2E.md).

### Vintage Watercolor maintenance QA contract

Run `node --test tests/vintage-pack.test.mjs`, then run the existing browser suite plus `tests/vintage-watercolor.spec.mjs` against the same Tokyo fixture. Required screenshot evidence: 390×844 Overview/Day and 1100×900 Overview/Day, plus visual inspection at 320×568 and 844×390, all views, no/long `infoCard`, mixed long labels, offline/keyboard/contrast. Reviewed screenshot evidence is bundled below. The released #115 repair received post-deployment owner acceptance on 2026-10-25; subsequent changes still require their own post-deployment Human Review. A new style changes only the template; historical one-off trip repos must not be auto-synced. `scripts/verify-style-parity.mjs` compares only previously shared looks; the new pack is tested separately.

### Vintage Watercolor visual evidence (same Tokyo trip, no invented travel facts)

[Before framing, 390px](./previews/vintage-watercolor-before-frame-mobile.png) · [**After framing, 390px**](./previews/vintage-watercolor-overview-mobile.png) · [Framed 390px Day](./previews/vintage-watercolor-day-mobile.png) · [Framed 1100px Overview](./previews/vintage-watercolor-overview-desktop.png) · [Framed 1100px Day](./previews/vintage-watercolor-day-desktop.png) · [**A5 framed cover**](./previews/vintage-watercolor-a5-cover.png) · [A5 framed day](./previews/vintage-watercolor-a5-day.png) · [A5 framed dense-page](./previews/vintage-watercolor-a5-dense.png).

**Fixed bottom navigation screenshot convention:** the long 390px Before/After/Day screenshots temporarily hide the pinned five-tab bar **only during full-page capture**; otherwise a `position: fixed` bar appears partway down the stitched image, incorrectly suggesting the navigation moved into the content. It remains visible and fixed in the live app. [Actual 390px viewport with fixed five tabs](./previews/vintage-watercolor-bottom-nav-viewport.png) · [Same viewport after scrolling to page end](./previews/vintage-watercolor-bottom-nav-scrolled-viewport.png). At wide desktop sizes, Travel Lite intentionally displays the five destinations in a header-adjacent row instead of a bottom-fixed bar.
