/*
 * Handoff-first scope guard for Travel Lite.
 *
 * The default trip UI stays small: itinerary, current/next context, weather,
 * trip map, checklists, reminders, lightweight day-of decisions, and links out
 * to the tools travellers already trust.
 * Advanced place discovery/enrichment remains available only when explicitly
 * enabled with ui.enableExploreTools=true.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(() => {
  const fullRenderMap = renderMap;
  const baseRenderNow = renderNow;
  const baseRenderTrip = renderTrip;
  const baseItemActions = itemActions;

  state.decisionSelections ||= {};
  let decisionsLoaded = false;
  let decisionsLoading = false;

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

  function decisionOptions(item) {
    return Array.isArray(item?.decision?.options)
      ? item.decision.options.filter((option) => option?.id && option?.label)
      : [];
  }

  function decisionHtml(item, compact = false) {
    const decision = item?.decision;
    const options = decisionOptions(item);
    if (!decision || !options.length || !item?.id) return "";

    const selectedId = state.decisionSelections[item.id] || "";
    const selected = options.find((option) => option.id === selectedId);
    const buttons = options.map((option) => {
      const active = option.id === selectedId;
      return `<button class="button-link ${active ? "primary" : ""}" type="button" data-decision-item="${escapeAttr(item.id)}" data-decision-option="${escapeAttr(option.id)}">${active ? "✓ " : ""}${escapeHtml(option.label)}</button>`;
    }).join("");

    return `<div class="decision-card${compact ? " compact" : ""}">
      <p class="eyebrow">${escapeHtml(decision.label || "Decide on the day")}</p>
      <strong>${escapeHtml(decision.prompt || item.title || "Choose an option")}</strong>
      ${decision.context ? `<p class="timeline-note">${escapeHtml(decision.context)}</p>` : ""}
      <div class="action-row">${buttons}</div>
      ${selected?.note ? `<p class="helper-text">${escapeHtml(selected.note)}</p>` : ""}
      ${selected?.url ? `<a class="inline-link" href="${escapeAttr(selected.url)}" target="_blank" rel="noreferrer">Open selected option ↗</a>` : ""}
    </div>`;
  }

  itemActions = function handoffFirstItemActions(item) {
    return `${baseItemActions(item)}${externalLinksHtml(item)}${decisionHtml(item, true)}`;
  };

  async function ensureDecisionState() {
    if (decisionsLoaded || decisionsLoading || !state.data) return;
    decisionsLoading = true;
    try {
      state.decisionSelections = (await TravelLiteStorage.get(tripKey("decisions"))) || {};
      decisionsLoaded = true;
      render();
    } catch {
      decisionsLoaded = true;
    } finally {
      decisionsLoading = false;
    }
  }

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-decision-item][data-decision-option]");
    if (!button || !state.data) return;
    state.decisionSelections[button.dataset.decisionItem] = button.dataset.decisionOption;
    await TravelLiteStorage.set(tripKey("decisions"), state.decisionSelections);
    render();
  });

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

  function decisionSummaryCard(day) {
    const items = (day?.items || []).filter((item) => decisionOptions(item).length && !state.decisionSelections[item.id]);
    if (!items.length) return null;
    const card = document.createElement("section");
    card.className = "panel day-summary trip-decision-summary";
    card.innerHTML = `<p class="eyebrow">Decide today</p><h2>${items.length} open choice${items.length === 1 ? "" : "s"}</h2>${items.map((item) =>
      `<div class="text-card"><h3>${escapeHtml(item.title)}</h3>${decisionHtml(item)}</div>`
    ).join("")}`;
    return card;
  }

  renderNow = function handoffFirstRenderNow() {
    baseRenderNow();
    ensureDecisionState();
    const context = getNowContext();
    const stack = root.querySelector(".view-stack");
    if (!stack || context.phase !== "during") return;

    const reminders = reminderCard(context.today);
    if (reminders && !stack.querySelector(".trip-reminder-card")) stack.appendChild(reminders);

    const decisions = decisionSummaryCard(context.today);
    if (decisions && !stack.querySelector(".trip-decision-summary")) stack.appendChild(decisions);
  };

  renderTrip = function handoffFirstRenderTrip() {
    baseRenderTrip();
    ensureDecisionState();
  };

  renderMap = function handoffFirstRenderMap() {
    if (state.data?.ui?.enableExploreTools === true) {
      fullRenderMap();
      return;
    }

    // Keep the itinerary map but suppress automatic public-data enrichment and
    // discovery panels. These are optional conveniences, not core travel flow.
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
