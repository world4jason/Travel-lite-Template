/* Day-of companion UX: time window, context rail, share/deep links, locale labels. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const dictionaries = {
    en: {
      navNow: "Now", navTrip: "Trip", navMap: "Map", navCheck: "Check", navMore: "More",
      overview: "Overview", trip: "Trip", previous: "Previous", scheduledNow: "Scheduled now", next: "Next",
      laterToday: "Later today", flexibleToday: "Flexible today", remember: "Remember", notDecided: "Not decided yet",
      myPreference: "My preference", deviceOnly: "this device only", online: "Online", offlineCopy: "Offline copy",
      updated: "updated", share: "Share", selectedStop: "Selected stop", openInMaps: "Open in Google Maps",
      noScheduledNow: "No scheduled item right now", betweenPlans: "Between plans", tripOverview: "Trip overview",
      openChoices: "Open choices", reservations: "Reservations", weather: "Weather", incomplete: "Incomplete",
      deviceStatus: "Device status", today: "Today", tomorrow: "Tomorrow", tbd: "TBD"
    },
    "zh-TW": {
      navNow: "現在", navTrip: "行程", navMap: "地圖", navCheck: "清單", navMore: "更多",
      overview: "總覽", trip: "行程", previous: "前一個", scheduledNow: "目前排定", next: "下一個",
      laterToday: "稍後", flexibleToday: "今天彈性安排", remember: "記得", notDecided: "尚未定案",
      myPreference: "我的偏好", deviceOnly: "僅此裝置", online: "線上", offlineCopy: "離線副本",
      updated: "更新", share: "分享", selectedStop: "目前地點", openInMaps: "Google Maps",
      noScheduledNow: "目前沒有排定行程", betweenPlans: "行程空檔", tripOverview: "旅程總覽",
      openChoices: "待決定", reservations: "預約 / 票券", weather: "天氣", incomplete: "未完成",
      deviceStatus: "裝置狀態", today: "今天", tomorrow: "明天", tbd: "未定"
    }
  };

  const iconPaths = {
    now: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    trip: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    map: '<path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2z"/><path d="M8 4v13M16 7v13"/>',
    check: '<path d="M5 12 10 17 20 7"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    pin: '<path d="M12 21s6-5.4 6-12a6 6 0 1 0-12 0c0 6.6 6 12 6 12Z"/><circle cx="12" cy="9" r="2"/>',
    share: '<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v7h14v-7"/>',
    wifi: '<path d="M4 9a12 12 0 0 1 16 0M7 12a8 8 0 0 1 10 0M10 15a4 4 0 0 1 4 0"/><circle cx="12" cy="19" r="1"/>',
    offline: '<path d="M5 5 19 19M4 9a12 12 0 0 1 6-2M14 7a12 12 0 0 1 6 2M7 12a8 8 0 0 1 4-1M14 12a8 8 0 0 1 3 1M10 15a4 4 0 0 1 4 0"/>'
  };

  function svgIcon(name, className = "companion-icon") {
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.more}</svg>`;
  }

  function currentLocale() {
    const raw = state?.data?.ui?.locale || document.documentElement.lang || navigator.language || "en";
    return /^zh(?:-|$)/i.test(raw) ? "zh-TW" : "en";
  }

  function t(key, fallback = "") {
    const overrides = state?.data?.ui?.labels || {};
    return String(overrides[key] || dictionaries[currentLocale()]?.[key] || dictionaries.en[key] || fallback || key);
  }

  function safeUrl(rawUrl, protocols = ["http:", "https:"]) {
    if (!rawUrl) return "";
    try {
      const url = new URL(rawUrl, window.location.href);
      return protocols.includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function minuteValue(raw) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(raw || "").trim());
    if (!match) return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
  }

  function isTimed(item) { return minuteValue(item?.start) != null; }
  toMinutes = (raw) => minuteValue(raw) ?? Number.NaN;

  getDayProgress = function companionDayProgress(day, minuteOfDay) {
    const timed = (day?.items || []).filter(isTimed);
    if (!timed.length) return 0;
    let completed = 0;
    let active = false;
    timed.forEach((item, index) => {
      const start = minuteValue(item.start);
      const end = minuteValue(item.end) ?? minuteValue(timed[index + 1]?.start) ?? Math.min(1440, start + 120);
      if (end <= minuteOfDay) completed += 1;
      else if (start <= minuteOfDay && minuteOfDay < end) active = true;
    });
    return Math.min(100, Math.round(((completed + (active ? 0.5 : 0)) / timed.length) * 100));
  };

  function decoratedItems(day) {
    return (day?.items || []).map((item, index) => ({ ...item, date: day.date, dayId: day.id, dayTitle: day.title, index }));
  }

  function futureTimed(nowDate, minuteOfDay) {
    const result = [];
    (state.data.days || []).forEach((day) => decoratedItems(day).filter(isTimed).forEach((item) => {
      if (day.date > nowDate || (day.date === nowDate && minuteValue(item.start) > minuteOfDay)) result.push(item);
    }));
    return result.sort((a, b) => a.date.localeCompare(b.date) || minuteValue(a.start) - minuteValue(b.start));
  }

  getNowContext = function companionNowContext() {
    const { trip, days } = state.data;
    const now = zonedNow(trip.timezone);
    const today = days.find((day) => day.date === now.date) || null;
    const all = flattenItems();
    if (now.date < trip.startDate) return { phase: "before", now, daysUntil: dayDiff(now.date, trip.startDate), next: all.find(isTimed) || all[0] || null };
    if (now.date > trip.endDate) return { phase: "after", now, today: null, previous: null, current: null, next: null, later: [], floating: [] };

    const timed = decoratedItems(today).filter(isTimed).sort((a, b) => minuteValue(a.start) - minuteValue(b.start));
    let current = null;
    timed.forEach((item, index) => {
      const start = minuteValue(item.start);
      const end = minuteValue(item.end) ?? minuteValue(timed[index + 1]?.start) ?? Math.min(1440, start + 120);
      if (start <= now.minuteOfDay && now.minuteOfDay < end) current = item;
    });
    let previous = null;
    if (current) {
      const idx = timed.findIndex((item) => item.id === current.id);
      previous = idx > 0 ? timed[idx - 1] : null;
    } else previous = [...timed].reverse().find((item) => minuteValue(item.start) <= now.minuteOfDay) || null;

    const future = futureTimed(now.date, now.minuteOfDay);
    return {
      phase: "during", now, today, previous, current,
      next: future[0] || null, later: future.slice(1, 3),
      floating: decoratedItems(today).filter((item) => !isTimed(item))
    };
  };

  function compactLinks(item) {
    if (!item) return "";
    const mapUrl = safeUrl(googleMapsOpenUrl(item));
    const secondary = [];
    (item.externalLinks || []).forEach((link) => {
      const url = safeUrl(link?.url, ["http:", "https:", "tel:", "mailto:"]);
      if (link?.label && url) secondary.push({ label: link.label, url });
    });
    (item.googleSearches || []).forEach((search) => {
      const url = search?.query && typeof googleMapsSearchUrl === "function" ? safeUrl(googleMapsSearchUrl(search.query, item)) : "";
      if (search?.label && url) secondary.push({ label: search.label, url });
    });
    const map = mapUrl ? `<a class="companion-icon-action" href="${escapeAttr(mapUrl)}" target="_blank" rel="noreferrer" title="${escapeAttr(t("openInMaps"))}">${svgIcon("pin")}</a>` : "";
    const more = secondary.length ? `<details class="companion-overflow"><summary aria-label="More links">${svgIcon("more")}</summary><div>${secondary.map((link) => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} <span>↗</span></a>`).join("")}</div></details>` : "";
    return map || more ? `<div class="companion-compact-actions">${map}${more}</div>` : "";
  }

  function supplementary(item) {
    if (!item || typeof itemActions !== "function") return "";
    const template = document.createElement("template");
    template.innerHTML = itemActions(item);
    return [...template.content.querySelectorAll(".decision-card, .info-card")].map((node) => node.outerHTML).join("");
  }

  function relativeDay(item, nowDate) {
    if (!item?.date || item.date === nowDate) return "";
    return dayDiff(nowDate, item.date) === 1 ? t("tomorrow") : prettyDate(item.date, { weekday: "short" });
  }

  function windowCard(label, item, tone = "") {
    if (!item) return `<article class="companion-window-card empty"><span>${escapeHtml(label)}</span><strong>—</strong></article>`;
    const nowDate = zonedNow(state.data.trip.timezone).date;
    const when = [relativeDay(item, nowDate), item.start || t("tbd")].filter(Boolean).join(" · ");
    return `<article class="companion-window-card ${tone}"><div><span>${escapeHtml(label)}</span><small>${escapeHtml(when)}</small></div><strong>${escapeHtml(item.title || "")}</strong><p>${escapeHtml(item.location || item.dayTitle || "")}</p>${compactLinks(item)}</article>`;
  }

  function remindersHtml(day) {
    const reminders = Array.isArray(day?.reminders) ? day.reminders : [];
    if (!reminders.length) return "";
    return `<section class="panel companion-section"><div class="companion-section-heading"><p class="eyebrow">${escapeHtml(t("today"))}</p><h2>${escapeHtml(t("remember"))}</h2></div><div class="companion-reminders">${reminders.map((entry) => {
      const text = typeof entry === "string" ? entry : entry?.text || entry?.label || "";
      const url = safeUrl(typeof entry === "object" ? entry?.url : "");
      return text ? `<div><span>!</span><p>${escapeHtml(text)}${url ? ` <a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">↗</a>` : ""}</p></div>` : "";
    }).join("")}</div></section>`;
  }

  function floatingHtml(items) {
    if (!items?.length) return "";
    return `<section class="panel companion-section"><div class="companion-section-heading"><p class="eyebrow">${escapeHtml(t("tbd"))}</p><h2>${escapeHtml(t("flexibleToday"))}</h2></div><div class="companion-floating-list">${items.map((item) => `<article><div><span class="type-pill">${escapeHtml(item.type || t("tbd"))}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.location || item.note || "")}</p></div>${compactLinks(item)}${supplementary(item)}</article>`).join("")}</div></section>`;
  }

  function laterHtml(items) {
    if (!items?.length) return "";
    const nowDate = zonedNow(state.data.trip.timezone).date;
    return `<section class="panel companion-section"><div class="companion-section-heading"><p class="eyebrow">${escapeHtml(t("today"))}</p><h2>${escapeHtml(t("laterToday"))}</h2></div><div class="companion-later-list">${items.map((item) => `<article><time>${escapeHtml([relativeDay(item, nowDate), item.start].filter(Boolean).join(" · "))}</time><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.location || item.dayTitle || "")}</p></div>${compactLinks(item)}</article>`).join("")}</div></section>`;
  }

  async function injectMainWeather(context) {
    const slot = root.querySelector("#companion-now-weather");
    if (!slot || typeof TravelLiteProviders === "undefined") return;
    const item = context.current || context.next || context.today?.items?.find((candidate) => Number.isFinite(Number(candidate.lat)) && Number.isFinite(Number(candidate.lng)));
    const lat = Number(item?.lat ?? state.data.trip.center?.lat);
    const lng = Number(item?.lng ?? state.data.trip.center?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { slot.remove(); return; }
    try {
      const data = await TravelLiteProviders.weather(lat, lng);
      if (!document.contains(slot)) return;
      const current = data.current || {};
      slot.innerHTML = `<div class="weather-icon">◐</div><div><p class="eyebrow">${escapeHtml(t("weather"))}</p><h2>${Math.round(current.temperature_2m ?? 0)}°</h2><p>Feels ${Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0)}° · Wind ${Math.round(current.wind_speed_10m ?? 0)} km/h${data.__stale ? " · cached" : ""}</p></div>`;
    } catch { slot.remove(); }
  }

  renderNow = function companionRenderNow() {
    const context = getNowContext();
    if (context.phase === "before") {
      root.innerHTML = `<div class="view-stack companion-now"><section class="panel companion-focus"><p class="eyebrow">${escapeHtml(state.data.trip.title)}</p><h2>Trip starts in ${context.daysUntil} day${context.daysUntil === 1 ? "" : "s"}</h2><p>${escapeHtml(dateRangeLabel(state.data.trip))}</p></section>${context.next ? `<section class="panel companion-section"><h2>${escapeHtml(t("next"))}</h2>${windowCard(t("next"), context.next, "next")}</section>` : ""}</div>`;
      afterRender(); return;
    }
    if (context.phase === "after") {
      root.innerHTML = `<section class="panel empty-state"><p class="eyebrow">Trip complete</p><h2>${escapeHtml(state.data.trip.title)}</h2><p>${escapeHtml(dateRangeLabel(state.data.trip))}</p></section>`;
      afterRender(); return;
    }

    const focus = context.current;
    const today = context.today;
    const progress = today ? getDayProgress(today, context.now.minuteOfDay) : 0;
    root.innerHTML = `<div class="view-stack companion-now">
      <section class="panel companion-focus"><div class="status-row"><span class="status-dot ${focus ? "" : "upcoming"}"></span>${escapeHtml(focus ? t("scheduledNow") : t("betweenPlans"))}</div><div class="companion-focus-top"><div><h2>${escapeHtml(focus?.title || today?.title || t("today"))}</h2><p>${focus ? `${escapeHtml(focus.start || "")} ${focus.end ? `–${escapeHtml(focus.end)}` : ""}${focus.location ? ` · ${escapeHtml(focus.location)}` : ""}` : escapeHtml(t("noScheduledNow"))}</p></div>${compactLinks(focus)}</div>${focus?.note ? `<p class="companion-focus-note">${escapeHtml(focus.note)}</p>` : ""}${supplementary(focus)}${today ? `<div class="progress-wrap"><div class="progress-meta"><span>${escapeHtml(today.label)} · ${escapeHtml(today.title)}</span><span>${progress}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div></div>` : ""}</section>
      <section id="companion-now-weather" class="panel weather-card"><div class="weather-icon">◌</div><div><p class="eyebrow">${escapeHtml(t("weather"))}</p><p>Loading…</p></div></section>
      <section class="companion-window" aria-label="Schedule reference window">${windowCard(t("previous"), context.previous, "previous")}${windowCard(t("scheduledNow"), context.current, "current")}${windowCard(t("next"), context.next, "next")}</section>
      ${laterHtml(context.later)}${floatingHtml(context.floating)}${remindersHtml(today)}
    </div>`;
    injectMainWeather(context);
    afterRender();
  };

  function localeSetup() {
    document.documentElement.lang = currentLocale();
    VIEW_META.now.label = t("navNow"); VIEW_META.now.icon = svgIcon("now", "nav-svg");
    VIEW_META.trip.label = t("navTrip"); VIEW_META.trip.icon = svgIcon("trip", "nav-svg");
    VIEW_META.map.label = t("navMap"); VIEW_META.map.icon = svgIcon("map", "nav-svg");
    VIEW_META.check.label = t("navCheck"); VIEW_META.check.icon = svgIcon("check", "nav-svg");
    VIEW_META.more.label = t("navMore"); VIEW_META.more.icon = svgIcon("more", "nav-svg");
  }

  function cleanTravelerCopy() {
    root.querySelectorAll(".helper-text").forEach((node) => {
      const next = /Shared TBD|update trip\.json/i.test(node.textContent) ? t("notDecided") : (/Personal preference/i.test(node.textContent) ? `${t("myPreference")} · ${t("deviceOnly")}` : "");
      if (next && node.textContent !== next) node.textContent = next;
    });
    root.querySelectorAll(".decision-card .eyebrow").forEach((node) => {
      if (/^TBD$/i.test(node.textContent.trim()) && node.textContent !== t("notDecided")) node.textContent = t("notDecided");
    });
    const overview = root.querySelector("[data-trip-mode='overview']");
    if (overview) {
      const strong = overview.querySelector("strong"), small = overview.querySelector("small");
      if (strong && strong.textContent !== t("overview")) strong.textContent = t("overview");
      if (small && small.textContent !== t("trip")) small.textContent = t("trip");
    }
  }

  function numberMapMarkers() {
    [...root.querySelectorAll(".map-marker")].forEach((marker, index) => {
      const expected = String(index + 1);
      if (marker.textContent !== expected) marker.textContent = expected;
      marker.dataset.sequence = expected;
      marker.setAttribute("aria-label", `Stop ${expected}: ${marker.title || "trip stop"}`);
    });
  }

  function freshnessText() {
    const runtime = window.TravelLiteRuntimeStatus || {};
    const raw = state?.data?.trip?.updatedAt || runtime.lastNetworkAt || "";
    if (!raw) return "";
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? String(raw) : new Intl.DateTimeFormat(currentLocale(), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function isFreshNetwork() {
    const runtime = window.TravelLiteRuntimeStatus || {};
    return navigator.onLine && runtime.tripSource !== "cache";
  }

  function updateStatusChip() {
    if (!state?.data) return;
    const online = isFreshNetwork();
    const freshness = freshnessText();
    const label = `${escapeHtml(online ? t("online") : t("offlineCopy"))}${freshness ? ` · ${escapeHtml(t("updated"))} ${escapeHtml(freshness)}` : ""}`;

    const chip = document.querySelector("#companion-runtime-status");
    if (chip) {
      chip.classList.toggle("offline", !online);
      chip.innerHTML = `${svgIcon(online ? "wifi" : "offline")}<span>${label}</span>`;
    }

    const moreStatus = root.querySelector("#companion-more-status");
    if (moreStatus) {
      moreStatus.classList.toggle("offline", !online);
      moreStatus.innerHTML = `${svgIcon(online ? "wifi" : "offline")}<span>${label}</span>`;
    }
  }

  async function shareCurrent() {
    const data = { title: state?.data?.trip?.title || document.title, text: state?.data?.trip?.subtitle || "", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else if (navigator.clipboard) await navigator.clipboard.writeText(data.url);
    } catch (error) { if (error?.name !== "AbortError") console.warn("Share failed", error); }
  }

  function installHeaderControls() {
    if (document.querySelector("#companion-runtime-status")) return;
    const header = document.querySelector(".trip-header");
    if (!header) return;
    let actions = header.querySelector(".header-actions");
    if (!actions) { actions = document.createElement("div"); actions.className = "header-actions"; header.appendChild(actions); }
    const status = document.createElement("div");
    status.id = "companion-runtime-status"; status.className = "companion-runtime-status"; status.setAttribute("aria-live", "polite");
    const share = document.createElement("button");
    share.id = "companion-share"; share.className = "companion-header-button"; share.type = "button"; share.title = t("share"); share.setAttribute("aria-label", t("share"));
    share.innerHTML = `${svgIcon("share")}<span>${escapeHtml(t("share"))}</span>`; share.addEventListener("click", shareCurrent);
    actions.prepend(status); actions.appendChild(share); updateStatusChip();
  }

  function currentTripMode() {
    if (state.view !== "trip") return "";
    if (root.querySelector("[data-trip-mode='overview'].active")) return "overview";
    return root.querySelector("[data-trip-day].active")?.dataset.tripDay || state.selectedDate || "";
  }

  // app.js renders its stored/default view before the incoming deep link is applied; don't overwrite it until then.
  let initialHashHandled = false;
  function syncHash() {
    if (!state?.data || !initialHashHandled) return;
    let hash = `#${state.view}`;
    if (state.view === "trip") {
      const mode = currentTripMode();
      hash = mode === "overview" ? "#trip/overview" : `#trip/day/${encodeURIComponent(mode || state.selectedDate || "")}`;
    } else if (state.view === "map") hash = `#map/day/${encodeURIComponent(state.selectedDate || "")}${state.selectedMapItemId ? `/stop/${encodeURIComponent(state.selectedMapItemId)}` : ""}`;
    if (window.location.hash !== hash) history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }

  let applyingHash = false;
  function applyHash() {
    if (applyingHash || !state?.data) return;
    const parts = window.location.hash.replace(/^#/, "").split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return;
    applyingHash = true;
    if (parts[0] === "trip") {
      state.view = "trip";
      if (parts[1] === "day" && state.data.days.some((day) => day.date === parts[2])) state.selectedDate = parts[2];
      render();
      queueMicrotask(() => {
        const button = parts[1] === "overview" ? root.querySelector("[data-trip-mode='overview']") : [...root.querySelectorAll("[data-trip-day]")].find((node) => node.dataset.tripDay === parts[2]);
        button?.click();
      });
    } else if (parts[0] === "map") {
      state.view = "map";
      if (parts[1] === "day" && state.data.days.some((day) => day.date === parts[2])) state.selectedDate = parts[2];
      if (parts[3] === "stop") state.selectedMapItemId = parts[4] || null;
      render();
    } else if (VIEW_META[parts[0]]) { state.view = parts[0]; render(); }
    window.setTimeout(() => { applyingHash = false; }, 0);
  }

  function contextRows(items) {
    return items.filter(Boolean).map((item) => `<article class="companion-context-row"><span>${escapeHtml(item.start || t("tbd"))}</span><div><strong>${escapeHtml(item.title || "")}</strong><small>${escapeHtml(item.location || item.dayTitle || "")}</small></div></article>`).join("");
  }

  function reservationRows(date = "") {
    return (state.data.reservations || []).filter((item) => !date || item.date === date).slice(0, 3).map((item) => `<article class="companion-context-row"><span>${escapeHtml(item.type || "•")}</span><div><strong>${escapeHtml(item.title || "")}</strong><small>${escapeHtml([item.time || "", item.location || ""].filter(Boolean).join(" · "))}</small></div></article>`).join("");
  }

  async function injectContextWeather(container, day, context) {
    if (!container || typeof TravelLiteProviders === "undefined") return;
    const item = context?.current || context?.next || day?.items?.find((candidate) => Number.isFinite(Number(candidate.lat)) && Number.isFinite(Number(candidate.lng)));
    const lat = Number(item?.lat ?? state.data.trip.center?.lat), lng = Number(item?.lng ?? state.data.trip.center?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    try {
      const data = await TravelLiteProviders.weather(lat, lng);
      if (!document.contains(container)) return;
      const today = zonedNow(state.data.trip.timezone).date;
      if (day?.date && day.date !== today) {
        const idx = data.daily?.time?.indexOf(day.date) ?? -1;
        if (idx >= 0) {
          const hi = Math.round(data.daily.temperature_2m_max?.[idx] ?? 0), lo = Math.round(data.daily.temperature_2m_min?.[idx] ?? 0), rain = data.daily.precipitation_probability_max?.[idx] ?? 0;
          container.innerHTML = `<strong>${escapeHtml(t("weather"))}</strong><span>${hi}° / ${lo}° · rain ${rain}%${data.__stale ? " · cached" : ""}</span>`;
          return;
        }
      }
      container.innerHTML = `<strong>${escapeHtml(t("weather"))}</strong><span>${Math.round(data.current?.temperature_2m ?? 0)}° · ${Math.round(data.current?.wind_speed_10m ?? 0)} km/h${data.__stale ? " · cached" : ""}</span>`;
    } catch {}
  }

  function renderContextRail() {
    const right = document.querySelector("#shell-right");
    if (!right || !state?.data) return;
    const context = getNowContext();
    const day = state.data.days.find((candidate) => candidate.date === state.selectedDate) || context.today || state.data.days[0];

    if (state.view === "now") {
      const reminders = Array.isArray(context.today?.reminders) ? context.today.reminders.slice(0, 3) : [];
      right.innerHTML = `<section class="shell-context-card"><div class="shell-context-heading"><strong>${escapeHtml(t("scheduledNow"))}</strong><span>${escapeHtml(context.now.time)}</span></div><div class="companion-context-list">${contextRows([context.previous, context.current, context.next])}</div></section><section class="shell-context-section companion-context-weather" id="companion-context-weather"><strong>${escapeHtml(t("weather"))}</strong><span>…</span></section>${reminders.length ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>${escapeHtml(t("remember"))}</strong><span>${reminders.length}</span></div><ul class="shell-reminder-list">${reminders.map((entry) => `<li>${escapeHtml(typeof entry === "string" ? entry : entry?.text || entry?.label || "")}</li>`).join("")}</ul></section>` : ""}`;
      injectContextWeather(right.querySelector("#companion-context-weather"), context.today, context); return;
    }

    if (state.view === "trip") {
      if (currentTripMode() === "overview") {
        const open = state.data.days.flatMap((d) => (d.items || []).filter((item) => item.decision?.options?.length && !item.decision.resolvedOptionId));
        const reservations = reservationRows();
        right.innerHTML = `<section class="shell-context-card"><div class="shell-context-heading"><strong>${escapeHtml(t("tripOverview"))}</strong><span>${escapeHtml(state.data.trip.subtitle || "")}</span></div><div class="shell-stat-grid"><span><b>${state.data.days.length}</b> days</span><span><b>${flattenItems().length}</b> stops</span><span><b>${open.length}</b> ${escapeHtml(t("openChoices"))}</span></div></section>${reservations ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>${escapeHtml(t("reservations"))}</strong></div><div class="companion-context-list">${reservations}</div></section>` : ""}`;
      } else {
        const open = (day?.items || []).filter((item) => item.decision?.options?.length && !item.decision.resolvedOptionId);
        const reminders = Array.isArray(day?.reminders) ? day.reminders.slice(0, 3) : [];
        const reservations = reservationRows(day?.date);
        right.innerHTML = `<section class="shell-context-card"><div class="shell-context-heading"><strong>${escapeHtml(day?.title || t("today"))}</strong><span>${day ? prettyDate(day.date, { weekday: "short" }) : ""}</span></div>${open.length ? `<p class="shell-context-route">${open.length} ${escapeHtml(t("openChoices"))}</p>` : ""}</section><section class="shell-context-section companion-context-weather" id="companion-context-weather"><strong>${escapeHtml(t("weather"))}</strong><span>…</span></section>${reminders.length ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>${escapeHtml(t("remember"))}</strong><span>${reminders.length}</span></div><ul class="shell-reminder-list">${reminders.map((entry) => `<li>${escapeHtml(typeof entry === "string" ? entry : entry?.text || entry?.label || "")}</li>`).join("")}</ul></section>` : ""}${reservations ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>${escapeHtml(t("reservations"))}</strong></div><div class="companion-context-list">${reservations}</div></section>` : ""}`;
        injectContextWeather(right.querySelector("#companion-context-weather"), day, context);
      }
      return;
    }

    if (state.view === "map") {
      const item = (day?.items || []).find((candidate) => candidate.id === state.selectedMapItemId) || day?.items?.[0];
      const map = item ? safeUrl(googleMapsOpenUrl(item)) : "";
      const external = (item?.externalLinks || []).slice(0, 3).map((link) => { const url = safeUrl(link?.url, ["http:", "https:", "tel:", "mailto:"]); return link?.label && url ? `<a class="companion-context-link" href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>` : ""; }).join("");
      right.innerHTML = `<section class="shell-context-card"><div class="shell-context-heading"><strong>${escapeHtml(t("selectedStop"))}</strong><span>${escapeHtml(item?.start || t("tbd"))}</span></div><h3>${escapeHtml(item?.title || day?.title || "")}</h3><p class="shell-context-route">${escapeHtml(item?.location || "")}</p>${item?.note ? `<p class="shell-context-muted">${escapeHtml(item.note)}</p>` : ""}${map ? `<a class="companion-context-link" href="${escapeAttr(map)}" target="_blank" rel="noreferrer">${svgIcon("pin")} ${escapeHtml(t("openInMaps"))} ↗</a>` : ""}${external}</section>`; return;
    }

    if (state.view === "check") {
      const todoDone = state.data.todos.filter((item) => state.todos[item.id]).length;
      const checks = state.data.checklists.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id })));
      const checkDone = checks.filter((item) => state.checks[`${item.groupId}:${item.id}`]).length;
      const incomplete = [...state.data.todos.filter((item) => !state.todos[item.id]).map((item) => item.label || item.title), ...checks.filter((item) => !state.checks[`${item.groupId}:${item.id}`]).map((item) => item.label)].slice(0, 5);
      right.innerHTML = `<section class="shell-context-card"><div class="shell-context-heading"><strong>${escapeHtml(t("navCheck"))}</strong></div><div class="shell-stat-grid"><span><b>${todoDone}/${state.data.todos.length}</b> todo</span><span><b>${checkDone}/${checks.length}</b> check</span></div></section>${incomplete.length ? `<section class="shell-context-section"><div class="shell-context-heading"><strong>${escapeHtml(t("incomplete"))}</strong><span>${incomplete.length}</span></div><ul class="shell-reminder-list">${incomplete.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul></section>` : ""}`; return;
    }

    right.innerHTML = `<section class="shell-context-card"><div class="shell-context-heading"><strong>${escapeHtml(t("deviceStatus"))}</strong></div><p class="shell-context-muted">${escapeHtml(isFreshNetwork() ? t("online") : t("offlineCopy"))}${freshnessText() ? ` · ${escapeHtml(freshnessText())}` : ""}</p></section>`;
  }

  let contextFrame = 0;
  function scheduleContextRail() { cancelAnimationFrame(contextFrame); contextFrame = requestAnimationFrame(renderContextRail); }
  function afterRender() { cleanTravelerCopy(); numberMapMarkers(); scheduleContextRail(); syncHash(); }

  const baseRenderMore = renderMore;
  renderMore = function companionRenderMore() {
    baseRenderMore();
    const stack = root.querySelector(".view-stack");
    if (stack && !stack.querySelector(".companion-more-utilities")) {
      const utilities = document.createElement("section");
      utilities.className = "panel companion-more-utilities";
      utilities.innerHTML = `
        <div class="companion-more-utility-copy">
          <p class="eyebrow">${escapeHtml(t("deviceStatus"))}</p>
          <div id="companion-more-status" class="companion-more-status" aria-live="polite"></div>
        </div>
        <button class="companion-more-share" type="button" data-companion-share-more>
          ${svgIcon("share")}<span>${escapeHtml(t("share"))}</span>
        </button>`;
      stack.prepend(utilities);
      utilities.querySelector("[data-companion-share-more]")?.addEventListener("click", shareCurrent);
      updateStatusChip();
    }
  };

  const baseSetView = setView;
  setView = function companionSetView(view) { baseSetView(view); requestAnimationFrame(afterRender); };

  let rootObserver;
  const observeRoot = () => rootObserver.observe(root, { childList: true, subtree: true });
  rootObserver = new MutationObserver(() => {
    rootObserver.disconnect();
    cleanTravelerCopy();
    numberMapMarkers();
    scheduleContextRail();
    observeRoot();
  });
  observeRoot();

  root.addEventListener("click", () => requestAnimationFrame(() => { syncHash(); scheduleContextRail(); }));
  document.querySelector("#shell-left")?.addEventListener("click", () => requestAnimationFrame(() => { syncHash(); scheduleContextRail(); }));
  window.addEventListener("resize", scheduleContextRail, { passive: true });
  window.addEventListener("hashchange", applyHash);
  window.addEventListener("travel-lite-runtime-status", updateStatusChip);

  // Wait for app.js to finish loading trip data and hydrating stored view/date (no timeout: slow or
  // offline loads must still apply the incoming deep link).
  async function onAppReady() {
    state.personalDecisionSelections = (await TravelLiteStorage.get(tripKey("personalDecisions"))) || state.personalDecisionSelections || {};
    localeSetup(); installHeaderControls(); renderNav();
    initialHashHandled = true;
    if (window.location.hash) applyHash(); else render();
    requestAnimationFrame(() => { afterRender(); updateStatusChip(); });
  }
  if (state?.ready) onAppReady();
  else window.addEventListener("travel-lite-ready", onAppReady, { once: true });
})();
