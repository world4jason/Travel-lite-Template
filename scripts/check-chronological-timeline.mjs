/* Strict chronological publishing gate. SPDX-License-Identifier: AGPL-3.0-or-later */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = value => CLOCK.test(value || "") ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
const formats = new Map();
function wallParts(ms, zone) {
  let fmt = formats.get(zone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    formats.set(zone, fmt);
  }
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).filter(x => x.type !== "literal")
    .map(x => [x.type, Number(x.value)]));
  return { ...p, date: [p.year, String(p.month).padStart(2, "0"), String(p.day).padStart(2, "0")].join("-") };
}
function epochAt(date, time, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !CLOCK.test(time || "")) return NaN;
  try {
    const d = date.split("-").map(Number);
    const h = Number(time.slice(0, 2)), m = Number(time.slice(3));
    const target = Date.UTC(d[0], d[1] - 1, d[2], h, m);
    let instant = target;
    for (let i = 0; i < 4; i++) {
      const p = wallParts(instant, zone);
      const rendered = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second || 0);
      const next = target - (rendered - instant);
      if (Math.abs(next - instant) < 1000) { instant = next; break; }
      instant = next;
    }
    const result = wallParts(instant, zone);
    return result.date === date && result.hour === h && result.minute === m ? instant : NaN;
  } catch { return NaN; }
}
function nextDay(date) {
  const d = new Date(date + "T12:00:00Z");
  if (Number.isNaN(d.valueOf())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
export function auditTimeline(data) {
  const errors = [], warnings = [];
  for (const [dayIndex, day] of (data?.days || []).entries()) {
    let previous = null;
    const items = Array.isArray(day.items) ? day.items : [];
    for (const [index, item] of items.entries()) {
      const key = "days[" + dayIndex + "].items[" + index + "] (" + (item.id || "missing ID") + ")";
      if (!item.id || !item.type || !item.title) errors.push(key + ": stable id, type and title are mandatory");
      const timed = CLOCK.test(item.start || ""), ended = CLOCK.test(item.end || "");
      if (item.start && item.start !== "TBD" && !timed) errors.push(key + ": invalid start time");
      if (item.end && !ended) errors.push(key + ": invalid end time");
      if (ended && !timed) errors.push(key + ": end without timed start");
      if (item.transferAfter && items[index + 1]?.type === "transport")
        warnings.push(key + ": redundant transferAfter before explicit transport row");
      if (!timed) continue; // floating is not 00:00
      const date = item.startDate || day.date;
      const zone = item.timezone || day.timezone || data?.trip?.timezone || "UTC";
      const start = epochAt(date, item.start, zone);
      if (!Number.isFinite(start)) { errors.push(key + ": invalid date / IANA time zone"); continue; }
      let end = ended ? epochAt(item.endDate || date, item.end, zone) : NaN;
      if (ended && end < start && !item.endDate && minutes(item.end) < minutes(item.start))
        end = epochAt(nextDay(date), item.end, zone);
      if (ended && (!Number.isFinite(end) || end <= start)) errors.push(key + ": end must be after start");
      if (!ended) warnings.push(key + ": end time unknown; it must stay TBD, never inferred");
      if (previous && start < previous.start) errors.push(key + ": source order is not chronological after " + previous.key);
      else if (previous && Number.isFinite(previous.end) && start < previous.end)
        errors.push(key + ": time range overlaps " + previous.key);
      previous = { key, start, end };
    }
  }
  return { errors, warnings };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const filename = resolve(process.argv[2] || "trip.json");
    const data = JSON.parse(readFileSync(filename, "utf8"));
    const result = auditTimeline(data);
    for (const line of result.warnings) console.warn("WARN " + line);
    for (const line of result.errors) console.error("FAIL " + line);
    if (result.errors.length) process.exitCode = 1;
    else console.log("PASS chronological timeline: " + (data.days || []).length +
      " days; valid source-ordered, non-overlapping time blocks");
  } catch (error) {
    console.error("FAIL timeline contract: " + error.message);
    process.exitCode = 1;
  }
}
