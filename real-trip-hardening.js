/* Real-trip hardening: multi-timezone now logic, long-trip navigation, untimed day brief. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const localeText = {
    en: {
      todayBrief: "Today brief",
      noFixedTimes: "No fixed times in this page",
      tripOverview: "Trip overview",
      chooseDay: "Choose day",
      today: "Today",
      previousDay: "Previous day",
      nextDay: "Next day",
      route: "Route",
    },
    "zh-TW": {
      todayBrief: "今日摘要",
      noFixedTimes: "這頁沒有固定時間，依現場／領隊安排",
      tripOverview: "旅程總覽",
      chooseDay: "選擇日期",
      today: "今天",
      previousDay: "前一天",
      nextDay: "後一天",
      route: "今日動線",
    },
  };

  function locale() {
    const raw = state?.data?.ui?.locale || document.documentElement.lang || navigator.language || "en";
    return /^zh(?:-|$)/i.test(raw) ? "zh-TW" : "en";
  }

  function h(key) {
    return state?.data?.ui?.labels?.[key] || localeText[locale()]?.[key] || localeText.en[key] || key;
  }

  function minuteValue(raw) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(raw || "").trim());
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
  }

  function validZone(zone) {
    if (!zone) return "";
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone }).format(new Date());
      return zone;
    } catch {
      return "";
    }
  }

  function dayTimeZone(day) {
    return validZone(day?.timezone) || validZone(state?.data?.trip?.timezone) || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }

  function itemTimeZone(day, item) {
    return validZone(item?.timezone) || dayTimeZone(day);
  }

  function itemDate(day, item) {
    return item?.date || day?.date || "";
  }

  function decoratedEntries() {
    const entries = [];
    (state?.data?.days || []).forEach((day, dayIndex) => {
      (day.items || []).forEach((item, itemIndex) => {
        entries.push({
          ...item,
          date: itemDate(day, item),
          dayId: day.id,
          dayTitle: day.title,
          dayIndex,
          itemIndex,
          timeZone: itemTimeZone(day, item),
          __day: day,
        });
      });
    });
    return entries;
  }

  function isTimed(entry) {
    return minuteValue(entry?.start) != null;
  }

  function entryEndMinute(entry, allEntries) {
    const explicit = minuteValue(entry?.end);
    if (explicit != null) return explicit >= minuteValue(entry.start) ? explicit : 1440;
    const next = allEntries.find((candidate) =>
      candidate.dayIndex === entry.dayIndex
      && candidate.itemIndex > entry.itemIndex
      && candidate.date === entry.date
      && candidate.timeZone === entry.timeZone
      && isTimed(candidate)
    );
    return minuteValue(next?.start) ?? Math.min(1440, minuteValue(entry.start) + 120);
  }

  function entryStatus(entry, allEntries) {
    if (!isTimed(entry)) return "floating";
    const now = zonedNow(entry.timeZone);
    if (now.date < entry.date) return "future";
    if (now.date > entry.date) return "past";
    const start = minuteValue(entry.start);
    const end = entryEndMinute(entry, allEntries);
    if (now.minuteOfDay < start) return "future";
    if (now.minuteOfDay >= end) return "past";
    return "current";
  }

  function activeTripDay() {
    const days = state?.data?.days || [];
    if (!days.length) return null;
    const entries = decoratedEntries().filter(isTimed);
    const currentEntry = entries.find((entry) => entryStatus(entry, entries) === "current");
    if (currentEntry) return currentEntry.__day;

    const directMatches = days.filter((day) => zonedNow(dayTimeZone(day)).date === day.date);
    if (directMatches.length === 1) return directMatches[0];
    if (directMatches.length > 1) {
      const next = entries.find((entry) => entryStatus(entry, entries) === "future" && directMatches.includes(entry.__day));
      if (next) return next.__day;
      return directMatches[0];
    }

    const itemMatch = entries.find((entry) => zonedNow(entry.timeZone).date === entry.date);
    if (itemMatch) return itemMatch.__day;

    const fallbackNow = zonedNow(validZone(state.data.trip.timezone) || dayTimeZone(days[0]));
    return days.find((day) => day.date === fallbackNow.date) || null;
  }

  function currentContextNow(day) {
    return zonedNow(day ? dayTimeZone(day) : (validZone(state?.data?.trip?.timezone) || "UTC"));
  }

  function phaseByDays(activeDay) {
    const days = state?.data?.days || [];
    if (activeDay) return "during";
    if (!days.length) return "after";
    const first = days[0];
    const last = days[days.length - 1];
    if (zonedNow(dayTimeZone(first)).date < first.date) return "before";
    if (zonedNow(dayTimeZone(last)).date > last.date) return "after";
    return "during";
  }

  getNowContext = function hardeningNowContext() {
    const days = state?.data?.days || [];
    const entries = decoratedEntries();
    const timed = entries.filter(isTimed);
    const activeDay = activeTripDay();
    const phase = phaseByDays(activeDay);
    const now = currentContextNow(activeDay);

    if (phase === "before") {
      const first = days[0];
      return {
        phase,
        now,
        daysUntil: first ? Math.max(0, dayDiff(zonedNow(dayTimeZone(first)).date, first.date)) : 0,
        next: timed[0] || entries[0] || null,
        today: null,
        previous: null,
        current: null,
        later: [],
        floating: [],
      };
    }

    if (phase === "after") {
      return { phase, now, today: null, previous: timed[timed.length - 1] || null, current: null, next: null, later: [], floating: [] };
    }

    const statuses = timed.map((entry) => ({ entry, status: entryStatus(entry, timed) }));
    const current = statuses.find((row) => row.status === "current")?.entry || null;
    const past = statuses.filter((row) => row.status === "past").map((row) => row.entry);
    const future = statuses.filter((row) => row.status === "future").map((row) => row.entry);
    const previous = past[past.length - 1] || null;
    const next = future[0] || null;
    const today = activeDay || current?.__day || next?.__day || previous?.__day || null;
    const floating = entries.filter((entry) => entry.__day === today && !isTimed(entry));

    return {
      phase: "during",
      now: currentContextNow(today),
      today,
      previous,
      current,
      next,
      later: future.slice(1, 3),
      floating,
    };
  };

  getDayProgress = function hardeningDayProgress(day) {
    const entries = decoratedEntries().filter((entry) => entry.__day === day && isTimed(entry));
    if (!entries.length) return 0;
    const statuses = entries.map((entry) => entryStatus(entry, entries));
    const completed = statuses.filter((status) => status === "past").length;
    const active = statuses.includes("current");
    return Math.min(100, Math.round(((completed + (active ? 0.5 : 0)) / entries.length) * 100));
  };

  const baseUpdateClock = updateClock;
  updateClock = function hardeningUpdateClock() {
    if (!state?.data) return baseUpdateClock();
    const day = activeTripDay();
    const zone = day ? dayTimeZone(day) : (validZone(state.data.trip.timezone) || "UTC");
    const now = zonedNow(zone);
    const timeNode = document.querySelector("#local-time");
    const zoneNode = document.querySelector("#timezone-label");
    if (timeNode) timeNode.textContent = now.time;
    if (zoneNode) zoneNode.textContent = zone.replaceAll("_", " ");
  };

  function briefRoute(day) {
    const explicit = Array.isArray(day?.routeSummary) ? day.routeSummary.filter(Boolean) : [];
    if (explicit.length) return explicit.map((entry) => typeof entry === "string" ? entry : entry?.label || entry?.title).filter(Boolean).slice(0, 6);
    return (day?.items || []).map((item) => item.routeLabel || item.title || item.location).filter(Boolean).slice(0, 6);
  }

  function enhanceUntimedDayBrief(context) {
    const day = context?.today;
    if (!day) return;
    const timedCount = (day.items || []).filter((item) => minuteValue(item.start) != null).length;
    if (timedCount) return;

    const focus = root.querySelector(".companion-focus");
    if (!focus) return;
    const route = briefRoute(day);
    focus.classList.add("companion-day-brief");
    focus.innerHTML = `<p class="eyebrow">${escapeHtml(h("todayBrief"))}</p>
      <h2>${escapeHtml(day.title || day.label || h("today"))}</h2>
      ${day.subtitle ? `<p class="companion-focus-note">${escapeHtml(day.subtitle)}</p>` : ""}
      ${route.length ? `<div class="hardening-brief-route"><span>${escapeHtml(h("route"))}</span><strong>${route.map(escapeHtml).join(" → ")}</strong></div>` : ""}
      <p class="hardening-untimed-note">${escapeHtml(h("noFixedTimes"))}</p>`;

    root.querySelector(".companion-window")?.remove();
    root.querySelector(".companion-later-list")?.closest(".companion-section")?.remove();
  }

  const baseRenderNow = renderNow;
  renderNow = function hardeningRenderNow() {
    baseRenderNow();
    const context = getNowContext();
    if (context.phase === "during") enhanceUntimedDayBrief(context);
    updateClock();
  };

  function activeModeFromTripTabs() {
    if (root.querySelector("[data-trip-mode='overview'].active")) return "overview";
    return root.querySelector("[data-trip-day].active")?.dataset.tripDay || state.selectedDate || "overview";
  }

  function currentDayForTripNav() {
    const today = activeTripDay();
    return today?.date || "";
  }

  function clickTripTarget(value) {
    if (value === "overview") {
      root.querySelector("[data-trip-mode='overview']")?.click();
      return;
    }
    [...root.querySelectorAll("[data-trip-day]")].find((node) => node.dataset.tripDay === value)?.click();
  }

  function installLongTripNav() {
    if (state.view !== "trip" || !state?.data?.days || state.data.days.length <= 12) return;
    const tabs = root.querySelector(".trip-v2-tabs");
    if (!tabs || root.querySelector(".hardening-long-nav")) return;

    const mode = activeModeFromTripTabs();
    const days = state.data.days;
    const currentIndex = days.findIndex((day) => day.date === mode);
    const nav = document.createElement("nav");
    nav.className = "hardening-long-nav";
    nav.setAttribute("aria-label", h("chooseDay"));
    nav.innerHTML = `<button type="button" data-hardening-prev aria-label="${escapeAttr(h("previousDay"))}" ${currentIndex <= 0 ? "disabled" : ""}>‹</button>
      <label><span>${escapeHtml(h("chooseDay"))}</span><select data-hardening-day>
        <option value="overview" ${mode === "overview" ? "selected" : ""}>${escapeHtml(h("tripOverview"))}</option>
        ${days.map((day) => `<option value="${escapeAttr(day.date)}" ${mode === day.date ? "selected" : ""}>${escapeHtml(day.label || prettyDate(day.date))} · ${escapeHtml(prettyDate(day.date))} · ${escapeHtml(day.title || "")}</option>`).join("")}
      </select></label>
      <button type="button" data-hardening-next aria-label="${escapeAttr(h("nextDay"))}" ${currentIndex < 0 || currentIndex >= days.length - 1 ? "disabled" : ""}>›</button>
      ${currentDayForTripNav() ? `<button type="button" class="hardening-today" data-hardening-today>${escapeHtml(h("today"))}</button>` : ""}`;
    tabs.before(nav);
    tabs.classList.add("hardening-long-tabs");

    nav.querySelector("[data-hardening-day]")?.addEventListener("change", (event) => clickTripTarget(event.target.value));
    nav.querySelector("[data-hardening-prev]")?.addEventListener("click", () => {
      if (currentIndex > 0) clickTripTarget(days[currentIndex - 1].date);
    });
    nav.querySelector("[data-hardening-next]")?.addEventListener("click", () => {
      if (currentIndex >= 0 && currentIndex < days.length - 1) clickTripTarget(days[currentIndex + 1].date);
      else if (mode === "overview" && days.length) clickTripTarget(days[0].date);
    });
    nav.querySelector("[data-hardening-today]")?.addEventListener("click", () => clickTripTarget(currentDayForTripNav()));
  }

  const baseRenderTrip = renderTrip;
  renderTrip = function hardeningRenderTrip() {
    baseRenderTrip();
    requestAnimationFrame(installLongTripNav);
  };

  function normalizeExistingTripView() {
    if (state.view === "trip") requestAnimationFrame(installLongTripNav);
    updateClock();
  }

  window.addEventListener("resize", normalizeExistingTripView, { passive: true });
  const observer = new MutationObserver(() => {
    if (state?.view === "trip") requestAnimationFrame(installLongTripNav);
  });
  observer.observe(root, { childList: true, subtree: true });

  const wait = window.setInterval(() => {
    if (!state?.data) return;
    window.clearInterval(wait);
    normalizeExistingTripView();
    if (state.view === "now") renderNow();
  }, 50);
  window.setTimeout(() => window.clearInterval(wait), 5000);

  window.TravelLiteTime = {
    activeTripDay,
    dayTimeZone,
    itemTimeZone,
    entryStatus: (entry) => entryStatus(entry, decoratedEntries().filter(isTimed)),
  };
})();