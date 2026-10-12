/* Static trip export primitives. Shared data only; no storage, network, or planner behavior.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";

  const encoder = new TextEncoder();
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const clockPattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

  function validDate(value) {
    const match = datePattern.exec(String(value || ""));
    if (!match) return false;
    const stamp = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return Number.isFinite(stamp.getTime()) && stamp.toISOString().slice(0, 10) === value;
  }

  function parseClock(value) {
    const match = clockPattern.exec(String(value || "").trim());
    return match ? { hour: +match[1], minute: +match[2] } : null;
  }

  function addLocalDay(value) {
    if (!validDate(value)) return null;
    const stamp = new Date(Date.parse(`${value}T00:00:00Z`));
    stamp.setUTCDate(stamp.getUTCDate() + 1);
    return stamp.toISOString().slice(0, 10);
  }

  function safeText(value) {
    return String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  }

  function html(value) {
    return safeText(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function normalizedTrip(data) {
    const trip = data?.trip || {};
    const days = Array.isArray(data?.days) ? data.days : [];
    return {
      title: safeText(trip.title || "Travel itinerary"),
      subtitle: safeText(trip.subtitle || ""),
      homeLabel: safeText(trip.homeLabel || ""),
      startDate: safeText(trip.startDate || ""),
      endDate: safeText(trip.endDate || ""),
      days: days.map((day) => ({
        date: safeText(day.date || ""),
        label: safeText(day.label || ""),
        title: safeText(day.title || ""),
        timezone: safeText(day.timezone || trip.timezone || ""),
        route: (Array.isArray(day.routeSummary) ? day.routeSummary : [])
          .map((stop) => typeof stop === "string" ? stop : stop?.label || stop?.title || "")
          .filter(Boolean).map(safeText),
        reminders: (Array.isArray(day.reminders) ? day.reminders : [])
          .map((entry) => typeof entry === "string" ? entry : entry?.text || entry?.label || "")
          .filter(Boolean).map(safeText),
        items: (Array.isArray(day.items) ? day.items : []).map((item) => ({
          title: safeText(item.title || item.location || "Planned stop"),
          start: parseClock(item.start) ? safeText(item.start).trim() : "",
          end: parseClock(item.end) ? safeText(item.end).trim() : "",
          location: safeText(item.location || ""),
          note: safeText(item.note || ""),
          timezone: safeText(item.timezone || day.timezone || trip.timezone || "")
        }))
      })),
      reservations: (Array.isArray(data?.reservations) ? data.reservations : [])
        .filter((booking) => String(booking.status || "").toLowerCase() === "confirmed")
        .map((booking) => ({
          title: safeText(booking.title || ""),
          date: safeText(booking.date || ""),
          time: safeText(booking.time || ""),
          location: safeText(booking.location || "")
        }))
    };
  }

  function itemMarkup(item, dayZone, lang) {
    const when = item.start ? `${item.start}${item.end ? "–" + item.end : ""}` : (lang === "zh" ? "時間未定" : "Time TBD");
    const timeZone = item.timezone && item.timezone !== dayZone ? `<small class="zone">${html(item.timezone)}</small>` : "";
    return `<li class="itinerary-item">
      <span class="item-when">${html(when)}${timeZone}</span>
      <div class="item-copy"><strong>${html(item.title)}</strong>
        ${item.location ? `<span class="location">${html(item.location)}</span>` : ""}
        ${item.note ? `<p class="item-note">${html(item.note)}</p>` : ""}
      </div>
    </li>`;
  }

  function dayMarkup(day, lang, booklet) {
    const title = day.title || day.label || day.date;
    const zone = day.timezone ? `<small class="zone">${html(day.timezone)}</small>` : "";
    return `<section class="day ${booklet ? "booklet-day" : "a4-day"}">
      <header class="day-heading"><span class="day-date">${html(day.date)}${day.label ? " · " + html(day.label) : ""}</span>
        <h2>${html(title)}</h2>${zone}</header>
      ${day.route.length ? `<p class="route">${day.route.map(html).join(" → ")}</p>` : ""}
      ${day.items.length ? `<ol class="itinerary">${day.items.map((item) => itemMarkup(item, day.timezone, lang)).join("")}</ol>` :
        `<p class="empty">${lang === "zh" ? "這天沒有排定活動。" : "No activities published for this day."}</p>`}
      ${day.reminders.length ? `<aside class="day-reminders"><h3>${lang === "zh" ? "提醒" : "Reminders"}</h3><ul>${day.reminders.map((reminder) => `<li>${html(reminder)}</li>`).join("")}</ul></aside>` : ""}
    </section>`;
  }

  function printStyles(booklet) {
    const size = booklet ? "A5" : "A4";
    const margin = booklet ? "11mm" : "15mm";
    return `
      @page { size: ${size} portrait; margin: ${margin}; }
      :root { color-scheme: light; font-family: system-ui, -apple-system, "Noto Sans CJK TC", "PingFang TC", sans-serif; color: #222d30; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #e4e8e7; line-height: 1.5; font-size: ${booklet ? "11pt" : "10pt"}; }
      .print-bar { position: sticky; top: 0; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #243e41; color: white; z-index: 10; font-size: 14px; }
      .print-bar button { border: 0; border-radius: 5px; background: white; color: #243e41; padding: 10px 15px; font: inherit; font-weight: 650; cursor: pointer; }
      .paper { width: ${booklet ? "148mm" : "210mm"}; max-width: 100%; padding: ${margin}; margin: 20px auto; background: white; box-shadow: 0 12px 34px #0002; }
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: ${booklet ? "23pt" : "26pt"}; letter-spacing: -.03em; line-height: 1.16; overflow-wrap: anywhere; }
      h2 { font-size: ${booklet ? "15pt" : "17pt"}; line-height: 1.25; overflow-wrap: anywhere; }
      h3 { font-size: 10.5pt; }
      .eyebrow, .day-date, .zone { color: #526468; letter-spacing: .04em; }
      .eyebrow { font-size: 9pt; font-weight: 700; text-transform: uppercase; }
      .range, .subtitle, .home { margin-top: 8px; color: #4e5b5e; }
      .cover { border-bottom: 2px solid #44595c; padding: 32px 0 22px; margin-bottom: 12mm; }
      .cover h1 { margin-top: 12px; }
      .overview { margin-bottom: 10mm; }
      .overview h2 { margin-bottom: 10px; }
      .overview-list { margin: 0; padding-left: 20px; }
      .overview-list li { padding: 4px 0; overflow-wrap: anywhere; }
      .day { margin-bottom: 11mm; }
      .day-heading { border-top: 1px solid #87999b; padding-top: 12px; margin-bottom: 12px; break-after: avoid; }
      .day-date { display: block; font-size: 9pt; font-weight: 700; margin-bottom: 4px; }
      .zone { display: block; font-size: 8pt; font-weight: 400; letter-spacing: 0; }
      .route { color: #43565a; margin-bottom: 10px; overflow-wrap: anywhere; }
      .itinerary { list-style: none; padding: 0; margin: 0; }
      .itinerary-item { display: grid; grid-template-columns: ${booklet ? "29mm" : "35mm"} minmax(0, 1fr); gap: 7px; padding: 10px 0; border-bottom: 1px solid #d5dede; break-inside: avoid; page-break-inside: avoid; }
      .item-when { font-weight: 700; font-size: 9pt; white-space: normal; }
      .item-copy { min-width: 0; overflow-wrap: anywhere; }
      .item-copy strong { font-size: 10.5pt; display: block; }
      .location { display: block; color: #536165; margin-top: 2px; }
      .item-note { margin-top: 4px; font-size: 9.5pt; white-space: pre-wrap; }
      .day-reminders { margin-top: 10px; padding: 10px 12px; border-left: 3px solid #6c8587; background: #f4f7f7; break-inside: auto; }
      .day-reminders ul { margin: 5px 0 0; padding-left: 18px; overflow-wrap: anywhere; }
      .day-reminders li { margin: 4px 0; }
      .confirmed { border-top: 2px solid #44595c; padding-top: 12px; break-inside: avoid; page-break-inside: avoid; }
      .confirmed h2 { margin-bottom: 10px; }
      .confirmed li { margin: 4px 0; overflow-wrap: anywhere; }
      .disclaimer { margin-top: 15mm; border-top: 1px solid #bbc8c9; padding-top: 8px; color: #586669; font-size: 8pt; }
      .empty { color: #667; }
      ${booklet ? `
        .booklet-cover { min-height: 159mm; display: flex; flex-direction: column; justify-content: center; border-bottom: 0; }
        .booklet-cover h1 { font-size: 26pt; }
        .booklet-overview { padding-top: 6mm; }
      ` : ""}
      @media print {
        html, body { margin: 0; background: white; }
        .print-bar { display: none !important; }
        .paper { width: auto; max-width: none; padding: 0; margin: 0; box-shadow: none; }
        .day-reminders { background: #fff; }
        .a4-day { break-inside: avoid; page-break-inside: avoid; }
        ${booklet ? `
          .booklet-cover, .booklet-overview { break-after: page; page-break-after: always; }
          .booklet-day { break-before: page; page-break-before: always; }
        ` : ""}
      }
      @media screen and (max-width: 600px) { .paper { margin: 0; padding: 16px; box-shadow: none; } .print-bar { position: static; } }
    `;
  }

  function printHtml(data, format = "a4", lang = "en") {
    const model = normalizedTrip(data);
    const booklet = format === "a5";
    const chinese = lang === "zh";
    const cover = `<section class="cover ${booklet ? "booklet-cover" : ""}">
      <p class="eyebrow">${chinese ? "旅行小手冊" : booklet ? "Travel booklet" : "Travel itinerary"}</p>
      <h1>${html(model.title)}</h1>
      ${model.subtitle ? `<p class="subtitle">${html(model.subtitle)}</p>` : ""}
      <p class="range">${html(model.startDate)} – ${html(model.endDate)}</p>
      ${model.homeLabel ? `<p class="home">${html(model.homeLabel)}</p>` : ""}
    </section>`;
    const overview = booklet ? `<section class="overview booklet-overview">
      <p class="eyebrow">${chinese ? "行程一覽" : "At a glance"}</p>
      <h2>${chinese ? "每天去哪裡" : "Your trip by day"}</h2>
      <ol class="overview-list">${model.days.map((day) => `<li><strong>${html(day.date)}</strong> — ${html(day.title || day.label || day.date)}</li>`).join("")}</ol>
    </section>` : "";
    const confirmed = model.reservations.length ? `<section class="confirmed">
      <h2>${chinese ? "已確認的預訂摘要" : "Confirmed bookings · overview"}</h2>
      <ul>${model.reservations.map((booking) => `<li><strong>${html(booking.title)}</strong> — ${html([booking.date, booking.time, booking.location].filter(Boolean).join(" · "))}</li>`).join("")}</ul>
    </section>` : "";
    return `<!doctype html><html lang="${chinese ? "zh-TW" : "en"}">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${html(model.title)} — ${booklet ? "A5" : "A4"}</title><style>${printStyles(booklet)}</style></head>
      <body><div class="print-bar"><span>${chinese ? "列印預覽 · 行程快照" : "Print preview · itinerary snapshot"} · ${booklet ? "A5" : "A4"}</span>
      <button type="button" id="print-now">${chinese ? "列印／另存 PDF" : "Print / Save PDF"}</button></div>
      <main class="paper ${booklet ? "booklet" : "full-itinerary"}">${cover}${overview}
        ${model.days.map((day) => dayMarkup(day, chinese ? "zh" : "en", booklet)).join("")}
        ${confirmed}
        <p class="disclaimer">${chinese ? "根據已發佈的行程產生的靜態快照；交通與即時營運資訊請以官方資訊為準。" :
          "Snapshot of the published itinerary. Check operators for live travel or booking updates."}</p>
      </main></body></html>`;
  }

  function validZone(zone) {
    try { new Intl.DateTimeFormat("en", { timeZone: zone }).format(0); return true; }
    catch { return false; }
  }

  function escapeIcsText(value) {
    return safeText(value).replace(/\r\n|\r|\n/g, "\n")
      .replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  // RFC 5545 3.1: 75 octets per physical line, CRLF + one whitespace octet on continuation.
  function foldIcsLine(line) {
    const folded = [];
    let chunk = "", length = 0;
    for (const codePoint of String(line)) {
      const bytes = encoder.encode(codePoint).length;
      if (length + bytes > 75 && chunk) {
        folded.push(chunk);
        chunk = " " + codePoint;
        length = 1 + bytes;
      } else {
        chunk += codePoint;
        length += bytes;
      }
    }
    folded.push(chunk);
    return folded.join("\r\n");
  }

  function utcStamp(ms) {
    return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function isAmbiguousWallTime(ms, date, time, zone, api) {
    const original = parseClock(time);
    for (const offsetMinutes of [-120, -90, -60, -30, 30, 60, 90, 120]) {
      const probe = api.zonedPartsAt(ms + offsetMinutes * 60000, zone);
      if (probe.date === date && probe.hour === original.hour && probe.minute === original.minute) return true;
    }
    return false;
  }

  function buildIcs(data, timeApi, options = {}) {
    if (!timeApi?.localDateTimeToEpoch || !timeApi?.zonedPartsAt) {
      throw new Error("Trip timezone helpers are unavailable");
    }
    const trip = data?.trip || {};
    const alarm = options.alarmMinutes === 30 ? 30 : 0;
    const stamp = utcStamp(options.nowMs ?? Date.now());
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Travel Lite//Trip Export//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    let included = 0, skipped = 0;
    const skipReasons = { noTime: 0, invalidTimeZone: 0, invalidDateOrTime: 0, missingId: 0 };
    function skip(reason) { skipped += 1; skipReasons[reason] += 1; }

    for (const day of Array.isArray(data?.days) ? data.days : []) {
      for (const item of Array.isArray(day.items) ? day.items : []) {
        if (!parseClock(item.start)) { skip("noTime"); continue; }
        if (!trip.id || !day.id || !item.id) { skip("missingId"); continue; }
        if (!validDate(day.date)) { skip("invalidDateOrTime"); continue; }
        const zone = item.timezone || day.timezone || trip.timezone;
        if (!zone || !validZone(zone)) { skip("invalidTimeZone"); continue; }

        const begin = timeApi.localDateTimeToEpoch(day.date, item.start, zone);
        if (!Number.isFinite(begin) || isAmbiguousWallTime(begin, day.date, item.start, zone, timeApi)) {
          skip("invalidDateOrTime"); continue;
        }

        let end = null;
        if (parseClock(item.end)) {
          const startMinutes = parseClock(item.start).hour * 60 + parseClock(item.start).minute;
          const endMinutes = parseClock(item.end).hour * 60 + parseClock(item.end).minute;
          const endDay = endMinutes < startMinutes ? addLocalDay(day.date) : day.date;
          const candidate = timeApi.localDateTimeToEpoch(endDay, item.end, zone);
          if (!Number.isFinite(candidate) || isAmbiguousWallTime(candidate, endDay, item.end, zone, timeApi)) {
            skip("invalidDateOrTime"); continue;
          }
          if (candidate > begin) end = candidate;
        }
        // Length-prefixed segments prevent collisions when stable IDs contain periods.
        const uid = [trip.id, day.id, item.id].map((part) => {
          const encoded = encodeURIComponent(String(part)).replace(/\./g, "%2E");
          return `${encoded.length}-${encoded}`;
        }).join(".") + "@travel-lite.invalid";
        lines.push("BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + stamp, "DTSTART:" + utcStamp(begin));
        if (end !== null) lines.push("DTEND:" + utcStamp(end));
        lines.push("SUMMARY:" + escapeIcsText(item.title || item.location || "Trip event"));
        if (item.location) lines.push("LOCATION:" + escapeIcsText(item.location));
        if (item.note) lines.push("DESCRIPTION:" + escapeIcsText(item.note));
        if (alarm) {
          lines.push("BEGIN:VALARM", "ACTION:DISPLAY",
            "DESCRIPTION:" + escapeIcsText(item.title || "Trip reminder"),
            "TRIGGER:-PT" + alarm + "M", "END:VALARM");
        }
        lines.push("END:VEVENT");
        included += 1;
      }
    }

    lines.push("END:VCALENDAR");
    return {
      text: lines.map(foldIcsLine).join("\r\n") + "\r\n",
      included, skipped, skipReasons
    };
  }

  globalThis.TravelLiteExportCore = Object.freeze({
    printHtml, normalizedTrip, buildIcs, validDate, parseClock, escapeIcsText, foldIcsLine
  });
})();
