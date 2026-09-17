/* Trip overview + compact day timeline. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  let tripMode = "overview";

  function safeUrl(rawUrl, protocols = ["http:", "https:"]) {
    if (!rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      return protocols.includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function routeStops(day) {
    const explicit = Array.isArray(day?.routeSummary) ? day.routeSummary : [];
    const source = explicit.length
      ? explicit
      : (day?.items || []).map((item) => item.routeLabel || item.title || item.location).filter(Boolean);
    const seen = new Set();
    return source
      .map((entry) => typeof entry === "string" ? entry : entry?.label || entry?.title)
      .filter(Boolean)
      .filter((label) => {
        const key = String(label).trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function unresolvedItems(day) {
    return (day?.items || []).filter((item) =>
      Array.isArray(item?.decision?.options)
      && item.decision.options.length
      && !item.decision.resolvedOptionId
    );
  }

  function dayRouteText(day) {
    const stops = routeStops(day);
    if (!stops.length) return "No route summary";
    return stops.slice(0, 5).join(" → ") + (stops.length > 5 ? " → …" : "");
  }

  function secondaryLinks(item) {
    const links = [];
    (Array.isArray(item?.externalLinks) ? item.externalLinks : []).forEach((link) => {
      if (!link?.label) return;
      const url = safeUrl(link.url, ["http:", "https:", "tel:", "mailto:"]);
      if (url) links.push({ label: link.label, url });
    });
    (Array.isArray(item?.googleSearches) ? item.googleSearches : []).forEach((search) => {
      if (!search?.label || !search?.query || typeof googleMapsSearchUrl !== "function") return;
      const url = safeUrl(googleMapsSearchUrl(search.query, item));
      if (url) links.push({ label: search.label, url });
    });
    return links;
  }

  function compactActions(item) {
    const mapUrl = safeUrl(googleMapsOpenUrl(item));
    const secondary = secondaryLinks(item);
    if (!mapUrl && !secondary.length) return "";

    const map = mapUrl
      ? `<a class="trip-icon-action" href="${escapeAttr(mapUrl)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeAttr(item.title || "stop")} in Google Maps" title="Google Maps"><span aria-hidden="true">📍</span></a>`
      : "";

    const more = secondary.length
      ? `<details class="trip-action-menu"><summary aria-label="More links" title="More links">•••</summary><div class="trip-action-menu-body">${secondary.map((link) => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`).join("")}</div></details>`
      : "";

    return `<div class="trip-compact-actions">${map}${more}</div>`;
  }

  function supplementaryContent(item) {
    if (typeof itemActions !== "function") return "";
    const template = document.createElement("template");
    template.innerHTML = itemActions(item);
    return [...template.content.querySelectorAll(".decision-card, .info-card")]
      .map((node) => node.outerHTML)
      .join("");
  }

  function transferHtml(item) {
    const transfer = item?.transferAfter;
    if (!transfer) return "";
    const url = safeUrl(transfer.url);
    const meta = [transfer.mode, transfer.duration].filter(Boolean).join(" · ");
    return `<div class="trip-transfer">
      <span class="trip-transfer-arrow" aria-hidden="true">↓</span>
      <div class="trip-transfer-copy">
        <strong>${escapeHtml(transfer.label || "Transfer")}</strong>
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
        ${transfer.summary ? `<p>${escapeHtml(transfer.summary)}</p>` : ""}
      </div>
      ${url ? `<a class="trip-transfer-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer" aria-label="Open transfer details">↗</a>` : ""}
    </div>`;
  }

  function routeSummaryCard(day) {
    const stops = routeStops(day);
    if (!stops.length) return "";
    const first = stops[0];
    const last = stops[stops.length - 1];
    return `<section class="panel trip-route-summary">
      <div class="trip-route-heading"><div><p class="eyebrow">Day route</p><h3>${escapeHtml(day.routeLabel || "At a glance")}</h3></div><span>${stops.length} stop${stops.length === 1 ? "" : "s"}</span></div>
      <div class="trip-route-endpoints"><div><small>Start</small><strong>${escapeHtml(first)}</strong></div><span aria-hidden="true">→</span><div class="end"><small>End</small><strong>${escapeHtml(last)}</strong></div></div>
      ${stops.length > 2 ? `<div class="trip-route-steps">${stops.map((stop, index) => `<span><b>${index + 1}</b>${escapeHtml(stop)}</span>`).join("")}</div>` : ""}
    </section>`;
  }

  function highlightDate(highlight) {
    if (highlight.dateLabel) return highlight.dateLabel;
    if (highlight.date) return prettyDate(highlight.date, { weekday: "short" });
    if (highlight.startDate && highlight.endDate) return `${prettyDate(highlight.startDate)} – ${prettyDate(highlight.endDate)}`;
    if (highlight.startDate) return prettyDate(highlight.startDate);
    return "Flexible";
  }

  function highlightCard(highlight) {
    const url = safeUrl(highlight.url);
    return `<article class="panel trip-highlight-card">
      <div class="trip-highlight-meta"><span>${escapeHtml(highlightDate(highlight))}</span>${highlight.status ? `<small>${escapeHtml(highlight.status)}</small>` : ""}</div>
      <h3>${highlight.icon ? `<span aria-hidden="true">${escapeHtml(highlight.icon)}</span> ` : ""}${escapeHtml(highlight.title || "Activity")}</h3>
      ${highlight.note ? `<p>${escapeHtml(highlight.note)}</p>` : ""}
      ${url ? `<a class="trip-text-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">Open details ↗</a>` : ""}
    </article>`;
  }

  function overviewDayCard(day) {
    const open = unresolvedItems(day).length;
    return `<button class="panel trip-overview-day" type="button" data-trip-day="${escapeAttr(day.date)}">
      <div class="trip-overview-day-meta"><span>${escapeHtml(day.label || "Day")}</span><time>${prettyDate(day.date, { weekday: "short" })}</time></div>
      <h3>${escapeHtml(day.title || "Trip day")}</h3>
      <p>${escapeHtml(dayRouteText(day))}</p>
      <div class="trip-overview-day-foot"><span>${day.items?.length || 0} planned</span>${open ? `<span class="trip-open-count">${open} TBD</span>` : ""}<span aria-hidden="true">→</span></div>
    </button>`;
  }

  function renderOverview() {
    const days = state.data.days || [];
    const highlights = Array.isArray(state.data.highlights) ? state.data.highlights : [];
    const openDecisions = days.flatMap((day) => unresolvedItems(day).map((item) => ({ day, item })));
    const stopCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0);

    root.innerHTML = `<div class="trip-v2 trip-overview-view">
      ${tripTabs()}
      <section class="panel trip-overview-hero">
        <p class="eyebrow">Trip overview</p>
        <h2>${escapeHtml(state.data.trip.title)}</h2>
        <p>${escapeHtml(dateRangeLabel(state.data.trip))}</p>
        <div class="trip-overview-stats"><span><strong>${days.length}</strong> days</span><span><strong>${stopCount}</strong> planned stops</span>${openDecisions.length ? `<span><strong>${openDecisions.length}</strong> open choice${openDecisions.length === 1 ? "" : "s"}</span>` : ""}</div>
      </section>
      <section class="trip-overview-days" aria-label="Daily overview">${days.map(overviewDayCard).join("")}</section>
      ${highlights.length ? `<section class="trip-overview-section"><div class="trip-section-heading"><div><p class="eyebrow">Flexible</p><h2>Highlights & activities</h2></div><span>${highlights.length}</span></div><div class="trip-highlight-grid">${highlights.map(highlightCard).join("")}</div></section>` : ""}
      ${openDecisions.length ? `<section class="trip-overview-section"><div class="trip-section-heading"><div><p class="eyebrow">TBD</p><h2>Open decisions</h2></div><span>${openDecisions.length}</span></div><div class="trip-open-decisions">${openDecisions.map(({ day, item }) => `<button type="button" class="panel trip-open-decision" data-trip-day="${escapeAttr(day.date)}"><span>${prettyDate(day.date, { weekday: "short" })}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.decision?.prompt || "Decide on the day")}</p><small>View day →</small></button>`).join("")}</div></section>` : ""}
    </div>`;

    attachOverviewHandlers();
  }

  function tripTabs() {
    const overview = `<button class="day-chip trip-overview-chip ${tripMode === "overview" ? "active" : ""}" type="button" data-trip-mode="overview"><strong>Overview</strong><small>Trip</small></button>`;
    const days = state.data.days.map((day) => `<button class="day-chip ${tripMode === day.date ? "active" : ""}" type="button" data-trip-day="${escapeAttr(day.date)}"><strong>${escapeHtml(day.label)}</strong><small>${prettyDate(day.date)}</small></button>`).join("");
    return `<div class="day-tabs trip-v2-tabs" aria-label="Trip sections">${overview}${days}</div>`;
  }

  function attachOverviewHandlers() {
    root.querySelectorAll("[data-trip-day]").forEach((button) => button.addEventListener("click", () => {
      tripMode = button.dataset.tripDay;
      state.selectedDate = tripMode;
      TravelLiteStorage.set(tripKey("ui:selectedDate"), state.selectedDate);
      renderTrip();
    }));
    root.querySelector("[data-trip-mode='overview']")?.addEventListener("click", () => {
      tripMode = "overview";
      renderTrip();
    });
  }

  function renderDay(day) {
    const currentDate = zonedNow(state.data.trip.timezone).date;
    const now = zonedNow(state.data.trip.timezone);
    const timeline = (day.items || []).map((item, index) => {
      const isCurrent = day.date === currentDate && now.minuteOfDay >= toMinutes(item.start) && now.minuteOfDay < toMinutes(item.end || item.start);
      return `<div class="trip-stop-wrap">
        <article class="timeline-item trip-v2-item ${isCurrent ? "current" : ""}">
          <div class="timeline-time">${escapeHtml(item.start || "TBD")}</div>
          <div class="timeline-rail"><div class="timeline-dot"></div></div>
          <div class="timeline-content">
            <div class="trip-item-top"><div><div class="item-heading"><h3>${escapeHtml(item.title)}</h3>${item.type ? `<span class="type-pill">${escapeHtml(item.type)}</span>` : ""}</div>${item.location ? `<p>${escapeHtml(item.location)}</p>` : ""}</div>${compactActions(item)}</div>
            ${item.note ? `<p class="timeline-note">${escapeHtml(item.note)}</p>` : ""}
            ${supplementaryContent(item)}
          </div>
        </article>
        ${index < day.items.length - 1 ? transferHtml(item) : ""}
      </div>`;
    }).join("");

    root.innerHTML = `<div class="trip-v2 trip-day-view">
      ${tripTabs()}
      <section class="panel day-summary"><p class="eyebrow">${escapeHtml(day.label || "")} · ${prettyDate(day.date, { weekday: "short" })}</p><h2>${escapeHtml(day.title || "Trip")}</h2><p>${day.items?.length || 0} planned stop${day.items?.length === 1 ? "" : "s"}</p>${day.note ? `<p class="day-note">${escapeHtml(day.note)}</p>` : ""}</section>
      ${routeSummaryCard(day)}
      <section class="panel timeline trip-v2-timeline">${timeline || `<div class="empty-state"><p>No plans yet.</p></div>`}</section>
    </div>`;

    attachOverviewHandlers();
  }

  renderTrip = function renderTripOverviewV2() {
    if (!state.data?.days?.length) {
      root.innerHTML = `<section class="panel empty-state"><p>No trip days yet.</p></section>`;
      return;
    }
    if (tripMode === "overview") {
      renderOverview();
      return;
    }
    const day = state.data.days.find((candidate) => candidate.date === tripMode)
      || state.data.days.find((candidate) => candidate.date === state.selectedDate)
      || state.data.days[0];
    tripMode = day.date;
    state.selectedDate = day.date;
    renderDay(day);
  };
})();
