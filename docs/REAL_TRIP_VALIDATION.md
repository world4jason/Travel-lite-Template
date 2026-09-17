# Real-trip validation workflow

Travel Lite uses realistic trips to pressure-test the generic template, but **fixture data must stay outside this repository**.

The base template should change only after a realistic fixture exposes a reusable problem, that problem has its own GitHub issue with acceptance criteria, and the generic fix passes the relevant fixtures.

## Why fixtures stay external

Real itineraries may contain personal travel details, booking context, family-specific reminders, or temporary experiments that do not belong in an open-source template.

Do not commit:

- Tina/Italy fixture data
- converted personal itineraries
- fixture screenshots/reports unless explicitly requested for permanent docs
- test-only fixed clocks
- fixture-specific UI branches

The fixture workflow is an **external validation harness**, not product content.

## Build an isolated fixture

Use the stdlib-only helper:

```bash
python3 tools/build_fixture.py \
  /absolute/path/to/external/trip.json \
  /tmp/travel-lite-fixture
```

The builder:

1. validates the external `trip.json`
2. reads the current `sw.js` `CORE` list
3. copies the current runtime assets into the external output directory
4. replaces only the copied `trip.json`
5. keeps the original repository untouched

It refuses to write the generated fixture inside this repository.

Preview the result:

```bash
python3 -m http.server 8000 --directory /tmp/travel-lite-fixture
```

Then open `http://localhost:8000`.

## Historical day-of testing

To test a real past/future itinerary at a specific instant, inject a fixed clock into the **fixture copy only**:

```bash
python3 tools/build_fixture.py \
  /absolute/path/to/external/trip.json \
  /tmp/travel-lite-fixture \
  --now 2026-09-19T11:25:00Z
```

`--now` inserts a fixture-only `Date` shim before `bootstrap.js` in the copied `index.html`.

Never copy that shim back into the template.

Use an ISO-8601 instant with an explicit offset or `Z` so multi-timezone tests are unambiguous.

## Required viewport matrix

For reusable shell/UX changes, validate all three compositions:

```text
390 × 844    phone
1100 × 900   compact desktop / tablet landscape
1600 × 900   wide desktop
```

A responsive change is not accepted merely because it works at one phone and one desktop size.

Also test at least one live resize sequence when state matters:

```text
390 → 1100 → 1600 → 390
```

Selected day, theme, deep-link context, and device-local state should remain coherent.

## Required scenario matrix

Maintain external fixtures that collectively cover these cases.

### Dense timed day

Use a day with multiple timed stops/transfers.

Verify:

- previous / Scheduled now / next
- early/delayed reference usefulness
- transfer context
- reminders
- compact item actions
- Map selected stop

### Fully untimed day

Use a group-tour/flexible day with published stop order but no reliable times.

Verify:

- Today Brief appears
- no synthetic time is displayed
- source order is preserved
- route summary is useful
- reminders/weather/handoff remain available

### Mixed timed + floating/TBD day

Verify:

- normal timed Now window remains
- floating/TBD item does not become current or midnight
- floating item remains visible under Flexible today / Trip

### Multi-timezone boundary

Use at least one trip that crosses countries/timezones.

Verify:

- `item.timezone → day.timezone → trip.timezone`
- departure/arrival ordering is based on absolute instants
- selected-day clock uses that day's timezone
- date rollover does not assign an event to the wrong trip day

### Long-trip navigation

Keep at least:

- one 10+ day fixture
- one 30+ day fixture

Verify mobile compact navigation, deep-link restore, Overview access, Today access when relevant, and desktop persistent day rail.

### Map / Check / offline / deep links

Across the fixture set, also cover:

- numbered read-only Map markers
- selected stop and Google Maps handoff
- checklist persistence behavior
- network vs offline-copy status when testable
- direct links such as `#trip/day/<date>` and `#map/day/<date>/stop/<id>`

## Current reference fixture shapes

The current external validation set includes two useful shapes:

### Italy-style fixture

- about 10 days
- group-tour / order-first days
- multiple fully untimed days
- Taiwan ↔ Europe boundary

Useful for Today Brief, source-order route summaries, moderate-length mobile navigation, and timezone-boundary checks.

### Tina-style fixture

- about 30+ days
- dense multi-transfer days
- group-tour sections with no fixed times
- multiple European countries plus Taiwan/Iceland
- source conflicts and operational reminders

Useful for dense Now windows, long-trip navigation, timezone overrides, TBD/fallback entries, and source-faithful route summaries.

These descriptions are generic fixture categories. The personal fixture files themselves remain external.

## Issue-first rule

When a fixture exposes a generic problem:

```text
real fixture
    ↓
reproduce generic gap
    ↓
open GitHub issue
    ↓
define scope / non-goals / acceptance criteria
    ↓
implement on an isolated branch
    ↓
re-run relevant fixtures
    ↓
code + web/browser review
    ↓
merge only if generic
```

Do **not** fix the problem directly in `main` just because a fixture looks awkward.

A fixture-specific preference is not automatically a template requirement.

## Ticket/PR hygiene

Each generic issue should be small enough to review independently. GitHub recommends breaking larger work into smaller issues/tasks so the resulting pull requests remain manageable.

For each ticket:

- change only the accepted scope
- explicitly list non-goals
- attach fixture validation results to the PR description
- avoid unrelated cleanup
- close the issue only after merge and post-merge verification

If validation discovers another independent gap, open a new issue rather than expanding the current PR.

## Privacy guardrail

`tools/build_fixture.py` intentionally refuses output directories inside the repository.

Still review fixture data before using external/public hosting. A generated fixture can contain whatever was present in the supplied `trip.json`, including sensitive data. Prefer local `/tmp` output for private itineraries.
