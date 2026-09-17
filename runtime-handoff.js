/*
 * Handoff-first scope guard for Travel Lite.
 *
 * The default trip UI stays small: itinerary, current/next context, weather,
 * trip map, checklists, reminders, and links out to the tools travellers already trust.
 * Advanced place discovery/enrichment remains available only when explicitly
 * enabled with ui.enableExploreTools=true.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(() => {
  const fullRenderMap = renderMap;
  const baseRenderNow = renderNow;
  const baseItemActions = itemActions;

  function externalLinks(item) {
    const links = Array.isArray(item?.externalLinks) ? item.externalLinks : [];
    return links.filter((link) => {
      if (!link?.label || !link?.url) return false;
      try {
        const url = new URL(link.url, window.location.href);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    });
  }

  function externalLinksHtml(item) {
    const links = externalLinks(item);
    if (!links.length) return "";
    return `<div class="action-row handoff-actions">${links.map((link) =>
      `<a class="button-link" href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`
    ).join("")}</div>`;
  }

  itemActions = function handoffFirstItemActions(item) {
    return `${baseItemActions(item)}${externalLinksHtml(item)}`;
  };

  function normalizedReminders(day) {
    const raw = Array.isArray(day?.reminders) ? day.reminders : (Array.isArray(day?.must) ? day.must : []);
    return raw.flatMap((entry) => {
      if (typeof entry === "string") return [{ text: entry }];
      if (entry?.text || entry?.label) return [{ text: entry.text || entry.label, url: entry.url || "" }];
      return [];
    });
  }

  function reminderCard(day) {
    const reminders = normalizedReminders(day);
    if (!reminders.length) return null;
    const card = document.createElement("section");
    card.className = "panel day-summary trip-reminder-card";
    card.innerHTML = `<p class="eyebrow">Today</p><h2>Remember</h2>${reminders.map((reminder) => {
      let link = "";
      if (reminder.url) {
        try {
          const url = new URL(reminder.url, window.location.href);
          if (url.protocol === "https:" || url.protocol === "http:") {
            link = ` <a class="inline-link" href="${escapeAttr(url.href)}" target="_blank" rel="noreferrer">Open ↗</a>`;
          }
        } catch {}
      }
      return `<p class="timeline-note">! ${escapeHtml(reminder.text)}${link}</p>`;
    }).join("")}`;
    return card;
  }

  renderNow = function handoffFirstRenderNow() {
    baseRenderNow();
    const context = getNowContext();
    const card = context.phase === "during" ? reminderCard(context.today) : null;
    const stack = root.querySelector(".view-stack");
    if (card && stack && !stack.querySelector(".trip-reminder-card")) stack.appendChild(card);
  };

  renderMap = function handoffFirstRenderMap() {
    if (state.data?.ui?.enableExploreTools === true) {
      fullRenderMap();
      return;
    }

    // Keep the full MapLibre itinerary map but suppress automatic public-data
    // enrichment and discovery panels. These are optional conveniences, not
    // core travel workflow.
    const originalWikipediaNearby = TravelLiteProviders.wikipediaNearby;
    TravelLiteProviders.wikipediaNearby = async () => [];
    try {
      fullRenderMap();
    } finally {
      TravelLiteProviders.wikipediaNearby = originalWikipediaNearby;
    }

    root.querySelector(".place-search-panel")?.remove();
    root.querySelector(".nearby-panel")?.remove();
    root.querySelector("#place-enrichment")?.remove();

    const heading = root.querySelector(".runtime-map-panel .map-heading .eyebrow");
    if (heading) heading.textContent = "Trip map";

    const fallback = root.querySelector(".map-library-fallback");
    if (fallback?.textContent?.includes("place search")) {
      fallback.textContent = "No coordinates are available yet. Add lat/lng to trip.json or let the coding agent resolve the itinerary locations.";
    }

    const selectedDay = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
    const selected = selectedDay?.items?.find((item) => item.id === state.selectedMapItemId)
      || selectedDay?.items?.find((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)))
      || selectedDay?.items?.[0];
    const handoffs = externalLinksHtml(selected);
    const card = root.querySelector(".selected-place-card");
    if (card && handoffs) card.insertAdjacentHTML("beforeend", handoffs);
  };
})();
