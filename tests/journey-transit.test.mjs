import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../journey-transit.js", import.meta.url), "utf8");
const fmt = (epoch, zone) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(epoch)).map((item) => [item.type, item.value]));
  return { date: [parts.year, parts.month, parts.day].join("-"), time: parts.hour + ":" + parts.minute };
};
function fixture() {
  const context = {
    state: { data: { ui: { locale: "en" } } }, root: { querySelector() { return null; } },
    getNowContext() { return { phase: "before" }; }, renderNow() {},
    escapeHtml(value) { return String(value); },
    window: { TravelLiteTime: {
      validTimeZone(zone) { try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; } catch { return false; } },
      effectiveItemTimeZone(item, day) { return item.timezone || day.timezone || "Asia/Tokyo"; },
      zonedPartsAt: fmt,
      localDateTimeToEpoch(date, clock, zone) {
        if (zone !== "Asia/Tokyo") return NaN;
        return Date.parse(date + "T" + clock + ":00+09:00");
      }
    } }, Date
  };
  runInNewContext(source, context);
  return context.window.TravelLiteTransit;
}
const transfer = {
  estimate: { minMinutes: 25, maxMinutes: 35, bufferMinutes: 15, basis: "researched" },
  sourceLinks: [{ label: "Operator", url: "https://example.org/route" }], checkedAt: "2026-09-01"
};
const day = { date: "2026-10-03", timezone: "Asia/Tokyo" };
const from = { start: "12:00", end: "13:00", title: "Previous" };
const next = { title: "Must arrive", arrivalDeadline: "2026-10-03T14:00:00+09:00" };

test("duration range and evidenced conservative reference leave-by", () => {
  const core = fixture();
  assert.match(core.durationText(transfer.estimate), /25–35 min/);
  assert.equal(core.calculate(transfer, from, next, day).label, "13:10");
  assert.equal(core.calculate(transfer, from, next, day).tight, false);
});
test("TBD, normal start, bad basis, missing sources or buffer never imply leave-by", () => {
  const core = fixture();
  assert.equal(core.calculate(transfer, from, { start: "14:00" }, day), null);
  assert.equal(core.calculate({ ...transfer, sourceLinks: [] }, from, next, day), null);
  assert.equal(core.calculate({ ...transfer, checkedAt: "" }, from, next, day), null);
  assert.equal(core.calculate({ ...transfer, estimate: { ...transfer.estimate, bufferMinutes: undefined } }, from, next, day), null);
  assert.equal(core.calculate({ ...transfer, estimate: { ...transfer.estimate, basis: "rough" } }, from, next, day), null);
});
test("negative scheduled slack produces only a soft warning; overnight uses date prefix", () => {
  const core = fixture();
  assert.equal(core.calculate(transfer, { ...from, end: "13:25" }, next, day).tight, true);
  assert.equal(core.calculate(transfer, from,
    { arrivalDeadline: "2026-10-04T00:10:00+09:00" }, day).label, "23:20");
  assert.equal(core.calculate(transfer, from,
    { arrivalDeadline: "2026-10-03T00:10:00+09:00" }, day).label, "2026-10-02 23:20");
});
test("DST gap or mismatched destination offset is rejected, never guessed", () => {
  const core = fixture();
  assert.equal(core.calculate(transfer, from, {
    timezone: "America/New_York", arrivalDeadline: "2026-03-08T02:30:00-05:00"
  }, day), null);
  assert.equal(core.calculate(transfer, from, {
    timezone: "Asia/Tokyo", arrivalDeadline: "2026-10-03T14:00:00+08:00"
  }, day), null);
});
