# Shared Weather + Date Navigator — Trip / Transport / Places

> **Cross-page component contract (P1).** Governed by [UIUX.md](../UIUX.md) P0.4 / P1.5 and [SHARED.md](./SHARED.md); weather is **not** a sixth top-level tab. Trip / Transport / Places render the **same component** and selected-day state. Now may show a small, sourced current-day weather reference only if needed; it must not create a separate weather state.

## 1. Information hierarchy and interaction

- One horizontal, individually selectable day-card strip: **D number + source date + short day title + actual weather icon and high/low °C only when present**. No repeated generic helper subtitles, ornamental clouds, square glyphs, fixed text placeholders or an empty “weather” frame.
- The selected day is clear through both styling and accessible state, not color alone. Tap/click, focus, arrows, scroll, jump-to-day and Back/Forward work. Preserve **Overview**, **Today**, previous/next and an accessible jump-to-day control as appropriate; the strip is primary, dropdown secondary.
- For long trips, allow horizontal **strip-only** scrolling with current day reachable. Card text must be legible at 320/390px and 200% text; the main page must not overflow. Weather loading/error must never disable day selection.
- Trip Overview and Places All are view modes independent of `state.selectedDate`; Transport has **day only** and must not manufacture its own Overview. Cross-tab navigation carries the explicit selected date and deep link.

## 2. Source, time horizon and truth labels

| Date relative to trip-location local “today” | Provider and visible meaning |
| --- | --- |
| Today / future within the provider's supported range | Open-Meteo Forecast API; **forecast** (max `forecast_days=16`) |
| Recent past within the Forecast API history window | Forecast API `past_days`, maximum 92 days; **historical / prior-model-derived weather**, not “live” or on-site observation |
| Older past | Open-Meteo Historical Weather API `/v1/archive`, **historical weather (model/reanalysis estimate)** |
| Unavailable / unsupported / invalid | Keep date, D marker and day title **only**; suppress weather fields and icon |

- The cutoff follows the provider's documented support and the **date in the weather location's IANA timezone**, not arbitrary device UTC boundaries. Never render past weather as future forecast or measured weather-station fact. A historical forecast is a model product too.
- The canonical trip schedule/timezone remains `trip.json`; weather is third-party supplementary data and never rewrites the day title, time range, itinerary order or scheduled activity. Show a concise provider/type/date disclosure in an accessible detail or source link where weather is shown, rather than a repetitive explanation inside every card.
- Open-Meteo daily keys: `weather_code`, `temperature_2m_max`, `temperature_2m_min`. **Only show a full icon + temperature when all requested daily values are valid for that date**, with an explicit °C unit. Use a tested WMO-code-to-semantic-SVG mapping with an accessible description; do not invent a random sunshine/cloud/snow glyph when the code is missing.
- Rain **probability (%)** is forecast metadata only when actually provided; historical `precipitation_sum` is measured/modelled **amount (mm)**, not a probability. Do not convert between the two or infer rain severity from missing values. Optional precipitation details must carry correct units and source type.

## 3. Location resolution

1. Prefer that day's explicit public `days[].weatherLocation`: `{lat,lng,label}`; check plausibility and timezone.
2. Otherwise use only a **known, source-backed coordinate for a scheduled venue/item on that day**.
3. If neither exists, omit that day's weather. **Never** reuse Osaka (or day one) for all Kyoto, Ise, Kumano or other multi-city days, and never invent a coordinate from a place label.
4. Date and city are paired: avoid showing the wrong city name when the itinerary moves across regions within the same day. Weather is area-level context, not an exact microclimate at every stop.

## 4. Loading, caching, privacy and edge states

- Loading skeleton should not look like a valid forecast. On timeout, HTTP error, partial API response, offline or rate limit: date card stays actionable, weather is absent or clearly labelled **cached / stale** if displaying previously valid data.
- Cache by resolved day, location, provider/source type and appropriate refresh time. Do not reuse a prior location's result under another city's date. Never make a stale historical/forecast result look freshly checked.
- No GPS permission is necessary to read scheduled-area weather; do not claim the user is at the forecast location. Safe URLs, bounded requests, accessible image/SVG labels and offline fallbacks are mandatory.
- Timezone rollovers, cross-midnight flights, past/future transition, missing highs or lows, multi-city days, 16-day boundary, 92-day boundary and unavailable archive must all be considered.

## 5. Acceptance

- `npm run test:trip-widgets` for weather source selection, valid/missing values and flight/date interactions.
- `npm run test:uiux`, `npm run test:timeline` and browser date navigation / responsive tests for shared state, complete strip, keyboard, 320/390/1100px and text zoom. Check that **all five tabs** remain usable with zero network and that neither weather fetch nor stale cache changes the selected date.
- Manual cases: future within range, recent past, older past, no coordinates, missing weather code/temperature, offline/stale cache, Osaka/Kyoto/Kumano day-location differences.

Official provider references: [Open-Meteo Forecast API](https://open-meteo.com/en/docs), [Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api).
