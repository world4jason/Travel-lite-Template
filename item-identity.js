/* Published itinerary identity audit. Pure, deterministic and fail-closed.
   Runs after legacy missing-ID fallback, before any identity-based consumer.
   SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const valid = id => typeof id === "string" && id.length > 0 && id === id.trim();

  function audit(days) {
    const grouped = new Map();
    const invalid = [];
    (Array.isArray(days) ? days : []).forEach((day, dayIndex) => {
      (Array.isArray(day?.items) ? day.items : []).forEach((item, itemIndex) => {
        const path = `days[${dayIndex}].items[${itemIndex}]`;
        if (!valid(item?.id)) {
          invalid.push(Object.freeze({ id: null, paths: Object.freeze([path]), kind: "invalid" }));
          return;
        }
        if (!grouped.has(item.id)) grouped.set(item.id, []);
        grouped.get(item.id).push(Object.freeze({ item, day, dayIndex, itemIndex, path }));
      });
    });
    const duplicates = [...grouped.entries()].filter(([, rows]) => rows.length > 1)
      .map(([id, rows]) => Object.freeze({
        id, paths: Object.freeze(rows.map(row => row.path)), kind: "duplicate",
      }));
    const diagnostics = Object.freeze([...duplicates, ...invalid]);
    const resolveUnique = id => {
      if (!valid(id)) return null;
      const matches = grouped.get(id);
      return matches?.length === 1 ? matches[0] : null;
    };
    return Object.freeze({
      diagnostics,
      hasIssues: diagnostics.length > 0,
      isUnique: id => Boolean(resolveUnique(id)),
      isAmbiguous: id => valid(id) && (grouped.get(id)?.length || 0) > 1,
      resolveUnique,
      // Disclosure of source paths is intentional, but never expose booking
      // records or silently reassign source IDs.
    });
  }

  window.TravelLiteItemIds = Object.freeze({ audit });
})();
