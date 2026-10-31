/* #116 D1: Trip start validity must not depend on the selected Style Pack.
   Exercise the real index.html boot, including companion/timezone overrides.
   D2 route projection is a separate known issue and is not changed here.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const source = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const fixedNow = 1790991000000; // 2026-10-03T01:30:00Z = 10:30 Asia/Tokyo.
const date = "2026-10-03";
const representativeStyles = ["editorial", "storybook", "risograph", "vintage-watercolor"];

// These expectations are literal policy examples, not a copy of the runtime
// parser. Overlapping valid windows may all be current; do not impose a new
// single-current-item policy while removing the Style Pack condition.
const cases = [
  { id: "valid", title: "Valid HHMM", fields: { start: "09:00", end: "11:00" }, timed: true, current: true },
  { id: "tbd", title: "TBD with valid end", fields: { start: "TBD", end: "11:00" }, timed: false, current: false },
  { id: "short", title: "One digit hour", fields: { start: "9:00", end: "11:00" }, timed: false, current: false },
  { id: "space", title: "Whitespace start", fields: { start: " 09:00 ", end: "11:00" }, timed: false, current: false },
  { id: "noend", title: "No end", fields: { start: "09:00" }, timed: true, current: false },
  { id: "nostart", title: "No start", fields: { end: "11:00" }, timed: false, current: false },
  { id: "bad-hour", title: "Invalid hour", fields: { start: "25:00", end: "26:00" }, timed: false, current: false },
  { id: "tbd-end", title: "TBD end", fields: { start: "09:00", end: "TBD" }, timed: true, current: false },
  { id: "start-boundary", title: "Start boundary", fields: { start: "10:30", end: "11:30" }, timed: true, current: true },
  { id: "end-boundary", title: "End boundary", fields: { start: "09:30", end: "10:30" }, timed: true, current: false },
  { id: "bad-minute", title: "Invalid minute", fields: { start: "09:60", end: "11:00" }, timed: false, current: false },
  { id: "space-end", title: "Existing end parser", fields: { start: "09:00", end: " 11:00 " }, timed: true, current: true },
];

function fixture() {
  const trip = structuredClone(source);
  Object.assign(trip.trip, {
    id: "issue116-trip-start-contract",
    title: "Trip start contract",
    startDate: date,
    endDate: date,
    timezone: "Asia/Tokyo",
  });
  Object.assign(trip.ui, { locale: "en", defaultView: "trip", visualStyle: "editorial", theme: "system" });
  trip.days = [{
    id: "issue116-day",
    date,
    label: "Day 1",
    title: "Published time cases",
    routeSummary: ["Contract cases"],
    items: cases.map(({ id, title, fields }) => ({ id: "issue116-" + id, title, type: "activity", ...fields })),
  }];
  return trip;
}

test.describe("#116 D1 complete-boot Trip start contract", () => {
  // A browser timezone different from the trip catches accidental reliance
  // on the machine clock. The shared trip remains the clock authority.
  test.use({ viewport: { width: 390, height: 844 }, locale: "en-US", timezoneId: "UTC" });

  for (const style of representativeStyles) {
    test("strict Trip start and unchanged end semantics: " + style, async ({ page, baseURL }, testInfo) => {
      const trip = fixture();
      const sourceDays = structuredClone(trip.days);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.addInitScript(({ now }) => {
        const RealDate = Date;
        class FixedDate extends RealDate {
          constructor(...args) { super(...(args.length ? args : [now])); }
          static now() { return now; }
        }
        globalThis.Date = FixedDate;
      }, { now: fixedNow });

      // Keep every local application script/CSS in the normal boot order.
      // External fonts/providers are irrelevant to this semantic contract.
      const origin = new URL(baseURL).origin;
      await page.route("**/*", route => new URL(route.request().url()).origin === origin
        ? route.continue() : route.abort());
      await page.route("**/trip.json", route => route.fulfill({
        status: 200, contentType: "application/json", body: JSON.stringify(trip),
      }));
      await page.goto("/?previewStyle=" + style + "#trip/day/" + date, { waitUntil: "domcontentloaded" });
      await expect.poll(() => page.evaluate(() => state.ready)).toBe(true);
      await expect(page.locator("html")).toHaveAttribute("data-visual-style", style);
      await expect(page.locator(".trip-v2-item")).toHaveCount(cases.length);

      const runtime = await page.evaluate(() => ({
        now: Date.now(),
        date: zonedNow(state.data.trip.timezone).date,
        minute: zonedNow(state.data.trip.timezone).minuteOfDay,
        zone: window.TravelLiteTime.displayTimeZone(),
        tbdIsNaN: Number.isNaN(toMinutes("TBD")),
        shortStartMinutes: toMinutes("9:00"),
        paddedEndMinutes: toMinutes(" 11:00 "),
      }));
      expect(runtime).toEqual({
        now: fixedNow, date, minute: 630, zone: "Asia/Tokyo",
        tbdIsNaN: true, shortStartMinutes: 540, paddedEndMinutes: 660,
      });

      // Normalization may add top-level UI defaults; it must not repair or
      // rewrite these already-ID'd source items, their raw times or order.
      expect(await page.evaluate(() => state.data.days)).toEqual(sourceDays);
      expect(await page.evaluate(async () => (await TravelLiteStorage.get("snapshot:latest")).days))
        .toEqual(sourceDays);

      const actual = await page.locator(".trip-v2-item").evaluateAll(cards => cards.map(card => {
        const clocks = card.querySelectorAll(".timeline-time");
        const clock = clocks[0];
        return {
          title: card.querySelector(".item-heading > h3")?.textContent,
          clocks: clocks.length,
          tag: clock?.tagName,
          text: clock?.textContent.trim(),
          datetime: clock?.getAttribute("datetime"),
          floating: clock?.classList.contains("timeline-time--floating"),
          current: card.classList.contains("current"),
        };
      }));
      const expected = cases.map(entry => ({
        title: entry.title,
        clocks: 1,
        tag: entry.timed ? "TIME" : "SPAN",
        text: entry.timed ? entry.fields.start : "Time TBD",
        datetime: entry.timed ? entry.fields.start : null,
        floating: !entry.timed,
        current: entry.current,
      }));
      await testInfo.attach("trip-start-observations", {
        contentType: "application/json",
        body: Buffer.from(JSON.stringify({
          style, chromium: page.context().browser()?.version(),
          viewport: page.viewportSize(), browserLocale: "en-US", browserTimezone: "UTC",
          runtime, sourceDays, actual, expected, pageErrors: errors,
        }, null, 2)),
      });
      expect(errors).toEqual([]);
      expect(actual).toEqual(expected);
    });
  }
});
