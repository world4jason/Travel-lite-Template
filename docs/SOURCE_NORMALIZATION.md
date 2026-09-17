# Source normalization for vibe-generated trips

This document is for LLM/coding agents converting planning results, spreadsheets, PDFs, booking notes, existing trip sites, or chat transcripts into `trip.json`.

The goal is **source-faithful compression**, not replanning. Preserve useful structure that already exists in the source and avoid replacing it with generic summaries.

## Core rule

Prefer explicit source information over model inference.

When two source fields disagree, preserve the conflict as a reminder/TBD/note rather than silently choosing one unless the user has already resolved it.

Do not invent:

- times
- transfer durations
- route modes
- booking status
- URLs
- coordinates
- timezone conversions
- resolved decisions

## `day.routeSummary` extraction priority

When generating `day.routeSummary`, use this order:

```text
1. explicit source route / route chain
2. source subtitle / structured route field
3. ordered itinerary item route labels or titles
4. day title only as a last-resort fallback
```

Stop at the first source that already expresses a useful route/order. Do not blend lower-priority guesses into a better explicit route.

### 1. Explicit source route / route chain

If the source already contains something like:

```text
Melk → Danube cruise → Dürnstein → Vienna
```

preserve that order:

```json
{
  "routeSummary": ["Melk", "Danube cruise", "Dürnstein", "Vienna"]
}
```

Do not replace it with the day title `Wachau Valley day trip`.

### 2. Subtitle / structured route field

If the source has a route-like subtitle but no dedicated route field:

```text
Rome → Montepulciano → Pisa
```

use that before inspecting item titles.

If the subtitle is descriptive rather than route-like, for example:

```text
Morning museum, afternoon free
```

do not force it into route stops. Continue to ordered items instead.

### 3. Ordered item labels/titles

If the source gives only an ordered list:

```text
Vatican / St. Peter's
Spanish Steps free time
Rome hotel
```

compress the already-published order into a human-readable route:

```json
{
  "routeSummary": ["Vatican", "Spanish Steps", "Rome"]
}
```

Preserve source order. This is not route optimization.

Prefer an explicit `item.routeLabel` when the raw item title is too operational or verbose.

Example:

```json
{
  "title": "DDSG blue booth: exchange voucher and queue",
  "routeLabel": "Danube cruise"
}
```

### 4. Day-title fallback

Use the day title only when no useful route/order exists.

Do not repeat the same generic day title as multiple route stops.

## Concision rules

A route summary is for overview scanning, not a second timeline.

Prefer:

```text
Haneda → Shibuya → Ebisu
```

over:

```text
Arrive at Haneda Airport → pick up IC card → train into Tokyo → hotel check-in → Shibuya Crossing → dinner in Ebisu
```

Guidelines:

- prefer place/area/activity labels over operational instructions
- preserve important named transfers only when the source treats them as meaningful itinerary waypoints
- avoid duplicate adjacent stops
- keep source spelling/language unless normalization is clearly harmless
- do not geocode or query routing services merely to populate `routeSummary`

## Relationship to other fields

`routeSummary` is not a substitute for:

- `items` — detailed published itinerary
- `transferAfter` — stable, pre-researched transition context
- `decision` — unresolved choices
- `day.reminders` — operational reminders
- Google Maps/transit apps — live routing and current timing

A dense transit day may have a concise route summary while keeping platform numbers, transfer warnings, and live-timing reminders in the detailed items.

## Validation examples

Real-trip fixture expectations:

### Dense transit day

Source meaning:

```text
Melk → Danube cruise → Dürnstein → Vienna
```

Expected overview route:

```json
["Melk", "Danube cruise", "Dürnstein", "Vienna"]
```

The detailed timeline still retains trains, ticket exchange, bus, platform, and fallback-boat information.

### Group-tour day

Source gives an ordered day plan without precise times:

```text
Vatican
Spanish Steps
Rome
```

Expected overview route:

```json
["Vatican", "Spanish Steps", "Rome"]
```

Do not invent departure times or transit between them.

## Agent checklist

Before writing `routeSummary`, ask:

1. Is there already an explicit route in the source?
2. Is the subtitle actually route-like?
3. If not, what order did the source publish the items in?
4. Can verbose operational titles be shortened safely with `routeLabel`?
5. Am I preserving source order rather than optimizing it?
6. Did I accidentally invent a transfer, duration, or place?

If uncertain, omit `routeSummary`; the UI can derive a simple display from item titles. A missing summary is safer than a fabricated one.
