/*
 * Runtime travel context for Travel Lite.
 * Keeps only small changing context (weather) and an overview map for already
 * planned stops. Discovery/recommendation belongs in specialist apps.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(() => {
  let mapInstance = null;
  let maplibrePromise = null;

  const baseRenderNow = renderNow;
  const baseRenderTrip = renderTrip;

  function primaryCoordinate(items = []) {
    const item = items.find((candidate) =>
      Number.isFinite(Number(candidate?.lat)) && Number.isFinite(Number(candidate?.lng)));
    if (item) return {
      lat: Number(item.lat),
      lng: Number(item.lng),
      label: item.title || item.location || "Trip",
    };

    const center = state.data.trip.center;
    if (Array.isArray(center) && center.length >= 2) {
      return { lat: Number(center[0]), lng: Number(center[1]), label: state.data.trip.homeLabel || state.data.trip.title };
    }
    if (center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))) {
      return { lat: Number(center.lat), lng: Number(center.lng), label: state.data.trip.homeLabel || state.data.trip.title };
    }
    return null;
  }

  function mapPreview(item, compact = false) {
    if (!item) return "";
    const src = googleMapsEmbedUrl(item);
    if (src) {
      return `<div class="map-frame ${compact ? "compact" : ""}"><iframe title="Google Map for ${escapeAttr(item.title || item.location || "trip location")}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="${escapeAttr(src)}" allowfullscreen></iframe></div>`;
    }
    const open = googleMapsOpenUrl(item);
    if (!open) return "";
    return `<section class="panel map-handoff ${compact ? "compact" : ""}"><div><p class="eyebrow">Map handoff</p><strong>${escapeHtml(item.title || item.location || "Place")}</strong><p>Open your normal map app for ratings, photos, live details and navigation.</p></div><a class="button-link" href="${escapeAttr(open)}" target="_blank" rel="noreferrer">Open Google Maps ↗</a></section>`;
  }

  window.mapPreview = mapPreview;

  itemActions = function runtimeItemActions(item) {
    if (!item) return "";
    const open = googleMapsOpenUrl(item);
    const hasPlace = Boolean(
      Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))
      || item.location || item.mapQuery
    );
    return `<div class="action-row">
      ${hasPlace ? `<button class="button-link primary" type="button" data-map-item="${escapeAttr(item.id)}">Trip map</button>` : ""}
      ${open ? `<a class="button-link" href="${escapeAttr(open)}" target="_blank" rel="noreferrer">Google Maps ↗</a>` : ""}
    </div>`;
  };

  function weatherLabel(code) {
    if (code === 0) return "Clear";
    if ([1, 2].includes(code)) return "Mostly clear";
    if (code === 3) return "Cloudy";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Weather";
  }

  function weatherIcon(code) {
    if (code === 0) return "☀";
    if ([1, 2].includes(code)) return "◐";
    if (code === 3) return "☁";
    if ([45, 48].includes(code)) return "≋";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "☂";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄";
    if ([95, 96, 99].includes(code)) return "ϟ";
    return "◌";
  }

  async function weatherCardFor(date, coordinate, mode = "daily") {
    if (!coordinate) return null;
    try {
      const data = await TravelLiteProviders.weather(coordinate.lat, coordinate.lng);
      const idx = data.daily?.time?.indexOf(date) ?? -1;
      if (idx < 0 && mode !== "current") return null;
      const current = data.current || {};
      const card = document.createElement("section");
      card.className = "panel weather-card";

      if (mode === "current" && date === zonedNow(state.data.trip.timezone).date) {
        card.innerHTML = `<div class="weather-icon">${weatherIcon(current.weather_code)}</div><div><p class="eyebrow">Live weather · ${escapeHtml(coordinate.label)}</p><h2>${Math.round(current.temperature_2m ?? 0)}° · ${escapeHtml(weatherLabel(current.weather_code))}</h2><p>Feels ${Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0)}° · Wind ${Math.round(current.wind_speed_10m ?? 0)} km/h${data.__stale ? " · cached" : ""}</p></div>`;
      } else {
        const hi = data.daily.temperature_2m_max?.[idx];
        const lo = data.daily.temperature_2m_min?.[idx];
        const rain = data.daily.precipitation_probability_max?.[idx];
        const code = data.daily.weather_code?.[idx];
        card.innerHTML = `<div class="weather-icon">${weatherIcon(code)}</div><div><p class="eyebrow">Forecast · ${escapeHtml(coordinate.label)}</p><h2>${Math.round(hi)}° / ${Math.round(lo)}° · ${escapeHtml(weatherLabel(code))}</h2><p>Rain ${rain ?? 0}%${data.__stale ? " · cached" : ""}</p></div>`;
      }
      return card;
    } catch (error) {
      console.warn("Weather provider unavailable", error);
      return null;
    }
  }

  async function injectNowWeather() {
    const context = getNowContext();
    if (context.phase !== "during") return;
    const coordinate = primaryCoordinate([context.current, context.next].filter(Boolean));
    const card = await weatherCardFor(context.now.date, coordinate, "current");
    if (!card || state.view !== "now") return;
    const stack = root.querySelector(".view-stack");
    if (stack && !stack.querySelector(".weather-card")) stack.insertBefore(card, stack.children[1] || null);
  }

  async function injectTripWeather() {
    const day = state.data.days.find((candidate) => candidate.date === state.selectedDate);
    if (!day) return;
    const coordinate = primaryCoordinate(day.items || []);
    const card = await weatherCardFor(day.date, coordinate, "daily");
    if (!card || state.view !== "trip" || state.selectedDate !== day.date) return;
    const summary = root.querySelector(".day-summary");
    if (summary && !root.querySelector(".weather-card")) summary.insertAdjacentElement("afterend", card);
  }

  renderNow = function runtimeRenderNow() {
    baseRenderNow();
    injectNowWeather();
  };

  renderTrip = function runtimeRenderTrip() {
    baseRenderTrip();
    injectTripWeather();
  };

  async function ensureMapLibre() {
    if (maplibrePromise) return maplibrePromise;
    if (!document.querySelector('link[data-maplibre]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl.css";
      link.dataset.maplibre = "1";
      document.head.appendChild(link);
    }
    maplibrePromise = import("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/+esm").catch((error) => {
      maplibrePromise = null;
      throw error;
    });
    return maplibrePromise;
  }

  function destroyMap() {
    if (!mapInstance) return;
    try { mapInstance.remove(); } catch {}
    mapInstance = null;
  }

  function itemCoordinates(item) {
    const lat = Number(item?.lat);
    const lng = Number(item?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  async function initMap(items, selected) {
    const container = document.querySelector("#runtime-map");
    if (!container) return;
    destroyMap();

    const mappable = items.filter(itemCoordinates);
    if (!mappable.length) {
      container.innerHTML = `<div class="map-library-fallback">No coordinates are available for this day. Add lat/lng during vibe-time, or use the Google Maps handoff on an itinerary card.</div>`;
      return;
    }

    try {
      const maplibregl = await ensureMapLibre();
      if (!document.querySelector("#runtime-map") || state.view !== "map") return;
      const focus = itemCoordinates(selected) || itemCoordinates(mappable[0]);

      mapInstance = new maplibregl.Map({
        container: "runtime-map",
        style: state.data.providers?.mapStyle || TravelLiteProviders.config().mapStyle,
        center: [focus.lng, focus.lat],
        zoom: mappable.length > 1 ? 11 : 14,
        attributionControl: true,
      });
      mapInstance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

      const bounds = new maplibregl.LngLatBounds();
      mappable.forEach((item) => {
        const coord = itemCoordinates(item);
        bounds.extend([coord.lng, coord.lat]);

        const el = document.createElement("button");
        el.className = `map-marker ${item.id === selected?.id ? "active" : ""}`;
        el.type = "button";
        el.textContent = item.start || "•";
        el.title = item.title || item.location || "Trip stop";
        el.addEventListener("click", () => {
          state.selectedMapItemId = item.id;
          renderMap();
        });

        new maplibregl.Marker({ element: el }).setLngLat([coord.lng, coord.lat]).addTo(mapInstance);
      });

      if (mappable.length > 1) mapInstance.fitBounds(bounds, { padding: 54, maxZoom: 14, duration: 0 });
    } catch (error) {
      console.warn("MapLibre unavailable", error);
      container.innerHTML = `<div class="map-library-fallback"><strong>Interactive map unavailable.</strong><br>Trip data and Google Maps links still work.</div>`;
    }
  }

  renderMap = function runtimeRenderMap() {
    const selectedDay = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
    if (selectedDay) state.selectedDate = selectedDay.date;
    const items = selectedDay?.items || [];

    const selected = items.find((item) => item.id === state.selectedMapItemId)
      || items.find(itemCoordinates)
      || items[0]
      || null;
    state.selectedMapItemId = selected?.id || null;

    const dayTabs = state.data.days.map((day) =>
      `<button class="day-chip ${day.date === state.selectedDate ? "active" : ""}" type="button" data-runtime-map-date="${escapeAttr(day.date)}"><strong>${escapeHtml(day.label)}</strong><small>${prettyDate(day.date)}</small></button>`
    ).join("");

    const placeChips = items.map((item) =>
      `<button class="place-chip ${item.id === state.selectedMapItemId ? "active" : ""}" type="button" data-runtime-map-place="${escapeAttr(item.id)}"><span>${escapeHtml(item.start || "")}</span>${escapeHtml(item.title)}</button>`
    ).join("");

    const googleUrl = selected ? googleMapsOpenUrl(selected) : "";

    root.innerHTML = `<div class="day-tabs" aria-label="Map days">${dayTabs}</div>
      <section class="panel map-panel runtime-map-panel">
        <div class="map-heading"><div><p class="eyebrow">Trip map</p><h2>${escapeHtml(selectedDay?.title || "Trip map")}</h2></div>${googleUrl ? `<a class="button-link" href="${escapeAttr(googleUrl)}" target="_blank" rel="noreferrer">Google Maps ↗</a>` : ""}</div>
        ${placeChips ? `<div class="place-chips">${placeChips}</div>` : ""}
        <div id="runtime-map" class="interactive-map" aria-label="Interactive trip map"></div>
        ${selected ? `<div class="selected-place-card"><div><p class="eyebrow">Selected stop</p><h3>${escapeHtml(selected.title || selected.location || "Place")}</h3><p>${escapeHtml(selected.location || "")}</p></div>${googleUrl ? `<a class="button-link" href="${escapeAttr(googleUrl)}" target="_blank" rel="noreferrer">Ratings & navigation ↗</a>` : ""}</div>` : ""}
      </section>`;

    root.querySelectorAll("[data-runtime-map-date]").forEach((button) => button.addEventListener("click", () => {
      state.selectedDate = button.dataset.runtimeMapDate;
      state.selectedMapItemId = null;
      TravelLiteStorage.set(tripKey("ui:selectedDate"), state.selectedDate);
      renderMap();
    }));

    root.querySelectorAll("[data-runtime-map-place]").forEach((button) => button.addEventListener("click", () => {
      state.selectedMapItemId = button.dataset.runtimeMapPlace;
      renderMap();
    }));

    initMap(items, selected);
  };

  window.addEventListener("beforeunload", destroyMap);
})();
