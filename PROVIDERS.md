# Runtime providers

Travel Lite is static and local-first. Runtime providers are optional adapters for data that changes after `trip.json` is generated.

The guiding rule is:

> Resolve stable facts during vibe-time; fetch changing/ad-hoc facts at runtime.

## Default stack

### Interactive map — MapLibre + OpenFreeMap

- Style default: `https://tiles.openfreemap.org/styles/liberty`
- No Travel Lite account, token, or server is required.
- OpenFreeMap's public instance currently advertises no registration, API key, map-view limit, or request limit.
- The map renderer is dynamically loaded only when Map is opened.
- If MapLibre/CDN/map tiles are unavailable, Google Maps links still work.

OpenFreeMap: https://openfreemap.org/

### Weather — Open-Meteo

- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Uses coordinate-based current weather and daily forecasts.
- Travel Lite asks for up to 16 forecast days.
- Results are cached in IndexedDB for 30 minutes.
- A failed refresh may use cached data; otherwise the weather card simply disappears.
- **Hosted free API caveat:** Open-Meteo's free endpoint is for non-commercial use, currently limited to 10,000 calls/day, 5,000/hour, and 600/minute, with no uptime guarantee. Its returned weather data is CC BY 4.0 and requires attribution.
- Commercial/high-volume forks should configure Open-Meteo's customer endpoint or a self-hosted/replacement weather provider instead of silently relying on the free public endpoint.

Docs: https://open-meteo.com/en/docs
Pricing/terms: https://open-meteo.com/en/pricing · https://open-meteo.com/en/terms

### Place search — Photon

- Default public demo: `https://photon.komoot.io/api/`
- Based on OpenStreetMap data.
- Travel Lite uses explicit submit-to-search, not continuous typeahead, to keep public-demo traffic low.
- Searches are location-biased when the current trip day has coordinates.
- Results are cached for six hours.
- The public demo has no SLA and may throttle or ban extensive use; self-host or replace the endpoint for heavier deployments.

Project/API docs: https://github.com/komoot/photon

### Place enrichment — Wikipedia + Wikidata

Travel Lite queries the nearest Wikipedia articles around the selected coordinate and uses the corresponding Wikidata entity when available.

Possible runtime fields include:

- public description / intro
- Wikipedia thumbnail
- Wikidata description
- Wikimedia Commons image through Wikidata P18
- official website through Wikidata P856

Proximity is not identity. The UI labels this information as public knowledge rather than treating the nearest article as guaranteed metadata for the selected business/place.

Stable enriched facts should preferably be written into `trip.json` by the coding agent.

### Nearby POI — Overpass

- Default endpoint: `https://overpass-api.de/api/interpreter`
- Categories currently include sights, food, cafe, and shopping.
- Queries run only after explicit user action.
- Results are cached for six hours.
- Do not query on every map pan/zoom.

For a high-traffic fork, configure another Overpass instance or run your own.

### Ratings, reviews, details, navigation — Google Maps URLs

Default behavior is a normal Google Maps URL:

```text
https://www.google.com/maps/search/?api=1&query=PLACE_NAME,ADDRESS
```

Google Maps URLs do not require an API key. Travel Lite prefers place name + address/location to coordinates because Google Maps can then open the actual listing and its details more reliably. When a `googlePlaceId` is known, Travel Lite also supplies `query_place_id` for a precise listing handoff.

Google Maps URLs docs:
https://developers.google.com/maps/documentation/urls/get-started

### Optional Google Maps iframe

Set `providers.googleMapsEmbedKey` only when the trip owner explicitly wants the official Maps Embed API.

```json
{
  "providers": {
    "googleMapsEmbedKey": "YOUR_BROWSER_KEY"
  }
}
```

Maps Embed requests are currently no-charge/unlimited, but Google requires a valid Cloud API key and billing account. Restrict a browser key by HTTP referrer to the deployed GitHub Pages origin.

Docs:
https://developers.google.com/maps/documentation/embed/quickstart

## Configuration

```json
{
  "providers": {
    "mapStyle": "https://tiles.openfreemap.org/styles/liberty",
    "weatherEndpoint": "https://api.open-meteo.com/v1/forecast",
    "photonEndpoint": "https://photon.komoot.io/api/",
    "overpassEndpoint": "https://overpass-api.de/api/interpreter",
    "wikipediaLanguage": "zh",
    "googleMapsEmbedKey": ""
  }
}
```

Every public provider should be replaceable without changing the UI architecture.

## Build-time enrichment recommendation

A coding agent generating a trip should try to produce:

```json
{
  "id": "sensoji",
  "title": "Senso-ji",
  "location": "2 Chome-3-1 Asakusa, Taito City, Tokyo",
  "lat": 35.7148,
  "lng": 139.7967,
  "googlePlaceId": "optional",
  "wikidataId": "optional"
}
```

This gives the page useful maps and links even if runtime geocoding/enrichment is unavailable.

## Provider failure rule

External providers are enhancements. They must never be required to render the itinerary, checklist, reservations, or local notes.
