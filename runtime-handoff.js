/*
 * Handoff-first companion layer for Travel Lite.
 *
 * Shared trip.json is authoritative. IndexedDB is device-local only.
 * Specialist apps handle reviews, live transport, booking changes and ad-hoc
 * discovery. Vibe-time research can add static info cards to trip.json.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(() => {
  const baseRenderMap = renderMap;
  const baseRenderNow = renderNow;
  const baseRenderTrip = renderTrip;
  const baseItemActions = itemActions;

  state.personalDecisionSelections ||= {};
  let decisionsLoaded = false;
  let decisionsLoading = false;

  function safeUrl(rawUrl, protocols = ["http:", "https:"]) {
    if (!rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      return protocols.includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function safeLinks(links) {
    return (Array.isArray(links) ? links : []).flatMap((link) => {
      if (!link?.label || !link?.url) return [];
      const url = safeUrl(link.url, ["http:", "https:", "tel:", "mailto:"]);
      return url ? [{ label: String(link.label), url }] : [];
    });
  }

  function linkButtonsHtml(links, className = "handoff-actions") {
    const safe = safeLinks(links);
    if (!safe.length) return "";
    return `<div class="action-row ${className}">${safe.map((link) =>
      `<a class="button-link" href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`
    ).join("")}</div>`;
  }

  function externalLinksHtml(item) {
    return linkButtonsHtml(item?.externalLinks);
  }

  function googleSearchLinksHtml(item) {
    const searches = Array.isArray(item?.googleSearches) ? item.googleSearches : [];
    const links = searches.flatMap((search) => {
      if (!search?.label || !search?.query || typeof googleMapsSearchUrl !== "function") return [];
      const url = googleMapsSearchUrl(search.query, item);
      return url ? [{ label: search.label, url }] : [];
    });
    return linkButtonsHtml(links, "google-search-handoffs");
  }

  function infoCardHtml(item) {
    const card = item?.infoCard;
    if (!card || (!card.title && !card.summary && !Array.isArray(card.facts))) return "";

    const facts = (Array.isArray(card.facts) ? card.facts : [])
      .filter(Boolean)
      .map((fact) => `<li>${escapeHtml(fact)}</li>`)
      .join("");

    const sources = linkButtonsHtml(card.sourceLinks, "info-source-links");
    const imageUrl = safeUrl(card.image);
    const image = imageUrl
      ? `<img class="info-card-image" src="${escapeAttr(imageUrl)}" alt="" loading="lazy">`
      : "";

    return `<details class="info-card">
      <summary>${escapeHtml(card.label || "About this stop")}</summary>
      <div class="info-card-body">${image}<div>
        ${card.title ? `<h3>${escapeHtml(card.title)}</h3>` : ""}
        ${card.summary ? `<p>${escapeHtml(card.summary)}</p>` : ""}
        ${facts ? `<ul>${facts}</ul>` : ""}
        ${sources}
      </div></div>
    </details>`;
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
      optionHtml = `<div class="decision-options">${options.map((option) => {
        const optionUrl = safeUrl(option.url);
        return `<div class="text-card"><strong>${escapeHtml(option.label)}</strong>${option.note ? `<p>${escapeHtml(option.note)}</p>` : ""}${optionUrl ? `<a class="inline-link" href="${escapeAttr(optionUrl)}" target="_blank" rel="noreferrer">Open option ↗</a>` : ""}</div>`;
      }).join("")}</div><p class="helper-text">Shared TBD · this page does not resolve it locally. Update trip.json after the group decides.</p>`;
    }

    const resolutionUrl = safeUrl(decision.resolutionLink?.url);
    const resolutionLink = resolutionUrl && decision.resolutionLink?.label
      ? `<a class="inline-link" href="${escapeAttr(resolutionUrl)}" target="_blank" rel="noreferrer">${escapeHtml(decision.resolutionLink.label)} ↗</a>`
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
    return `${baseItemActions(item)}${externalLinksHtml(item)}${googleSearchLinksHtml(item)}${decisionHtml(item, true)}${infoCardHtml(item)}`;
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
      const url = safeUrl(reminder.url);
      if (url) link = ` <a class="inline-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">Open ↗</a>`;
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
    baseRenderMap();

    const selectedDay = state.data.days.find((day) => day.date === state.selectedDate) || state.data.days[0];
    const selected = selectedDay?.items?.find((item) => item.id === state.selectedMapItemId)
      || selectedDay?.items?.find((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)))
      || selectedDay?.items?.[0];

    const extras = `${externalLinksHtml(selected)}${googleSearchLinksHtml(selected)}${infoCardHtml(selected)}`;
    const card = root.querySelector(".selected-place-card");
    if (card && extras) card.insertAdjacentHTML("beforeend", extras);
  };
})();
