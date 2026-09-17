/*
 * Post-planning companion guardrails.
 * Keeps discovery tools opt-in, renders specialist handoff links, and surfaces
 * simple day reminders without turning Travel Lite into a planner.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(() => {
  const exploreEnabled = () => state?.data?.ui?.enableExploreTools === true;

  function safeExternalLinks(item) {
    return (item?.externalLinks || []).flatMap((link) => {
      if (!link?.label || !link?.url) return [];
      try {
        const url = new URL(link.url, window.location.href);
        if (!["http:", "https:", "tel:", "mailto:"].includes(url.protocol)) return [];
        return [{ label: String(link.label), url: url.href }];
      } catch {
        return [];
      }
    });
  }

  function externalLinksHtml(item) {
    const links = safeExternalLinks(item);
    if (!links.length) return "";
    return `<div class="action-row external-handoffs">${links.map((link) =>
      `<a class="button-link" href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`
    ).join("")}</div>`;
  }

  // Optional discovery providers must not make network requests in the default flow.
  if (window.TravelLiteProviders) {
    const baseSearchPlaces = TravelLiteProviders.searchPlaces;
    const baseWikipediaNearby = TravelLiteProviders.wikipediaNearby;
    const baseWikidata = TravelLiteProviders.wikidata;
    const baseNearby = TravelLiteProviders.nearby;

    TravelLiteProviders.searchPlaces = (...args) => exploreEnabled() ? baseSearchPlaces(...args) : Promise.resolve([]);
    TravelLiteProviders.wikipediaNearby = (...args) => exploreEnabled() ? baseWikipediaNearby(...args) : Promise.resolve([]);
    TravelLiteProviders.wikidata = (...args) => exploreEnabled() ? baseWikidata(...args) : Promise.resolve(null);
    TravelLiteProviders.nearby = (...args) => exploreEnabled() ? baseNearby(...args) : Promise.resolve([]);
  }

  const baseItemActions = itemActions;
  itemActions = function companionItemActions(item) {
    return `${baseItemActions(item)}${externalLinksHtml(item)}`;
  };

  function normalizeReminders(day) {
    const values = day?.reminders || day?.must || [];
    return values.flatMap((value) => {
      if (typeof value === "string") return [{ text: value }];
      if (value?.text || value?.label) return [{ text: value.text || value.label, url: value.url || "" }];
      return [];
    });
  }

  function reminderCardForToday() {
    const context = getNowContext();
    if (context.phase !== "during" || !context.today) return null;
    const reminders = normalizeReminders(context.today);
    if (!reminders.length) return null;

    const card = document.createElement("section");
    card.className = "panel day-summary trip-reminder-card";
    card.innerHTML = `<p class="eyebrow">Today</p><h2>Remember</h2>${reminders.map((reminder) => {
      const text = `<span>! ${escapeHtml(reminder.text)}</span>`;
      if (!reminder.url) return `<p class="timeline-note">${text}</p>`;
      try {
        const url = new URL(reminder.url, window.location.href);
        if (!["http:", "https:", "tel:", "mailto:"].includes(url.protocol)) return `<p class="timeline-note">${text}</p>`;
        return `<p class="timeline-note">${text} <a class="inline-link" href="${escapeAttr(url.href)}" target="_blank" rel="noreferrer">Open ↗</a></p>`;
      } catch {
        return `<p class="timeline-note">${text}</p>`;
      }
    }).join("")}`;
    return card;
  }

  const baseRenderNow = renderNow;
  renderNow = function companionRenderNow() {
    baseRenderNow();
    const card = reminderCardForToday();
    const stack = root.querySelector(".view-stack");
    if (card && stack && !stack.querySelector(".trip-reminder-card")) stack.appendChild(card);
  };

  const baseRenderMap = renderMap;
  renderMap = function companionRenderMap() {
    baseRenderMap();

    if (!exploreEnabled()) {
      root.querySelector(".place-search-panel")?.remove();
      root.querySelector(".nearby-panel")?.remove();
      root.querySelector("#place-enrichment")?.remove();
    }

    const selectedDay = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
    const selected = selectedDay?.items?.find((item) => item.id === state.selectedMapItemId) || selectedDay?.items?.[0];
    const html = externalLinksHtml(selected);
    const card = root.querySelector(".selected-place-card");
    if (html && card && !card.querySelector(".external-handoffs")) card.insertAdjacentHTML("beforeend", html);
  };
})();
