# Style Pack Surface Contract (v2) — Geometry is not a color token

**Release provenance:** the reading/cost contract was released in [PR #115](https://github.com/world4jason/Travel-lite-Template/pull/115), with owner Human Visual Acceptance recorded on 2026-10-25 in [#113](https://github.com/world4jason/Travel-lite-Template/issues/113) and [#81](https://github.com/world4jason/Travel-lite-Template/issues/81). That approval applies to that release. [#116](https://github.com/world4jason/Travel-lite-Template/issues/116) adds the shared Trip hierarchy and Route/Map workspace ownership; its independent review, actual browser evidence, deployment and owner gate are recorded separately. No prior approval or smoke count substitutes for the new release's visual review.

## Architecture and root cause

The **data and app behavior are already shared**. `app.js` chooses a whitelisted local stylesheet. Thirteen illustrated styles also enable `storybook-theme.css`; Risograph does not. Some illustrated styles require the same optional illustration handling in JS, but #113's observed text/border collisions do **not** come from trip-data or route logic.

The **visual component API was incomplete**: general-purpose selectors such as `.panel` and `.runtime-map-panel` were treated as interchangeable, and a theme could set `border` without the `padding` (or painted-radius ownership) that makes a border safe. The actual cascade also includes several structural stylesheets and multiple enabled packs. An out-of-order or higher-specificity rule can therefore reintroduce an outline after an earlier stylesheet removed the inset.

Changing only the CSS *can* alter content usability. A frame is not a purely decorative color: it occupies pixels, affects box sizing, reduces reading space, may cover map controls and can interact with overflow, focus rings and source text.

## Stable DOM roles — no new functional JS branch

Renderers label their **existing** semantic DOM elements with `data-surface-role`; the value never depends on `visualStyle`.

| Role | Component | Contract |
| --- | --- | --- |
| `map-workspace` | Transport's `.runtime-map-panel` | Pan/zoom and map stage remain operable. No complete outer border unless the heading and controls have real inset. Open utility chrome is valid and preferred for Vintage/Risograph. |
| `transport-context` | Published transfers `details` | Functional disclosure: summary, expanded content and keyboard focus must remain reachable. A perimeter requires its own summary inset; never glue it to a parent frame. |
| `selected-stop` | Selected map stop summary | A standalone selected-place reading surface, not a More row. If framed, reserve ≥12px inline inset; preserve external navigation actions. |
| `section` | More `.more-section` and Preparation | This layer owns grouping, header, painted corners and clipping. Its content must not blindly acquire a second frame. |
| `reading-row` | Reservations, notes, costs, files, contacts, essentials | Either **open row + one divider** or **standalone framed row with matching padding**. The border/padding/radius/background are ONE role decision, not four independent overrides. |
| `cost-summary` | More → Costs Total, separate from ordinary cost entry rows | Complete frame, inset, radius, fill and long amount wrapping are one geometry contract. A visible left/right border needs ≥12–16px inline gap. |
| `route-endpoints` | Trip START / END | Preserve actual start/end names, arrow and order. If framed, keep at least 8px inline reading room, increasing where feasible. |
| `route-step` | Trip numbered route item | Preserve order and ink number. If a chip is framed, it needs at least 8px inline inset. Long names cannot become inaccessible. |

Existing CSS classes remain intact for backward compatibility. DOM roles are annotations, not a new renderer, DOM fork, content schema, React component or arbitrary Style Brief instruction.

## Reading-row implementation: explicit atomic tokens

`surface-contract.css` is deliberately loaded **after** all enabled visual overlays in `index.html`; it owns the final geometry of annotated reading rows:

- `--ui-reading-row-frame`: border including left and right, or `0`
- `--ui-reading-row-divider`: top row separator, or matching framed border
- `--ui-reading-row-padding`: *both horizontal and vertical* spacing
- `--ui-reading-row-radius`: border-radius, or `0`
- `--ui-reading-row-fill`: fill under the content, or `transparent`

Example for a new framed pack:

```css
:root[data-visual-style="example-pack"] {
  --ui-reading-row-frame: 1px solid var(--line);
  --ui-reading-row-divider: 1px solid var(--line);
  --ui-reading-row-padding: 14px 16px; /* paired with the frame */
  --ui-reading-row-radius: 6px;
  --ui-reading-row-fill: var(--surface);
}
```

Example for a ruled editorial pack:

```css
:root[data-visual-style="example-pack"] {
  --ui-reading-row-frame: 0;
  --ui-reading-row-divider: 1px solid var(--line);
  --ui-reading-row-padding: 13px 0;
  --ui-reading-row-radius: 0;
  --ui-reading-row-fill: transparent;
}
```

**Never add a direct `.info-row, .file-row, .text-card { border:... }` without also accounting for inset.** Style Packs should set role tokens rather than override the final role selector. The existing Storybook unannotated-row fallback is retained for older call sites; the annotated app renderers use the contract. Storybook-derived packs inherit a matched 2px/13px framed row unless a particular pack intentionally overrides the role tokens. Risograph chooses the open reading row; its `Stay` tag has separate microtypographic inset.

## Costs summary migration (reviewer P1 follow-up)

`cost-summary` uses four *paired* tokens in `surface-contract.css`: `--ui-cost-summary-frame`, `--ui-cost-summary-padding`, `--ui-cost-summary-radius`, `--ui-cost-summary-fill`. The published Tokyo fixture currently has no Costs entries; tests **must create a populated fixture**, otherwise this entire surface goes unrendered and may pass falsely.

The first repair found **eight more packs** with `.more-section > summary, .cost-total` sharing a full frame and color but without explicit matching inline padding: Paper Collage, Taiwan Poster, Quiet Linocut, Doodle Memory Grid, Crayon Journal, Painterly Editorial, Geometric Print and Quiet Acrylic. They now keep their original border/radius/background through these role tokens with 16px inline padding. Storybook-derived styling and Risograph have their own matching tokens; Editorial stays unframed.

A new static guard detects `border`, `border-left/right`, `border-inline*`, `border-width` and inward `outline` declarations on reading/cost rows lacking horizontal inset. **This lint is conservative and cannot substitute for real computed CSS specificity.** A separate runtime guard now checks each side independently rather than requiring a four-sided frame, with negative cases for side-only frame injection.

## Shared Trip hierarchy

All appearances render one named section with an h2 and `ol[role="list"]`. Each source item contributes one direct li/article with an h3; its outgoing transfer remains in the same li. The empty-state message sits outside the list. Editorial's section heading remains accessible while visually hidden. A fixed aria-hidden rail and the existing direct-child artwork mapping preserve each pack's presentation without a second semantic renderer.

Trip uses one strict `HH:MM` start classification for both `<time datetime>` and current eligibility. Invalid/missing starts use the localized floating span. The intentional Editorial change for one-digit hours, surrounding whitespace and invalid starts is covered by a complete-boot fixed-clock test. Raw data, end parsing, overlapping windows and timezone policy are unchanged; Now's existing format tolerance is not redesigned here. The independent return-visit/route-label deduplication bug is tracked in [#120](https://github.com/world4jason/Travel-lite-Template/issues/120), outside this migration.

## Route and Map workspace ownership

`surface-contract.css` consumes the final geometry for `route-endpoints`, `route-step` and `map-workspace`. Their parameters use `--ui-route-endpoints-*`, `--ui-route-step-*` and `--ui-map-workspace-*`: frame, padding, radius and fill; endpoints/workspace also account for decorative outline and offset. Keep frame and inset as a matched decision. Editorial's open route typography, Risograph's asymmetric open steps, Candy's double perimeter and Vintage's open workspace remain distinct.

These pack parameters are declared at the existing role element/breakpoint scope, preserving the original cascade and variable resolution. Do not mix inherited root values with element-local mobile defaults that silently override the pack. Remove old direct geometry declarations when ownership moves; a later stylesheet or new token name alone does not prove ownership. The shared consumers use the same shorthand semantics as the displaced rules.

Grid/arrow placement, route scroll rails and number badges remain component composition. Map stage/chrome retain their existing responsibilities, including the `max-width:899px OR max-height:600px` layout and Vintage's text inset around a full-bleed stage. Selected-stop and transport-context remain separate regression surfaces. The MapLibre lifecycle and non-Transport map callers are not redesigned. Material-only pack rules may retain color, backdrop or external shadow without reclaiming workspace geometry.

## Navigation is not an ornamental surface

The primary `.bottom-nav` is **functional responsive shell chrome**, not decoration. The shared shell owns its `position:fixed` behavior on phones and in-flow/sticky desktop placement. A Style Pack may change its paper, ink, radius and active-state visuals, but **MUST NOT** put `.bottom-nav` in a broad `:is(...){position:relative}` selector or otherwise override navigation positioning/scroll semantics. Real 390px five-tab screenshots caught this existing flaw in **Risograph** and **Taiwan Poster**; both were repaired in PR #115. The 16-appearance default Chromium role test now measures computed `position:fixed` and the nav's viewport-relative top before and after scrolling.

**Text-only zoom contract (reviewer 200% P1):** the mobile five-button shell wraps by intrinsic label widths rather than arbitrarily breaking labels (`Transport`, `Places`) or shrinking font sizes. The final role sheet `surface-contract.css` maintains full label words, 44px minimum target widths, and the same five source-driven tabs. `app.js` observes the actual navigation block size with `ResizeObserver`, and only updates `--mobile-nav-block-size` on `.app-shell`; shell CSS reserves that live height plus the bottom safe-area offset and 20px for the final card. It does not change the route, content or Style Pack aesthetic tokens. Browser acceptance explicitly tests 320/390px with 200% root text and ensures the final itinerary card remains clear at maximum scroll; normal size restores the original one-row navigation. The offline precache must bump when any CSS/JS for this contract changes.

CSS `:is(...)` adopts the **highest specificity** of its selectors, even if a simpler member matches. For example, a broad `:is(.panel, .trip-day-view > .day-summary, ...)` perimeter can unexpectedly outrank `... .more-section`, even if the frame is actually a More section. The Vintage fix explicitly scopes `.more-section.panel` to regain ownership. Inspect the **computed cascade** in a real browser; loading an override later is not a specificity guarantee.

Long mixed-language expense titles are flexible and may wrap; the associated amount is a single atomic value and `[data-surface-role="reading-row"].compact-row > strong` must not vertically break its currency digits. The 320/390/1100 browser tests include intentionally long CJK/English descriptions to catch this.

## Ownership and invariants

1. **Shared layout** owns semantic/source order, flex/grid, breakpoint shell, scroll rails, map hit targets, details/dialog behavior and fallback. A Style Pack can alter deliberate presentation/composition but must preserve those invariants.
2. **Style Pack** owns typography, color, texture, ornament and role geometry through paired tokens. Border does not imply "all panels are cards"; `.panel` and `.runtime-map-panel` are **different roles** even if both used to receive the same broad selector.
3. **Container frame ≠ reading row ≠ compact badge**. Ordinary complete frames need at least ~12–16px horizontal inset; compact chips need ≥8px. If an element has no full frame, zero inline inset can be correct.
4. **One responsible perimeter** per functional section unless its art direction explicitly documents decorative double rules with inset. The Vintage chapter's floral frame is not permission to frame Transport and map controls.
5. **Corner ownership**: an opaque child summary must not paint a larger outside radius than its clipped parent. Use one painted silhouette or aligned nested radii, verified in the browser.
6. **No data/UI bifurcation**: never change trip facts, stop order, map data, storage, five-tab IA, deep links, PDF/ICS or execution by arbitrary LLM CSS. `data-surface-role` stays constant across all appearances.

## Enforcement, not just style guidance

- `node --test tests/style-surface-contract.test.mjs` checks role annotations, final stylesheet load order, SW offline inclusion, paired consumers, reading-row frame/inset and the three migrated roles' exclusive geometry ownership. It rejects direct geometry in component/pack rules and enforces zero remaining mixed panel/map frame groups, with deliberate negative cases for the lint itself.
- `npx playwright test tests/style-surface-role.spec.mjs --project=chromium` checks all **16 appearances** on actual rendered More/Trip/Transport DOM at 390px. It rejects framed zero-inset rows/endpoints/route chips/map workspaces. This runs inside the default Playwright suite.
- `npx playwright test tests/style-semantic-parity.spec.mjs --project=chromium` checks the same named section/h2/ordered-list hierarchy, direct source-item relationships, keyboard actions, empty days, facts and transfers across all 16 appearances, including both Editorial themes. Artwork differences are excluded from semantic signatures.
- `npx playwright test tests/issue116-trip-contract.spec.mjs --project=chromium` checks 12 explicit time cases through the complete real script load order, including invalid starts, unchanged end tolerance, overlapping current windows and source/snapshot preservation.
- `npx playwright test tests/issue116-role-geometry.spec.mjs --project=chromium` records all-appearance Route/Map role geometry at 320/390/1100 widths and a short-height layout, with real MapLibre controls, long labels, fallback and actual style-picker transitions. Baseline capture mode records evidence only; final acceptance requires the candidate assertions and before/after inspection.
- `npx playwright test tests/style-surface-padding.spec.mjs --project=chromium` checks three specific #113 regressions at 320/390/1100, long mixed text and real before/after capture mode.
- `TRAVEL_LITE_FULL_STYLE_QA=1 npx playwright test tests/style-surface-matrix.spec.mjs --project=chromium` is the separately gated 240-state smoke matrix. **Smoke metrics do not replace screenshot/Human QA**.

The authorized Mac later ran the real Node and Chromium suites: **255 default browser tests PASS, 16 opt-in matrix tests intentionally skipped**; the 240-state matrix and 32 zoom cases were run separately. See [QA execution ledger](./QA_STYLE_SURFACE_PADDING_2026-10-24.md). The subsequent independent review, merge, Pages deployment and 2026-10-25 owner acceptance for that release are recorded in #113/#81; future changes retain those separate release gates.

## Migration policy (avoid a 15-theme big bang)

**Phase A / PR #115 (released and accepted):** annotate semantic roles, move More reading-row geometry into atomic CSS tokens, repair the confirmed Vintage/Risograph collisions, add static and browser gates. In addition, Risograph Map's frame now belongs to the *map stage*, not a zero-inset workspace.

**Phase B / [Issue #116](https://github.com/world4jason/Travel-lite-Template/issues/116):** one accessible Trip hierarchy plus paired `map-workspace` and `route-endpoints/route-step` geometry. Review the time-policy correction, DOM cutover, Route ownership and Map ownership as separate changes. The implementation preserves different ink, cardstock, stickers and archival frames; before/after screenshots and computed evidence must support the candidate. #120 is separately tracked and is not a prerequisite for this scope.

**Phase C / future packs:** use this role API in the template/manifest review checklist, add screenshots for the newly introduced role at 320/390/1100 and add a targeted regression if a design needs an exception. Accept exceptions only with an explicit named role and observed computed values.

**Release gate:** independent Agent code review → Node and actual Chromium → screenshots/matrix → merge → GitHub Pages → **owner Human Review**. Do not treat a source-only audit or the prior #81/#113 acceptance as Human Review for new changes.
