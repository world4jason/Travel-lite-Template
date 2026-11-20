/* Optional, owner-curated Overview artwork; never affects itinerary facts.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const escape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const POSITION = new Set(["center", "top", "bottom", "left", "right"]);
  const FIT = new Set(["cover", "contain"]);

  function safeMediaUrl(raw) {
    if (typeof raw !== "string" || !raw.trim() || raw.trim().startsWith("//")) return "";
    try {
      const value = raw.trim();
      const explicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
      const url = new URL(value, document.baseURI);
      if ((explicitScheme && url.protocol !== "https:") ||
          (!explicitScheme && url.origin !== location.origin) ||
          url.username || url.password) return "";
      return url.href;
    } catch { return ""; }
  }

  function resolve(data, activeStyle) {
    const raw = data?.trip?.overviewArtwork;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const sourceIds = new Set((data.days || []).flatMap(day => (day.items || []).map(item => item.id)).filter(Boolean));
    const selected = Array.isArray(raw.subjectIds) ? raw.subjectIds : [];
    if (!selected.length || selected.length > 6 || new Set(selected).size !== selected.length ||
        selected.some(id => typeof id !== "string" || !sourceIds.has(id))) return [];
    if (!Array.isArray(raw.images) || raw.images.length > 48) return [];
    const valid = raw.images.flatMap(entry => {
      if (!entry || typeof entry !== "object") return [];
      const src = safeMediaUrl(entry.src);
      const alt = typeof entry.alt === "string" ? entry.alt.trim() : "";
      if (!src || !alt || alt.length > 350) return [];
      const styleId = typeof entry.styleId === "string" ? entry.styleId : "";
      return [{
        src, alt, styleId,
        fit: FIT.has(entry.fit) ? entry.fit : "cover",
        focalPoint: POSITION.has(entry.focalPoint) ? entry.focalPoint : "center",
      }];
    });
    // Up to three images per active pack; allow many reviewed pack variants
    // in the manifest without showing them all or mixing art styles.
    const styled = valid.filter(image => image.styleId === activeStyle);
    return (styled.length ? styled : valid.filter(image => !image.styleId)).slice(0, 3);
  }

  function render(data, style) {
    const images = resolve(data, style);
    if (!images.length) return "";
    const label = /^zh/i.test(data.ui?.locale || "") ? "旅程主視覺" : "Trip artwork";
    return '<section class="trip-overview-artwork" aria-label="' + escape(label) + '" data-count="' + images.length + '" data-overview-artwork>' +
      images.map((item, index) =>
        '<figure class="trip-overview-art-frame" data-artwork-fit="' + item.fit +
          '" data-artwork-position="' + item.focalPoint + '">' +
          '<img src="' + escape(item.src) + '" alt="' + escape(item.alt) +
          '" loading="' + (index ? "lazy" : "eager") + '" decoding="async"></figure>'
      ).join("") + '</section>';
  }

  function bind(root) {
    const artwork = root.querySelector("[data-overview-artwork]");
    if (!artwork) return;
    artwork.querySelectorAll("img").forEach(img => img.addEventListener("error", () => {
      img.closest(".trip-overview-art-frame")?.remove();
      if (!artwork.querySelector(".trip-overview-art-frame")) artwork.remove();
    }, { once: true }));
  }

  window.TravelLiteOverviewArtwork = Object.freeze({ resolve, render, bind });
})();
