/* Same source facts and usable controls for both distinct Trip DOM modes.
   This test guards semantic parity while their markup is migrated separately.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const source = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const day = source.days[0];
const day2 = source.days[1];
const looks = ["editorial", "storybook", "candy", "risograph", "paper-collage",
  "naive-city", "taiwan-poster", "field-stamp", "quiet-linocut",
  "doodle-memory-grid", "crayon-journal", "painterly-editorial",
  "geometric-print", "quiet-acrylic", "vintage-watercolor"];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.route("https://tiles.openfreemap.org/**", route => route.abort());
});

for (const look of looks) {
  test("appearance must not change itinerary facts or stop order: " + look, async ({ page }) => {
    const url = "/?previewStyle=" + look;
    await page.goto(url + "#trip/day/" + day.date);
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", look);
    expect(await page.locator(".trip-v2-item .item-heading > h3").allTextContents())
      .toEqual(day.items.map(item => item.title));
    await expect(page.locator(".trip-v2-item")).toHaveCount(day.items.length);
    for (const item of await page.locator(".trip-v2-item").all()) await expect(item).toBeVisible();

    const endpoints = await page.locator('[data-surface-role="route-endpoints"] strong').allTextContents();
    expect(endpoints).toEqual([day.routeSummary[0], day.routeSummary.at(-1)]);
    const publishedRoute = await page.locator('[data-surface-role="route-step"]').allTextContents();
    expect(publishedRoute.map(line => line.replace(/^\d+/, "").trim())).toEqual(day.routeSummary);

    await page.goto(url + "#more");
    await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
    const reservation = page.locator('[data-surface-role="section"]').filter({
      has: page.locator("summary").filter({ hasText: "Reservations" }),
    }).first();
    await expect(reservation).toBeVisible();
    const titles = await reservation.locator('[data-surface-role="reading-row"] h3').allTextContents();
    expect(titles).toEqual(source.reservations.map(item => item.title));
    await expect(reservation.locator('[data-surface-role="reading-row"]').first()).toBeVisible();

    await page.goto(url + "#map/day/" + day2.date);
    await expect(page.locator('[data-surface-role="map-workspace"]')).toBeVisible();
    const transfers = page.locator('[data-surface-role="transport-context"]');
    await expect(transfers).toBeVisible();
    await transfers.locator("summary").click();
    await expect(transfers).toHaveAttribute("open", "");
    await expect(transfers.locator(".transport-leg-list > li")).toHaveCount(2);
  });
}
