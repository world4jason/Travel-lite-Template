/* Shared site identity for all browser-persisted data.
 * GitHub Pages project sites may have different paths on the same origin.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";

  // Resolve relative to this bundled script, rather than the current route,
  // hash, query string or the trip ID supplied by an itinerary.
  const base = new URL("./", document.currentScript?.src || document.baseURI);
  const siteId = base.origin + base.pathname;
  const namespace = encodeURIComponent(siteId);

  window.TravelLiteSiteStorage = Object.freeze({
    siteId,
    databaseName: `travel-lite:${namespace}`,
    localKey(name) { return `travel-lite:${namespace}:${name}`; },
  });
})();
