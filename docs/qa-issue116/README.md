# Issue #116 — component comparison evidence

This directory preserves representative Chromium captures for [PR #121](https://github.com/world4jason/Travel-lite-Template/pull/121). The PR records the final tested commit, deployment and independent review. Owner Human Visual Acceptance is tracked separately in [#116](https://github.com/world4jason/Travel-lite-Template/issues/116).

## Recorded source and method

- Baseline: `897454280487873505eea3dcab8a7046d85c07de`.
- Initial capture candidate: `50981193deb3ae5466ee407c7b6496dfb3642bbc`.
- Harness: `tests/issue116-role-geometry.spec.mjs`, using the same synthetic stress fixture derived from the published `trip.json`, with deliberately long, unique route labels, for both checkouts.
- Chromium 153.0.8010.12 / Playwright 1.63.0 on macOS; en-US browser, UTC browser timezone, English fixture, Asia/Tokyo trip timezone; fixed clock 1790991000000.
- Remote fonts are blocked and reduced motion is enabled. The MapLibre library and actual canvas/controls/markers run locally against a source-free background; remote-provider availability is a separate deployment check.
- Four layouts: 320×568, 390×844, 1100×900 and 1100×600. Each records Trip, Transport and expanded Transport.
- Screenshots are element crops at 390×844. Fixed page navigation remains visible where it intersects a tall crop. Real hit-testing, keyboard focus and scrolling are exercised separately.

The final candidate run must reproduce these image hashes after evidence files are added. Adding this directory does not alter runtime files. The original source checkpoint remains explicit instead of retroactively relabelling captures.

## Comparison

[Capture comparison and SHA-256 manifest](capture-comparison.json) records all 48 image pairs and the retained files.

| Measurement | Result |
| --- | --- |
| Appearances | 16 |
| State snapshots compared | 192 |
| Role records compared | 1,472 |
| Illustrated heading states compared | 56 |
| Computed geometry differences | 0 |
| PNG pairs byte-identical | 46 / 48 |
| Different PNG pairs | Editorial Light/Dark timeline only |

Computed comparisons cover per-side borders, padding, radius, background, outline, measured text inset and parent-relative bounds. The three migrated roles and the existing Map heading/stage/selected-stop/transport-context compatibility surfaces are included. Illustrated heading margins, typography and relative positions are also compared.

Baseline capture mode records geometry without asserting the new acceptance policy. Its successful functional checks are not a claim that every baseline geometry assertion ran. Candidate assertion mode verifies frame/inset pairing, reachable long route labels, page overflow, real Map controls, selected-stop state, fallbacks and actual Appearance-picker transitions.

### Intentional Editorial difference

The shared time renderer displays the localized floating label `Time TBD` in place of Editorial's former raw `TBD`. The strict start contract also excludes malformed starts from Trip current eligibility across all appearances; the separate fixed-clock test covers those cases. Source data, end parsing and Now's existing parser policy are preserved.

| Appearance | Baseline | Candidate |
| --- | --- | --- |
| Editorial Light | [Timeline](editorial-light-timeline-baseline.png) | [Timeline](editorial-light-timeline-candidate.png) |
| Editorial Dark | [Timeline](editorial-dark-timeline-baseline.png) | [Timeline](editorial-dark-timeline-candidate.png) |

### Unchanged representative captures

Each image below has identical baseline and candidate PNG bytes; one copy is retained.

| Appearance | Shared timeline | Route | Transport |
| --- | --- | --- | --- |
| Storybook | [Timeline](storybook-timeline.png) | [Route](storybook-route.png) | [Transport](storybook-transport.png) |
| Risograph | [Timeline](risograph-timeline.png) | [Route](risograph-route.png) | [Transport](risograph-transport.png) |
| Vintage Watercolor | [Timeline](vintage-watercolor-timeline.png) | — | [Transport](vintage-watercolor-transport.png) |

Independent review caught the h3-to-h2 default bottom-margin change in Risograph. Its explicit `1em` title margin restores the measured baseline 24.8px and the original timeline position while keeping the common h2 semantics.

## Reproduce

Create a separate checkout pinned to the baseline commit. Run the candidate's harness with the baseline served through `TRAVEL_LITE_TEST_SITE_ROOT`; keep output directories separate.

```sh
git worktree add --detach ../travel-lite-116-baseline 897454280487873505eea3dcab8a7046d85c07de

TRAVEL_LITE_TEST_SITE_ROOT=../travel-lite-116-baseline \
TRAVEL_LITE_116_SOURCE_SHA=897454280487873505eea3dcab8a7046d85c07de \
TRAVEL_LITE_116_CAPTURE_ONLY=1 \
npx playwright test tests/issue116-role-geometry.spec.mjs --project=chromium \
  --grep '#116 role geometry' --output=/tmp/tlt116-before

TRAVEL_LITE_116_SOURCE_SHA="$(git rev-parse HEAD)" \
npx playwright test tests/issue116-role-geometry.spec.mjs --project=chromium \
  --output=/tmp/tlt116-after

node --test tests/*.test.mjs
npm run test:integrity
TRAVEL_LITE_FULL_STYLE_QA=1 npm run test:mobile
```

Use the same browser/dependency versions and fixture settings for a meaningful comparison. Preserve reports from failed attempts as well as the final pass. Real iOS/Android, assistive-technology sessions and real calendar-application imports require separate evidence; these Chromium captures do not mark those historical gaps complete.
