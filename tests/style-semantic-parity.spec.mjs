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
    // Distinct current JS templates are documented debt (#116). Guard facts,
    // actions and TBD semantics without pretending their DOM is identical.
    const trip = structuredClone(source);
    trip.days[0].items[2].start = "TBD";
    trip.days[0].items[2].end = "TBD";
    await page.route("**/trip.json", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(trip),
    }));
    await page.goto(url + "#trip/day/" + day.date);
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", look);
    // Wait for the async itinerary renderer before snapshotting titles.
    // Reading allTextContents() first could return [] when the style flag
    // was already present but trip.json rendering had not yet completed.
    await expect(page.locator(".trip-v2-item")).toHaveCount(day.items.length);
    expect(await page.locator(".trip-v2-item .item-heading > h3").allTextContents())
      .toEqual(day.items.map(item => item.title));
    for (const item of await page.locator(".trip-v2-item").all()) await expect(item).toBeVisible();
    // Derive the renderer mode from its actual registry, not a style-ID list:
    // Risograph also enables the illustrated <ol>/<li>/<time> branch.
    // Editorial remains a <section>/<div> timeline until #116.
    const illustrated = await page.evaluate(() => isIllustratedStyle());
    await expect(page.locator(".trip-v2-timeline")).toHaveCount(1);
    expect(await page.locator(".trip-v2-timeline").evaluate(node => node.tagName))
      .toBe(illustrated ? "OL" : "SECTION");
    const rendered = page.locator(".trip-v2-item");
    for (const [index, item] of trip.days[0].items.entries()) {
      const card = rendered.nth(index);
      await expect(card.locator(".timeline-time")).toBeVisible();
      const clock = card.locator(".timeline-time").first();
      if (/^\d{2}:\d{2}$/.test(item.start || "")) {
        await expect(clock).toContainText(item.start);
        if (illustrated) await expect(card.locator("time.timeline-time")).toHaveCount(1);
      } else {
        await expect(clock).toContainText("TBD");
        await expect(card).not.toHaveClass(/\bcurrent\b/);
        if (illustrated) await expect(clock).toHaveClass(/timeline-time--floating/);
      }
      await expect(card.locator(".trip-item-top h3")).toHaveText(item.title);
    }
    // The action contract must be data-driven, independent of appearance.
    await expect(rendered.first().locator("a.trip-icon-action")).toHaveCount(1);
    await expect(rendered.first().locator("details.trip-action-menu > summary")).toBeVisible();
    await rendered.first().locator("details.trip-action-menu > summary").focus();
    await page.keyboard.press("Enter");
    await expect(rendered.first().locator("details.trip-action-menu")).toHaveAttribute("open", "");
    await expect(rendered.first().locator(".trip-action-menu-body a").first()).toHaveAttribute("href", /tokyo-haneda/);
    await expect(rendered.nth(2).locator('[data-open-place="d1-shibuya"]')).toHaveCount(1);
    await expect(page.locator(".trip-stop-wrap")).toHaveCount(day.items.length);
    await expect(page.locator(".trip-transfer")).toHaveCount(3);


    const endpoints = await page.locator('[data-surface-role="route-endpoints"] strong').allTextContents();
    expect(endpoints).toEqual([day.routeSummary[0], day.routeSummary.at(-1)]);
    const publishedRoute = await page.locator('[data-surface-role="route-step"]').allTextContents();
    expect(publishedRoute.map(line => line.replace(/^\d+/, "").trim())).toEqual(day.routeSummary);

    // The button navigation is synchronous with the app renderer. A second
    // page.goto() on the same path with only a changed hash can race the
    // hashchange handler immediately after keyboard interaction.
    await page.locator('#bottom-nav [data-view="more"]').click();
    await expect(page.locator('#bottom-nav [data-view="more"]')).toHaveClass(/active/);
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
