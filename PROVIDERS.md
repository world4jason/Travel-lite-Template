# Runtime providers

Travel Lite keeps runtime dependencies intentionally small.

> Resolve stable facts during vibe-time; fetch only small changing context at runtime.

## Interactive map — MapLibre + OpenFreeMap

- Default style: `https://tiles.openfreemap.org/styles/liberty`
- Used only as an overview of already-planned stops.
- The renderer loads only when the Map view opens.
- If MapLibre/CDN/map tiles fail, the itinerary and Google Maps handoff still work.

OpenFreeMap: https://openfreemap.org/

## Weather — Open-Meteo

- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Coordinate-based current weather and daily forecast.
- Up to 16 forecast days.
- Cached in IndexedDB for 30 minutes.
- Failed refresh may use cached data; otherwise weather UI disappears.
- The hosted free API has its own non-commercial/rate/availability terms; commercial/high-volume forks should replace or configure an appropriate endpoint.

Docs: https://open-meteo.com/en/docs
Pricing/terms: https://open-meteo.com/en/pricing · https://open-meteo.com/en/terms

## Google Maps handoff

Normal place handoff:

```text
https://www.google.com/maps/search/?api=1&query=PLACE_NAME,ADDRESS
```

Travel Lite also supports small query shortcuts (`googleSearches`) such as "restaurants" or "cafe", scoped around the selected stop. This replaces the need for a base-template nearby/search provider.

No Maps URL API key is required.

Google Maps URLs docs:
https://developers.google.com/maps/documentation/urls/get-started

## Optional Google Maps iframe

Set `providers.googleMapsEmbedKey` only when the trip owner explicitly wants the official Maps Embed API. Keep it empty by default and restrict any browser key by HTTP referrer.

Docs:
https://developers.google.com/maps/documentation/embed/quickstart

## Vibe-time place/context enrichment

The base template has **no runtime Photon, Overpass, Wikipedia, or Wikidata provider**.

A coding agent should resolve stable trip data before deployment:

```json
{
  "title": "Senso-ji",
  "location": "Senso-ji, Tokyo",
  "lat": 35.7148,
  "lng": 139.7967,
  "infoCard": {
    "summary": "Short context useful during the visit.",
    "facts": ["Useful fact"],
    "sourceLinks": [
      { "label": "Wikipedia", "url": "https://..." },
      { "label": "Official site", "url": "https://..." }
    ]
  }
}
```

The agent may use Wikipedia/Wikidata/official sources during research, but the rendered trip consumes the static result. This avoids runtime identity-matching errors and makes the info available offline.

## Configuration

```json
{
  "providers": {
    "mapStyle": "https://tiles.openfreemap.org/styles/liberty",
    "weatherEndpoint": "https://api.open-meteo.com/v1/forecast",
    "googleMapsEmbedKey": ""
  }
}
```

## Provider failure rule

External providers are enhancements. They must never be required to render the itinerary, reminders, decisions, checklist, reservations, static info cards, or local notes.
