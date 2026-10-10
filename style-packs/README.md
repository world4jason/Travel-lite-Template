# Travel Lite — reviewed Style Packs

Travel Lite's **functional template** remains shared: Now / Trip / Map / Check / More, deep links, itinerary/timezone facts, notes, tickets, maps, and offline behavior. A Style Pack changes only visual representation and permitted illustration assets.

## Built-in styles

| `ui.visualStyle` | Status | Layout and materials | Live preview (same Tokyo sample) |
| --- | --- | --- | --- |
| `editorial` | Stable default | Editorial Atlas; Auto / Light / Dark | [Editorial](https://world4jason.github.io/Travel-lite-Template/#trip/overview) |
| `storybook` | Stable opt-in | Ink outlined paper-white illustrations, Huninn, gentle motion | [Storybook](https://world4jason.github.io/Travel-lite-Template/?previewStyle=storybook#trip/overview) |
| `candy` | Phase 2, reviewed prototype | Rounded five-fill sticker art, big soft-radius cards and timeline | [Candy](https://world4jason.github.io/Travel-lite-Template/?previewStyle=candy#trip/overview) |
| `risograph` | Phase 2, reviewed prototype | Single-ink editorial print, halftone skyline, paper grain, no motion | [Risograph](https://world4jason.github.io/Travel-lite-Template/?previewStyle=risograph#trip/overview) |

Set the style for a newly generated trip by adding `"visualStyle": "candy"` or `"risograph"` inside `trip.json → ui`. This is site-level, shared presentation, **not** a device preference. Unsupported strings fall back to Editorial and are never interpreted as URLs, scripts or CSS. `?previewStyle=...` is a read-only appearance preview.

## Verified screenshots (same Tokyo Autumn data)

These are **real Playwright browser captures**, not mockups or AI-generated screenshots. The pages show the exact same trip facts and contain no reference-photo reconstruction.

| Pack | 390px mobile | Desktop | Detailed day |
| --- | --- | --- | --- |
| Candy Geometry | [Overview](./previews/candy-overview-mobile.png) | [Overview](./previews/candy-overview-desktop.png) | [Day timeline](./previews/candy-day-mobile.png) |
| Risograph Zine | [Overview](./previews/risograph-overview-mobile.png) | [Overview](./previews/risograph-overview-desktop.png) | [Day timeline](./previews/risograph-day-mobile.png) |

## What is actually generated from Style Briefs?

These two packs are the **first real implementation experiment** for [Style Prompt Lab](../style-generator/README.md). They are deliberately different types of work, even though their input comes from the same extractor workflow.

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
npm run test:mobile       # all mobile/desktop views and both new visual packs
```

Specific browser tests: [`tests/phase2-packs.spec.mjs`](../tests/phase2-packs.spec.mjs). They compare both styles using **the same trip**, verify old pack isolation, semantic timeline, offline assets, motion, phone-to-desktop responsiveness and major navigation views.

When adding a fifth style, do not merely append an arbitrary `visualStyle` from an LLM. Create a reviewed pack/manifest, honor source-photo uncertainty and ship local assets, add an explicit registry entry plus a new CSS link, then run the complete regression suite.
