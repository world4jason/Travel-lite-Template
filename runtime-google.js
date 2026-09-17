/* Google Maps handoff adapter. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  function googleTextQuery(item) {
    if (!item) return "";
    const text = item.googleQuery || item.mapQuery || [item.title, item.location].filter(Boolean).join(", ") || item.location || item.title;
    if (text) return text;
    if (item.lat != null && item.lng != null) return `${item.lat},${item.lng}`;
    return "";
  }

  googleMapsOpenUrl = function googleMapsReviewsUrl(item) {
    if (!item) return "";
    if (item.mapsUrl) return item.mapsUrl;
    const query = googleTextQuery(item);
    if (!query) return "";
    const params = new URLSearchParams({ api: "1", query });
    if (item.googlePlaceId) params.set("query_place_id", item.googlePlaceId);
    return `https://www.google.com/maps/search/?${params}`;
  };

  googleMapsEmbedUrl = function officialGoogleMapsEmbedUrl(item) {
    if (!item) return "";
    if (item.mapEmbedUrl) return item.mapEmbedUrl;
    const key = state.data.providers?.googleMapsEmbedKey;
    const query = googleTextQuery(item);
    if (!key || !query) return "";
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`;
  };
})();
