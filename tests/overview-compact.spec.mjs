/* Browser gate: all styles share the same compact Overview hierarchy.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {test, expect} from "@playwright/test";
import {readFileSync} from "node:fs";
const data = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const styles = ["editorial", "storybook", "candy", "risograph", "paper-collage",
  "naive-city", "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
  "crayon-journal", "painterly-editorial", "geometric-print", "quiet-acrylic", "vintage-watercolor"];

test.beforeEach(async ({page}) => {
  await page.route("https://fonts.googleapis.com/**", r => r.fulfill({status:200, contentType:"text/css", body:""}));
  await page.route("https://fonts.gstatic.com/**", r => r.abort());
  await page.route("https://api.open-meteo.com/**", r => r.abort());
  await page.route("https://archive-api.open-meteo.com/**", r => r.abort());
  await page.route("https://tiles.openfreemap.org/**", r => r.abort());
});

async function inspect(page, style, width, zoom=100) {
  await page.setViewportSize({width, height:900});
  await page.goto("/?previewStyle=" + encodeURIComponent(style) + "#trip/overview");
  await expect(page.locator(".trip-overview-compact-hero")).toBeVisible();
  await expect(page.locator(".trip-overview-compact-day")).toHaveCount(data.days.length);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", style);
  if (zoom !== 100) await page.evaluate(percent => {document.documentElement.style.fontSize = percent + "%";}, zoom);
  return page.evaluate(() => {
    const hero = document.querySelector(".trip-overview-compact-hero");
    const cards = [...document.querySelectorAll(".trip-overview-compact-day")];
    const h = hero.getBoundingClientRect();
    const pseudo = selector => getComputedStyle(document.querySelector(selector), "::after").content;
    const pageWidth = document.documentElement.scrollWidth;
    return {
      height: h.height,
      heroDecor: pseudo(".trip-overview-compact-hero"),
      cardDecor: pseudo(".trip-overview-compact-day"),
      overflow: pageWidth - innerWidth,
      cardText: cards.every(c => {
        const a=c.getBoundingClientRect(), b=c.querySelector(".trip-compact-day-main").getBoundingClientRect();
        return b.left >= a.left+10 && b.right <= a.right-10 && b.width >= 40;
      })
    };
  });
}

test("all bundled visual styles keep compact, meaningful Overview cards", async ({page}) => {
  test.setTimeout(180000);
  for (const style of styles) for (const width of [390,1100]) {
    const m = await inspect(page, style, width);
    expect(m.height, style+" hero height at "+width).toBeLessThan(280);
    expect(m.heroDecor, style+" hero art").toBe("none");
    expect(m.cardDecor, style+" day art").toBe("none");
    expect(m.overflow, style+" horizontal overflow at "+width).toBeLessThanOrEqual(2);
    expect(m.cardText, style+" card reading width at "+width).toBe(true);
  }
});

test("small phones, wide desktops and 200% text do not clip overview content", async ({page}) => {
  for (const [style,width,zoom] of [
    ["editorial",320,100], ["doodle-memory-grid",320,100],
    ["vintage-watercolor",980,100], ["storybook",1440,100],
    ["editorial",1920,100], ["doodle-memory-grid",390,200], ["storybook",1100,200]
  ]) {
    const m = await inspect(page, style, width, zoom);
    expect(m.height, style+" header height / "+width+" at "+zoom+"%").toBeLessThan(zoom===200 ? 420 : 280);
    expect(m.overflow, style+" reflow / "+width+" at "+zoom+"%").toBeLessThanOrEqual(2);
    expect(m.cardText, style+" card bounds / "+width+" at "+zoom+"%").toBe(true);
  }
});

test("overview is a functioning route to the published day, without invented stops", async ({page}) => {
  await inspect(page,"editorial",390);
  await expect(page.locator(".trip-overview-compact-stats")).toContainText(/itinerary items|行程項目/);
  await expect(page.locator(".trip-overview-compact-stats")).not.toContainText("planned stops");
  await page.locator(".trip-overview-compact-day").first().click();
  await expect(page).toHaveURL(new RegExp("#trip/day/" + data.days[0].date));
  await expect(page.locator(".trip-day-view")).toBeVisible();
});

test("only one Light/Dark appearance selector exists; default is Light", async ({page}) => {
  await page.goto("/#more");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator('[data-style-picker-open]')).toHaveCount(1);
  await expect(page.locator(".theme-switcher, [data-theme].theme-button")).toHaveCount(0);
  await page.locator("[data-style-picker-open]").click();
  await expect(page.locator('[data-style-choice="editorial-light"]')).toHaveCount(1);
  await expect(page.locator('[data-style-choice="editorial-dark"]')).toHaveCount(1);
  await page.locator('[data-style-choice="editorial-dark"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-style-picker-open]").click();
  await page.locator("[data-style-reset]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
