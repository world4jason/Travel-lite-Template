/* Responsive context shell. Shared trip data, different viewport composition. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const left = document.querySelector("#shell-left");
  const right = document.querySelector("#shell-right");
  const rootNode = document.querySelector("#view-root");
  let scheduled = false;

  function safeUrl(rawUrl) {
    if (!rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function currentTripMode() {
    if (state.view !== "trip") return "";
    if (rootNode?.querySelector("[data-trip-mode='overview'].active")) return "overview";
    return rootNode?.querySelector("[data-trip-day].active")?.dataset.tripDay || state.selectedDate || "";
  }

  function selectedDay() {
    if (!state?.data?.days?.length) return null;
    const today = zonedNow(state.data.trip.timezone).date;
    return state.data.days.find((day) => day.date === state.selectedDate)
      || state.data.days.find((day) => day.date === today)
      || state.data.days[0];
  }

  function routeText(day, limit = 3) {
    const explicit = Array.isArray(day?.routeSummary) ? day.routeSummary : [];
    const source = explicit.length
      ? explicit
      : (day?.items || []).map((item) => item.routeLabel || item.title || item.location).filter(Boolean);
    const labels = source
      .map((entry) => typeof entry === "string" ? entry : entry?.label || entry?.title)
      .filter(Boolean);
    return labels.slice(0, limit).join(" → ") + (labels.length > limit ? " → …" : "");
  }

  function openChoiceCount(day) {
    return (day?.items || []).filter((item) =>
      Array.isArray(item?.decision?.options)
      && item.decision.options.length
      && !item.decision.resolvedOptionId
    ).length;
  }

  function allOpenChoiceCount() {
    return (state.data.days || []).reduce((sum, day) => sum + openChoiceCount(day), 0);
  }

  function totalStops() {
    return (state.data.days || []).reduce((sum, day) => sum + (day.items?.length || 0), 0);
  }

  function leftRailHtml() {
    const days = state.data.days || [];
    const mode = currentTripMode();
    const tripActive = state.view === "trip";
    const reservations = (state.data.reservations || []).slice(0, 2);

    const dayButtons = days.map((day) => {
      const selected = tripActive && mode === day.date;
      const tbd = openChoiceCount(day);
      return `<button class="shell-day ${selected ? "active" : ""}" type="button" data-shell-day="${escapeAttr(day.date)}">
        <span class="shell-day-date">${escapeHtml(prettyDate(day.date, { month: "numeric", day: "numeric" }))}</span>
        <span class="shell-day-copy"><strong>${escapeHtml(day.title || day.label || "Trip day")}</strong><small>${escapeHtml(routeText(day, 2) || `${day.items?.length || 0} stops`)}</small></span>
        ${tbd ? `<span class="shell-day-badge">${tbd}</span>` : ""}
      </button>`;
    }).join("");

    const referenceCards = reservations.map((item) => {
      const url = safeUrl(item.url);
      return `<article class="shell-mini-card"><span>${escapeHtml(item.type || "booking")}</span><strong>${escapeHtml(item.title || "Reservation")}</strong><p>${escapeHtml([item.date ? prettyDate(item.date) : "", item.time || item.location || ""].filter(Boolean).join(" · "))}</p>${url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">Open ↗</a>` : ""}</article>`;
    }).join("");

    return `<div class="shell-rail-title">Trip</div>
      <button class="shell-overview-link ${tripActive && mode === "overview" ? "active" : ""}" type="button" data-shell-overview>
        <span>Overview</span><small>${days.length} days · ${totalStops()} stops</small>
      </button>
      <div class="shell-day-list">${dayButtons}</div>
      ${referenceCards ? `<div class="shell-rail-section"><div class="shell-rail-title">Reference</div>${referenceCards}</div>` : ""}`;
  }

  function rightRailHtml() {
    const day = selectedDay();
    const days = state.data.days || [];
    const open = allOpenChoiceCount();
    const reminders = Array.isArray(day?.reminders) ? day.reminders.slice(0, 3) : [];
    const stops = (day?.items || []).slice(0, 5);

    const stopRows = stops.map((item, index) => `<button type="button" class="shell-stop-row" data-shell-day="${escapeAttr(day.date)}">
      <span class="shell-stop-icon">${index === 0 ? "●" : "○"}</span>
      <span><strong>${escapeHtml(item.title || "Stop")}</strong><small>${escapeHtml([item.start || "TBD", item.location || ""].filter(Boolean).join(" · "))}</small></span>
    </button>`).join("");

    const reminderRows = reminders.map((entry) => {
      const text = typeof entry === "string" ? entry : entry?.text || entry?.label || "";
      return text ? `<li>${escapeHtml(text)}</li>` : "";
    }).join("");

    return `<section class="shell-context-card">
        <div class="shell-context-heading"><strong>Trip overview</strong><span>${escapeHtml(state.data.trip.subtitle || dateRangeLabel(state.data.trip))}</span></div>
        <div class="shell-stat-grid"><span><b>${days.length}</b> days</span><span><b>${totalStops()}</b> stops</span>${open ? `<span><b>${open}</b> TBD</span>` : ""}</div>
        <p class="shell-context-muted">${escapeHtml(dateRangeLabel(state.data.trip))}</p>
      </section>
      ${day ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>${escapeHtml(day.label || "Selected day")}</strong><span>${prettyDate(day.date, { weekday: "short" })}</span></div><h3>${escapeHtml(day.title || "Trip day")}</h3><p class="shell-context-route">${escapeHtml(routeText(day, 4))}</p><div class="shell-stop-list">${stopRows}</div></section>` : ""}
      ${reminderRows ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>Remember</strong><span>${reminders.length}</span></div><ul class="shell-reminder-list">${reminderRows}</ul></section>` : ""}
      <section class="shell-context-section"><div class="shell-context-heading"><strong>Quick access</strong></div><div class="shell-quick-grid"><button type="button" data-shell-view="map">Map</button><button type="button" data-shell-view="check">Check</button><button type="button" data-shell-view="more">More</button></div></section>`;
  }

  function activateTripControl(predicate) {
    const button = [...rootNode.querySelectorAll("[data-trip-day], [data-trip-mode]")].find(predicate);
    button?.click();
  }

  function goOverview() {
    state.view = "trip";
    TravelLiteStorage.set(tripKey("ui:view"), "trip");
    renderNav();
    renderTrip();
    queueMicrotask(() => activateTripControl((button) => button.dataset.tripMode === "overview"));
  }

  function goDay(date) {
    state.view = "trip";
    state.selectedDate = date;
    TravelLiteStorage.set(tripKey("ui:view"), "trip");
    TravelLiteStorage.set(tripKey("ui:selectedDate"), date);
    renderNav();
    renderTrip();
    queueMicrotask(() => activateTripControl((button) => button.dataset.tripDay === date));
  }

  function attachHandlers() {
    left?.querySelector("[data-shell-overview]")?.addEventListener("click", goOverview);
    document.querySelectorAll("[data-shell-day]").forEach((button) => button.addEventListener("click", () => goDay(button.dataset.shellDay)));
    right?.querySelectorAll("[data-shell-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.shellView)));
  }

  function renderContext() {
    scheduled = false;
    if (!state?.data || !left || !right) return;
    left.innerHTML = leftRailHtml();
    right.innerHTML = rightRailHtml();
    attachHandlers();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(renderContext);
  }

  if (rootNode) new MutationObserver(scheduleRender).observe(rootNode, { childList: true });
  window.addEventListener("resize", scheduleRender, { passive: true });

  // app.js dispatches travel-lite-ready once trip data and stored view/date are final (no timeout).
  if (state?.ready) renderContext();
  else window.addEventListener("travel-lite-ready", renderContext, { once: true });
})();
