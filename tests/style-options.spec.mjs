
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const sample = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const mutedFont = async (page) => {
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
};
const published = (modify) => {
  const data = structuredClone(sample);
  if (modify) modify(data);
  return data;
};
async function serveData(page, modify) {
  const data = published(modify);
  await page.route("**/trip.json", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(data),
  }));
  return data;
}
async function storybookReady(page) {
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", "storybook");
  await expect.poll(() => page.locator("#storybook-style")
    .evaluate(el => !el.disabled && !!el.sheet)).toBe(true);
}

test.beforeEach(async ({ page }) => mutedFont(page));

test("untouched trips remain editorial and preserve Auto/Light/Dark theme", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#trip-title")).toHaveText("Tokyo Autumn");
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", "editorial");
  await expect(page.locator("#storybook-style")).toHaveJSProperty("disabled", true);
  await expect(page.locator("#storybook-font")).toHaveCount(0);
  await page.locator(".bottom-nav [data-view='more']").click();
  await expect(page.locator("button[data-theme]")).toHaveCount(3);
  await expect(page.locator("[data-motion-choice]")).toHaveCount(0);
  await page.locator("[data-theme='dark']").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-theme='light']").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator(".bottom-nav [data-view='trip']").click();
  await expect(page.locator(".trip-overview-day")).toHaveCount(3);
  const edge = await page.locator(".trip-overview-day").first().evaluate(el => ({
    width: getComputedStyle(el).borderTopWidth,
    image: getComputedStyle(el, "::after").backgroundImage,
  }));
  expect(edge.width).not.toBe("3px");
  expect(edge.image).toBe("none");
});

test("preview URL enables storybook without writing to trip.json", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?previewStyle=storybook#trip/overview");
  await storybookReady(page);
  await expect(page.locator(".trip-overview-day")).toHaveCount(3);
  const visual = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    border: getComputedStyle(document.querySelector(".trip-overview-day")).borderTopWidth,
    art: getComputedStyle(document.querySelector(".trip-overview-hero"), "::after").backgroundImage,
    font: getComputedStyle(document.body).fontFamily,
    config: state.data.ui.visualStyle,
    active: state.visualStyle,
  }));
  expect(visual.bg).toBe("rgb(255, 252, 246)");
  expect(visual.border).toBe("3px");
  expect(visual.art).toContain("assets/storybook/hero.svg");
  expect(visual.font).toContain("Huninn");
  expect(visual.config).toBe("editorial");
  expect(visual.active).toBe("storybook");
  await expect(page.locator("#quick-theme-toggle")).toBeHidden();
  await expect(page.locator("#storybook-font")).toHaveCount(1);
  await page.screenshot({ path: "/tmp/travel-lite-storybook-preview-mobile.png", fullPage: true });
});

test("shared ui.visualStyle config renders storybook without preview parameter", async ({ page }) => {
  await serveData(page, trip => {
    trip.ui.visualStyle = "storybook";
    trip.days[0].illustration = "plane";
    trip.days[0].items[0].mustGo = true;
    trip.days[0].items[0].transportMode = "flight";
    trip.days[0].items[1].illustration = "hotel";
    trip.days[0].items[2].start = "TBD";
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#trip/day/2026-10-03");
  await storybookReady(page);
  await expect(page.locator(".trip-day-view")).toBeVisible();
  await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
  await expect(page.locator("ol.trip-v2-timeline .must-go-tag")).toHaveCount(1);
  await expect(page.locator("ol.trip-v2-timeline .transport-tag--flight")).toContainText("Flight");
  await expect(page.locator("ol.trip-v2-timeline .timeline-time--floating")).toHaveCount(1);
  await expect(page.locator(".day-summary")).toHaveAttribute("data-storybook-art", "plane");
  await expect.poll(() => page.locator("ol.trip-v2-timeline > li:nth-child(2) .trip-v2-item")
    .getAttribute("data-storybook-kind")).toBe("hotel");
  await expect(page.locator("#quick-theme-toggle")).toBeHidden();
  await page.screenshot({ path: "/tmp/travel-lite-storybook-day-mobile.png", fullPage: true });
});

test("storybook artwork accepts only known names and never parses user strings as urls", async ({ page }) => {
  await serveData(page, trip => {
    trip.ui.visualStyle = "storybook";
    trip.days[0].illustration = "javascript:evil";
    trip.days[0].items[0].illustration = "../../other.svg";
    trip.days[0].items[0].transportMode = "teleport";
  });
  await page.goto("/#trip/day/2026-10-03");
  await storybookReady(page);
  await expect(page.locator(".day-summary")).toHaveAttribute("data-storybook-art", "city");
  await expect(page.locator(".trip-v2-item").first()).toHaveAttribute("data-storybook-kind", "map");
  await expect(page.locator(".transport-tag")).toHaveCount(0);
});

test("storybook respects OS reduced motion plus a persistent per-trip manual control", async ({ page }) => {
  await serveData(page, trip => { trip.ui.visualStyle = "storybook"; });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#trip/overview");
  await storybookReady(page);
  await expect.poll(() => page.locator(".trip-overview-hero")
    .evaluate(el => getComputedStyle(el, "::after").animationName)).toBe("none");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => page.locator(".trip-overview-hero")
    .evaluate(el => getComputedStyle(el, "::after").animationName)).toContain("storybook-float");
  await page.locator(".bottom-nav [data-view='more']").click();
  await page.locator("[data-motion-choice='reduce']").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await expect(page.locator("[data-motion-choice='reduce']")).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await storybookReady(page);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  await page.locator(".bottom-nav [data-view='more']").click();
  await page.locator("[data-motion-choice='system']").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "system");
});

test("storybook works at narrow, tablet, and desktop widths without horizontal overflow", async ({ page }) => {
  await page.goto("/?previewStyle=storybook#trip/overview");
  await storybookReady(page);
  for (const width of [320, 360, 390, 430, 820, 1100, 1600]) {
    await page.setViewportSize({ width, height: width < 600 ? 690 : 900 });
    await page.locator(".bottom-nav [data-view='trip']").click();
    if (await page.locator(".trip-overview-day").count() === 0) {
      if (width >= 900) await page.locator("[data-shell-overview]").click();
      else await page.locator("[data-trip-mode='overview']").click();
    }
    const first = page.locator(".trip-overview-day").first();
    await first.click();
    await expect(page.locator(".trip-day-view")).toBeVisible();
    const sizes = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth, width: innerWidth,
      cardBounds: [...document.querySelectorAll("ol.trip-v2-timeline .trip-v2-item")]
        .map(el => { const r=el.getBoundingClientRect(); return [r.left,r.right]; }),
    }));
    expect(sizes.content, "overflow at " + width).toBeLessThanOrEqual(sizes.width + 2);
    expect(sizes.cardBounds.every(([left,right]) => left >= -2 && right <= sizes.width + 2),
      "cards outside viewport at " + width).toBe(true);
    if (width === 1600) await page.screenshot({
      path: "/tmp/travel-lite-storybook-preview-desktop.png", fullPage: true,
    });
  }
});

test("invalid style choices preserve Editorial without CSS leakage", async ({ page }) => {
  await serveData(page, trip => { trip.ui.visualStyle = "<script>alert(1)</script>"; });
  await page.goto("/?previewStyle=../../../external.css#trip/overview");
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", "editorial");
  await expect(page.locator("#storybook-style")).toHaveJSProperty("disabled", true);
  await expect(page.locator("#storybook-font")).toHaveCount(0);
  await expect(page.locator(".trip-overview-day")).toHaveCount(3);
});

test("storybook's five companion views keep the original data/actions and fit mobile and wide desktop", async ({ page }) => {
  await page.route("https://api.open-meteo.com/**", route => route.abort());
  await page.route("https://cdn.jsdelivr.net/**", route => route.abort());
  await page.route("https://tiles.openfreemap.org/**", route => route.abort());
  await page.goto("/?previewStyle=storybook#trip/overview");
  await storybookReady(page);
  for (const width of [320, 390, 820, 1100, 1600]) {
    await page.setViewportSize({ width, height: width <= 320 ? 568 : 900 });
    for (const [view, selector] of [
      ["now", "#view-root :is(.view-stack, .empty-state)"], ["trip", "#view-root .trip-v2"],
      ["map", "#view-root .runtime-map-panel"], ["check", "#view-root .check-group"],
      ["more", "#view-root .settings-card"],
    ]) {
      await page.locator(".bottom-nav [data-view='" + view + "']").click();
      await expect(page.locator(selector).first(), view + " at " + width).toBeVisible();
      const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(contentWidth, view + " overflow at " + width).toBeLessThanOrEqual(width + 2);
    }
  }
  await page.locator(".bottom-nav [data-view='more']").click();
  await expect(page.locator(".motion-preference")).toBeVisible();
  await expect(page.locator("[data-theme]")).toHaveCount(1); // the html root only
});

test.describe("storybook offline shell", () => {
  test.use({ serviceWorkers: "allow" });

  test("preloaded illustrated style and itinerary survive an offline reload", async ({ page, context }) => {
    await page.goto("/?previewStyle=storybook#trip/overview");
    await storybookReady(page);
    await page.waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 12000 });
    const coreLoaded = await page.evaluate(async () => {
      const requests = [
        "./storybook-theme.css", "./assets/storybook/hero.svg",
        "./assets/storybook/map.svg", "./trip.json"
      ];
      return Promise.all(requests.map(async path =>
        Boolean(await caches.match(new URL(path, location.href).href))));
    });
    expect(coreLoaded).toEqual([true, true, true, true]);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await storybookReady(page);
    await expect(page.locator("#trip-title")).toHaveText("Tokyo Autumn");
    await expect(page.locator(".trip-overview-day")).toHaveCount(3);
    await page.locator(".trip-overview-day").first().click();
    await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
  });
});

test("storybook 15-day itinerary keeps compact mobile date selector and linked day timeline", async ({ page }) => {
  await serveData(page, trip => {
    trip.ui.visualStyle = "storybook";
    trip.ui.defaultView = "trip";
    trip.days = Array.from({ length: 15 }, (_, index) => {
      const day = structuredClone(sample.days[0]);
      const date = new Date(Date.UTC(2026, 9, 3 + index)).toISOString().slice(0, 10);
      day.id = "day-" + (index + 1);
      day.date = date;
      day.label = "Day " + (index + 1);
      day.title = "A day to explore " + (index + 1);
      day.items = day.items.map(item => ({ ...item, id: day.id + "-" + item.id }));
      return day;
    });
    trip.trip.endDate = trip.days.at(-1).date;
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#trip/day/2026-10-12");
  await storybookReady(page);
  await expect(page.locator(".long-trip-nav")).toBeVisible();
  await expect(page.locator("[data-long-trip-select]")).toHaveValue("2026-10-12");
  await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
  await page.locator("[data-long-trip-next]").click();
  await expect(page.locator("[data-long-trip-select]")).toHaveValue("2026-10-13");
  await expect(page.locator(".day-summary")).toContainText("A day to explore 11");
  const widths = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
  expect(widths[1]).toBeLessThanOrEqual(widths[0] + 2);
});
