/* Responsive shell contract. Shared trip data, different viewport composition. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const left = document.querySelector("#shell-left");
  const right = document.querySelector("#shell-right");
  const rootNode = document.querySelector("#view-root");
  const CONTEXT_SLOTS = ["primary", "secondary", "utility"];
  let scheduled = false;

  function currentTripMode() {
    if (state.view !== "trip") return "";
    if (rootNode?.querySelector("[data-trip-mode='overview'].active")) return "overview";
    return rootNode?.querySelector("[data-trip-day].active")?.dataset.tripDay || state.selectedDate || "";
  }

  function routeText(day, limit = 2) {
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

  function totalStops() {
    return (state.data.days || []).reduce((sum, day) => sum + (day.items?.length || 0), 0);
  }

  function leftRailHtml() {
    const days = state.data.days || [];
    const mode = currentTripMode();
    const tripActive = state.view === "trip";
    const dayButtons = days.map((day) => {
      const selected = tripActive && mode === day.date;
      const tbd = openChoiceCount(day);
      return `<button class="shell-day ${selected ? "active" : ""}" type="button" data-shell-day="${escapeAttr(day.date)}" ${selected ? 'aria-current="date"' : ""}>
        <span class="shell-day-date">${escapeHtml(prettyDate(day.date, { month: "numeric", day: "numeric" }))}</span>
        <span class="shell-day-copy"><strong>${escapeHtml(day.title || day.label || "Trip day")}</strong><small>${escapeHtml(routeText(day) || `${day.items?.length || 0} stops`)}</small></span>
        ${tbd ? `<span class="shell-day-badge" aria-label="${tbd} unresolved decision${tbd === 1 ? "" : "s"}">${tbd}</span>` : ""}
      </button>`;
    }).join("");

    return `<div class="shell-rail-heading">
        <div class="shell-rail-title">Trip</div>
        <small>${days.length} days · ${totalStops()} stops</small>
      </div>
      <button class="shell-overview-link ${tripActive && mode === "overview" ? "active" : ""}" type="button" data-shell-overview ${tripActive && mode === "overview" ? 'aria-current="page"' : ""}>
        <span>Overview</span><small>Whole trip</small>
      </button>
      <div class="shell-day-list" role="list" aria-label="Trip days">${dayButtons}</div>`;
  }

  function ensureRightRailContract() {
    if (!right) return;
    if (!right.querySelector("[data-shell-context-host]")) {
      right.innerHTML = `<div class="shell-context-stack composition-aside" data-shell-context-host>
        ${CONTEXT_SLOTS.map((name) => `<section class="shell-context-slot" data-shell-context-slot="${name}"></section>`).join("")}
      </div>`;
    }
    syncRightRailVisibility();
  }

  function contextSlot(name) {
    if (!CONTEXT_SLOTS.includes(name)) return null;
    ensureRightRailContract();
    return right?.querySelector(`[data-shell-context-slot="${name}"]`) || null;
  }

  function clearRightContext() {
    CONTEXT_SLOTS.forEach((name) => contextSlot(name)?.replaceChildren());
    syncRightRailVisibility();
  }

  function syncRightRailVisibility() {
    if (!right) return;
    const hasContent = CONTEXT_SLOTS.some((name) => {
      const slot = right.querySelector(`[data-shell-context-slot="${name}"]`);
      return slot && slot.childNodes.length > 0;
    });
    right.classList.toggle("has-context", hasContent);
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
    left?.querySelectorAll("[data-shell-day]").forEach((button) => button.addEventListener("click", () => goDay(button.dataset.shellDay)));
  }

  function renderContext() {
    scheduled = false;
    if (!state?.data || !left || !right) return;
    left.innerHTML = leftRailHtml();
    ensureRightRailContract();
    attachHandlers();
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(renderContext);
  }

  if (rootNode) new MutationObserver(scheduleRender).observe(rootNode, { childList: true });
  if (right) new MutationObserver(syncRightRailVisibility).observe(right, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleRender, { passive: true });

  window.TravelLiteShellContext = Object.freeze({
    slot: contextSlot,
    clear: clearRightContext,
    sync: syncRightRailVisibility,
  });

  // app.js dispatches travel-lite-ready once trip data and stored view/date are final (no timeout).
  if (state?.ready) renderContext();
  else window.addEventListener("travel-lite-ready", renderContext, { once: true });
})();
