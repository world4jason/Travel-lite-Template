/* #116: one source-ordered, accessible Trip hierarchy across 16 appearances.
   Artwork/pseudo-elements are deliberately excluded from semantic equality.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const source = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const day = source.days[0];
const day2 = source.days[1];
const appearances = [
  { name: "editorial-light", style: "editorial", scheme: "light" },
  { name: "editorial-dark", style: "editorial", scheme: "dark" },
  ...["storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor"].map(style => ({ name: style, style, scheme: "light" })),
];
const emptyDay = { id: "qa-empty-day", date: "2026-10-06", label: "Day 4", title: "Published empty day", items: [] };

test.use({ locale: "en-US", timezoneId: "UTC" });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.route("https://tiles.openfreemap.org/**", route => route.abort());
  await page.addInitScript(() => {
    const RealDate = Date;
    const now = 1790991000000; // 2026-10-03 10:30 in the source's Asia/Tokyo timezone.
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now; }
    }
    globalThis.Date = FixedDate;
  });
});

async function canonicalTimeline(page, sourceDay) {
  const section = page.getByRole("region", { name: "Day timeline", exact: true });
  await expect(section).toHaveCount(1);
  await expect(section).toHaveJSProperty("tagName", "SECTION");
  await expect(section.getByRole("heading", { name: "Day timeline", level: 2, exact: true })).toHaveCount(1);
  const list = section.getByRole("list", { name: "Day timeline", exact: true });
  await expect(list).toHaveCount(1);
  await expect(list).toHaveJSProperty("tagName", "OL");
  await expect(list).toHaveClass(/\btrip-v2-timeline\b/);
  await expect(list.locator(":scope > *")).toHaveCount(sourceDay.items.length);
  const wraps = list.locator(":scope > li.trip-stop-wrap");
  await expect(wraps).toHaveCount(sourceDay.items.length);
  await expect(section.locator(".trip-v2-item")).toHaveCount(sourceDay.items.length);

  for (const [index, item] of sourceDay.items.entries()) {
    const wrap = wraps.nth(index);
    const article = wrap.locator(":scope > article.trip-v2-item");
    await expect(wrap.locator(":scope > article")).toHaveCount(1);
    await expect(article).toHaveCount(1);
    await expect(article.locator(".item-heading > h3")).toHaveText(item.title);
    await expect(article.getByRole("heading", { name: item.title, level: 3, exact: true })).toHaveCount(1);
    await expect(article.locator(":scope > .timeline-rail")).toHaveAttribute("aria-hidden", "true");
    const transfer = wrap.locator(":scope > .trip-transfer");
    const hasTransfer = Boolean(item.transferAfter) && index < sourceDay.items.length - 1;
    await expect(transfer).toHaveCount(hasTransfer ? 1 : 0);
    if (hasTransfer) {
      await expect(transfer.locator(".trip-transfer-copy > strong")).toHaveText(item.transferAfter.label || "Transfer");
      expect(await wrap.evaluate(node => Boolean(
        node.querySelector(":scope > article").compareDocumentPosition(node.querySelector(":scope > .trip-transfer"))
        & Node.DOCUMENT_POSITION_FOLLOWING
      ))).toBe(true);
    }
  }
  // These relationships preserve the source-index artwork hook without
  // requiring art attributes, hidden decorative nodes or pseudo-elements to match.
  return list;
}

for (const look of appearances) {
  test("appearance must not change itinerary facts or stop order: " + look.name, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: look.scheme, reducedMotion: "reduce" });
    const url = "/?previewStyle=" + look.style;
    const trip = structuredClone(source);
    trip.ui.locale = "en";
    trip.ui.theme = look.scheme;
    trip.days[0].items[2].start = "TBD";
    trip.days[0].items[2].end = "TBD";
    trip.days.push(structuredClone(emptyDay));
    trip.trip.endDate = emptyDay.date;
    await page.route("**/trip.json", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(trip),
    }));
    await page.goto(url + "#trip/day/" + day.date);
    await expect.poll(() => page.evaluate(() => state.ready)).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.style);
    await expect(page.locator("html")).toHaveAttribute("data-theme", look.scheme);
    // Wait for the async itinerary renderer before snapshotting titles.
    // Reading allTextContents() first could return [] when the style flag
    // was already present but trip.json rendering had not yet completed.
    await expect(page.locator(".trip-v2-item")).toHaveCount(day.items.length);
    expect(await page.locator(".trip-v2-item .item-heading > h3").allTextContents())
      .toEqual(day.items.map(item => item.title));
    for (const item of await page.locator(".trip-v2-item").all()) await expect(item).toBeVisible();
    const timeline = await canonicalTimeline(page, trip.days[0]);
    const rendered = page.locator(".trip-v2-item");
    for (const [index, item] of trip.days[0].items.entries()) {
      const card = rendered.nth(index);
      await expect(card.locator(".timeline-time")).toBeVisible();
      const clock = card.locator(".timeline-time").first();
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(item.start || "")) {
        await expect(clock).toHaveText(item.start);
        await expect(card.locator("time.timeline-time")).toHaveCount(1);
        await expect(clock).toHaveAttribute("datetime", item.start);
        await expect(clock).not.toHaveClass(/timeline-time--floating/);
      } else {
        await expect(clock).toHaveText("Time TBD");
        await expect(clock).toHaveJSProperty("tagName", "SPAN");
        await expect(clock).not.toHaveAttribute("datetime");
        await expect(card).not.toHaveClass(/\bcurrent\b/);
        await expect(clock).toHaveClass(/timeline-time--floating/);
      }
      await expect(card.locator(".trip-item-top h3")).toHaveText(item.title);
      await expect(card.locator("a.trip-icon-action")).toHaveCount(1);
      await expect(card.locator("a.trip-icon-action")).toHaveAccessibleName("Open " + item.title + " in Google Maps");
    }
    await expect(rendered.first()).toHaveClass(/\bcurrent\b/);
    for (let index = 1; index < trip.days[0].items.length; index++) {
      await expect(rendered.nth(index)).not.toHaveClass(/\bcurrent\b/);
    }
    // The action contract must be data-driven, independent of appearance.
    await expect(rendered.first().locator("a.trip-icon-action")).toHaveCount(1);
    await expect(rendered.first().locator("details.trip-action-menu > summary")).toBeVisible();
    await rendered.first().locator("a.trip-icon-action").focus();
    await page.keyboard.press("Tab");
    await expect(rendered.first().locator("details.trip-action-menu > summary")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(rendered.first().locator("details.trip-action-menu")).toHaveAttribute("open", "");
    await expect(rendered.first().locator(".trip-action-menu-body a").first()).toHaveAttribute("href", /tokyo-haneda/);
    await page.keyboard.press("Tab");
    await expect(rendered.first().locator(".trip-action-menu-body a").first()).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(rendered.first().locator("details.trip-action-menu > summary")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(rendered.first().locator("details.trip-action-menu")).not.toHaveAttribute("open");
    await expect(rendered.nth(2).locator('[data-open-place="d1-shibuya"]')).toHaveCount(1);
    await expect(page.locator(".trip-stop-wrap")).toHaveCount(day.items.length);
    await expect(page.locator(".trip-transfer")).toHaveCount(3);


    const endpoints = await page.locator('[data-surface-role="route-endpoints"] strong').allTextContents();
    expect(endpoints).toEqual([day.routeSummary[0], day.routeSummary.at(-1)]);
    const publishedRoute = await page.locator('[data-surface-role="route-step"]').allTextContents();
    expect(publishedRoute.map(line => line.replace(/^\d+/, "").trim())).toEqual(day.routeSummary);

    const signature = await timeline.evaluate(node => ({
      list: node.tagName,
      stops: [...node.children].map(wrap => {
        const article = wrap.querySelector(":scope > article");
        const clock = article.querySelector(".timeline-time");
        return {
          wrapper: wrap.tagName, article: article.tagName,
          title: article.querySelector(".item-heading > h3").textContent,
          timeTag: clock.tagName, time: clock.textContent, datetime: clock.getAttribute("datetime"),
          transfer: wrap.querySelector(":scope > .trip-transfer .trip-transfer-copy > strong")?.textContent || null,
          current: article.classList.contains("current"),
        };
      }),
    }));
    await testInfo.attach("canonical-trip-signature", {
      contentType: "application/json", body: Buffer.from(JSON.stringify(signature, null, 2)),
    });
    expect(await page.evaluate(() => state.data.days)).toEqual(trip.days);

    // Exercise the source-backed Place action with the keyboard, and return
    // through real history before changing the selected source day.
    await rendered.nth(2).locator('[data-open-place="d1-shibuya"]').focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#places\/item\/d1-shibuya$/);
    await expect(page.locator(".places-detail-heading")).toContainText(trip.days[0].items[2].title);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp("#trip/day/" + day.date + "$"));
    await canonicalTimeline(page, trip.days[0]);

    // An empty source day has no invented stop/listitem. The explanatory
    // message is outside the ordered list, so it is not counted as a visit.
    await page.locator('.trip-v2-tabs [data-trip-day="' + emptyDay.date + '"]').click();
    await expect(page.locator(".day-summary h2")).toHaveText(emptyDay.title);
    const emptyList = await canonicalTimeline(page, emptyDay);
    await expect(emptyList.locator("li, article")).toHaveCount(0);
    const emptyMessage = page.getByRole("region", { name: "Day timeline", exact: true }).locator(".empty-state");
    await expect(emptyMessage).toHaveText("No plans yet.");
    await expect(emptyMessage).toBeVisible();
    expect(await emptyMessage.evaluate(node => node.closest("ol, li"))).toBeNull();

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
    expect(await page.evaluate(() => state.data.days)).toEqual(trip.days);
  });
}
