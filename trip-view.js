/* Trip overview + compact day timeline. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  let tripMode = "overview";
  let lastRenderedDate = null;
  const TRANSPORT_MODES = Object.freeze({
    flight: { zh: "飛機", en: "Flight" },
    drive: { zh: "自駕", en: "Drive" },
    boat: { zh: "搭船", en: "Boat" },
    train: { zh: "火車", en: "Train" },
    subway: { zh: "地鐵", en: "Metro" },
    cable: { zh: "纜車", en: "Cable car" },
    bus: { zh: "巴士", en: "Bus" },
    walk: { zh: "步行", en: "Walk" },
  });
  function localized(zh, en) {
    return /^zh/i.test(state.data?.ui?.locale || "") ? zh : en;
  }
  function transportTag(item) {
    const mode = Object.hasOwn(TRANSPORT_MODES, item.transportMode) ? TRANSPORT_MODES[item.transportMode] : null;
    if (!mode) return "";
    const name = localized(mode.zh, mode.en);
    return `<span class="transport-tag transport-tag--${item.transportMode}" aria-label="${escapeAttr(name)}"><span aria-hidden="true">${(window.TravelLiteIcons?.svg?.(item.transportMode) || "")}</span>${escapeHtml(name)}</span>`;
  }
  function hasTimedStart(item) {
    // Trip follows the published HH:MM contract in every appearance. Keep
    // the existing end-time parser/window policy separate from this gate.
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(item.start || "");
  }
  // The itinerary source owns the only visible sequence: time ranges for all kinds.
  function validTimelineClock(value) {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }
  function timeLabel(item, day) {
    if (!hasTimedStart(item)) {
      const label = typeof item.timeLabel === "string" && item.timeLabel.trim()
        ? item.timeLabel.trim() : localized("時間未定", "Time TBD");
      return '<span class="timeline-time timeline-time--floating">' + escapeHtml(label) + '</span>';
    }
    const hasEnd = validTimelineClock(item.end);
    const end = hasEnd ? item.end : localized("待定", "TBD");
    const nextDay = hasEnd && item.end < item.start && !item.endDate;
    const dayZone = day?.timezone || state.data?.trip?.timezone || "";
    const zone = item.timezone && item.timezone !== dayZone ? item.timezone : "";
    const label = item.start + "–" + end + (nextDay ? " (+1 day)" : "") + (zone ? " " + zone : "");
    return '<span class="timeline-time timeline-time--range" aria-label="' + escapeAttr(label) + '">' +
      '<time datetime="' + escapeAttr(item.start) + '">' + escapeHtml(item.start) + '</time>' +
      '<span class="timeline-time-divider" aria-hidden="true">–</span>' +
      (hasEnd ? '<time datetime="' + escapeAttr(item.end) + '">' + escapeHtml(item.end) + '</time>'
        : '<span class="timeline-time-pending">' + escapeHtml(end) + '</span>') +
      (nextDay ? '<small class="timeline-time-zone">+1 day</small>' : '') +
      (zone ? '<small class="timeline-time-zone">' + escapeHtml(zone) + '</small>' : '') +
      '</span>';
  }

  function chronologicalDiagnostics(day) {
    const toEpoch = window.TravelLiteTime?.localDateTimeToEpoch;
    if (typeof toEpoch !== "function") return [];
    const problems = [];
    let last = null;
    for (const item of day.items || []) {
      if (!hasTimedStart(item)) continue;
      const zone = item.timezone || day.timezone || state.data?.trip?.timezone;
      const date = item.startDate || day.date;
      const startEpoch = toEpoch(date, item.start, zone);
      if (!Number.isFinite(startEpoch)) continue;
      let endEpoch = validTimelineClock(item.end) ? toEpoch(item.endDate || date, item.end, zone) : NaN;
      if (Number.isFinite(endEpoch) && endEpoch < startEpoch && !item.endDate) {
        const nextDate = new Date(date + "T12:00:00Z");
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        endEpoch = toEpoch(nextDate.toISOString().slice(0, 10), item.end, zone);
      }
      if (last && startEpoch < last.startEpoch) {
        problems.push(localized("時間倒序：", "Out of order: ") + (item.title || item.id));
      } else if (last && Number.isFinite(last.endEpoch) && startEpoch < last.endEpoch) {
        problems.push(localized("時間重疊：", "Overlap: ") +
          (last.item.title || last.item.id) + " / " + (item.title || item.id));
      }
      last = { item, startEpoch, endEpoch };
    }
    return problems;
  }

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
      ? `<a class="trip-icon-action" href="${escapeAttr(mapUrl)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeAttr(item.title || "stop")} in Google Maps" title="Google Maps"><span aria-hidden="true">${(window.TravelLiteIcons?.svg?.("map-pin") || "")}</span></a>`
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
    return [...template.content.querySelectorAll(".decision-card, .info-card, .trip-alternatives")]
      .map((node) => node.outerHTML)
      .join("");
  }

  function transferHtml(item, next, day) {
    const transfer = item?.transferAfter;
    if (!transfer || next?.type === "transport") return "";
    const url = safeUrl(transfer.url);
    const structured = window.TravelLiteTransit?.durationText(transfer.estimate) || "";
    const meta = [transfer.mode, structured || transfer.duration].filter(Boolean).join(" · ");
    return `<div class="trip-transfer">
      <span class="trip-transfer-arrow" aria-hidden="true">↓</span>
      <div class="trip-transfer-copy">
        <strong>${escapeHtml(transfer.label || "Transfer")}</strong>
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
        ${transfer.summary ? `<p>${escapeHtml(transfer.summary)}</p>` : ""}
        ${window.TravelLiteTransit?.timingHtml(transfer, item, next, day) || ""}
        ${window.TravelLitePlanB?.(transfer.planB) || ""}
      </div>
      ${url ? `<a class="trip-transfer-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer" aria-label="Open transfer details">↗</a>` : ""}
    </div>`;
  }

  function routeSummaryCard(day) {
    const stops = routeStops(day);
    if (!stops.length) return "";
    const first = stops[0];
    const last = stops[stops.length - 1];
    return `<section class="trip-route-summary composition-operational">
      <div class="trip-route-heading"><div><h3>${escapeHtml(day.routeLabel || "At a glance")}</h3></div><span>${stops.length} stop${stops.length === 1 ? "" : "s"}</span></div>
      <div class="trip-route-endpoints" data-surface-role="route-endpoints"><div><small>Start</small><strong>${escapeHtml(first)}</strong></div><span aria-hidden="true">→</span><div class="end"><small>End</small><strong>${escapeHtml(last)}</strong></div></div>
      ${stops.length > 2 ? `<div class="trip-route-steps">${stops.map((stop, index) => `<span data-surface-role="route-step"><b>${index + 1}</b>${escapeHtml(stop)}</span>`).join("")}</div>` : ""}
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
    return `<article class="trip-highlight-card composition-narrative">
      <div class="trip-highlight-meta"><span>${escapeHtml(highlightDate(highlight))}</span>${highlight.status ? `<small>${escapeHtml(highlight.status)}</small>` : ""}</div>
      <h3>${(window.TravelLiteIcons?.svg?.(highlight.icon) || "") ? `<span class="trip-highlight-icon" aria-hidden="true">${(window.TravelLiteIcons?.svg?.(highlight.icon) || "")}</span>` : ""}<span class="trip-highlight-title">${escapeHtml(highlight.title || "Activity")}</span></h3>
      ${highlight.note ? `<p>${escapeHtml(highlight.note)}</p>` : ""}
      ${url ? `<a class="trip-text-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">Open details ↗</a>` : ""}
    </article>`;
  }


  // Overview is a compact reference projection, not another itinerary table.
  // All metadata comes from the published days/items; mobility is optional.
  function overviewModeIcons(day) {
    const seen = new Set();
    const modes = (day.items || []).filter((item) => item.type === "transport")
      .map((item) => item.transportMode)
      .filter((mode) => {
        if (!Object.hasOwn(TRANSPORT_MODES, mode) || seen.has(mode)) return false;
        seen.add(mode);
        return true;
      }).slice(0, 3);
    return modes.map((mode) => {
      const svg = window.TravelLiteIcons?.svg?.(mode) || "";
      const name = TRANSPORT_MODES[mode];
      return svg ? `<span title="${escapeAttr(localized(name.zh, name.en))}">${svg}</span>` : "";
    }).join("");
  }

  function overviewDayCard(day, index) {
    const open = unresolvedItems(day).length;
    const title = day.shortTitle || day.title || localized("當日行程", "Trip day");
    const route = dayRouteText(day);
    const routeLine = route === "No route summary" || route === title ? "" : route;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(day.date || "")
      ? day.date.slice(5).replace("-", "/") : prettyDate(day.date);
    const modes = overviewModeIcons(day);
    const authoredCue = typeof day.overviewCue === "string" ? day.overviewCue.trim() : "";
    const cue = authoredCue || (open ? localized(`${open} 項待確認`, `${open} open choices`) : "");
    return `<button class="trip-overview-day trip-overview-compact-day composition-sequence" type="button" data-trip-day="${escapeAttr(day.date)}">
      <span class="trip-compact-day-index"><time datetime="${escapeAttr(day.date)}">${escapeHtml(date)}</time><strong>${String(index + 1).padStart(2, "0")}</strong></span>
      <span class="trip-compact-day-main"><strong>${escapeHtml(title)}</strong>${routeLine ? `<small>${escapeHtml(routeLine)}</small>` : ""}</span>
      <span class="trip-compact-day-signals">${modes ? `<span class="trip-compact-day-modes" aria-hidden="true">${modes}</span>` : ""}${cue ? `<small>${escapeHtml(cue)}</small>` : ""}</span>
      <span class="trip-compact-day-chevron" aria-hidden="true">›</span>
    </button>`;
  }

  function renderOverview() {
    lastRenderedDate = null;
    const days = state.data.days || [];
    const highlights = Array.isArray(state.data.highlights) ? state.data.highlights : [];
    const openDecisions = days.flatMap((day) => unresolvedItems(day).map((item) => ({ day, item })));
    const stopCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0);

    root.innerHTML = `<div class="trip-v2 trip-overview-view">
      ${tripTabs()}
      <section class="trip-overview-hero trip-overview-compact-hero composition-identity" aria-label="${escapeAttr(localized("旅程總覽", "Trip overview"))}">
        <div class="trip-compact-cover-top"><span>${escapeHtml(localized("旅程總覽", "Trip overview"))}</span><time>${escapeHtml(dateRangeLabel(state.data.trip))}</time></div>
        <h2>${escapeHtml(state.data.trip.title)}</h2>
        <div class="trip-overview-stats trip-overview-compact-stats"><span><strong>${days.length}</strong> ${localized("天", "days")}</span><span><strong>${stopCount}</strong> ${localized("行程項目", "itinerary items")}</span>${openDecisions.length ? `<span><strong>${openDecisions.length}</strong> ${localized("項待確認", "open choices")}</span>` : ""}</div>
      </section>
      <section class="trip-overview-days trip-overview-compact-days" aria-label="${escapeAttr(localized("每日總覽", "Daily overview"))}">${days.map(overviewDayCard).join("")}</section>
      ${window.TravelLitePlanB?.(state.data.pocketPicks, localized("口袋清單", "Pocket picks")) || ""}
      ${highlights.length ? `<section class="trip-overview-section"><div class="trip-section-heading"><div><p class="eyebrow">Flexible</p><h2>Highlights & activities</h2></div><span>${highlights.length}</span></div><div class="trip-highlight-grid">${highlights.map(highlightCard).join("")}</div></section>` : ""}
      ${openDecisions.length ? `<section class="trip-overview-section"><div class="trip-section-heading"><div><p class="eyebrow">TBD</p><h2>Open decisions</h2></div><span>${openDecisions.length}</span></div><div class="trip-open-decisions">${openDecisions.map(({ day, item }) => `<button type="button" class="trip-open-decision composition-narrative" data-trip-day="${escapeAttr(day.date)}"><span>${prettyDate(day.date, { weekday: "short" })}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.decision?.prompt || "Decide on the day")}</p><small>View day →</small></button>`).join("")}</div></section>` : ""}
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

  // Keep the published source untouched; avoid showing title/location or
  // time/duration twice in the *visible* itinerary card.
  function conciseLocation(item) {
    const location = typeof item.location === "string" ? item.location.trim() : "";
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!location) return "";
    const normalized = value => value.replace(/\s+/g, "").replace(/[：:]/g, ":");
    return normalized(location) === normalized(title) ? "" : location;
  }
  function conciseNote(item) {
    let note = typeof item.note === "string" ? item.note.trim() : "";
    if (!note) return "";
    const prefix = note.match(/^約?\s*(\d{2}:\d{2})\s*[-–—]\s*(\d{2}:\d{2})\s*[|｜]\s*/);
    if (prefix && prefix[1] === item.start && prefix[2] === item.end)
      note = note.slice(prefix[0].length).trim();
    if (/^(?:步行|停留)約?\s*\d+(?:\s*[–-]\s*\d+)?\s*分鐘[。.]?$/u.test(note))
      return "";
    return note;
  }

  function journeyLegsHtml(entry) {
    if (entry.kind !== "journey") return "";
    const list = entry.legs.map(leg => {
      const mode = transportTag(leg);
      const start = validTimelineClock(leg.start) ? leg.start : localized("待定", "TBD");
      const end = validTimelineClock(leg.end) ? leg.end : localized("待定", "TBD");
      return '<li class="trip-journey-leg" data-timeline-leg-id="' + escapeAttr(leg.id || "") +
        '" data-source-item-id="' + escapeAttr(leg.id || "") + '">' +
        '<span class="trip-journey-leg-time">' + escapeHtml(start) + '–' + escapeHtml(end) + '</span>' +
        '<div class="trip-journey-leg-main"><div class="trip-journey-leg-heading">' +
        mode + '<strong>' + escapeHtml(leg.title || localized("交通", "Transit")) + '</strong></div>' +
        (conciseLocation(leg) ? '<p>' + escapeHtml(conciseLocation(leg)) + '</p>' : "") +
        (conciseNote(leg) ? '<p>' + escapeHtml(conciseNote(leg)) + '</p>' : "") +
        supplementaryContent(leg) + '</div>' + compactActions(leg) + '</li>';
    }).join("");
    const summary = localized("查看", "Show") + " " + entry.legs.length + " " +
      localized("段交通／轉乘明細", "travel legs / transfers");
    return '<details class="trip-journey-details"><summary>' +
      '<span>' + escapeHtml(summary) + '</span><span class="trip-journey-chevron" aria-hidden="true">⌄</span></summary>' +
      '<ol class="trip-journey-legs" role="list">' + list + '</ol>' +
      '<p class="trip-journey-map-note">' + escapeHtml(localized("Google Maps 可能推薦不同路線／班次，請以業者資訊為準。", "Google Maps may suggest different routes or times; check the operator.")) + '</p></details>';
  }

  function renderDay(day) {
    const isNewDay = lastRenderedDate !== day.date;
    lastRenderedDate = day.date;

    const currentDate = zonedNow(state.data.trip.timezone).date;
    const now = zonedNow(state.data.trip.timezone);
    const chronologyWarnings = chronologicalDiagnostics(day);
    const entries = window.TravelLiteJourneys?.groupItems?.(day.items || [], state.data?.ui?.locale) ||
      (day.items || []).map(item => ({kind:"item",item,first:item,last:item,legs:[]}));
    const timeline = entries.map((entry, index) => {
      const item = entry.item;
      const journey = entry.kind === "journey";
      const isCurrent = hasTimedStart(item) && day.date === currentDate &&
        now.minuteOfDay >= toMinutes(item.start) &&
        now.minuteOfDay < toMinutes(item.end || item.start);

      const highlight = item.mustGo === true
        ? `<span class="must-go-tag" aria-label="${localized("編輯精選", "Curated highlight")}">${localized("★ 必去", "★ Highlight")}</span>`
        : "";
      const mode = journey
        ? [...new Set(entry.legs.map(leg => leg.transportMode))].map(transportMode =>
          transportTag({transportMode})).join("")
        : transportTag(item);
      // Every trusted A→B transport can link to directions, including a
      // single walking or rail leg. Grouped Journeys use their outer endpoints.
      const directionsTarget = journey ? entry : item.type === "transport"
        ? {route:window.TravelLiteJourneys?.routeFromLeg?.(item),legs:[item]} : null;
      const journeyUrl = directionsTarget
        ? safeUrl(window.TravelLiteJourneys?.directionsUrl?.(directionsTarget)) : "";
      const journeyAction = journeyUrl
        ? '<a class="trip-journey-directions" href="' + escapeAttr(journeyUrl) +
          '" target="_blank" rel="noopener noreferrer" aria-label="' +
          escapeAttr(localized("Google Maps 路線：", "Google Maps directions: ") + item.title) +
          '">' + escapeHtml(item.title) + ' <span class="trip-journey-map-cta">' +
          (window.TravelLiteIcons?.svg?.("map-pin") || "") +
          '<span aria-hidden="true">↗</span></span></a>'
        : escapeHtml(item.title);
      const placeLink = !journey && window.TravelLitePlaces?.isPlace(item) && state.itemIdentity?.isUnique(item.id) ?
        `<button type="button" class="trip-place-detail" data-open-place="${escapeAttr(item.id)}" aria-label="${escapeAttr(localized("開啟景點詳情", "Open place details"))}">${localized("景點資訊", "Place details")} ↗</button>` :
        window.TravelLitePlaces?.isPlace(item) && state.itemIdentity?.isAmbiguous(item.id)
          ? `<span class="trip-identity-warning">${localized("來源 ID 重複，景點連結暫停", "Duplicate source ID — place link unavailable")}</span>` : "";
      const itemTop = `<div class="trip-item-top"><div><div class="item-heading"><h3>${journeyAction}</h3>${highlight}${placeLink}</div>${mode ? `<div class="trip-transport-meta">${mode}</div>` : ""}${conciseLocation(item) ? `<p>${escapeHtml(conciseLocation(item))}</p>` : ""}</div>${journey ? "" : compactActions(item)}</div>`;
      const details = `<div class="timeline-content">${itemTop}${conciseNote(item) ? `<p class="timeline-note">${escapeHtml(conciseNote(item))}</p>` : ""}${journey ? journeyLegsHtml(entry) : supplementaryContent(item)}</div>`;
      const currentClass = isCurrent ? "current" : "";
      return `<li class="trip-stop-wrap">
        <article class="timeline-item trip-v2-item ${currentClass} ${item.mustGo === true ? "trip-must-go" : ""}" data-timeline-kind="${escapeAttr(item.type || "activity")}" data-timeline-item-id="${escapeAttr(item.id || "")}" data-journey-group="${journey ? "true" : "false"}">
          ${timeLabel(item, day)}
          <div class="timeline-rail" aria-hidden="true"><div class="timeline-dot"></div></div>
          ${details}
        </article>${index < entries.length - 1 ? transferHtml(entry.last, entries[index + 1].first, day) : ""}
      </li>`;
    }).join("");

    const dayNote = typeof day.note === "string" ? day.note.trim() : "";
    const usefulNote = dayNote && !/^依實走順序串起交通與遊覽/.test(dayNote);
    const noteDetail = usefulNote ? `<details class="trip-day-note"><summary>${localized("備註", "Notes")}</summary><p>${escapeHtml(dayNote)}</p></details>` : "";
    const summary = `<section class="day-summary composition-identity">
        <p class="eyebrow">${escapeHtml(day.label || "")} · ${prettyDate(day.date, { weekday: "short" })}</p>
        <h2>${escapeHtml(day.title || "Trip")}</h2>
        <p>${entries.length} ${localized("項行程", "planned stops")}</p>
        ${noteDetail}
      </section>`;

    const timelineView = `<section class="trip-timeline-section" aria-labelledby="trip-timeline-title">
        <div class="trip-timeline-heading"><h2 id="trip-timeline-title" class="trip-timeline-title">${localized("每日時間軸", "Day timeline")}</h2></div>
        ${chronologyWarnings.length ? '<div class="timeline-chronology-warning" role="status"><strong>' + localized("請核對行程時間", "Check published times") + '</strong><ul>' + chronologyWarnings.map(x => '<li>' + escapeHtml(x) + '</li>').join("") + '</ul></div>' : ""}
        <ol class="timeline trip-v2-timeline composition-sequence" role="list" aria-labelledby="trip-timeline-title">${timeline}</ol>
        ${timeline ? "" : '<div class="empty-state"><p>No plans yet.</p></div>'}
      </section>`;

    root.innerHTML = `<div class="trip-v2 trip-day-view ${isNewDay ? "day-switch-enter" : ""}">
      ${tripTabs()}
      ${summary}
      ${routeSummaryCard(day)}
      ${window.TravelLitePlanB?.(day.planB) || ""}
      ${timelineView}
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
    // Trip's Overview/Day mode is independent. Inside Day mode the date is
    // shared: if Transport/Places changed it, use that date instead of a
    // stale private tripMode date.
    if (state.data.days.some((candidate) => candidate.date === state.selectedDate))
      tripMode = state.selectedDate;
    const day = state.data.days.find((candidate) => candidate.date === tripMode)
      || state.data.days.find((candidate) => candidate.date === state.selectedDate)
      || state.data.days[0];
    tripMode = day.date;
    state.selectedDate = day.date;
    renderDay(day);
  };
})();
