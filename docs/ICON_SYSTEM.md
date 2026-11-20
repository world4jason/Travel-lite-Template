# Functional Icon System — separate from AI-generated travel artwork

## Source of truth

- Runtime allowlist: ui-icons.js — inline, local vector SVG shapes.
- Semantic catalog: assets/icons/semantic-catalog.v1.json — 21 names, roles, zh-TW/en labels and meaning.
- Preview: tools/icon-review.html — compare the same real functional icons across 15 site Style Packs.
- Independent QA: node scripts/verify-icon-catalog.mjs, npm run test:icons, npm run test:icons:browser.

Do not rely on emoji, remote icon-font CDNs, untrusted user-supplied SVG strings, destination naming, or generated images for important UI actions. Visual Style Packs may vary tokens such as color, weight and frame, but **cannot turn walking into a running person**, turn a map pin into a glyph, or reuse the same geometry for train/subway/cable.

## Required icons

| ID | UI meaning | Non-negotiable graphic |
| --- | --- | --- |
| map-pin | Place/Maps handoff | recognizable location pin and target |
| map | Map workspace | folding map outline, distinct from location pin |
| route | From-to navigation | route with distinct nodes |
| walk | Walking | **two footprints**, NOT running silhouette or a hiking stick |
| train | Regional/intercity train | side-view multi-window train |
| subway | Metro | front-facing car and wide windscreen |
| cable | Cable/funicular | suspended/funicular silhouette, not bus/train |
| bus | Bus travel | recognizable bus front |
| boat, drive, flight | Other modes | ship, car, aircraft |
| ticket, stay, event | Ticket/lodging/event | semantically distinct, labeled |

The remaining catalog icons (clock/list/more/check/museum/task/sparkles) use the same allowlist and accessibility checks. All functional icons must work without a network icon provider or travel artwork.

## Accessibility, licenses and Style Packs

- Inline decorative SVG inside a button/link with visible text uses aria-hidden=true and focusable=false; the action must have a meaningful label. A meaningful stand-alone icon needs its own accessible name.
- Prefer currentColor and a common 24x24 SVG viewBox. Verify icon sizes at 20, 24, 32 px, keyboard navigation and 200% text resizing. Preserve legible contrast in every Style Pack.
- Do NOT generate fifteen different functional icon silhouettes with AI. Only decorative hero/illustrations vary per Style Pack. Functional action meaning stays invariant.
- Track origin/rights of borrowed paths. Lucide icons use ISC with notice obligations: https://lucide.dev/license . SVG accessibility guidance: https://design-system.w3.org/styles/svg-icons.html .

## Five independent adversarial cover controls

| ID | Deliberate wrong input | Required failure |
| --- | --- | --- |
| N1 | Manifest declares a cover but native image file is absent | E_NATIVE_FILE_MISSING |
| N2 | Replace Prompt with a generic skyline and rehash BOTH job and generation receipt | E_PROMPT_NOT_DERIVED_FROM_RECIPE; independent verifier reconstructs the locked prompt |
| N3 | Crop a contact sheet and pretend it is an independent high-res cover | E_ATLAS_CROP_NOT_INDEPENDENT |
| N4 | Image lacks yokai or does not match Candy art medium | E_SUBJECT_MISSING / E_JUDGE_LOW_STYLEMATCH |
| N5 | Replace an image after model/human approval, retaining the stale approval records | E_JUDGE_STALE_IMAGE / E_HUMAN_REVIEW_STALE_IMAGE |

Executable fixtures are in tests/test_cover_verifier.py. These tests verify that deliberate negative cases are caught, **not** that actual generated covers have passed.

Important epistemic boundary: Prompt SHA and local response receipts prove local consistency but cannot prove from the pixels alone which external request generated an image. Check provider call evidence when available, use independent visual assessment, and require human release approval. Content provenance signals may help origin review but cannot identify the actual input Prompt: https://developers.openai.com/api/docs/guides/content-provenance .

## Manual release gate, no GitHub Actions

1. Run npm run test:artwork-verify; the verifier should reject all N1–N5 counterexamples.
2. Run npm run artwork:verify on the real cover files, receipts and independent judge/human evidence.
3. Run npm run verify:icons and npm run test:icons to audit the 21 functional icons.
4. Run npm run test:icons:browser for 15 styles at 390px, 320px and text zoom.
5. Keep PRs in Draft until all mandatory checks are genuinely PASS, not simply because GitHub Actions was removed.
