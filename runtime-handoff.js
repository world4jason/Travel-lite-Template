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

  state.personalDecisionSelections ||= {};
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

    const resolvedId = decision.resolvedOptionId || "";
    const resolved = options.find((option) => option.id === resolvedId);
    const personalMode = decision.mode === "personal";
    const personalSelectedId = personalMode ? (state.personalDecisionSelections[item.id] || "") : "";
    const personalSelected = options.find((option) => option.id === personalSelectedId);

    let optionHtml = "";
    if (resolved) {
      optionHtml = `<div class="action-row"><span class="button-link primary">✓ ${escapeHtml(resolved.label)}</span></div>${resolved.note ? `<p class="helper-text">${escapeHtml(resolved.note)}</p>` : ""}`;
    } else if (personalMode) {
      optionHtml = `<div class="action-row">${options.map((option) => {
        const active = option.id === personalSelectedId;
        return `<button class="button-link ${active ? "primary" : ""}" type="button" data-personal-decision-item="${escapeAttr(item.id)}" data-personal-decision-option="${escapeAttr(option.id)}">${active ? "✓ " : ""}${escapeHtml(option.label)}</button>`;
      }).join("")}</div><p class="helper-text">Personal preference · saved only on this device.</p>${personalSelected?.note ? `<p class="helper-text">${escapeHtml(personalSelected.note)}</p>` : ""}`;
    } else {
      optionHtml = `<div class="decision-options">${options.map((option) => `<div class="text-card"><strong>${escapeHtml(option.label)}</strong>${option.note ? `<p>${escapeHtml(option.note)}</p>` : ""}${option.url ? `<a class="inline-link" href="${escapeAttr(option.url)}" target="_blank" rel="noreferrer">Open option ↗</a>` : ""}</div>`).join("")}</div><p class="helper-text">Shared TBD · this page does not resolve it locally. Update trip.json after the group decides.</p>`;
    }

    const resolutionLink = decision.resolutionLink?.url && decision.resolutionLink?.label
      ? `<a class="inline-link" href="${escapeAttr(decision.resolutionLink.url)}" target="_blank" rel="noreferrer">${escapeHtml(decision.resolutionLink.label)} ↗</a>`
      : "";

    return `<div class="decision-card${compact ? " compact" : ""}">
      <p class="eyebrow">${escapeHtml(resolved ? "Resolved" : (decision.label || "TBD"))}</p>
      <strong>${escapeHtml(decision.prompt || item.title || "Decision")}</strong>
      ${decision.context ? `<p class="timeline-note">${escapeHtml(decision.context)}</p>` : ""}
      ${optionHtml}
      ${resolutionLink}
    </div>`;
  }

  itemActions = function handoffFirstItemActions(item) {
    return `${baseItemActions(item)}${externalLinksHtml(item)}${decisionHtml(item, true)}`;
  };

  async function ensureDecisionState() {
    if (decisionsLoaded || decisionsLoading || !state.data) return;
    decisionsLoading = true;
    try {
      state.personalDecisionSelections = (await TravelLiteStorage.get(tripKey("personalDecisions"))) || {};
      decisionsLoaded = true;
      render();
    } catch {
      decisionsLoaded = true;
    } finally {
      decisionsLoading = false;
    }
  }

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-personal-decision-item][data-personal-decision-option]");
    if (!button || !state.data) return;
    state.personalDecisionSelections[button.dataset.personalDecisionItem] = button.dataset.personalDecisionOption;
    await TravelLiteStorage.set(tripKey("personalDecisions"), state.personalDecisionSelections);
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
    const items = (day?.items || []).filter((item) => decisionOptions(item).length && !item.decision?.resolvedOptionId);
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
