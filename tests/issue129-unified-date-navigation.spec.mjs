/* #129: one date navigator, one shared day, view-specific overviews.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const template = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const styles = [
  "editorial", "storybook", "candy", "risograph", "paper-collage",
  "naive-city", "taiwan-poster", "field-stamp", "quiet-linocut",
  "doodle-memory-grid", "crayon-journal", "painterly-editorial",
  "geometric-print", "quiet-acrylic", "vintage-watercolor"
];

function fixture(n) {
  const data = structuredClone(template);
  const base = data.days[1];
  data.days = Array.from({ length: n }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 3 + index)).toISOString().slice(0, 10);
    return { ...structuredClone(base),
      id: "unified-day-" + index, date, label: "Day " + (index + 1),
      title: "Day " + (index + 1) + " · 日本の長い旅程タイトル",
      items: index === 3 ? [{ id: "transit-only-" + index, title: "Train", type: "transport", start: "TBD" }] :
        base.items.map(item => ({ ...structuredClone(item), id: item.id + "-" + index }))
    };
  });
  data.trip.endDate = data.days.at(-1).date;
  data.ui.locale = "zh-TW";
  return data;
}

async function withFixture(page, length = 11) {
  const data = fixture(length);
  await page.route("**/trip.json", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) }));
  return data;
}
async function choose(page, day) {
  await page.locator("[data-unified-date-select]").selectOption(day);
  await expect(page.locator("[data-unified-date-select]")).toHaveValue(day);
}
async function openTab(page, view) {
  await page.locator("#bottom-nav [data-view='" + view + "']").click();
  await expect(page.locator("#bottom-nav [data-view='" + view + "']")).toHaveClass(/active/);
}
async function checkNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    screen: window.innerWidth
  }));
  expect(dimensions.html, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.screen + 2);
  expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.screen + 2);
}

test("3-day: same source day, different Overview modes; all tabs and deep link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#trip/overview");
  await expect(page.locator(".unified-date-nav")).toBeVisible();
  await choose(page, "2026-10-04");
  await expect(page.locator(".trip-day-view")).toBeVisible();
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-04");

  await openTab(page, "map");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-04");
  await expect(page.locator(".map-day-tabs")).toBeHidden();
  await openTab(page, "places");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("overview");
  await expect(page.locator(".places-card")).toHaveCount(3);

  await choose(page, "2026-10-03");
  await expect(page.locator(".places-card")).toHaveCount(1);
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-03");
  await openTab(page, "trip");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-03");
  await expect(page.locator(".trip-day-view")).toBeVisible();
  await openTab(page, "map");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-03");

  await openTab(page, "places");
  await page.locator("[data-unified-date-overview]").click();
  await expect(page.locator(".places-card")).toHaveCount(3);
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-03");
  await openTab(page, "trip");
  await page.locator("[data-unified-date-overview]").click();
  await expect(page.locator(".trip-overview-view")).toBeVisible();
  await openTab(page, "places");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("overview");
  await checkNoOverflow(page);
});

test("native Back/Forward, refresh and day handoffs preserve selected dates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#places");
  await choose(page, "2026-10-03");
  await choose(page, "2026-10-04");
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  await page.goBack();
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-03");
  await page.goForward();
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-04");
  await page.reload();
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-04");
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-04");
  expect(await page.evaluate(() => TravelLiteStorage.get(tripKey("places:mode")))).toBe("day");
  await openTab(page, "map");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-04");

  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-04");
  await page.locator("[data-places-transport]").click();
  await expect(page).toHaveURL(/#map\/day\/2026-10-04\/stop\/d2-sensoji$/);
  await expect(page.locator(".map-selected-summary")).toContainText("Senso-ji");
  await page.locator("[data-unified-date-select]").selectOption("2026-10-03");
  // The existing Map renderer auto-selects the first valid stop on a new day;
  // never retain the prior day's d2-sensoji stop.
  await expect(page).toHaveURL(/#map\/day\/2026-10-03(?:\/stop\/d1-haneda)?$/);
  expect(page.url()).not.toContain("d2-sensoji");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-03");
});

test("11-day: one selector across pages, a zero-Places day is a true empty state", async ({ page }) => {
  await withFixture(page, 11);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#trip/overview");
  await expect(page.locator(".unified-date-nav")).toBeVisible();
  await expect(page.locator("[data-unified-date-select] option")).toHaveCount(12);
  await expect(page.locator(".long-trip-nav")).toBeHidden();
  await expect(page.locator(".trip-v2-tabs")).toBeHidden();
  await choose(page, "2026-10-13");
  await expect(page.locator(".trip-day-view")).toBeVisible();
  await openTab(page, "map");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-13");
  await openTab(page, "places");
  await choose(page, "2026-10-06");
  await expect(page.locator(".places-card")).toHaveCount(0);
  await expect(page.locator(".empty-state")).toContainText("這天沒有已安排的景點");
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-06");
  await openTab(page, "map");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-06");
  await checkNoOverflow(page);
});

test("32-day: Last/First navigation, invalid dates and legacy routes fail safely", async ({ page }) => {
  await withFixture(page, 32);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#trip/overview");
  await expect(page.locator(".unified-date-nav")).toBeVisible();
  await expect(page.locator("[data-unified-date-select] option")).toHaveCount(33);
  const last = new Date(Date.UTC(2026,9,3+31)).toISOString().slice(0,10);
  await choose(page, last);
  await expect(page.locator("[data-unified-date-next]")).toBeDisabled();
  await page.locator("[data-unified-date-prev]").click();
  await expect(page.locator("[data-unified-date-select]")).not.toHaveValue(last);
  await page.locator("[data-unified-date-overview]").click();
  await expect(page.locator(".trip-overview-day")).toHaveCount(32);
  await page.goto("/#places/day/2099-01-01");
  await expect(page).toHaveURL(/#places$/);
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("overview");
  await page.goto("/#map/day/2026-10-13");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-13");
  await checkNoOverflow(page);
});

test("legacy Places date migrates once into shared day plus mode, without cloning date truth", async ({ page }) => {
  await page.goto("/#more");
  await page.waitForFunction(() => state.ready && !!state.data);
  await page.evaluate(async () => {
    await TravelLiteStorage.set(tripKey("places:date"),"2026-10-04");
    await TravelLiteStorage.set(tripKey("ui:selectedDate"),"2026-10-03");
    await TravelLiteStorage.remove(tripKey("places:mode"));
  });
  await page.goto("/#places/day/2026-10-04");
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-04");
  expect(await page.evaluate(() => TravelLiteStorage.get(tripKey("places:mode")))).toBe("day");
  expect(await page.evaluate(() => TravelLiteStorage.get(tripKey("ui:selectedDate")))).toBe("2026-10-04");
  await page.goto("/#check");
  await expect(page.locator(".check-group").first()).toBeVisible();
});

test("legacy Places date migrates only All/Day mode; stored shared date always wins", async ({ page }) => {
  await page.goto("/#more");
  await page.waitForFunction(() => state.ready && !!state.data);
  await page.evaluate(async () => {
    await TravelLiteStorage.set(tripKey("places:date"), "2026-10-04");
    await TravelLiteStorage.set(tripKey("ui:selectedDate"), "2026-10-03");
    await TravelLiteStorage.set(tripKey("ui:view"), "places");
    await TravelLiteStorage.remove(tripKey("places:mode"));
  });
  await page.goto("/"); // no explicit route, so device-only mode wins
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-03");
  await expect(page.locator(".places-card")).toHaveCount(1);
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-03");
  expect(await page.evaluate(() => TravelLiteStorage.get(tripKey("places:mode")))).toBe("day");
  await page.reload();
  await expect(page.locator("[data-unified-date-select]")).toHaveValue("2026-10-03");
});

test("native date selector is keyboard reachable and retains focus-visible indication", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#trip/overview");
  const selector = page.locator("[data-unified-date-select]");
  await expect(selector).toBeVisible();
  await expect(selector).toHaveAttribute("aria-label", "Choose trip date");
  await selector.focus();
  await expect(selector).toBeFocused();
  await expect(page.locator(".unified-date-select-wrap")).toHaveCSS("outline-style", "solid");
  // Headless macOS Chromium native selects use typeahead, not ArrowDown.
  // Type 'd' to choose the first 'Day' option via actual keyboard focus.
  await page.keyboard.press("d");
  await page.keyboard.press("Enter");
  await expect(selector).toHaveValue("2026-10-03");
  await expect(page.locator(".trip-day-view")).toBeVisible();
});

test("320px, 200% root text, readable controls across all supported dates", async ({ page }) => {
  const stylesToCheck = ["editorial", "storybook", "risograph", "vintage-watercolor"];
  await withFixture(page, 11);
  await page.setViewportSize({ width: 320, height: 568 });
  for (const style of stylesToCheck) {
    await page.goto("/?previewStyle=" + style + "#trip/day/2026-10-09");
    await expect(page.locator(".unified-date-nav")).toBeVisible();
    await page.evaluate(() => document.documentElement.style.fontSize = "200%");
    await checkNoOverflow(page);
    const selectBox = await page.locator(".unified-date-select-wrap").boundingBox();
    expect(selectBox.width).toBeGreaterThan(75);
    await openTab(page, "map");
    await expect(page.locator(".unified-date-nav")).toBeVisible();
    await checkNoOverflow(page);
    await openTab(page, "places");
    await checkNoOverflow(page);
    await page.evaluate(() => document.documentElement.style.fontSize = "");
  }
});

for (const look of styles) {
  test("style geometry: " + look + " (3 views, 320/390/1100px)", async ({ page }) => {
    await withFixture(page, 11);
    for (const width of [320, 390, 1100]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/?previewStyle=" + look + "#trip/day/2026-10-09");
      await expect(page.locator(".unified-date-nav")).toBeAttached();
      if (width < 900) {
        await expect(page.locator(".unified-date-nav")).toBeVisible();
        await expect(page.locator(".unified-date-nav")).toHaveCSS("display", "grid");
      } else {
        await expect(page.locator(".shell-context-left")).toBeVisible();
        await expect(page.locator(".unified-date-nav")).toBeHidden();
      }
      await checkNoOverflow(page);
      await openTab(page,"map");
      await expect(page.locator(".unified-date-nav")).toBeVisible();
      await expect(page.locator(".map-day-tabs")).toBeHidden();
      await checkNoOverflow(page);
      await openTab(page,"places");
      await expect(page.locator(".unified-date-nav")).toBeVisible();
      await expect(page.locator(".places-date-picker")).toBeHidden();
      await checkNoOverflow(page);
    }
  });
}
