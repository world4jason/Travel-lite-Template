/* Shared, semantic inline SVG icons (no glyph-font or brand dependency).
 * All names and paths are allowlisted; trip data cannot inject markup.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const shapes = Object.freeze({
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    route: '<circle cx="6" cy="19" r="2"/><path d="M6 17V9a5 5 0 0 1 5-5h3"/><path d="m15 1 3 3-3 3"/><circle cx="19" cy="13" r="2"/>',
    "map-pin": '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
    more: '<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    flight: '<path d="M21 3 10 14M21 3l-6 18-4-7-7-4 17-7Z"/>',
    drive: '<path d="m5 11 2-6h10l2 6M5 11h14l2 5v3h-3v-2H6v2H3v-3l2-5Z"/><path d="M7 14h2m6 0h2"/>',
    boat: '<path d="M3 14 12 17l9-3-3 6H6l-3-6ZM12 3v14m0-10 6 5h-6"/>',
    // Different silhouettes: regional train is side-on with multiple windows;
    // underground metro is front-on with a wide windscreen.
    train: '<rect x="2" y="5" width="20" height="13" rx="3"/><path d="M3 12h18M8 5v13M15 5v13M5 22l3-4m11 4-3-4"/><circle cx="6" cy="15" r=".7"/><circle cx="19" cy="15" r=".7"/>',
    subway: '<rect x="5" y="2" width="14" height="17" rx="3"/><path d="M7 7h10v6H7zM8 22l2-3m6 3-2-3"/><circle cx="9" cy="16" r=".8"/><circle cx="15" cy="16" r=".8"/>',
    cable: '<path d="m2 6 20-4M8 4l2 3m6-5-1 5"/><rect x="5" y="8" width="14" height="12" rx="3"/><path d="M5 14h14M8 23l2-3m6 3-2-3"/>',
    bus: '<rect x="4" y="3" width="16" height="17" rx="3"/><path d="M5 11h14M8 20v2m8-2v2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>',
    walk: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4M4 13h4"/>',
    museum: '<path d="m2 9 10-6 10 6M3 10h18M5 10v9m5-9v9m4-9v9m5-9v9M2 21h20"/>',
    ticket: '<path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4Z"/><path d="M12 6v2m0 3v2m0 3v2"/>',
    sparkles: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z"/>',
    stay: '<path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16M3 9h18M8 21v-7h8v7"/>',
    task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
    event: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>'
  });
  const aliases = Object.freeze({ "✦": "sparkles", "✧": "sparkles", "◫": "museum" });
  function svg(input) {
    const name = aliases[input] || input;
    if (!Object.prototype.hasOwnProperty.call(shapes, name)) return "";
    return '<svg class="tl-ui-icon tl-ui-icon--' + name +
      '" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      shapes[name] + '</svg>';
  }
  window.TravelLiteIcons = Object.freeze({svg, names:Object.freeze(Object.keys(shapes))});
})();
