# Overview Artwork pilot QA — 2026-11-20

Branch: `feat/curated-overview-artwork-20261120`; Draft PR #141. This is a scoped evidence record, **not full release approval**.

## PASS — source-/contract-level execution

- Actual GitHub connector files were fetched on this branch. Isolated JavaScript runtime checks with safe URL mocks: **13/13 PASS** (selected source IDs, visual-style matching, neutral/no-image fallback, URL schemes and alt escaping, 1–3 image cap, asset/PWA references, compact styling).
- Source syntax parsing and static composition checks: **8/8 PASS** (JS renderer compiles, authoring picker inline script compiles, `trip.json` parses, script load order, size cap and no `:has()` dependency).
- Publisher picker includes real `event` and `break` items (never a Places-only ranking); it exports a brief and never calls the image API in a public browser.

## FAIL / BLOCKED — GitHub Actions

- The `Chronological Timeline Contract` workflow on this PR is **FAIL**. The Actions connector shows the job failed; job-step summaries are empty and logs are unavailable/404. We cannot determine from that evidence whether this is infrastructure, a pre-existing failure, or caused by this PR.
- This issue blocks release. Do not mark CI PASS or merge based solely on the source-level checks.

## NOT RUN / PENDING

- The repository's full Node `npm run test:contracts` command: **NOT RUN** in an installed repo working tree.
- Playwright full cross-pack browser matrix, 320/390/1100/1920px and 200% text: **NOT RUN**. A local Chromium screenshot attempt could not start in the current container environment.
- Real GitHub Pages preview/deployment inspection: **NOT RUN** (draft PR not merged/deployed).
- Human visual/subject acceptance: **PENDING**; generated art is a creative journey montage rather than a photograph.

## Gate

Required before merge: diagnose CI, run the actual Node + Playwright suites in a working browser environment, check offline image loading/asset paths, review the owner's subject fit and responsive layout, then explicitly sign off. The original `main` remains unchanged.

## Follow-up — owner removed GH Actions and requested all Style Pack illustrations

- The sole tracked `.github/workflows/chronological-timeline.yml` has been deleted from `main` in Template, Osaka and Xinjiang, and from the active Template/Osaka artwork PR branches. Old failed workflow runs remain historical entries; **there is no active tracked repository workflow** for these branches.
- Template now stores up to 48 audited image variants, shows max three for active Style Pack; safe 5×3 atlas slice added.
- The complete generated artwork ZIP and 15-style visual contact sheet were delivered in the ChatGPT conversation; the repo stores a compressed AVIF atlas for web use. The atlas is a derived raster preview, not fifteen independent source-photo edits.
- Required manual Node/Chromium/browser and human visual acceptance remain **NOT RUN/PENDING**, not PASS. Removing CI is not equivalent to passing QA; direct source checks are a narrower gate.
