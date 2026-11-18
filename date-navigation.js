/* Reusable Trip / Transport / Places date navigation. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const root = document.querySelector("#view-root");
  if (!root) return;
  const views = new Set(["trip", "map", "places"]);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  let pending = false;
  const zh = () => /^zh/i.test(state.data?.ui?.locale || "");
  const tr = (cn, en) => zh() ? cn : en;
  const esc = value => escapeHtml(String(value ?? ""));
  const att = value => escapeAttr(String(value ?? ""));
  // Published dates must be real YYYY-MM-DD calendar days, not merely keys.
  const isoDay = date => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const candidate = new Date(date + "T12:00:00Z");
    return Number.isFinite(candidate.getTime()) && candidate.toISOString().slice(0,10) === date;
  };
  const days = () => (state.data?.days || []).filter(day => isoDay(day.date));
  const validDate = date => isoDay(date) && days().some(day => day.date === date);
  const dayIndex = date => days().findIndex(day => day.date === date);
  const dayAt = index => days()[index]?.date || "";

  function dayLabel(date, expanded = false) {
    const index = dayIndex(date);
    if (index < 0) return "";
    const d = days()[index];
    const [y, m, dd] = date.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, dd));
    const short = zh()
      ? "第 " + (index + 1) + " 天 · " + String(m).padStart(2,"0") + "/" +
        String(dd).padStart(2,"0") + "（" + weekdays[utc.getUTCDay()] + "）"
      : "Day " + (index + 1) + " · " +
        new Intl.DateTimeFormat("en", {month:"short", day:"numeric", weekday:"short", timeZone:"UTC"}).format(utc);
    return expanded && d.title ? short + " · " + d.title : short;
  }
  function mode(view) {
    if (view === "trip" && root.querySelector(".trip-overview-view")) return "overview";
    // A Places detail is a specific published visit even when the directory's
    // stored list mode is All. Label its actual day, not an implied Overview.
    if (view === "places" && state.selectedPlaceId && validDate(state.selectedDate))
      return state.selectedDate;
    if (view === "places" && window.TravelLitePlaces?.getFilterDate?.() === "all") return "overview";
    return validDate(state.selectedDate) ? state.selectedDate : dayAt(0);
  }
  function today() {
    const date = window.TravelLiteTime?.currentTripDay?.()?.date ||
      (typeof zonedNow === "function" ? zonedNow(state.data.trip.timezone).date : "");
    return validDate(date) ? date : "";
  }
  function near(value, delta) {
    if (value === "overview") return delta > 0 ? dayAt(0) : "";
    const idx = dayIndex(value);
    if (idx === 0 && delta < 0 && state.view !== "map") return "overview";
    return dayAt(idx + delta);
  }
  function hashFor(view, value) {
    if (view === "trip") return value === "overview" ? "#trip/overview" :
      "#trip/day/" + encodeURIComponent(value);
    if (view === "places") return value === "overview" ? "#places" :
      "#places/day/" + encodeURIComponent(value);
    return "#map/day/" + encodeURIComponent(value);
  }
  function setSharedDate(date) {
    if (!validDate(date)) return false;
    state.selectedDate = date;
    TravelLiteStorage.set(tripKey("ui:selectedDate"), date);
    return true;
  }
  function pushRoute(hash) {
    if (location.hash !== hash)
      history.pushState({travelLite:"dateNav"}, "", location.pathname + location.search + hash);
  }
  function navigate(value) {
    const view = state.view;
    if (!views.has(view) ||
      (value === "overview" && view === "map") ||
      (value !== "overview" && !validDate(value))) return;
    if (value !== "overview") setSharedDate(value);
    pushRoute(hashFor(view, value));
    if (view === "trip") {
      const button = value === "overview" ?
        root.querySelector(".trip-v2-tabs [data-trip-mode='overview']") :
        [...root.querySelectorAll(".trip-v2-tabs [data-trip-day]")]
          .find(el => el.dataset.tripDay === value);
      button?.click();
    } else if (view === "map") {
      state.selectedMapItemId = null;
      renderMap();
    } else {
      state.selectedPlaceId = null;
      window.TravelLitePlaces?.applyRouteDate(value === "overview" ? "all" : value);
      window.TravelLitePlaces?.render();
    }
  }
  // Dates are the primary navigation surface; weather enhances each card only
  // when the provider has a real forecast for its published date.
  function html(view) {
    const selected = mode(view), prev = near(selected, -1), next = near(selected, 1);
    const allowAll = view !== "map", now = today();
    const options = (allowAll ? '<option value="overview"' + (selected === "overview" ? " selected" : "") +
      '>' + esc(tr("總覽", "Overview")) + "</option>" : "") +
      days().map(day => '<option value="' + att(day.date) + '"' +
        (selected === day.date ? " selected" : "") + '>' +
        esc(dayLabel(day.date, true)) + "</option>").join("");
    const cards = days().map((day, index) => {
      const active = selected === day.date, [y, m, d] = day.date.split("-");
      const title = day.shortTitle || day.title || tr("每日行程", "Trip day");
      return '<button type="button" class="unified-date-card' + (active ? " active" : "") +
        '" data-unified-date-card="' + att(day.date) + '" data-weather-state="empty" aria-pressed="' + active +
        '" aria-label="' + att(dayLabel(day.date, true)) + '"' +
        (active ? ' aria-current="date"' : "") + '>' +
        '<span class="unified-date-card-day">D' + (index + 1) + '</span>' +
        '<span class="unified-date-card-date">' + esc(m + "/" + d) + '</span>' +
        '<span class="unified-date-card-weather" aria-hidden="true" hidden></span>' +
        '<span class="unified-date-card-temperature" hidden></span>' +
        '<span class="unified-date-card-kind" hidden></span>' +
        '<span class="unified-date-card-title" title="' + att(title) + '">' + esc(title) + '</span>' +
        '</button>';
    }).join("");
    return '<nav class="unified-date-nav" data-unified-date-key="' + att(view + ":" + selected) +
      '" aria-label="' + att(tr("旅程日期導覽", "Trip date navigation")) + '">' +
      '<div class="unified-date-toolbar"><div class="unified-date-quick">' +
      (allowAll ? '<button type="button" data-unified-date-overview class="' +
        (selected === "overview" ? "active" : "") + '" aria-pressed="' +
        (selected === "overview") + '">' + esc(tr("總覽", "Overview")) + '</button>' : "") +
      '<button type="button" data-unified-date-today class="' +
        (now && selected === now ? "active" : "") + '"' + (now ? "" : " disabled") +
        '>' + esc(tr("今天", "Today")) + '</button>' +
      '<small>' + days().length + ' ' + esc(tr("天", "days")) + '</small></div>' +
      '<div class="unified-date-main">' +
      '<button type="button" class="unified-date-arrow" data-unified-date-prev aria-label="' +
        att(tr("前一天", "Previous day")) + '"' + (prev ? "" : " disabled") +
        '><span aria-hidden="true">←</span></button>' +
      '<div class="unified-date-select-wrap"><span class="unified-date-value" aria-hidden="true">' +
        esc(tr("跳至日期", "Jump to day")) + '</span><span class="unified-date-chevron" aria-hidden="true">⌄</span>' +
      '<select class="unified-date-select" data-unified-date-select aria-label="' +
        att(tr("選擇旅程日期", "Choose trip date")) + '">' + options + '</select></div>' +
      '<button type="button" class="unified-date-arrow" data-unified-date-next aria-label="' +
        att(tr("後一天", "Next day")) + '"' + (next ? "" : " disabled") +
        '><span aria-hidden="true">→</span></button></div></div>' +
      '<div class="unified-date-strip" data-unified-date-strip role="group" aria-label="' +
        att(tr("滑動選擇日期", "Scrollable day selector")) + '">' + cards + '</div>' +
      '<p class="unified-date-weather-note">' +
        esc(tr("天氣來源：", "Weather: ")) +
        '<a href="https://open-meteo.com/" rel="noopener noreferrer" target="_blank">Open-Meteo</a>' +
      '</p></nav>';
  }

  function validPoint(item) {
    const numeric = value => (typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value));
    const lat = item?.lat, lng = item?.lng;
    return numeric(lat) && numeric(lng) && Math.abs(Number(lat)) <= 90 &&
      Math.abs(Number(lng)) <= 180 ? {lat: Number(lat), lng: Number(lng)} : null;
  }
  function weatherCoordinate(day) {
    const explicit = validPoint(day.weatherLocation);
    if (explicit) return explicit;
    const items = day.items || [];
    const first = items.find(x => x.type === "place" && validPoint(x)) ||
      items.find(x => x.type !== "transport" && validPoint(x)) ||
      items.find(x => validPoint(x));
    return validPoint(first); // No assumed city: unknown location means no weather forecast.
  }
  const weatherPending = new Map();
  function forecastSymbol(code) {
    if (code === 0) return ["☀", tr("晴", "Clear")];
    if ([1, 2].includes(code)) return ["⛅", tr("晴時多雲", "Partly cloudy")];
    if (code === 3) return ["☁", tr("多雲", "Cloudy")];
    if ([45, 48].includes(code)) return ["≋", tr("霧", "Fog")];
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
      return ["☂", tr("雨", "Rain")];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ["❄", tr("雪", "Snow")];
    if ([95, 96, 99].includes(code)) return ["ϟ", tr("雷雨", "Storm")];
    return ["", ""];
  }
  function weatherSvg(code) {
    const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11 1.5 1.5M5 19l1.5-1.5m11-11L19 5"/>';
    const cloud = '<path d="M7 19h10a4 4 0 0 0 .4-8A6 6 0 0 0 5.5 9.6 4.8 4.8 0 0 0 7 19Z"/>';
    const snow = cloud + '<path d="M8 21v2m-1-1h2m7-1v2m-1-1h2"/>';
    const rain = cloud + '<path d="m8 21-1 2m7-2-1 2m5-2-1 2"/>';
    const kind = code === 0 ? sun : [1,2].includes(code) ?
      '<circle cx="8" cy="8" r="3"/>' + cloud :
      code === 3 ? cloud : [45,48].includes(code) ? cloud + '<path d="M3 22h18"/>' :
      [71,73,75,77,85,86].includes(code) ? snow :
      [95,96,99].includes(code) ? cloud + '<path d="m12 19-2 3h3l-2 2"/>' : rain;
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      kind + '</svg>';
  }
  function applyDailyWeather(nav, dates, data, historical) {
    if (!nav.isConnected) return;
    for (const date of dates) {
      const card = [...nav.querySelectorAll("[data-unified-date-card]")]
        .find(el => el.dataset.unifiedDateCard === date);
      if (!card) continue;
      const idx = data?.daily?.time?.indexOf(date) ?? -1;
      if (idx < 0) continue;
      const code = data.daily.weather_code?.[idx];
      const high = data.daily.temperature_2m_max?.[idx];
      const low = data.daily.temperature_2m_min?.[idx];
      if (code == null || high == null || low == null ||
          !Number.isFinite(Number(code)) || !Number.isFinite(Number(high)) ||
          !Number.isFinite(Number(low))) continue;
      const [symbol, condition] = forecastSymbol(Number(code));
      if (!symbol) continue;
      const weather = card.querySelector(".unified-date-card-weather");
      const temperature = card.querySelector(".unified-date-card-temperature");
      const kind = card.querySelector(".unified-date-card-kind");
      const hi = Math.round(Number(high)), lo = Math.round(Number(low));
      if (weather) { weather.innerHTML = weatherSvg(Number(code)); weather.hidden = false; }
      if (temperature) { temperature.textContent = hi + "° / " + lo + "°"; temperature.hidden = false; }
      if (kind) {
        kind.textContent = historical ? tr("歷史", "History") : tr("預報", "Forecast");
        kind.hidden = false;
      }
      const rain = historical ? data.daily.precipitation_sum?.[idx] :
        data.daily.precipitation_probability_max?.[idx];
      const title = (historical ? tr("歷史天氣（模式估計）", "Historical model weather") :
        tr("天氣預報", "Weather forecast")) + " · " + condition + " · " +
        hi + "°/" + lo + "°" +
        (rain != null && Number.isFinite(Number(rain)) ? " · " +
          (historical ? tr("降水 ", "Precipitation ") + Number(rain).toFixed(1) + " mm" :
            tr("降雨機率 ", "Rain chance ") + Math.round(Number(rain)) + "%") : "") +
        (data.__stale ? " · " + tr("快取", "cached") : "");
      card.dataset.weatherState = historical ? "historical" : "forecast";
      card.title = title;
      card.setAttribute("aria-label", dayLabel(date, true) + " · " + title);
    }
  }
  function loadWeather(nav) {
    if (typeof TravelLiteProviders === "undefined" || !TravelLiteProviders.weather) return;
    const current = typeof zonedNow === "function" ?
      zonedNow(state.data.trip.timezone).date : "";
    const todayStamp = Date.parse(current + "T00:00:00Z");
    if (!Number.isFinite(todayStamp)) return;
    const grouped = new Map();
    for (const day of days()) {
      const diff = Math.round((Date.parse(day.date + "T00:00:00Z") - todayStamp) / 86400000);
      const point = weatherCoordinate(day);
      if (!point) continue;
      const source = diff < -92 ? "archive" : diff < 0 ? "recent" :
        diff <= 15 ? "forecast" : "";
      if (!source) continue;
      const key = source + ":" + point.lat.toFixed(3) + "," + point.lng.toFixed(3);
      if (!grouped.has(key)) grouped.set(key, {point, source, dates: [], pastDays: 0});
      const group = grouped.get(key);
      group.dates.push(day.date);
      if (source === "recent") group.pastDays = Math.max(group.pastDays, -diff);
    }
    for (const [key, group] of grouped) {
      const first = group.dates.reduce((a,b) => a < b ? a : b);
      const last = group.dates.reduce((a,b) => a > b ? a : b);
      const queryKey = key + ":" + (group.source === "archive" ? first + ":" + last :
        group.source === "recent" ? group.pastDays : "current");
      let promise = weatherPending.get(queryKey);
      if (!promise) {
        promise = group.source === "archive" ?
          TravelLiteProviders.historicalWeather?.(group.point.lat,group.point.lng,first,last) :
          group.source === "recent" ?
            TravelLiteProviders.recentWeather?.(group.point.lat,group.point.lng,group.pastDays) :
            TravelLiteProviders.weather(group.point.lat,group.point.lng);
        if (!promise) continue;
        weatherPending.set(queryKey,promise);
        promise.finally(() => {
          if (weatherPending.get(queryKey) === promise) weatherPending.delete(queryKey);
        }).catch(() => {});
      }
      promise.then(data => applyDailyWeather(nav,group.dates,data,group.source !== "forecast"))
        .catch(() => {}); // Failure never affects date navigation.
    }
  }
  function bind(nav) {
    nav.querySelectorAll("[data-unified-date-card]").forEach(card =>
      card.addEventListener("click", () => navigate(card.dataset.unifiedDateCard)));
    nav.querySelector("[data-unified-date-select]")?.addEventListener("change", event =>
      navigate(event.currentTarget.value));
    nav.querySelector("[data-unified-date-prev]")?.addEventListener("click", () => {
      const target = near(mode(state.view),-1);
      if (target) navigate(target);
    });
    nav.querySelector("[data-unified-date-next]")?.addEventListener("click", () => {
      const target = near(mode(state.view),1);
      if (target) navigate(target);
    });
    nav.querySelector("[data-unified-date-overview]")?.addEventListener("click", () => navigate("overview"));
    nav.querySelector("[data-unified-date-today]")?.addEventListener("click", () => {
      const target = today();
      if (target) navigate(target);
    });
  }
  function enhance() {
    pending = false;
    if (!state?.ready || !views.has(state.view) || !days().length) {
      root.classList.remove("unified-date-enabled");
      root.querySelector(":scope > .unified-date-nav")?.remove();
      return;
    }
    const key = state.view + ":" + mode(state.view);
    const previous = root.querySelector(":scope > .unified-date-nav");
    if (previous?.dataset.unifiedDateKey === key) return;
    previous?.remove();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html(state.view);
    const nav = wrapper.firstElementChild;
    root.prepend(nav);
    root.classList.add("unified-date-enabled");
    root.dataset.dateNavView = state.view;
    bind(nav);
    if (selectedDateForScroll(nav)) {
      requestAnimationFrame(() => {
        if (!nav.isConnected) return;
        nav.querySelector('.unified-date-card[aria-pressed="true"]')
          ?.scrollIntoView({inline:"nearest",block:"nearest",behavior:"instant"});
      });
    }
    loadWeather(nav);
  }
  function selectedDateForScroll(nav) {
    return nav.querySelector('.unified-date-card[aria-pressed="true"]') != null;
  }
  function schedule() {
    if (pending) return;
    pending = true;
    queueMicrotask(enhance);
  }
  new MutationObserver(schedule).observe(root, {childList:true});
  window.addEventListener("hashchange",schedule);
  window.addEventListener("popstate",schedule);
  if (state?.ready) schedule();
  else window.addEventListener("travel-lite-ready",schedule,{once:true});
  window.TravelLiteDateNav = Object.freeze({
    validDate,dayLabel,mode,navigate,setSharedDate,refresh:schedule
  });
})();
