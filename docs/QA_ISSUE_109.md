# Issue #109 — source item-ID integrity / fail-closed cross-link QA

**Scope:** a deliberately malformed *copy* of Tokyo trip.json (Senso-ji shares Shibuya's `d1-shibuya`), cross-day/same-day/non-Places cases and the unchanged unique-ID control. Published `trip.json` was not modified.

## Deterministic policy

The boot-time audit compiles all `days[].items[]` records, regardless of item type, after the existing missing/empty-ID fallback and before any identity-based consumer renders. Duplicate ID diagnostics include only the public ID and all original source paths; invalid IDs list paths without titles, reservations or private payloads. The publishing CLI `npm run test:integrity -- path/to/trip.json` uses the same audit and exits nonzero for invalid/duplicate IDs.

Ambiguous IDs **do not identify a unique visit**. Places list preserves every source-faithful card, but ambiguous cards are non-clickable and carry a publisher correction notice. An ambiguous/unknown ID-only `#places/item/ID` deep link displays a warning, not the first Place's detail. Trip skips ambiguous Place detail buttons. Map stop chips and markers with ambiguous IDs are disabled; `#map/day/DATE/stop/AMBIGUOUS_ID` does not select another item, link to another operator, or mark the wrong stop active. More still shows the original unedited reservations/files; Places/Transport do not project them onto an ambiguous ID (including `itemIds[]`). Unique IDs keep existing links/actions.

## Actual browser and Node evidence (2026-10-25, Chromium 153 on authorized Mac)

| Gate | Outcome |
| --- | --- |
| `node --test tests/*.test.mjs` | 61 PASS, 0 FAIL |
| `npm run test:integrity` | PASS on published Tokyo fixture; duplicate CLI fixture exits 1 with paths only |
| `npm run test:packs` | 15 PASS |
| `npx playwright test tests/issue109-identity.spec.mjs tests/places-transport.spec.mjs --project=chromium` | 28 PASS on the 11-test ID suite and 17 existing Places/Transport checks; later extra HTML-escaping test passed separately |
| `npm run test:mobile` | 267 PASS, 16 opt-in matrix tests intentionally skipped; 0 FAIL |
| Opt-in 16 appearances × 5 tabs × 3 widths | 16/16 suites, 240/240 real tab/viewport smoke states PASS (not owner visual sign-off) |

**Real Chromium screenshots (synthetic public fixture; 320/390/1100 widths):**

- [320px Places list source warning with both original venue cards](qa-issue109/duplicate-places-list-320.png)
- [320px ambiguous ID-only Place deep link: warning, no Shibuya/Senso-ji detail](qa-issue109/duplicate-id-deeplink-320.png)
- [320px Transport ambiguous stop warning](qa-issue109/ambiguous-transport-320.png)
- [390px Transport ambiguous stop warning](qa-issue109/ambiguous-transport-390.png)
- [1100px Transport ambiguous stop warning](qa-issue109/ambiguous-transport-1100.png)

## Release boundary

Code/Node/Chromium developer QA is not independent Agent code review, merged deployment, GitHub Pages verification or owner Human Review. Keep #109 Open, and keep PR Draft / `Refs #109` until review. No automated ID renumbering, data editing, new tab or changes to A4/A5/ICS.


## Personal-decision review repair — 2026-10-31

The independent review's residual ID-collision blocker is repaired. Device-only selections are read/rendered only for an audited unique valid item ID. The mutation handler independently resolves that ID and checks the source is still personal, unresolved and contains the requested option. Duplicate/invalid/unknown IDs and stale controls cannot save or project a preference. Existing local selections are preserved; published shared/resolved decisions remain readable. Prototype-shaped IDs are treated as own data.

A source audit found no additional per-itinerary-item personal preference read/write outlet outside runtime-handoff.js; companion-ux.js hydrates the whole stored map only. Its generic copy cleanup now preserves the explicit localized unavailable warning. Actual screenshot review caught that cleanup initially overwriting the explanation; the regression now asserts the publisher guidance text as well as disabled controls.

Executed on the authorized Mac:

- Original runtime + new collision regression: **FAIL as expected**, confirming the missing fail-closed personal state.
- `node --test tests/*.test.mjs`: **61 PASS / 0 FAIL**.
- `TRAVEL_LITE_TEST_PORT=4437 npx playwright test tests/issue109-identity.spec.mjs tests/places-transport.spec.mjs --project=chromium`: **38 PASS / 0 FAIL** after the repair (nine new cases).
- Cases cover a persisted valid selection followed by a newer cross-day collision, no false selection on either day, zero stale-handler writes, unique-ID persistence, malformed/generated fallback IDs, source resolutions, unknown options, and own-property storage.
- Real warning screenshots were inspected at [320px](qa-issue109/personal-collision-320.png), [390px](qa-issue109/personal-collision-390.png), and [1100px](qa-issue109/personal-collision-1100.png).
- Service Worker cache is `shell-v46-personal-decision-identity` under the existing site prefix.

Full regression, renewed independent review and Pages verification are recorded on PR #117. These are Agent checks, not owner Human Review; #109 remains open until its post-deployment owner acceptance. Published trip.json and export/ICS behavior are unchanged.
