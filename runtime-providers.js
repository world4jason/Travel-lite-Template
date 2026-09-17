/*
 * Travel Lite runtime providers.
 * Only small changing context belongs here. Stable trip/place facts should be
 * resolved during vibe-time and written to trip.json.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
const TravelLiteProviders = (() => {
  const DEFAULTS = {
    weatherEndpoint: "https://api.open-meteo.com/v1/forecast",
    mapStyle: "https://tiles.openfreemap.org/styles/liberty",
    mapStyleLight: "https://tiles.openfreemap.org/styles/liberty",
    mapStyleDark: "https://tiles.openfreemap.org/styles/dark",
  };

  const memory = new Map();

  function config() {
    return { ...DEFAULTS, ...(state?.data?.providers || {}) };
  }

  async function cachedFetchJson(key, url, options = {}, ttlMs = 30 * 60 * 1000) {
    const memoryHit = memory.get(key);
    if (memoryHit && Date.now() - memoryHit.fetchedAt < ttlMs) return memoryHit.value;

    const stored = await TravelLiteStorage.get(`provider:${key}`).catch(() => null);
    if (stored?.fetchedAt && Date.now() - stored.fetchedAt < ttlMs && stored.value) {
      memory.set(key, stored);
      return stored.value;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const value = await response.json();
      const record = { fetchedAt: Date.now(), value };
      memory.set(key, record);
      TravelLiteStorage.set(`provider:${key}`, record).catch(() => {});
      return value;
    } catch (error) {
      if (stored?.value) return { ...stored.value, __stale: true, __providerError: String(error) };
      throw error;
    }
  }

  function coordinateKey(lat, lng, precision = 3) {
    return `${Number(lat).toFixed(precision)},${Number(lng).toFixed(precision)}`;
  }

  async function weather(lat, lng) {
    const cfg = config();
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      timezone: "auto",
      forecast_days: "16",
      current: "temperature_2m,apparent_temperature,weather_code,precipitation,rain,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    });
    const key = `weather:${coordinateKey(lat, lng)}`;
    return cachedFetchJson(key, `${cfg.weatherEndpoint}?${params}`, {}, 30 * 60 * 1000);
  }

  return { config, weather };
})();
