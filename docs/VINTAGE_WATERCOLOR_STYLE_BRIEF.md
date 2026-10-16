# Vintage Watercolor Travel Guide — Art Direction & Frame Grammar v2

**Issue:** [#79](https://github.com/world4jason/Travel-lite-Template/issues/79) · **Downstream:** [#80 A5 print](https://github.com/world4jason/Travel-lite-Template/issues/80), [#81 website Style Pack](https://github.com/world4jason/Travel-lite-Template/issues/81)

**Status:** Published Style Pack; Frame Grammar v2 passed local Agent QA (67 Node / 144 browser, before/after screenshots and print PDF), pending post-deployment Human Visual Review.

## Product intent and evidence boundary

Use the supplied *2026 Central Europe / Vienna travel booklet PDF* **for visual reference only**. It is NOT a source itinerary, tourist-guide database, font license, asset library, or a public repository artifact. Its text, illustrations and page compositions are not to be reproduced. This repo must not contain copied PDF pages, screenshots of those pages, or reconstructed protected artwork.

The desired impression is **a gently aged, illustrated personal travel journal**: evocative enough to enjoy before and after a trip, while real journey content stays legible and practical on a phone.

- **Learn from the visual grammar:** aged warm paper, faint ink wash, botanical corner motifs, narrow antique rules, softly colored ink-and-watercolor illustrations, occasional ribbon labels, and clear editorial hierarchy.
- **Do not import content:** no Vienna names, facts, restaurants, dates, route geometry, transportation diagrams, souvenir prices, descriptions or invented guide prose.
- **Keep the original Travel Lite jobs:** Now, Trip, Map, Check and More; read-only data; offline behavior; timezones; links; shared vs. local state.
- **One data source, two render media:** the website Style Pack (#81) and optional A5 print style (#80) may share design tokens/art assets, but **not a fixed page layout**.
- **No special city inference:** destination-specific landmarks can appear only when explicitly provided, rights-cleared and verified in that trip's existing data/assets. Prefer generic botanical/architectural decorative motifs.

### Observed design references (for human reviewers who have the private PDF)

| PDF page | Visual property to extract | Not a specification to copy |
| --- | --- | --- |
| 1 | warm parchment, understated elaborate border, watercolor vignette around trip identity | exact cover text, buildings, food, illustrated layout |
| 5 | clean chapter-index spacing and restrained pastel labels | page list and the trip's actual dates |
| 10, 31, 75 | date-led breathing-room chapter divider, small decorative motifs | one-PDF-page-per-website-screen |
| 19, 32, 139 | icon-based transport sequencing and light dotted rules | actual route geometry, transit stops or itineraries |
| 37, 49, 125 | dominant watercolor sketch paired with readable factual fields | encyclopedic content or museum facts |
| 99, 104 | illustrative vignettes near compact information blocks | restaurant/menu content, food names or prices |
| 151 | framed editorial closing composition | guidebook narrative or historical details |

Reference pages above are **private review anchors**, not downloadable assets. The page styles vary across the original booklet; the goal is to distill a *coherent* reusable design, not imitate every page.

## Style DNA

| Dimension | Design decision |
| --- | --- |
| Mood | nostalgic, cultivated, warm, curious, gentle and tactile; **not childish or overly luxurious** |
| Medium | fine-line ink drawing with low-opacity watercolor washes; delicate, organic imperfections |
| Paper | ivory/cream with restrained edge texture; no full-page photographic parchment mandatory |
| Shapes | botanical branches/corners, dotted/light double rules, subtle plaques/ribbons |
| Depth | essentially flat print composition; no glossy cards or thick shadows |
| Hierarchy | large trip/day title, short ribbon subheading, uncomplicated body blocks and utility labels |
| Detail density | decorative at chapter boundaries, sparse in operational sections |
| Motion | static by default; no decorative animation required |
| Content | ONLY existing source-faithful `trip.json` fields; no generated copy added by Style Pack |

### Frame & Ornament Grammar — primary visual identity

User feedback makes the FRAME the main visual signature, not merely the palette. The typed local design contract is style-packs/vintage-watercolor/frame-grammar.json.

| Role | Source reference observation | New original interpretation |
| --- | --- | --- |
| Identity | P1: four symmetrical corner flourishes and gold perimeter | New self-authored SVG corners and gold outer rule |
| Inset | P1/P10/P31/P75: narrow inset inner line | CSS inset rule with no duplicated text |
| Divider | P37/P39/P49: thin, decorated section separation | New symmetric leaf-and-ink center divider SVG |
| Reading frame | P37/P49/P125: framed facts with separate labels | Understated single corner ornament and fine card edge |
| Print | P5/P10/P75: full-page frame even when content changes | A5 vector motif embedded in print CSS plus readable print-border fallback |
| Operations | Now/Map require immediate legibility | Simple structural borders and clear keyboard focus |

Visual acceptance demands visible four-corner geometry, nested rules and an ornamental section node on key identity/chapter surfaces. A plain 1px rectangle is not a substitute. Phone sizes reduce detail, not remove the defining frame. Real text, touch targets, keyboard operation and offline support always take priority.

### Proposed palette (new design tokens, **not** extracted HEX from the PDF)

All color values here are design proposals and must be validated by real screenshots and text-contrast tests before production.

| Role | Draft value | Usage |
| --- | --- | --- |
| Paper | `#FAF4E6` | reading surfaces / unobtrusive background |
| Card paper | `#FFFCF5` | raised context where grouping is useful |
| Main ink | `#392F26` | operational text and body |
| Muted ink | `#615448` | metadata and explanatory text |
| Antique green | `#445C43` | decorative ribbons, chapter labels, selected outlines |
| Old gold | `#AA8250` | hairline borders and ornament, not tiny text on cream |
| Terracotta | `#A85D43` | restrained date/accent emphasis, test contrast |
| Watercolor blue | `#BAD2D5` | landscape washes only, never sole indicator of status |
| Botanical gray-green | `#BCC9AF` | non-semantic botanical drawings and wash accents |

Rule: satisfy WCAG AA **4.5:1 for ordinary text**, **3:1 for large text and non-text UI boundaries** where applicable. If a reference-looking tint fails, darken the functional ink; do not reduce legibility to match paper artwork.

### Typography

- **Display:** a restrained editorial serif stack (e.g. `ui-serif, Georgia, "Songti TC", serif`). Use for a limited set of cover/day headings, with safe CJK fallbacks. Test Traditional Chinese glyph rendering before approval.
- **Utility/body:** existing system sans stack (e.g. `-apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif`). Times, addresses, warnings, infoCard facts and controls must scan quickly.
- Avoid embedded raster text, handwritten body text, overextended tracking on CJK, narrow fixed title boxes, ellipsis on critical locations and externally hosted render-blocking fonts.
- Allow long generated names to wrap, including unbroken Latin tokens and mixed Chinese/English. No decorative frame may require shrinking body type below normal reading sizes.

### Graphic assets

- Local, reusable, auditable **SVG motifs** for corner flora, a thin chapter ribbon, a small wash mark and a generic postcard-like landscape. All true itinerary text remains HTML/text.
- Architecture can be abstract/generic; a famous building with a proper identity requires destination-specific verified source material. Do not scrape or embed the reference PDF's drawings.
- A modest number of transparent soft washes can be raster art **if created/licensed separately**; require local storage, lazy loading where appropriate, alt semantics and offline fallback.
- Decorative-only images use empty `alt` and `aria-hidden` where appropriate; actual trip media requires informative `alt`.
- Maximum texture contrast should be low enough not to compete with reading text. Ensure a clean solid-paper fallback when images do not load.

## Component treatments — Website (#81)

| Screen/role | Proposed styling | Must preserve |
| --- | --- | --- |
| Trip overview | one illustrated identity composition, slim botanical corners, dates as editorial metadata | compact initial scan, true trip title/dates, existing highlighted/TBD sections |
| Day header | clear large date/label; small ribbon or flourished divider; optional *generic* vignette | ordered stops visible quickly, long day titles do not clip |
| Day timeline | delicate dotted/rule sequence and occasional accent on existing items | real times/TBD, transfer order, touch targets and Map handoff |
| infoCard | optional **collapsed** reading disclosure with a paper inset and unobtrusive header | existing `title/summary/facts/image/sourceLinks`; NO new Guide content |
| Now | only light surface/token accents, no illustration taking priority from “now/next” | accurate current scheduled context and fast accessibility |
| Map | very low decoration, framing outside interactive map only | exact MapLibre markers, pan/zoom, controls, Google Maps links |
| Check/More | small visual tokens/rules without elaborately decorated every row | native control affordances, labels, persistence, More Appearance picker |

**Mobile is not a mini A5 sheet.** Adapt by hierarchy and progressive disclosure. Keep action-first information visible in the first useful screen; unnecessary ornaments should disappear at narrow widths.

## Component treatments — A5 Print (#80)

- Optional `Classic / Vintage Watercolor` style under the existing More → A5 path; current Classic must remain a reliable plain-print fallback.
- Cover: generous margins, small original decorative motifs, strong title/date hierarchy.
- At-a-glance: readable day sequence; avoid a full-screen ornament instead of content.
- Day pages: concise chapter header, light separators, true time/location/note text. Dense days **must paginate** naturally: not forced to one page or a fixed height.
- Use HTML/CSS `@page` and `@media print`, selectable/searchable Unicode text, no rasterized full-page snapshots.
- Keep light/ink-saving mode and printer-disabled-background fallback legible. Avoid full-bleed background images; keep useful content within safe print margins.
- **No new fields or content transformations**: do not add infoCard into A5 in this phase. Possible opt-in longer Guide chapters remain future [#82](https://github.com/world4jason/Travel-lite-Template/issues/82).
- Print-only ornament and web-only decoration may have different density; same token family, different layout.

## Distinction from existing Style Packs

| Existing Pack | Already does | Why this is not just a palette variant |
| --- | --- | --- |
| `storybook` | illustrated, playful, outlined, rounded cards, story timeline | new reference uses fine historic illustration lines, botanical rules/ribbons, archival editorial hierarchy rather than cartoon outlines |
| `painterly-editorial` | soft pastel brush and generous modern white space | new reference adds classical illustrated-guide density, ornate separators, warm parchment and typographic hierarchy |
| `naive-city` | crooked gouache urban sketches, handdrawn feeling | new reference is more detailed, ordered, restrained, classical—not naive/wobbly buildings |
| `risograph` | limited spot inks, print grain, strongly graphic imagery | this is translucent watercolor wash + fine ink rather than halftone screenprint |

**Decision:** likely a *new reviewed Style Pack* built from existing Storybook composition primitives where practical, not merely a color swap. Finalize after visual comparison against the same existing non-Vienna trip fixture.

## Implementation and QA gates

The Vintage Watercolor runtime ID has already shipped. Frame Grammar v2 is a focused enhancement; its new artwork and layout must pass Agent visual checks before merge and Human review after deployment.

1. **Fixed source of truth:** use the existing non-Vienna Tokyo demo `trip.json` for the first visual comparison. Capture *the same trip facts* in old and proposed styles; do not change titles, locations or add stories.
2. **Visual specimen required before sign-off:** phone 390×844 and desktop 1100×900 overview and one day; a long CJK/Latin stress layout at 320×568; A5 cover/overview + one dense overflowing day. These captures may be screenshots of a local prototype using only original assets.
3. **Style-only parity:** text, ordering, timezones, links, map handoffs, decisions, checks, offline data and `infoCard` semantics remain invariant.
4. **Accessibility:** contrast, real text, keyboard focus, no horizontal overflow or clipped long names, prefers-reduced-motion, screen reader accessible labels; unknown images do not break layout.
5. **Offline/PWA:** newly bundled assets must be precached deliberately and have fallbacks; do not hotlink decorative images/fonts from the reference PDF or unknown websites.
6. **Code cleanliness:** no arbitrary CSS/HTML/JS from `trip.json`, no new runtime CMS/editor, no changes to unrelated Style Packs.
7. **Review:** compare illustrations against the private booklet for *mood only*, not similarity of scene, lettering or protected composition. Record human visual feedback and unresolved issues.

## Open decisions / explicitly not delivered in this draft

- [ ] Approve exact paper/ink/accent palette and validate WCAG contrast measurements.
- [ ] Produce original visual specimen/screenshots and compare with existing Storybook/Painterly/Naive styles.
- [ ] Review candidate original/reusable illustration assets and their provenance.
- [ ] Review web/print balance on actual devices and PDF output.
- [ ] Post-release Human Review on the deployed GitHub Pages site after the implementation is merged, with follow-up issues for feedback.

**Frame Grammar v2 browser and A5 visual evidence is now bundled in style-packs/previews, with detailed Agent QA at docs/QA_FRAME_2026-10-17.md; final Human Visual Review still occurs on the deployed website.** #80/#81 require agent-reviewed browser/print specimens and automated regression tests before merge. Once the live GitHub Pages build is verified, Human Review happens there; additional feedback becomes a follow-up issue. #82 remains separate Backlog.

## Implementation history — A5 variant

The downstream A5 implementation keeps the same `normalizedTrip()` / `dayMarkup()` and opt-in `a5-vintage` print CSS rather than creating a separate renderer. The original Classic A5 and A4 formats remain the defaults. Vintage ornaments are CSS-only abstract plant/wash shapes; all trip facts remain selectable DOM text. **Browser PDF test PASS:** actual A5 Tokyo sample (5 pages) and 6-day dense sample (32 pages; 132/132 printed stops confirmed by text extraction). Agent inspected preview screenshots; Human review on deployed Pages remains pending. The private reference booklet's contents are not reproduced.


## Implementation history — website pack

The previously merged #81 includes a whitelisted `vintage-watercolor` ID, scoped CSS, original local `hero.svg` / `marker.svg`, a prototype manifest and tests. Desktop-only decorative artwork is intentionally omitted on mobile for faster operational scanning. The pack preserves all existing `trip.json` content and does not interpret artwork as place/map evidence. **Earlier Agent visual review covered prior mobile/desktop and print screenshots; new Frame Grammar v2 requires its own QA and subsequent Human review.**
