# Issue #120 — route occurrence regression evidence

This directory records **developer self-tests** for [#120](https://github.com/world4jason/Travel-lite-Template/issues/120). Independent code / visual review and owner acceptance remain separate gates. No merge, issue closure or Pages deployment is claimed.

## Versions and result

- Baseline: `66aa14683cb890eea4d9e50684cc406ea2eaa652`.
- Published code candidate: [`471d287eacf69d4dc825dbdb76eef83e5c03801a`](https://github.com/world4jason/Travel-lite-Template/commit/471d287eacf69d4dc825dbdb76eef83e5c03801a).
- Code/test tree: `e0ee6706f983b82f7b0bdde6a1e94eb2b70bb2eb`. The final evidence commit adds only this documentation directory; it does not alter runtime or tests.
- Focused Chromium suite on the published candidate: **33 PASS / 0 FAIL / 0 skipped / 0 retries / 0 flaky**, 39.3 seconds.
- Baseline proof: the same spec's four representative appearance cases **FAIL** at the first explicit `Alpha → Beta → Alpha` assertion. Each reports two stops, `Start Alpha / End Beta`, and zero ordered route-step nodes. These are expected bug reproductions, not acceptance passes; those tests stop before their later cases.
- [browser-evidence.json](./browser-evidence.json) retains the source fixtures, all focused test outcomes and observations, text/rail geometry, source SHA, environment and screenshot hashes. The original published `trip.json` is read and checked without modification.

## Complete validation and #122 comparison

| Gate | Result |
| --- | --- |
| New route Node regression | **22 PASS**; identical tests on baseline: **6 PASS / 16 FAIL**. |
| All Node tests, including Style Generator | **107 PASS / 0 FAIL**. |
| Focused route Chromium | **33 PASS**, including all 16 appearances. |
| Complete Chromium with `TRAVEL_LITE_FULL_STYLE_QA=1` | **361 PASS / 5 FAIL / 366 total**, 0 skipped, 0 retries, 0 flaky; 490.3 seconds. This is not an all-green suite. |
| Existing #109 / #111 regressions | **21/21** and **18/18 PASS** in the complete suite. |
| Existing style semantic parity / full surface matrix / text zoom | **16/16**, **16/16** (240 internal view/width states), **32/32 PASS**. |
| Export launcher / Vintage A5 / storage | **9/9**, **2/2**, **7/7 PASS** in the complete suite, including A4/A5/ICS and real SW offline reload. |
| Published source / syntax / Style Briefs | Integrity **PASS**, changed and core JS syntax **PASS**, JSON parse **PASS**, Style Brief validation **12 PASS**. |
| Cross-site `test:style-parity` | **NOT RUN**: the preflight requires `MEGAN_LOCAL_REPO`; no Megan-trip checkout or cross-site publication is part of this PR. The separate 16-appearance Chromium semantic-parity suite above did run. |

[validation-results.json](./validation-results.json) records every complete-suite test outcome and the matching baseline errors. The five failures were rerun on the unchanged baseline with the **same Chromium, font configuration, test file and assertions**. All five reproduce with identical failure messages:

| Existing `mobile-layout.spec.mjs` test | Baseline | Candidate | Separate owner |
| --- | --- | --- | --- |
| `page shell reflows at 320x568` | FAIL | FAIL | #122: long Map date-chip centre remains outside viewport. |
| `light theme reflows at 320x568` | FAIL | FAIL | #122: same Map date-chip reachability check. |
| `dark theme reflows at 320x568` | FAIL | FAIL | #122: same Map date-chip reachability check. |
| `Map fallback keeps controls reachable when MapLibre cannot load` | FAIL | FAIL | #122: same date-chip reachability check. |
| `enlarged text keeps core read-only views inside a 320px shell` | FAIL | FAIL | #122: More 200% text, viewport/html/body widths **320 / 320 / 346px**. |

The Map failures concern the existing chip-centre reachability assertion; they do **not** establish that visible portions of the date chips cannot be clicked. No existing assertion was weakened, skipped or removed. More/Map CSS and their runtime code are untouched.

The complete run began on local commit `4e860109de768d9ddbe0939205b7bae2bd3730dc`. Publication through the GitHub connector generated new commit metadata; both commits have the identical full tree `e0ee6706f983b82f7b0bdde6a1e94eb2b70bb2eb`, verified with Git. The focused 33-case run and its saved screenshots were then repeated against the publicly reachable `471d287e...` candidate. This preserves the actual execution history rather than relabelling old screenshot metadata.

The published `trip.json` has no diff from baseline and retains SHA-256 `f238c3cd42d96a1b95b97d4ad14a914cc2c9827cc4735bbf8e15e0f93515732d`.

## Coverage

| Area | Actual exercised cases |
| --- | --- |
| Same source sequence in every appearance | 16 appearances × explicit and item-fallback `A → B → A` and `A → A → B`. Day endpoints, stop count and every numbered route step are compared to literal expected visits. |
| Trip / Now parity | Trip day, Trip overview, fully untimed Today Brief main route and the wide right rail. The existing overview first-five-plus-ellipsis presentation is retained and tested separately from the complete day/Now sequence. |
| Source priority | Empty array and non-array summary use items; a nonempty all-invalid/blank explicit array remains authoritative; mixed string/label/title entries, single stop, unique stops and more-than-five occurrence controls. Node projection tests provide the broader type/normalization matrix. |
| All-TBD day | Every fixture item remains floating. Trip has no current/timed item. Now retains all source item titles and order, with previous/current/next cleared and no later timed window. |
| Source preservation | In-memory day data and the cached snapshot equal the synthetic source after navigation; the published file's bytes remain unchanged. |
| Long mixed-language labels | Editorial Light/Dark, Storybook, Risograph and Vintage Watercolor at 320×568, 390×844 and 1100×900; Editorial additionally at 1600×900 for the complete Now right rail. |
| Readability and reachability | Endpoint/Now text wraps without ellipsis or line clamping; html/body stay within the viewport. The scroll rail accepts real Shift+Tab → Tab traversal and ArrowRight, passes visible-position hit testing, and exposes both ends of every label when scrolled. No test-only tabindex or style repair is injected. |

The test fixture is intentionally all-TBD and uses distinct item IDs. Explicit summaries use different fallback labels, so a priority regression cannot accidentally pass from equal source strings. External providers are blocked; route projection does not depend on their availability.

## Environment and reproduction

The recorded run uses Linux, Playwright **1.63.0**, Chromium **153.0.8010.0**, browser locale `en-US`, browser timezone `UTC`, trip timezone `Asia/Tokyo`, reduced motion, and a deterministic source-day clock at 10:30. Service workers and remote fonts/providers are blocked. System Latin fallback fonts plus local Noto Sans TC / Noto Serif TC Regular/Bold provide CJK glyph coverage. No application CSS or fonts were changed for the captures.

Standard repository reproduction:

```bash
npm install
npx playwright install chromium
TRAVEL_LITE_120_SOURCE_SHA=<candidate-sha> \
  npx playwright test tests/issue120-route-summary.spec.mjs --project=chromium
```

The execution environment could not use the default Playwright browser installation, so the recorded command uses a local, untracked runtime adapter pointing at the cached Chromium binary and fontconfig file. It preserves the repository's tests and assertions:

```bash
TRAVEL_LITE_TEST_PORT=4412 \
TRAVEL_LITE_120_SOURCE_SHA=471d287eacf69d4dc825dbdb76eef83e5c03801a \
TRAVEL_LITE_120_FONT_PROFILE='system Latin fallbacks; local Noto Sans TC / Noto Serif TC Regular+Bold; remote fonts blocked' \
ISSUE120_OUTPUT_DIR=/tmp/issue120-browser-published \
ISSUE120_JSON_REPORT=/tmp/issue120-browser-published-results.json \
node_modules/.bin/playwright test \
  --config=../issue120.playwright.config.mjs \
  tests/issue120-route-summary.spec.mjs --project=chromium
```

Complete suite and static commands actually executed:

```bash
node --test --test-isolation=none tests/*.test.mjs style-generator/tests/*.test.mjs
npm run test:integrity
npm run validate:styles
mkdir -p test-results
TRAVEL_LITE_TEST_PORT=4413 TRAVEL_LITE_FULL_STYLE_QA=1 \
  TRAVEL_LITE_120_SOURCE_SHA=4e860109de768d9ddbe0939205b7bae2bd3730dc \
  TRAVEL_LITE_120_FONT_PROFILE='system Latin fallbacks; local Noto Sans TC / Noto Serif TC Regular+Bold; remote fonts blocked' \
  ISSUE120_OUTPUT_DIR=/workspace/scratch/58f4bd790df2/issue120-full-results \
  ISSUE120_JSON_REPORT=/workspace/scratch/58f4bd790df2/issue120-full-results/results.json \
  npm run test:mobile -- --config=../issue120.playwright.config.mjs
```

The Node CLI child-process test and Chromium require normal subprocess/localhost access. An initial sandbox-only attempt could not launch these processes; the recorded final runs used the approved execution mode without changing assertions. The adapter selects the existing browser executable and local fontconfig; it does not disable web security or site isolation. The repository itself adds no dependency, browser flag or font configuration.

For baseline reproduction, serve an isolated checkout of the baseline through `TRAVEL_LITE_TEST_SITE_ROOT`, set its SHA and separate output paths, and use the same spec with:

```bash
--grep 'ordered return and consecutive visits: (editorial-light|storybook|risograph|vintage-watercolor)$'
```

The initial diagnostic run passed 32 cases before a local CJK fallback font was configured. Its tofu-glyph screenshots are deliberately excluded. Final evidence is from the 33-case candidate run above and the matching-font baseline.

## Original screenshots

These are direct Chromium PNGs. Viewport captures retain the phone navigation/context; component captures expose the complete route text when it exceeds a single phone screen. Horizontal rails deliberately show only their currently scrolled portion; the JSON records reachability of every visit and both label ends.

| Screenshot | What to inspect |
| --- | --- |
| [Before: Editorial return, 390px](./images/before-return-editorial-390.png) | Baseline incorrectly says two stops and End Beta. |
| [After: Editorial return, 390px](./images/after-return-editorial-390.png) | Three numbered visits and End Alpha. |
| [After: Storybook return, 390px](./images/after-return-storybook-390.png) | Same occurrence sequence in Storybook. |
| [After: Risograph return, 390px](./images/after-return-risograph-390.png) | Same occurrence sequence in Risograph. |
| [After: Vintage return, 390px](./images/after-return-vintage-390.png) | Same occurrence sequence in Vintage Watercolor. |
| [Long Trip: Editorial, 320px viewport](./images/after-long-trip-editorial-320.png) | Wrapped endpoints, complete count and focused rail above the fixed navigation. |
| [Long rail: final label's right edge, 320px component](./images/after-long-rail-end-editorial-320.png) | The final label's suffix is reachable by horizontal scrolling. |
| [Long Now: Editorial, 320px component](./images/after-long-now-editorial-320.png) | All four labels remain in order, including consecutive and returning occurrences. |
| [Long Trip: Storybook, 390px viewport](./images/after-long-trip-storybook-390.png) | Long endpoints and the same focused rail in the illustrated layout. |
| [Long Now: Storybook, 390px viewport](./images/after-long-now-storybook-390.png) | The main route wraps normally and retains all visits. |
| [Long Now: Editorial Dark, 320px component](./images/after-long-now-editorial-dark-320.png) | The same source-faithful route in dark appearance. |
| [Long Now: 1600px desktop viewport](./images/after-long-now-editorial-1600.png) | Main Today Brief and the contextual right rail agree. |

## Separate known issues and remaining gates

[#122](https://github.com/world4jason/Travel-lite-Template/issues/122) already tracks More's 200% text clipping and the Map long-date-chip/reachability issues. This change does not modify those areas or their assertions. Full-suite outcomes must list them separately; focused #120 passes do not imply #122 is resolved.

Independent code / visual review is **pending**, including assessment of these original screenshots against the candidate SHA. Live Pages verification is **not run for this unmerged candidate**. No prior visual acceptance is transferred to this change.

### Handoff to independent ChatGPT review

Review #120 against the published code candidate and the PR head's evidence-only delta. Inspect both route projections, priority and filtering controls, raw-source preservation, stop counts/endpoints and Now's all-TBD behavior. Review the original before/after and long-text screenshots plus actual browser observations. Assess #122's five matching baseline failures separately. Development self-checks in this record are not the independent code/visual review, owner acceptance, a merge authorization or an instruction to close either issue.
