/* Evidence-gated static transit timing; no routing/network API. SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  const localize = (zh, en) => /^zh/i.test(state.data?.ui?.locale || "") ? zh : en;
  const validMinutes = (value) => Number.isInteger(value) && value >= 0 && value <= 10080;
  function duration(estimate) {
    if (!estimate || typeof estimate !== "object") return null;
    const exact = validMinutes(estimate.minutes) ? estimate.minutes : null;
    const min = exact ?? estimate.minMinutes;
    const max = exact ?? estimate.maxMinutes;
    if (!validMinutes(min) || !validMinutes(max) || max < min) return null;
    return { min, max };
  }
  function durationText(estimate) {
    const value = duration(estimate);
    if (!value) return "";
    const unit = localize("分", "min");
    return value.min === value.max ? localize("約 ", "About ") + value.max + " " + unit :
      localize("約 ", "About ") + value.min + "–" + value.max + " " + unit;
  }
  function parsedDeadline(raw, day, next) {
    if (typeof raw !== "string") return null;
    // Require an explicit absolute ISO instant with offset, never a floating HH:mm start.
    const match = /^(\d{4}-\d{2}-\d{2})T([0-2]\d:[0-5]\d)(?::[0-5]\d)?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.exec(raw);
    if (!match) return null;
    const epoch = Date.parse(raw);
    const time = window.TravelLiteTime;
    if (!Number.isFinite(epoch) || !time?.zonedPartsAt || !time?.effectiveItemTimeZone) return null;
    const zone = time.effectiveItemTimeZone(next, day);
    if (!time.validTimeZone(zone)) return null;
    const parts = time.zonedPartsAt(epoch, zone);
    // Reject invalid dates and offsets inconsistent with the destination zone / DST.
    if (parts.date !== match[1] || parts.time !== match[2]) return null;
    return { epoch, zone };
  }
  function calculate(transfer, fromItem, next, day) {
    const value = duration(transfer?.estimate);
    if (!value || !next || !day || !fromItem) return null;
    const estimate = transfer.estimate;
    if (!["source-fixed", "researched"].includes(estimate.basis)) return null;
    if (!validMinutes(estimate.bufferMinutes)) return null; // explicit zero is valid
    if (typeof transfer.checkedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(transfer.checkedAt)) return null;
    if (!Array.isArray(transfer.sourceLinks) || !transfer.sourceLinks.some(
      (link) => typeof link?.url === "string" && /^https?:\/\/[^/]/i.test(link.url.trim()))) return null;
    const deadline = parsedDeadline(next.arrivalDeadline, day, next);
    if (!deadline) return null;
    const time = window.TravelLiteTime;
    const fromZone = time.effectiveItemTimeZone(fromItem, day);
    if (!time.validTimeZone(fromZone)) return null;
    const departEpoch = deadline.epoch - (value.max + estimate.bufferMinutes) * 60000;
    if (!Number.isFinite(departEpoch)) return null;
    const depart = time.zonedPartsAt(departEpoch, fromZone);
    const label = (depart.date === day.date ? "" : depart.date + " ") + depart.time;
    let tight = false;
    // Compare only an explicit, unambiguous scheduled finish; do not infer one.
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(fromItem.end || "") &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(fromItem.start || "") &&
        fromItem.end >= fromItem.start && time.localDateTimeToEpoch) {
      const scheduledEnd = time.localDateTimeToEpoch(day.date, fromItem.end, fromZone);
      tight = Number.isFinite(scheduledEnd) && scheduledEnd > departEpoch;
    }
    return { departEpoch, departDate: depart.date, departTime: depart.time,
      timeZone: fromZone, label, minutes: value.max, bufferMinutes: estimate.bufferMinutes, tight };
  }
  function timingHtml(transfer, fromItem, next, day) {
    const timing = calculate(transfer, fromItem, next, day);
    if (!timing) return "";
    return '<div class="trip-transit-time">' +
      '<strong>' + localize("參考最晚出發", "Reference leave-by") + ' · ' +
      escapeHtml(timing.label) + '</strong>' +
      '<small>' + escapeHtml(timing.timeZone) + ' · ' +
      localize("以保守交通時間", "Conservative travel") + ' ' + timing.minutes +
      localize(" 分 + 明列緩衝 ", " min + stated buffer ") + timing.bufferMinutes +
      localize(" 分推算；非即時 ETA", " min; not a live ETA") + '</small>' +
      (timing.tight ? '<p>' + localize("與前一站排定結束時間較接近或衝突，請核對。",
        "Scheduled finish may conflict with this reference departure; please double-check.") + '</p>' : "") +
      '</div>';
  }
  const baseNow = renderNow;
  renderNow = function transitAwareRenderNow() {
    baseNow();
    const context = getNowContext();
    if (!state.data || context?.phase !== "during" || !context.next) return;
    const day = (state.data.days || []).find((candidate) =>
      (candidate.id && candidate.id === context.next.dayId) || candidate.date === context.next.date);
    const index = day?.items?.findIndex((item) => item.id === context.next.id) ?? -1;
    if (index < 1) return;
    const previous = day.items[index - 1], next = day.items[index];
    const timing = calculate(previous?.transferAfter, previous, next, day);
    const stack = root.querySelector(".view-stack");
    if (!timing || !stack || stack.querySelector(".trip-transit-now")) return;
    stack.insertAdjacentHTML("beforeend", '<section class="panel trip-transit-now">' +
      '<p class="eyebrow">' + localize("下一段交通 · 已發佈行程參考", "Next transfer · published reference") + '</p>' +
      '<strong>' + localize("參考最晚出發", "Reference leave-by") + ' · ' +
      escapeHtml(timing.label) + '</strong><p>' +
      localize("請向交通業者確認即時班次與路況。", "Check live transit schedules and disruptions with the provider.") +
      '</p></section>');
  };
  window.TravelLiteTransit = Object.freeze({ duration, durationText, calculate, timingHtml });
})();
