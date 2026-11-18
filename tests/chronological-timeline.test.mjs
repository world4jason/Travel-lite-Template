/* P0 publishing gate regression tests. SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { auditTimeline } from "../scripts/check-chronological-timeline.mjs";
const block = (id, type, start, end) => ({ id, title: id, type, start, end });
const trip = items => ({ trip: { timezone: "Asia/Taipei" }, days: [{ date: "2030-06-01", items }] });
const example = [block("visit", "place", "10:00", "11:00"),
  { ...block("metro", "transport", "11:00", "11:30"), transportMode: "subway" },
  block("lunch", "food", "11:30", "13:00"),
  { ...block("train", "transport", "13:00", "15:00"), transportMode: "train" }];
test("four consecutive time blocks include independent visit, transit, meal and transit", () => {
  assert.deepEqual(auditTimeline(trip(example)).errors, []);
});
test("descending starts and overlapping blocks fail publishing", () => {
  assert.match(auditTimeline(trip([example[1], example[0]])).errors.join(" "), /chronological/);
  assert.match(auditTimeline(trip([example[0], { ...example[1], start: "10:50" }])).errors.join(" "), /overlap/);
});
test("cross-zone chronological comparison is by absolute time, not local HH:MM", () => {
  const data = {trip: {timezone: "Asia/Tokyo"}, days: [{date: "2030-06-01", items: [
    {...block("kix", "transport", "11:30", "14:50"), timezone: "Asia/Tokyo"},
    {...block("tpe", "event", "13:50", "14:40"), timezone: "Asia/Taipei"}
  ]}]};
  assert.deepEqual(auditTimeline(data).errors, []);
});
test("floating and incomplete times are never filled with invented intervals", () => {
  assert.deepEqual(auditTimeline(trip([example[0],
    { id: "flex", title: "Afternoon", type: "place", timeLabel: "下午", start: "TBD" },
    { id: "maybe", title: "Departure", type: "transport", start: "14:00" }])).errors, []);
  assert.equal(auditTimeline(trip([block("bad", "place", "25:99", "26:00")])).errors.length > 0, true);
});
test("runtime contains a visible HH:MM–HH:MM item range, not a transport-only aside", () => {
  const source = readFileSync(new URL("../trip-view.js", import.meta.url), "utf8");
  assert.match(source, /timeline-time--range/);
  assert.match(source, /data-timeline-kind/);
  assert.match(source, /data-timeline-item-id/);
  assert.match(source, /timeLabel\(item, day\)/);
  assert.match(source, /next\?\.type === "transport"/);
});
test("checked-in trip data obeys chronological source-order contract", () => {
  const data = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
  assert.deepEqual(auditTimeline(data).errors, []);
});
