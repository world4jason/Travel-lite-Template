# Travel Lite Visual System

Status: **Approved direction for Epic #43, defined by #50**

This document is primarily the implementation contract for the default Editorial Atlas direction. The opt-in Storybook exception is specified under Trip identity variability below. It defines the reusable visual/composition system only. It does not change product semantics, shared/local-state behavior, trip schema behavior, navigation jobs, or the static/no-build architecture.

## Direction: Editorial Atlas

Travel Lite should feel like a compact editorial travel companion: immediate enough to keep open while moving, but composed with the intentional hierarchy and whitespace of a well-edited travel guide.

The system is **not** a dashboard theme and **not** a destination-specific art direction.

Its signature is:

- one dominant traveller focus at a time;
- open composition before containers;
- editorial display hierarchy paired with highly legible utility text;
- sequence and context expressed through rhythm, rules, spacing, and source order rather than a stack of interchangeable cards;
- optional trip media that enriches identity but never carries core meaning;
- desktop space used for supporting context, not duplicated primary content.

## Product invariants

The visual system must preserve the existing product contract:

- a valid itinerary remains data/config driven;
- no destination-specific application code;
- static GitHub Pages deployment and no required build step;
- existing shared truth / local-state semantics;
- `travel-lite-ready` initialization;
- deep links and responsive state continuity;
- offline snapshot behavior;
- provider-failure fallback;
- accessibility and reduced-motion support;
- no duplicated business logic by breakpoint.

Visual work must never imply a semantic state that the product does not actually own.

## Design principles

### 1. Action before decoration

For a traveller using the site during a trip, the first question is usually “what matters now?”

Now must therefore prioritize:

1. current state or current item;
2. location / handoff context;
3. next reference;
4. weather, reminder, or readiness context;
5. secondary detail.

Trip overview instead prioritizes:

1. trip identity;
2. overall shape of the trip;
3. day sequence;
4. meaningful flexible/highlight content;
5. unresolved decisions.

Do not give every datum equal visual weight.

### 2. Compose before containing

A new bordered/rounded surface is not the default response to a grouping problem.

Prefer, in order:

1. spacing;
2. alignment;
3. typographic hierarchy;
4. rules/dividers;
5. background shift;
6. only then a contained surface when interaction or semantic grouping benefits from it.

A screen should not read as a grid of same-weight cards.

### 3. Editorial hierarchy, operational clarity

Display typography can create character, but body and utility text must remain fast to scan.

Large display text is reserved for a small number of focal elements. Generated itinerary copy, labels, controls, metadata, decisions, and long mixed-language content use the legible utility voice.

### 4. Identity is progressive enhancement

A trip must still feel coherent when:

- no cover image exists;
- media fails to load;
- the user is offline;
- content is sparse;
- content is dense;
- the itinerary is English, zh-TW, or mixed.

Media and accent color add identity; they do not define the information architecture.

### 5. Responsive composition, not responsive duplication

Mobile and desktop may arrange the same information differently, but they must preserve:

- semantic source order;
- the same product meaning;
- the same primary action hierarchy;
- the same shared state.

Desktop may add supporting context asides; it must not create a separate desktop product.

### 6. Motion explains orientation

Motion is allowed only when it helps the traveller understand:

- view change;
- state change;
- expansion/collapse;
- current-position change.

Motion must not delay access to information.

---

# Composition archetypes

These six archetypes are reusable composition roles. They are not mandatory “components” and do not imply a bordered card.

## 1. Trip identity / hero

**Purpose:** establish what trip this is and give the screen a recognizable editorial anchor.

May contain:

- destination / trip title;
- date range;
- subtitle or concise trip premise;
- optional cover/media;
- compact trip-level metadata.

### Mobile

- concise;
- must not push the current task below an unreasonable first-screen distance;
- can use a strong title, but not a multi-screen marketing hero.

### Desktop

- may use asymmetric composition and more whitespace;
- optional media can sit beside or behind identity only when text contrast and load behavior are safe.

### Rules

- core identity must remain readable without media;
- no text baked into images;
- no fixed-height hero that clips enlarged or long text;
- no destination-specific layout branch.

## 2. Operational strip

**Purpose:** compact current context/readiness without becoming a dashboard.

Typical content:

- current/next time;
- weather;
- readiness/offline state;
- reminder;
- short route handoff.

### Rules

- compact and secondary to the main focal item;
- use short labels and values;
- do not grow into a KPI/status-card grid;
- missing optional values collapse cleanly;
- color is not the only carrier of state.

## 3. Narrative section

**Purpose:** explanatory or grouped travel content that benefits from reading flow.

Examples:

- day summary;
- trip premise;
- flexible highlight;
- contextual note;
- stable visit guidance.

### Rules

- prefer open text blocks with deliberate width and spacing;
- use contained treatment only for genuinely distinct emphasis;
- long generated text must wrap naturally;
- narrative text must not compete with the active operational task.

## 4. Sequence / timeline

**Purpose:** express ordered itinerary content.

Examples:

- trip-day sequence;
- today’s item sequence;
- transfer sequence;
- progress through a route.

### Rules

- order must be visually obvious without relying on color alone;
- time/index column stays compact;
- current state may receive stronger emphasis, but non-current items remain readable;
- do not wrap each row in a separate rounded card;
- large text and long locations must expand row height rather than clip;
- sequence semantics must remain available in DOM/source order.

## 5. Inline utility

**Purpose:** small actions, metadata, handoffs, or source links that support the nearby content.

Examples:

- open map;
- open official source;
- handoff to provider;
- small status;
- compact metadata.

### Rules

- visually subordinate to the content they support;
- minimum usable touch target for interactive controls;
- generated labels wrap safely;
- icon-only controls require accessible names;
- avoid turning every inline utility into a pill.

## 6. Context aside

**Purpose:** desktop supporting context that improves orientation without duplicating the main task.

Examples:

- selected-day summary;
- previous/next reference;
- reminders;
- small unresolved-decision context;
- quick secondary navigation.

### Rules

- desktop enhancement only; content must still be reachable in the primary mobile flow when semantically required;
- must not duplicate the main focal copy verbatim;
- must remain visibly secondary;
- source order must stay logical for keyboard/screen-reader use;
- hide/collapse by layout, not by creating a second business-logic path.

---

# Typography intent

Use two voices.

## Editorial display voice

Use for:

- trip title;
- current focal title;
- major trip/day headings.

Intent:

- human, travel-editorial, confident;
- tighter tracking and strong scale;
- restrained use.

Implementation must remain offline-safe and no-build compatible. Prefer a system serif stack such as:

```css
font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif;
```

Do not add a render-blocking remote font dependency merely to achieve the art direction.

## Utility voice

Use for:

- body copy;
- navigation;
- metadata;
- time;
- controls;
- decisions;
- generated labels;
- dense itinerary content.

Prefer the existing system sans stack.

## Generated-content safety

The system must work with English, zh-TW, CJK fallback, and mixed strings.

Required behavior:

- responsive `clamp()` rather than fixed display sizes;
- no core generated heading depends on `white-space: nowrap`;
- use `overflow-wrap: anywhere` where arbitrary generated text can exceed normal word boundaries;
- do not ellipsize primary itinerary meaning;
- avoid fixed-height text containers;
- enlarged text must reflow rather than overlap;
- if a platform’s serif fallback produces poor CJK readability, utility sans may take precedence for that generated heading rather than forcing the Latin art direction.

Typography character must never outrank legibility.

---

# Spacing, surfaces, and elevation

## Spacing

The system should use a small, explicit rhythm rather than ad-hoc margins.

Recommended foundation for #45:

- 4px base unit;
- compact utility spacing: 4 / 8 / 12;
- content spacing: 16 / 20 / 24;
- section spacing: 32 / 40 / 48+ depending on viewport.

The implementation may adjust exact tokens, but relationships should remain consistent.

## Surfaces

Default page structure is open canvas + separation.

Use a contained surface when one of these is true:

- interactive controls form one unit;
- a decision/callout must be clearly isolated;
- a media block needs a stable frame;
- a utility group benefits from a clear boundary.

Do not give every section the same border, radius, shadow, and translucent fill.

## Radius

Rounded corners are a supporting detail, not the visual language.

Use smaller, more restrained radii than the current repeated large-panel grammar. Full pill shapes are reserved for genuinely compact controls/statuses.

## Elevation

Prefer no shadow for ordinary content.

Use elevation only for elements that are actually layered or floating, such as:

- mobile navigation;
- transient overlay;
- optional media treatment where separation is needed.

Do not use blur/glass/shadow on every content group.

---

# Media / cover rules

Media is optional and non-critical.

Allowed roles:

- trip identity / cover;
- occasional narrative anchor;
- optional day/place emphasis where the data contract supports it.

Required behavior:

- reserve aspect ratio before image load to prevent layout shift;
- provide intentional background/fallback when image is absent or fails;
- core title, current state, route, decisions, and actions remain available without the image;
- avoid putting long generated text directly over uncontrolled photography;
- if text overlays media, contrast must be guaranteed by the composition, not assumed from the image;
- do not fetch decorative remote media on the critical path;
- no destination-specific media logic in application code.

A cover can change the emotional temperature of a trip without changing the information architecture.

---

# Motion rules

Motion must be quiet and functional.

Preferred range for ordinary transitions: roughly 120–220ms.

Allowed:

- active-view transition;
- current-state emphasis;
- expanding/collapsing supporting detail;
- small movement/fade that preserves orientation.

Forbidden:

- scroll-jacking;
- delayed navigation for animation;
- autoplay spectacle;
- looping decorative motion around core content;
- large parallax that interferes with reading;
- motion required to discover essential information.

Under `prefers-reduced-motion: reduce`, all non-essential animation/transition should collapse to immediate state changes.

---

# Responsive principles

## Mobile first: one reading path

At phone width, the screen should have one clear vertical path.

For Now:

1. compact trip identity;
2. current state/item;
3. supporting context / operational strip;
4. previous/next sequence;
5. decisions/reminders;
6. secondary utilities.

For Trip overview:

1. trip identity;
2. trip premise / key metadata;
3. day sequence;
4. flexible/highlight content;
5. unresolved decisions.

No horizontal layout is allowed to make generated primary content inaccessible.

## Desktop: intentional asymmetry

At desktop width, use the available canvas to separate primary reading flow from secondary context.

The existing shell can evolve toward:

- navigation/context rail;
- primary editorial content column;
- optional supporting aside.

The exact grid belongs to #51, but the hierarchy must remain:

```text
primary content > supporting context > utilities
```

Desktop must not become a stretched mobile card column.

## Breakpoint invariants

- same data;
- same business logic;
- same semantic source order;
- no duplicated state machine;
- no duplicated decision semantics;
- deep links/restored state behave identically.

---

# Light and dark themes

For the default Editorial style, both light and dark modes are first-class. Storybook is deliberately light-only and respects reduced-motion preferences.

Dark mode is not a mechanical inversion.

Maintain:

- readable body contrast;
- quieter separators;
- restrained surface differences;
- accent contrast for text/controls;
- visible focus indication;
- media fallback that does not flash a bright block while loading.

The editorial hierarchy and composition must remain recognizable in both themes.

---

# Trip identity variability contract

## Bounded, opt-in visual style

The original Editorial Atlas remains the **default system**. A later product decision added thirteen explicit site-level styles—`storybook`, `candy`, `paper-collage`, `naive-city`, `risograph`, `taiwan-poster`, `field-stamp` and the six styles in [the second-prompt audit](../style-generator/batches/2026-10-11-editorial-posters.md)—validated through a fixed `ui.visualStyle` whitelist.

This is a **bounded exception** to the original 2026-09 no-preset direction. It was informed by a real user trip implementation and a requirement to reuse that outcome. It allows a **bounded built-in Style Pack picker in More → Appearance**, with a per-trip device-only override; it does not permit a free-form style editor, marketplace, arbitrary CSS/HTML injection or destination-dependent appearance inference.

| Style | Role | Allowed appearance |
| --- | --- | --- |
| `editorial` | default, backwards compatible | existing Editorial Atlas, Auto/Light/Dark, trip accent |
| `storybook` | explicit publisher opt-in | paper white, 3px ink contours, large radii, Huninn, gentle SVG travel illustrations, light-only, reduced-motion support |
| `candy` | reviewed Storybook variation | five sticker-fill SVG colors, rounded geometry, soft cards, accessible dark text, light-only, reduced motion |
| `risograph` | reviewed standalone print pack | indigo ink, ivory paper grain, halftone and one warm graphic accent, serif hierarchy, static/light-only |
| `paper-collage` | reviewed paper pack | matte layered cardstock, cut silhouettes, editorial serif and soft paper-contact shadows |
| `naive-city` | reviewed gouache pack | deliberately wobbly ink outlines, crooked ordinary streets, matte water-based color blocks |
| `taiwan-poster` | reviewed mid-century poster pack | navy/honey/brick print grammar and generic symbolic buildings, without photo or brand imitation |
| `field-stamp` | reviewed engraved pack | imperfect carved strokes, dry ink, misregistration only in decorative images, no fixed record copy |
| `quiet-linocut` | source-audited second prompt | small off-center engraved subject, right torn paper edge and navy/pastel spot inks |
| `doodle-memory-grid` | source-audited second prompt | loose 3×3 nine decorative icons, naive doodle pencil grain, no fake nine stops |
| `crayon-journal` | source-audited second prompt | horizontal five-object crayon memory and short dry strokes, reduced-motion aware |
| `painterly-editorial` | source-audited second prompt | pastel gouache/acrylic dry brush, airy large soft shapes |
| `geometric-print` | source-audited second prompt | hard-edged polygon print without illustration outlines or shadows |
| `quiet-acrylic` | source-audited second prompt | tiny thin-line acrylic motif and very large ivory-paper whitespace |

### Responsive Appearance selector: progressive disclosure

Do not permanently render fifteen visual tiles in the More page. Show one compact row with **the currently selected Style Pack** and a clear "Change visual style" action.

- **Narrow phone (≤767px):** activate a native modal **bottom sheet**, occupying at most 88dvh by default; only the tiles scroll. Header, reset and close stay available. Selecting a tile applies it and closes the sheet so the actual itinerary is visible.
- **Tablet / desktop (≥768px):** activate a native modal **right drawer** (max-width 550px). The rest of the page remains behind a dim overlay. The drawer stays open after selection for quick consecutive comparisons until user closes it.
- **Keyboard / accessibility:** use `dialog.showModal()` so background becomes inert, focus stays within, Escape closes and focus returns to the refreshed trigger. All controls must have usable sizes and visible focus rings. Backdrop and dedicated close/done actions also dismiss the panel.
- **No new style-choice mode setting:** one consistent trigger chooses the right presentation by viewport; do not create redundant user preferences for disclosure mechanism. The existing local Style Pack preference and shared trip facts remain unchanged.
- **Reduced motion:** entrance animations are decorative only and disabled under `prefers-reduced-motion` or saved motion reduction. Smaller 320×568 phones, landscape rotations and wide desktops must keep the picker footer reachable without horizontal scrolling.

Shared and invariant across styles:

- single `trip.json` source of facts and state semantics
- Now / Trip / Map / Check / More jobs and deep links
- read-only itinerary/decisions and source order
- offline support, weather/map fallbacks and specialist handoffs
- semantic labels, focus states, legible contrast, keyboard and motion accessibility
- phone, compact desktop and wide desktop reachability

The visual language may vary **within these fourteen controlled styles** (font families, surface grammar, radius, illustrations, timeline composition); the itinerary data model and workflow do not fork. The published default remains in `trip.json`, while a traveller may locally preview/switch using whitelisted IDs. Resetting follows the publisher default; the URL preview is temporary and higher precedence.

All illustrative pack assets are local, statically bundled and whitelisted; the six new pack directories are described in [Style Packs](../style-packs/README.md). Storybook supports only built-in SVG illustration keys in `assets/storybook/`. Unknown art keys use the generic fallback and do not request remote images. No trip content may inject CSS, arbitrary URLs, scripts, fonts, animations, or external presets. Styles are applied by an isolated disabled-until-opted-in stylesheet, so default Editorial rendering remains unaffected.

---

# Implemented foundation vocabulary

Issue #45 maps this contract to reusable CSS primitives. Downstream tickets should use these shared values/classes before adding local magic numbers.

## Semantic tokens

| Role | CSS tokens |
| --- | --- |
| Theme | `--bg`, `--bg-top`, `--surface`, `--surface-2`, `--text`, `--muted`, `--line`, `--accent`, `--accent-soft`, `--success` |
| Typography | `--font-display`, `--font-utility`, `--text-xs` through `--text-display`, `--leading-tight`, `--leading-body` |
| Spacing | `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-5`, `--space-6`, `--space-8`, `--space-10`, `--space-12` |
| Content widths | `--content-reading`, `--content-main` |
| Shape | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`, `--border-subtle` |
| Elevation | `--shadow`, `--shadow-float` — reserved for genuinely layered/floating UI |
| Interaction | `--focus-ring`, `--focus-offset` |
| Motion | `--motion-fast`, `--motion-base`, `--motion-slow`, `--ease-standard` |

`trip.accent` continues to supply `--accent`; the token system must not reinterpret accent as semantic status.

## Composition primitives

| Visual-system role | Shared CSS primitive |
| --- | --- |
| Trip identity / hero | `.composition-identity` |
| Operational strip | `.composition-operational` |
| Narrative section | `.composition-narrative` |
| Sequence / timeline | `.composition-sequence` |
| Inline utility | `.composition-inline` |
| Context aside | `.composition-aside` |

These primitives are intentionally structural. They do not encode trip data, destination logic, or breakpoint-specific business behavior.

## Structural surface treatments

Three distinct shared treatments are available:

- `.surface-open` — spacing/typography-led grouping with no container chrome;
- `.surface-contained` — restrained boundary for controls or true semantic grouping;
- `.surface-emphasis` — accent rule + quiet tint for exceptional callouts/decisions.

Do not create new “card variants” when one of these structural treatments and the composition primitives can express the hierarchy.

Legacy `.panel` remains supported during staged migration, but its foundation treatment is now deliberately quieter: restrained radius, subtle border, and no default blur/shadow. View tickets should progressively choose a semantic composition/surface role rather than wrapping every new block in `.panel`.

---

# Accessibility and robustness requirements

Downstream implementation must preserve:

- visible keyboard focus;
- touch targets large enough for mobile use;
- contrast that does not rely on the trip accent blindly;
- no color-only state meaning;
- reflow with enlarged text;
- no clipping of generated CJK/mixed content;
- logical heading structure;
- logical source order even when desktop visually reorders columns;
- reduced-motion behavior;
- safe external handoff labels;
- offline usefulness without decorative media.

---

# Anti-patterns / forbidden shortcuts

Do not:

- rebuild the product as a grid of same-weight rounded cards;
- create a new card primitive for every grouping problem;
- use badges/pills as default metadata decoration;
- depend on large hero photography to make the design feel finished;
- use destination-specific classes, coordinates, dates, copy, or layout logic;
- add remote webfonts that become a critical rendering dependency;
- truncate core generated itinerary content for visual neatness;
- place essential text inside images;
- use fixed-height primary content blocks;
- duplicate mobile and desktop business logic;
- hide semantic state behind hover-only interactions;
- add animation purely to look “award level”;
- invent new planner/editor/collaboration semantics;
- let the accent color override accessibility constraints.

---

# Downstream implementation contract

## #45 — Visual foundation

Should implement:

- color/theme tokens;
- type scale and two typography roles;
- spacing scale;
- restrained surface/radius/elevation tokens;
- motion primitives;
- composition primitives that enable open sections, rules, sequence rows, and emphasis without forcing cards.

## #51 — Shared shell/navigation

Should implement the responsive canvas and context-aside framework without changing view jobs or duplicating logic.

## #47 — Now

Should prove the action-first hierarchy and operational strip using all trip phases, including untimed days.

## #48 — Trip

Should prove trip identity, day sequence, narrative/flexible content, and unresolved decisions using the same visual grammar.

## #46 — Trip identity

Should be re-scoped around the bounded identity variability contract above. Do not introduce named presets unless a later product decision reopens this contract with new evidence.

---

# Review gate for downstream tickets

A downstream implementation is consistent with this system only if:

- the primary traveller focus is obvious without reading every container;
- the page still works when optional media is missing;
- light and dark both look intentionally composed;
- mobile is a clean reading path;
- desktop uses space intentionally rather than stretching cards;
- English/zh-TW/mixed long content reflows safely;
- the design is recognizably Travel Lite without destination-specific application code;
- surfaces clarify structure rather than becoming default decoration;
- current functionality/accessibility invariants remain intact.

When these rules conflict with visual spectacle, the traveller job wins.
