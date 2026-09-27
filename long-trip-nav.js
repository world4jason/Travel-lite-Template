/* Compact mobile navigation for long trips. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const LONG_TRIP_THRESHOLD = 8;
  const rootNode = document.querySelector("#view-root");
  if (!rootNode) return;

  function isChinese() {
    const locale = state?.data?.ui?.locale || document.documentElement.lang || navigator.language || "";
    return /^zh(?:-|$)/i.test(locale);
  }

  function label(key, english, chinese) {
    const override = state?.data?.ui?.labels?.[key];
    return String(override || (isChinese() ? chinese : english));
  }

  function tripContainer() {
    return state?.view === "trip" ? rootNode.querySelector(".trip-v2") : null;
  }

  function selectedMode(container) {
    if (container?.querySelector("[data-trip-mode='overview'].active")) return "overview";
    return container?.querySelector("[data-trip-day].active")?.dataset.tripDay || state?.selectedDate || "overview";
  }

  function currentTripDate() {
    const current = window.TravelLiteTime?.currentTripDay?.();
    if (current?.date && state.data.days.some((day) => day.date === current.date)) return current.date;
    return "";
  }

  function optionLabel(day, index) {
    const dayLabel = day.label || `${label("longTripDay", "Day", "第")} ${index + 1}`;
    const date = prettyDate(day.date, { month: "short", day: "numeric" });
    const title = day.title || "";
    return [dayLabel, date, title].filter(Boolean).join(" · ");
  }

  function controlFor(mode) {
    const container = tripContainer();
    if (!container) return null;
    if (mode === "overview") return container.querySelector("[data-trip-mode='overview']");
    return [...container.querySelectorAll("[data-trip-day]")].find((button) => button.dataset.tripDay === mode) || null;
  }

  function navigate(mode) {
    controlFor(mode)?.click();
  }

  function renderNavigator() {
    if (!state?.data?.days || state.data.days.length < LONG_TRIP_THRESHOLD) {
      rootNode.querySelector(".trip-v2")?.removeAttribute("data-long-trip");
      rootNode.querySelector(".long-trip-nav")?.remove();
      return;
    }

    const container = tripContainer();
    if (!container) return;
    container.dataset.longTrip = "true";

    const days = state.data.days;
    const mode = selectedMode(container);
    const dayIndex = days.findIndex((day) => day.date === mode);
    const previousMode = mode === "overview" ? "" : (dayIndex <= 0 ? "overview" : days[dayIndex - 1].date);
    const nextMode = mode === "overview" ? days[0]?.date || "" : (dayIndex >= 0 && dayIndex < days.length - 1 ? days[dayIndex + 1].date : "");
    const today = currentTripDate();

    const navigator = document.createElement("nav");
    navigator.className = "long-trip-nav";
    navigator.setAttribute("aria-label", label("longTripNavigation", "Trip day navigation", "旅程日期導覽"));
    navigator.innerHTML = `
      <button class="long-trip-step" type="button" data-long-trip-prev ${previousMode ? "" : "disabled"} aria-label="${escapeAttr(label("longTripPrevious", "Previous day", "前一天"))}">←</button>
      <label class="long-trip-select-wrap">
        <span class="long-trip-sr-only">${escapeHtml(label("longTripChooseDay", "Choose trip day", "選擇日期"))}</span>
        <select class="long-trip-select" data-long-trip-select aria-label="${escapeAttr(label("longTripChooseDay", "Choose trip day", "選擇日期"))}">
          <option value="overview" ${mode === "overview" ? "selected" : ""}>${escapeHtml(label("overview", "Overview", "總覽"))}</option>
          ${days.map((day, index) => `<option value="${escapeAttr(day.date)}" ${mode === day.date ? "selected" : ""}>${escapeHtml(optionLabel(day, index))}</option>`).join("")}
        </select>
      </label>
      <button class="long-trip-step" type="button" data-long-trip-next ${nextMode ? "" : "disabled"} aria-label="${escapeAttr(label("longTripNext", "Next day", "後一天"))}">→</button>
      <div class="long-trip-quick">
        <button type="button" data-long-trip-overview class="${mode === "overview" ? "active" : ""}">${escapeHtml(label("overview", "Overview", "總覽"))}</button>
        ${today ? `<button type="button" data-long-trip-today class="${mode === today ? "active" : ""}">${escapeHtml(label("today", "Today", "今天"))}</button>` : ""}
        <span>${escapeHtml(`${days.length} ${label("longTripDays", "days", "天")}`)}</span>
      </div>`;

    container.querySelector(".long-trip-nav")?.remove();
    container.prepend(navigator);

    navigator.querySelector("[data-long-trip-select]")?.addEventListener("change", (event) => navigate(event.target.value));
    navigator.querySelector("[data-long-trip-prev]")?.addEventListener("click", () => previousMode && navigate(previousMode));
    navigator.querySelector("[data-long-trip-next]")?.addEventListener("click", () => nextMode && navigate(nextMode));
    navigator.querySelector("[data-long-trip-overview]")?.addEventListener("click", () => navigate("overview"));
    navigator.querySelector("[data-long-trip-today]")?.addEventListener("click", () => today && navigate(today));
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      renderNavigator();
    });
  }

  new MutationObserver(schedule).observe(rootNode, { childList: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("resize", schedule, { passive: true });

  // app.js dispatches travel-lite-ready once trip data and stored view/date are final (no timeout).
  if (state?.ready) schedule();
  else window.addEventListener("travel-lite-ready", schedule, { once: true });
})();
