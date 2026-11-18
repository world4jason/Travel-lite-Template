/* Read-only flight cards. All scheduled times come from canonical trip.json
 * transport/flight items; no parallel flight timetable. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const root = document.querySelector("#view-root");
  if (!root) return;
  const tr = (zh, en) => /^zh/i.test(state.data?.ui?.locale || "") ? zh : en;
  const esc = value => escapeHtml(String(value ?? ""));
  const att = value => escapeAttr(String(value ?? ""));
  const clock = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
  function scheduledFlights() {
    return (state.data?.days || []).flatMap(day =>
      (day.items || []).filter(item => item.type === "transport" && item.transportMode === "flight")
        .map(item => ({item, day})));
  }
  function arrival(entry) {
    const {item, day} = entry;
    const config = item.flight || {};
    const depZone = item.timezone || day.timezone || state.data.trip.timezone;
    const arrZone = config.arrivalTimezone || depZone;
    if (!clock(item.end) || !window.TravelLiteTime?.localDateTimeToEpoch) return {time: "",zone:arrZone};
    const start = window.TravelLiteTime.localDateTimeToEpoch(item.startDate || day.date, item.start, depZone);
    let endDate = item.endDate || item.startDate || day.date;
    let finish = window.TravelLiteTime.localDateTimeToEpoch(endDate, item.end, depZone);
    if (Number.isFinite(start) && Number.isFinite(finish) && finish <= start && !item.endDate) {
      const date = new Date(endDate + "T12:00:00Z");
      date.setUTCDate(date.getUTCDate() + 1);
      endDate = date.toISOString().slice(0, 10);
      finish = window.TravelLiteTime.localDateTimeToEpoch(endDate, item.end, depZone);
    }
    if (!Number.isFinite(finish)) return {time: "",zone:arrZone};
    const local = window.TravelLiteTime.zonedPartsAt?.(finish, arrZone);
    return {time: local?.time || item.end,zone:arrZone,
      date: local?.date || endDate};
  }
  function card(entry, index, count, detail = false) {
    const {item, day} = entry, meta = item.flight || {};
    const origin = meta.origin || {}, dest = meta.destination || {};
    const route = typeof item.location === "string" ? item.location.split(/\s*[→➜]\s*/) : [];
    const originLabel = origin.code || route[0] || tr("出發地", "Origin");
    const destinationLabel = dest.code || route[1] || tr("目的地", "Destination");
    const flightNumber = meta.number || (item.title || "").match(/^[A-Z]{1,3}\d{2,5}/)?.[0] || "";
    const airline = meta.airline || "";
    const arrived = arrival(entry);
    const departure = clock(item.start) ? item.start : tr("待定", "TBD");
    const finish = arrived.time || tr("待定", "TBD");
    const label = count === 2 ? (index === 0 ? tr("去程", "Outbound") : tr("回程", "Return")) :
      count > 2 ? tr("航段 ", "Flight ") + (index + 1) : tr("航班", "Flight");
    const depTerminal = origin.terminal ? " · " + origin.terminal : "";
    const destTerminal = dest.terminal ? " · " + dest.terminal : "";
    return '<article class="travel-flight-card">' +
      '<div class="travel-flight-card-meta"><strong>' + esc(label) + '</strong>' +
        '<span>' + esc(day.date.slice(5).replace("-","/")) + '</span>' +
        (flightNumber ? '<b>' + esc(flightNumber) + '</b>' : '') + '</div>' +
      '<div class="travel-flight-times">' +
        '<div><strong>' + esc(departure) + '</strong><small>' + esc(originLabel + depTerminal) + '</small></div>' +
        '<span class="travel-flight-arrow" aria-hidden="true">✈</span>' +
        '<div><strong>' + esc(finish) + '</strong><small>' + esc(destinationLabel + destTerminal) + '</small></div>' +
      '</div>' +
      '<p class="travel-flight-caption">' + esc((airline ? airline + " · " : "") +
        tr("航班行程參考 · 非即時狀態", "Published flight · not live status")) + '</p>' +
      (detail && item.note ? '<p class="travel-flight-note">' + esc(item.note) + '</p>' : '') +
      (!detail ? '<a class="travel-flight-day-link" href="#trip/day/' + att(day.date) + '">' +
        esc(tr("查看當日行程", "View trip day")) + ' ↗</a>' : '') +
      '</article>';
  }
  function overview() {
    const target = root.querySelector(".trip-overview-days");
    if (!target || root.querySelector(".travel-flight-overview")) return;
    const entries = scheduledFlights();
    if (!entries.length) return;
    const section = document.createElement("section");
    section.className = "travel-flight-overview";
    section.setAttribute("aria-label", tr("去回程航班摘要", "Flight overview"));
    section.innerHTML = '<div class="travel-flight-heading"><h2>' +
      esc(tr("去回程航班", "Flights at a glance")) + '</h2><span>' +
      esc(tr("以行程資料為準", "Published itinerary")) + '</span></div>' +
      '<div class="travel-flight-grid">' +
      entries.map((entry, i) => card(entry, i, entries.length)).join("") + '</div>';
    target.before(section);
  }
  function transport() {
    const entries = scheduledFlights().filter(entry => entry.day.date === state.selectedDate);
    if (!entries.length || root.querySelector(".travel-flight-transport")) return;
    const target = root.querySelector(".tl-board") || root.querySelector(".runtime-map-panel") ||
      root.querySelector(".map-day-tabs");
    if (!target) return;
    const section = document.createElement("section");
    section.className = "travel-flight-overview travel-flight-transport";
    section.setAttribute("aria-label", tr("本日航班", "Flights today"));
    section.innerHTML = '<div class="travel-flight-heading"><h2>' +
      esc(tr("本日航班", "Flights today")) + '</h2><span>' +
      esc(tr("起降地當地時間", "Local airport times")) + '</span></div>' +
      '<div class="travel-flight-grid">' +
      entries.map((entry,i)=>card(entry,i,entries.length,true)).join("") + '</div>';
    target.before(section);
  }
  const originalTrip = renderTrip, originalMap = renderMap;
  renderTrip = function flightTripRender() { originalTrip(); if (state.view === "trip") overview(); };
  renderMap = function flightTransportRender() { originalMap(); if (state.view === "map") transport(); };
  window.TravelLiteFlights = Object.freeze({ scheduledFlights, arrival, overview, transport });
})();
