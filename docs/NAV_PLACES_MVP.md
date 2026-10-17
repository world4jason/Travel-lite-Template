# Navigation + Places MVP — first working iteration

Date: 2026-10-17. Repo: world4jason/Travel-lite-Template.

## Product choice

Five persistent primary destinations:

| Tab | Primary question | Delivered in this MVP |
| --- | --- | --- |
| Now | What is happening / what is next? | Unchanged schedule reference |
| Trip | What's the order of the day? | Existing timeline; small direct Place-detail links |
| Transport | How do I get there and what did we research? | Existing MapLibre map, selected stops, static published transfer summaries |
| Places | What is this place, do I have linked admission facts? | Day-filtered planned places, details, optional guides and item-linked entry references |
| More | What else do I need to prepare or keep? | Checklists, reservations/files, notes, exports, appearance |

Do not duplicate itinerary data across tabs. The map is still a spatial-reference map, not a proven bus-line geometry or live train timetable. Further full transport-first day and rural service schedules are addressed by #104 and #105 after shared source refinements.

## Key design choices

- Places uses existing scheduled item IDs, not a separate tourist destination search API.
- Filter out explicitly non-place transport/accommodation tasks and generic unconfirmed meals. Other published place types and venue-backed activities remain.
- Places cards show only title, itinerary date and existing short summary. Deep context stays in the detail screen.
- The detail screen can display existing infoCard title/summary/facts/image/sourceLinks; no auto-generated Guide chapters.
- A reservation or document appears on a Place only when the publisher explicitly provided itemId/itemIds. There is no fuzzy title/name matching.
- An absence of admission records does not mean entry is free, confirmed, or unnecessary; it means the shared source has no linked record.
- Link destinations are restricted to HTTP(S); all published text is escaped.
- Public GitHub Pages is not private ticket storage; never embed real personalized QR codes, booking credentials or signed sensitive URLs in trip data.
- Date filters are buttons for short trips and a native accessible select for long trips (>7 dates in the published place index).
- Device-local checkmarks keep their previous scoped storage keys; More embeds the existing reusable checklist markup. Old #check still opens a standalone legacy page, and a locally stored previous Check selection now opens More.
- Internal Map view ID and #map/day/.../stop/... URLs remain valid even though the public label becomes Transport. #transport URLs are accepted as compatibility aliases.
- Five-tab fixed navigation uses minmax(0,1fr) and wraps long words safely at 320px/large text; desktop uses its existing header-row reflow.
- There is no route optimization, reservation booking action, live data ingestion, background notifications, Group sync, ticket scanning or AI recommendation.

## Source-of-truth map

Published trip.json days[].items -> Trip / Places / Transport item positions and metadata.
Published trip.json days[].items[].transferAfter -> Trip/Transport static leg descriptions.
Published trip.json days[].items[].infoCard -> Places contextual reading and optional existing Trip disclosure.
Published trip.json reservations[] or files[] + explicit itemId -> Place admission references.
Published trip.json checklists[] / todos[] -> device-local More checklist state.
Device-only TravelLiteStorage -> checked status, visual style, personal notes, saved navigation.

No trip was automatically rewritten and no source picture was copied into the Guide. The bundled Tokyo fixture changes its UI.bottomNav setting only.

## Acceptance / QA workflow

1. Five tab labels and placement; correct active state and stored More view.
2. Trip day to Places detail and back; Places deep link can load directly and reload.
3. 320, 390, 844-landscape, 1100, 1600px; date selector and large-text accessibility.
4. No confirmed reservation invented without a matching itemId; unsafe text and URL cases.
5. Legacy #map and #check restore correctly; checkmarks survive reload and style changes.
6. Offline first-load service worker and MapLibre failure still allow read-only itinerary and place details.
7. All existing appearance packs and normal daytime window checks remain intact.
8. Five-pass Agent code/visual QA, merge gate, then Pages Human Visual Review.

## Deferred backlog

- #82: optional multi-section Guide reading and media rights.
- #104: transport-first day information priority, real departure/day service contract.
- #105: true transit stop/route markers, rural-bus departures and accessibility.
- #106: this L0/L1 five-tab navigation MVP.

## Human gates

The original manual real-itinerary import QA remains NOT RUN/owner-waived per previous agreement. Code review and browser regression are separate from Human Visual Review after Pages deployment. No AI-generated pass may be labeled owner-approved visual acceptance.
