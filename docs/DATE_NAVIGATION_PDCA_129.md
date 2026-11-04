# Unified Date Navigation — PDCA / Issue #129

Date: 2026-11-04. Scope: template UI. State: **P gate complete; D in progress; human review pending**.

## P — Problem and choice

Observed on an eleven-day Kansai fork:
- Trip uses the eight-day threshold native select and prev/next controls.
- Transport maps the same days as horizontally scrolling chips.
- Places has a separate All days filter and per-view date storage.
This is an interaction inconsistency, not a trip data problem.

**Selected: shared pure navigation model + thin per-view adapters**. A single date controller owns date
labels, validation, mobile nav, accessible buttons/select, Today and Overview affordances.
`state.selectedDate` plus the existing `ui:selectedDate` device-only store is the sole chosen **date**.
View-specific modes (Trip Overview/day, Places All/day) do not erase the chosen date.
Transport has no overview and reuses that chosen date. No additional transit/places records are created.

Rejected: moving one DOM node between live views (breaks rendering lifecycle and history);
CSS-only harmonization (does not resolve state/navigation semantics). No backend.

## State transitions (approved before implementation)

| Action | Shared date | Trip mode | Places mode | Transport |
| --- | --- | --- | --- | --- |
| First visit / no URL | stored valid date or trip-local today, else first day | Overview | All | the shared day |
| Choose day D in Trip | D | Day D | existing All or Day; if Day, display D | D |
| Choose day D in Places | D | existing Overview or Day; if Day, display D | Day D | D |
| Choose day D in Transport | D | existing Overview or Day; if Day, display D | existing All or Day; if Day, display D | D |
| Trip Overview | unchanged | Overview | unchanged | unchanged |
| Places All | unchanged | unchanged | All | unchanged |
| Tab switch | unchanged | preserve per-view mode | preserve per-view mode | display selected day |
| Explicit `#.../day/D` | D, if valid | Trip day if Trip link | Places day if Places link | D if Map link |
| Invalid day | unchanged | safe fallback | All for invalid Places link | safe existing day |

The old rule saying Places day filtering never affects Trip's selected date is **intentionally superseded**.
The Places local filter stores only All/Day **mode** after one-time migration of legacy `places:date`;
the day value itself is the shared `ui:selectedDate`. Device-only state is never presented as group sync.

## Backward compatibility / contracts

- Five tabs remain Now / Trip / Transport / Places / More.
- Desktop Trip sidebar remains the desktop day navigator. Mobile all three use one control.
- Trip Overview and Places All are different presentations, both intentionally retained.
- Dates without attractions may be selected in Places (legitimate empty state, not an invented place).
- Keep URL semantics `#trip/overview`, `#trip/day/D`, `#map[/day/D[/stop/ID]]`,
  `#places`, `#places/day/D`, `#places/item/ID`, `#check`.
- Back/Forward, reload, local storage, long trips, invalid IDs, older browse states,
  source labels and PWA offline cache remain safe.
- No changes to travel-leg contract (#104/#105), MapLibre routes, item IDs, or stored bookings.

## D — Change budget

New `date-navigation.js` and `date-navigation.css` shared component;
small changes in `trip-view.js` for cross-view shared-day synchronization,
`places-view.js` for selected-date/mode normalization, and minimal router hooks in `companion-ux.js`.
`index.html`/Service Worker registration, references and dedicated tests update.
Avoid changing data schemas, visual pack styles or unrelated components.

## C — Evidence matrix

Fixture days: 3, 11, 32; all-TBD; only some days with Places; invalid dates; duplicate IDs fail closed.
Check mobile 320/360/390, 1100/1600 desktop, 200% root type,
the 15 bundled style IDs (16 visible appearances including Editorial dark).
Verify all three nav widgets, click/keyboard/select, tab switches,
day persistence across reload, overview independence, URL deep links, back/forward,
offline static view and no duplicate visible date controls. Run existing Node, Playwright, integrity, style tests.
Capture mobile and desktop screenshots.

**Human review gates:** three distinct humans in three ordered rounds:
1. Frontend/interaction + accessibility;
2. Architecture/data/history + regression;
3. Product Owner final human visual acceptance.
GitHub reviewer identity, date, PASS/FAIL, evidence and fixes required in the PR.
Automated tests and AI review do not satisfy these human gates. PR must not be merged or Issue closed without them.

## A — Action

Resolve findings and rerun affected suite. Publish only after all human gates and Owner decision.
Record deployment and live GitHub Pages / PWA verification; otherwise state NOT RUN.
