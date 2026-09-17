# Timezone semantics

Travel Lite supports multi-country trips without adding a timezone planner UI.

The shared itinerary still stores local wall-clock dates/times. Timezone metadata tells the runtime how to interpret those wall-clock values as absolute instants for `Now`, previous/current/next, progress, and the header clock.

## Resolution order

```text
item.timezone
→ day.timezone
→ trip.timezone
```

All timezone values should be IANA identifiers supported by `Intl.DateTimeFormat`, for example:

- `Asia/Taipei`
- `Europe/Amsterdam`
- `Atlantic/Reykjavik`
- `Europe/Prague`
- `Europe/Vienna`

Invalid or absent narrower overrides fall back to the next level.

## Schema examples

Trip-level default:

```json
{
  "trip": {
    "timezone": "Europe/Amsterdam"
  }
}
```

Day override:

```json
{
  "date": "2026-08-25",
  "timezone": "Asia/Taipei",
  "items": []
}
```

Item override:

```json
{
  "date": "2026-09-03",
  "timezone": "Atlantic/Reykjavik",
  "items": [
    {
      "start": "19:40",
      "title": "Arrival-side appointment",
      "timezone": "Europe/Amsterdam"
    }
  ]
}
```

## Interpretation rules

- `day.date` is interpreted in `day.timezone` when present, otherwise `trip.timezone`.
- an item's `start` / `end` are interpreted in the item's effective timezone.
- valid `HH:MM` items are compared as absolute instants; do not compare wall-clock strings from different zones directly.
- `TBD` / missing times stay floating and never participate in current-time calculations.
- a selected Trip/Map day displays its local clock using the day timezone.
- Now uses the effective timezone of the current trip day.

## Cross-zone transport

The base schema does not try to model a flight as one editable timezone-conversion object.

Prefer source-faithful itinerary entries such as:

```text
Day 1 · Asia/Taipei
23:10 depart TPE

Day 2 · Europe/Amsterdam
07:40 arrive AMS
```

If one day's item genuinely uses a different local clock, use `item.timezone` explicitly.

Do not invent arrival times, convert flight schedules, or infer timezone overrides from place names at runtime.

## Runtime implementation

The base template uses `Intl.DateTimeFormat(..., { timeZone })` with IANA timezone names. `Temporal` is not required because browser support is still less universal than `Intl.DateTimeFormat`.

The runtime converts local wall-clock values to absolute instants before evaluating:

- previous / scheduled-now / next
- trip-day rollover
- progress
- selected-day clock

Nonexistent local times around DST changes are treated as invalid timed entries rather than silently shifted to another clock time.

## Non-goals

- timezone picker/editor UI
- automatic timezone discovery
- live flight status
- flight duration/conversion calculator
- changing the itinerary based on the device timezone
- backend/shared synchronization

## Validation

Changes to timezone behavior should cover:

1. legacy trip with only `trip.timezone`
2. day override
3. item override
4. untimed/TBD item exclusion
5. date rollover between different countries
6. a multi-country fixture such as Tina
7. Taiwan → Europe departure/arrival boundary behavior

Keep fixture-specific data outside the base template.