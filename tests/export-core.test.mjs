import test from "node:test";
import assert from "node:assert/strict";
import "../export-core.js";

// The existing timezone module is reused as-is. Install only the minimal
// browser globals needed by its top-level function overrides.
globalThis.window = globalThis;
globalThis.state = { data: { trip: { id: "trip-test", timezone: "Asia/Tokyo" }, days: [] } };
globalThis.zonedNow = () => ({ date: "2026-10-03", minuteOfDay: 0 });
globalThis.getNowContext = () => ({});
globalThis.getDayProgress = () => 0;
globalThis.updateClock = () => {};
await import("../timezone.js");

const core = globalThis.TravelLiteExportCore;
const api = globalThis.TravelLiteTime;

function fixture(items = [], timezone = "Asia/Tokyo") {
  return {
    trip: { id: "my-trip", title: "Tokyo <Autumn>", startDate: "2026-10-03", endDate: "2026-10-03", timezone },
    days: [{ id: "d1", date: "2026-10-03", label: "Day 1", title: "Arrival", routeSummary: ["Haneda", "Shibuya"],
      reminders: ["Check tickets"], items }],
    reservations: [{ id: "r1", title: "Hotel", status: "confirmed", date: "2026-10-03", time: "14:00", location: "Shibuya" }]
  };
}

test("A4 print layout includes complete published trip and no device-local state", () => {
  const data = fixture([{ id: "a", title: "<script>alert(1)</script>", start: "09:00", location: "Tokyo",
    note: "Map is outside this page" }, { id: "b", title: "Free time", start: "TBD" }]);
  data.personalNote = "THIS IS PRIVATE";
  data.checks = { x: true };
  const page = core.printHtml(data, "a4", "en");
  assert.match(page, /size: A4 portrait/);
  assert.match(page, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(page, /<script>alert\(1\)<\/script>/);
  assert.match(page, /Time TBD/);
  assert.match(page, /Check tickets/);
  assert.match(page, /Confirmed bookings/);
  assert.doesNotMatch(page, /THIS IS PRIVATE/);
  assert.doesNotMatch(page, /navigation.*Google Maps/);
});

test("A5 booklet has cover, per-day overview and intentional page breaks", () => {
  const data = fixture([{ id: "a", title: "First stop", start: "10:00" }]);
  for (let i = 2; i <= 32; i += 1) {
    data.days.push({ id: `day-${i}`, date: new Date(Date.UTC(2026, 9, 3 + i - 1)).toISOString().slice(0, 10), title: "Activity day", items: [{ id: "p", title: "Hike" }] });
  }
  const page = core.printHtml(data, "a5", "zh");
  assert.match(page, /size: A5 portrait/);
  assert.match(page, /旅行小手冊/);
  assert.match(page, /行程一覽/);
  assert.match(page, /page-break-before: always/);
  assert.equal((page.match(/class="day booklet-day"/g) || []).length, 32);
  assert.match(page, /時間未定/);
});

test("ICS keeps timezone, start-only semantics, UID stability and excludes TBD", () => {
  const data = fixture([
    { id: "first", start: "10:30", end: "12:00", title: "Arrive", location: "Haneda" },
    { id: "second", start: "16:00", title: "Lunch, cafe; coffee\\break\n日本語" },
    { id: "third", start: "TBD", title: "Flexible lunch" }
  ]);
  const result = core.buildIcs(data, api, { nowMs: Date.UTC(2026, 8, 1), alarmMinutes: 30 });
  const again = core.buildIcs(data, api, { nowMs: Date.UTC(2026, 8, 2), alarmMinutes: 0 });
  assert.equal(result.included, 2);
  assert.equal(result.skipped, 1);
  assert.equal(result.skipReasons.noTime, 1);
  assert.match(result.text, /DTSTART:20261003T013000Z/);
  assert.match(result.text, /DTEND:20261003T030000Z/);
  assert.match(result.text, /DTSTART:20261003T070000Z/);
  assert.equal((result.text.match(/DTEND:/g) || []).length, 1, "no invented end for second event");
  assert.match(result.text, /TRIGGER:-PT30M/);
  assert.doesNotMatch(result.text, /Flexible lunch/);
  assert.deepEqual([...result.text.matchAll(/^UID:(.*)$/gm)].map(x => x[1]),
    [...again.text.matchAll(/^UID:(.*)$/gm)].map(x => x[1]));
  assert.ok(result.text.endsWith("\r\n"));
  assert.equal(result.text.replace(/\r\n/g, "").includes("\n"), false, "CRLF only");
});

test("RFC 5545 TEXT escape and UTF-8 folding respect 75 octets per physical line", () => {
  assert.equal(core.escapeIcsText("a,b;c\\d\nline"), String.raw`a\,b\;c\\d\nline`);
  const folded = core.foldIcsLine("DESCRIPTION:" + "東京い".repeat(90) + "✨");
  for (const line of folded.split("\r\n")) {
    assert.ok(new TextEncoder().encode(line).length <= 75);
  }
  assert.match(folded, /\r\n /);
});

test("DST crossing midnight uses the next LOCAL date rather than adding 24h", () => {
  const data = fixture([{ id: "night", start: "23:30", end: "03:30", title: "Overnight train" }], "America/New_York");
  data.days[0].date = "2026-03-07";
  const result = core.buildIcs(data, api, { nowMs: 0 });
  assert.equal(result.included, 1);
  assert.match(result.text, /DTSTART:20260308T043000Z/);
  assert.match(result.text, /DTEND:20260308T073000Z/);
});

test("ambiguous/nonexistent DST local times and malformed zones are excluded", () => {
  const data = fixture([{ id: "spring", start: "02:30", title: "Missing local time" }], "America/New_York");
  data.days[0].date = "2026-03-08";
  let result = core.buildIcs(data, api, { nowMs: 0 });
  assert.equal(result.included, 0);
  assert.equal(result.skipReasons.invalidDateOrTime, 1);

  data.days[0].date = "2026-11-01";
  data.days[0].items[0].start = "01:30";
  result = core.buildIcs(data, api, { nowMs: 0 });
  assert.equal(result.included, 0);
  assert.equal(result.skipReasons.invalidDateOrTime, 1);

  data.days[0].items[0].start = "11:30";
  data.days[0].items[0].timezone = "Not/A_Zone";
  result = core.buildIcs(data, api, { nowMs: 0 });
  assert.equal(result.skipReasons.invalidTimeZone, 1);
});

test("invalid date cannot silently become another calendar day", () => {
  const data = fixture([{ id: "bad", start: "09:00", title: "Impossible" }]);
  data.days[0].date = "2026-02-30";
  assert.equal(core.validDate(data.days[0].date), false);
  const result = core.buildIcs(data, api, { nowMs: 0 });
  assert.equal(result.included, 0);
  assert.equal(result.skipReasons.invalidDateOrTime, 1);
});

test("stable calendar UID cannot collide when IDs contain punctuation", () => {
  const first = fixture([{ id: "d", start: "09:00", title: "A" }]);
  first.trip.id = "a.b";
  first.days[0].id = "c";
  const second = fixture([{ id: "d", start: "09:00", title: "B" }]);
  second.trip.id = "a";
  second.days[0].id = "b.c";
  const one = core.buildIcs(first, api, { nowMs: 0 });
  const two = core.buildIcs(second, api, { nowMs: 0 });
  const uid = (output) => output.text.match(/UID:([^\r\n]+)/)[1];
  assert.notEqual(uid(one), uid(two));
});
