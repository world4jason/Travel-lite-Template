# Companion UX contract

Travel Lite is a **post-planning travel companion**. Planning happens before the trip with people, an LLM, maps, spreadsheets, booking tools, or another planner. The deployed site should help travellers orient themselves and make small day-of decisions without becoming a planner.

## Mobile shell: travel context first

On phone widths, the header prioritizes the information a traveller needs immediately:

```text
trip / day context                         local trip time
```

Do not crowd the phone header with every utility control.

- local trip time remains persistent
- Share is available from **More** on phone
- network/offline freshness is available from **More** on phone
- Appearance remains under **More → Theme**
- desktop/tablet may keep richer header utilities where width permits
- these are composition changes only; they must not fork shared trip data or business logic

## Now: schedule reference, not location tracking

`Now` is based on the published itinerary. It does **not** claim the traveller has actually arrived at a stop.

The default day-of reference window is:

```text
previous scheduled item
current scheduled window
next scheduled item
```

This is intentionally useful when the group is early, delayed, or between activities. The UI says **Scheduled now** rather than implying real-world presence.

Additional context may include:

- the next two timed items
- floating/TBD items for today
- reminders
- weather

## Timed vs floating/TBD items

Only a valid local `HH:MM` `start` participates in current/previous/next time calculations.

These are floating/TBD and must not be treated as 00:00 or as the current activity:

```json
{ "start": "TBD" }
```

or an item with no `start`.

Floating items remain visible in Trip and in the Now **Flexible today** section.

## Today Brief fallback

Some itineraries intentionally contain a day/order plan without reliable clock times, especially group tours or flexible days.

If the current trip day has itinerary items but **zero valid timed items**, `Now` switches from previous/current/next to a read-only **Today Brief**:

```text
TODAY · DAY 6
Vatican → Spanish Steps → Rome

1  Vatican / St. Peter's
2  Spanish Steps free time

No fixed times in this itinerary.
```

Rules:

- preserve the published order; never synthesize times
- prefer `day.routeSummary`, otherwise derive a simple order from existing item labels
- keep reminders, weather, map/specialist handoff, decisions, and info cards available
- do not show yesterday/tomorrow timed entries as if they were today's previous/next window
- mixed days with at least one timed item stay on the normal previous/scheduled-now/next model; untimed entries remain under **Flexible today**
- this is presentation only, not a planning mode

## Shared decisions

A shared `decision` is informational until `resolvedOptionId` exists in shared `trip.json`.

Traveler-facing UI should use plain language such as:

- `Not decided yet`
- `My preference · this device only`

Do not show implementation instructions such as “update trip.json” in the travel UI. Keep those instructions in agent/developer documentation.

## Context-sensitive wide rail

The wide-desktop right rail should add useful context instead of duplicating the main view.

Recommended composition:

| Main view | Right rail |
| --- | --- |
| Now | previous/current/next, reminders, weather; or Today Brief context on a fully untimed day |
| Trip overview | trip stats, open decisions, reservations |
| Trip day | weather, reminders, day reservations, unresolved decisions |
| Map | selected stop details and specialist links |
| Check | completion summary and important incomplete items |
| More | device/offline freshness |

Do not repeat the entire day timeline in the rail.

## Map: read-only spatial reference

The map exists to answer “where are today’s planned stops relative to each other?”

Default marker semantics:

- numbered in itinerary order: `1`, `2`, `3`, ...
- selected marker visually emphasized
- Google Maps handoff remains available

Do not add route optimization, transport-mode editing, live re-routing, or place discovery to the base template.

If a fork has trusted route geometry prepared before deployment, it may display it. Do not fabricate real road/transit geometry from straight lines and present it as routing.

## Offline freshness

The app may load `trip.json` from network or fall back to its IndexedDB snapshot.

Traveler-facing status should distinguish:

```text
Online · updated <time>
Offline copy · updated <time>
```

Recommended shared metadata:

```json
{
  "trip": {
    "updatedAt": "2026-09-17T16:10:00+08:00",
    "revision": "trip-2026-09-17-03"
  }
}
```

`updatedAt` describes the published shared itinerary, not the time one device changed a checklist.

## Share and deep links

Sharing should work without a backend:

- prefer Web Share API when available
- otherwise copy the current URL
- preserve current context in the URL hash

Supported deep-link shapes may include:

```text
#now
#trip/overview
#trip/day/2026-10-04
#map/day/2026-10-04/stop/d2-ueno
#check
#more
```

Deep links select an existing read-only view; they are not edit/share-session links.

## Responsive map

On phone, Map may use most of the remaining viewport and place selected-stop details below it like a lightweight bottom sheet. On wider screens, the map shares space with persistent trip/context rails.

For the mobile shell:

- use dynamic viewport height rather than a fixed tall card
- normal portrait phones should keep a useful map without forcing a 480px minimum
- short-height/landscape mobile-shell layouts may reduce the map toward ~220px so selected-stop details remain reachable
- selected-stop content stays below the map rather than being permanently overlaid on it
- shell classification for very wide phone landscape is a separate responsive concern; do not solve it by distorting Map geometry

Collapse context panels before squeezing the map into an unusably narrow area.

## Icons

Use a small consistent inline-SVG icon set for shell/navigation/handoff controls. Avoid mixing unrelated emoji, glyph fonts, and text symbols for primary navigation.

Trip data may still contain meaningful emoji/icons in user-authored highlights when desired.

## Locale and labels

The base template supports a small shell-label strategy, not a full translation framework.

```json
{
  "ui": {
    "locale": "zh-TW",
    "labels": {
      "navNow": "現在",
      "navTrip": "行程"
    }
  }
}
```

Built-in shell labels currently cover English and Traditional Chinese. `ui.labels` may override individual shell/companion labels for a generated trip.

Do not duplicate the itinerary itself per locale unless a fork explicitly needs multilingual trip content.

## Explicit non-goals

Do not add these to the base template:

- itinerary creation/editing UI
- drag/drop or reorder
- route optimization
- live transit engine
- booking editor
- expense editor
- place search/discovery
- generic recommendations
- collaboration/chat/polls
- cross-device sync
- undo/redo planner state

Those belong in the pre-trip planning workflow or specialist tools.
