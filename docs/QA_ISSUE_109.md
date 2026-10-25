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
