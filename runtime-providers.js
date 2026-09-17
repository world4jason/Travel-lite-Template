/*
 * Travel Lite runtime providers.
 * Static-host friendly adapters for data that changes after trip.json is generated.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
const TravelLiteProviders = (() => {
  const DEFAULTS = {
    weatherEndpoint: "https://api.open-meteo.com/v1/forecast",
    photonEndpoint: "https://photon.komoot.io/api/",
    overpassEndpoint: "https://overpass-api.de/api/interpreter",
    mapStyle: "https://tiles.openfreemap.org/styles/liberty",
    wikipediaLanguage: null,
  };

  const memory = new Map();

  function config() {
    return { ...DEFAULTS, ...(state?.data?.providers || {}) };
  }

  function language() {
    const configured = config().wikipediaLanguage;
    if (configured) return configured;
    const value = (navigator.language || "en").toLowerCase();
    if (value.startsWith("zh")) return "zh";
    return value.split("-")[0] || "en";
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

  async function searchPlaces(query, options = {}) {
    const trimmed = String(query || "").trim();
    if (trimmed.length < 2) return [];
    const cfg = config();
    const params = new URLSearchParams({ q: trimmed, limit: String(options.limit || 8) });
    const lang = options.lang || language();
    if (lang) params.set("lang", lang);
    if (Number.isFinite(options.lat) && Number.isFinite(options.lng)) {
      params.set("lat", String(options.lat));
      params.set("lon", String(options.lng));
    }
    const key = `photon:${trimmed.toLowerCase()}:${options.lat || ""}:${options.lng || ""}:${lang}`;
    const payload = await cachedFetchJson(key, `${cfg.photonEndpoint}?${params}`, {}, 6 * 60 * 60 * 1000);
    return (payload.features || []).map((feature, index) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [];
      return {
        id: `photon-${props.osm_type || "x"}-${props.osm_id || index}`,
        title: props.name || props.street || props.city || trimmed,
        subtitle: [props.street, props.housenumber, props.city, props.state, props.country].filter(Boolean).join(", "),
        lat: Number(coords[1]),
        lng: Number(coords[0]),
        osmType: props.osm_type || null,
        osmId: props.osm_id || null,
        osmKey: props.osm_key || null,
        osmValue: props.osm_value || null,
        raw: feature,
      };
    }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  }

  async function wikipediaNearby(lat, lng) {
    const lang = language();
    const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      generator: "geosearch",
      ggsprimary: "all",
      ggsnamespace: "0",
      ggsradius: "1200",
      ggslimit: "6",
      ggscoord: `${lat}|${lng}`,
      prop: "extracts|pageimages|info|pageprops",
      exintro: "1",
      explaintext: "1",
      piprop: "thumbnail",
      pithumbsize: "720",
      inprop: "url",
    });
    const key = `wiki:${lang}:${coordinateKey(lat, lng, 4)}`;
    const payload = await cachedFetchJson(key, `${endpoint}?${params}`, {}, 24 * 60 * 60 * 1000);
    return Object.values(payload.query?.pages || {})
      .sort((a, b) => (a.index || 99) - (b.index || 99))
      .map((page) => ({
        pageId: page.pageid,
        title: page.title,
        extract: page.extract || "",
        url: page.fullurl || "",
        thumbnail: page.thumbnail?.source || "",
        wikidataId: page.pageprops?.wikibase_item || null,
      }));
  }

  async function wikidata(entityId) {
    if (!entityId) return null;
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: entityId,
      format: "json",
      origin: "*",
      props: "labels|descriptions|claims|sitelinks",
      languages: `${language()}|zh-tw|zh|en`,
      languagefallback: "1",
    });
    const key = `wikidata:${entityId}:${language()}`;
    const payload = await cachedFetchJson(key, `https://www.wikidata.org/w/api.php?${params}`, {}, 24 * 60 * 60 * 1000);
    const entity = payload.entities?.[entityId];
    if (!entity || entity.missing != null) return null;
    const labels = entity.labels || {};
    const descriptions = entity.descriptions || {};
    const preferred = [language(), "zh-tw", "zh", "en"];
    const first = (obj) => preferred.map((code) => obj[code]?.value).find(Boolean) || Object.values(obj)[0]?.value || "";
    const imageName = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value || null;
    const website = entity.claims?.P856?.[0]?.mainsnak?.datavalue?.value || null;
    return {
      id: entityId,
      label: first(labels),
      description: first(descriptions),
      website,
      image: imageName ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}?width=960` : null,
      url: `https://www.wikidata.org/wiki/${encodeURIComponent(entityId)}`,
    };
  }

  const NEARBY_FILTERS = {
    food: '["amenity"~"restaurant|fast_food|food_court"]',
    cafe: '["amenity"="cafe"]',
    sights: '["tourism"~"attraction|museum|gallery|viewpoint"]',
    shopping: '["shop"]',
  };

  async function nearby(lat, lng, category = "sights") {
    const filter = NEARBY_FILTERS[category] || NEARBY_FILTERS.sights;
    const query = `[out:json][timeout:20];(nwr(around:1500,${lat},${lng})${filter};);out center tags 40;`;
    const cfg = config();
    const key = `overpass:${category}:${coordinateKey(lat, lng, 3)}`;
    const body = new URLSearchParams({ data: query }).toString();
    const payload = await cachedFetchJson(key, cfg.overpassEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    }, 6 * 60 * 60 * 1000);
    return (payload.elements || []).map((element) => {
      const tags = element.tags || {};
      const center = element.center || element;
      return {
        id: `osm-${element.type}-${element.id}`,
        title: tags.name || tags["name:en"] || tags.amenity || tags.tourism || tags.shop || "Nearby place",
        subtitle: [tags.cuisine, tags.opening_hours, tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" · "),
        lat: Number(center.lat),
        lng: Number(center.lon),
        osmType: element.type,
        osmId: element.id,
        raw: element,
      };
    }).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  }

  return { config, language, weather, searchPlaces, wikipediaNearby, wikidata, nearby };
})();
