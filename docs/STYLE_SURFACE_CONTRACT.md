# Style Pack Surface Contract (v1) — Geometry is not a color token

**Status: implementation in Draft PR #115; Chromium/Human visual acceptance NOT RUN.** This contract prevents the #113 family of frame-and-text collisions without making 16 appearances share the same artistic geometry.

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
| `section` | More `.more-section` and Preparation | This layer owns grouping, header, painted corners and clipping. Its content must not blindly acquire a second frame. |
| `reading-row` | Reservations, notes, costs, files, contacts, essentials | Either **open row + one divider** or **standalone framed row with matching padding**. The border/padding/radius/background are ONE role decision, not four independent overrides. |
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

## Ownership and invariants

1. **Shared layout** owns semantic/source order, flex/grid, breakpoint shell, scroll rails, map hit targets, details/dialog behavior and fallback. A Style Pack can alter deliberate presentation/composition but must preserve those invariants.
2. **Style Pack** owns typography, color, texture, ornament and role geometry through paired tokens. Border does not imply "all panels are cards"; `.panel` and `.runtime-map-panel` are **different roles** even if both used to receive the same broad selector.
3. **Container frame ≠ reading row ≠ compact badge**. Ordinary complete frames need at least ~12–16px horizontal inset; compact chips need ≥8px. If an element has no full frame, zero inline inset can be correct.
4. **One responsible perimeter** per functional section unless its art direction explicitly documents decorative double rules with inset. The Vintage chapter's floral frame is not permission to frame Transport and map controls.
5. **Corner ownership**: an opaque child summary must not paint a larger outside radius than its clipped parent. Use one painted silhouette or aligned nested radii, verified in the browser.
6. **No data/UI bifurcation**: never change trip facts, stop order, map data, storage, five-tab IA, deep links, PDF/ICS or execution by arbitrary LLM CSS. `data-surface-role` stays constant across all appearances.

## Enforcement, not just style guidance

- `node --test tests/style-surface-contract.test.mjs` checks the role annotations, final stylesheet load order, SW offline inclusion, tokens and newly introduced **full reading-row borders without padding**.
- `npx playwright test tests/style-surface-role.spec.mjs --project=chromium` checks all **16 appearances** on actual rendered More/Trip/Transport DOM at 390px. It rejects framed zero-inset rows/endpoints/route chips/map workspaces. This runs inside the default Playwright suite.
- `npx playwright test tests/style-surface-padding.spec.mjs --project=chromium` checks three specific #113 regressions at 320/390/1100, long mixed text and real before/after capture mode.
- `TRAVEL_LITE_FULL_STYLE_QA=1 npx playwright test tests/style-surface-matrix.spec.mjs --project=chromium` is the separately gated 240-state smoke matrix. **Smoke metrics do not replace screenshot/Human QA**.

With only connected GitHub and an offline remote Mac, these commands are **not executed in this PR**; results stay NOT RUN until a real Chromium/Node run is attached. Existing `docs/QA_STYLE_SURFACE_PADDING_2026-10-24.md` keeps the acceptance ledger.

## Migration policy (avoid a 15-theme big bang)

**Phase A / PR #115:** annotate semantic roles, move More reading-row geometry into atomic CSS tokens, repair the confirmed Vintage/Risograph collisions, add static and browser gates. In addition, Risograph Map's frame now belongs to the *map stage*, not a zero-inset workspace.

**Phase B / separate scoped PR only after screenshot evidence:** migrate additional `map-workspace` and `route-endpoints/route-step` style-specific geometry into paired role tokens where cross-pack review proves it safe. Keep intentionally different ink, cardstock, stickers and archival frames. Do not erase pack identities with one universal border rule.

**Phase C / future packs:** use this role API in the template/manifest review checklist, add screenshots for the newly introduced role at 320/390/1100 and add a targeted regression if a design needs an exception. Accept exceptions only with an explicit named role and observed computed values.

**Release gate:** independent Agent code review → Node and actual Chromium → screenshots/matrix → merge → GitHub Pages → **owner Human Review**. Do not auto-close #81/#113 based on a source-only audit.
