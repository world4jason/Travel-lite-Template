import { test, expect } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const labels = ["Now", "Trip", "Map", "Check", "More"];

async function inspectNav(page) {
  return page.evaluate(() => {
    const nav = document.getElementById("bottom-nav");
    const r = nav.getBoundingClientRect();
    const css = getComputedStyle(nav);
    const buttons = [...nav.querySelectorAll(".nav-item")];
    return {
      position: css.position,
      bottomGap: innerHeight - r.bottom,
      left: r.left,
      right: r.right,
      width: innerWidth,
      scrollY,
      count: buttons.length,
      buttonDetails: buttons.map(button => {
        const b = button.getBoundingClientRect();
        const midX = (b.left + b.right) / 2;
        const midY = (b.top + b.bottom) / 2;
        const hit = document.elementFromPoint(midX, midY);
        return {
          title: button.textContent.trim(),
          left: b.left, right: b.right,
          top: b.top, bottom: b.bottom,
          hit: Boolean(hit && (button === hit || button.contains(hit))),
        };
      })
    };
  });
}

for (const [width, height] of [[320, 568], [360, 800], [390, 844], [430, 932], [844, 390]]) {
  for (const style of ["editorial", "vintage-watercolor"]) {
    test(style + " five bottom tabs stay fixed at " + width + "x" + height + ", even while scrolling", async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/?previewStyle=" + style + "#trip/overview");
      await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
      await expect(page.locator(".trip-overview-hero h2")).toBeVisible();
      const before = await inspectNav(page);
      expect(before.position).toBe("fixed");
      expect(before.bottomGap).toBeGreaterThanOrEqual(0);
      expect(before.bottomGap).toBeLessThanOrEqual(30);
      expect(before.left).toBeGreaterThanOrEqual(0);
      expect(before.right).toBeLessThanOrEqual(width);
      expect(before.count).toBe(5);
      expect(before.buttonDetails.every(item => item.hit)).toBe(true);
      const buttonTexts = await page.locator("#bottom-nav .nav-item").allTextContents();
      expect(buttonTexts.map(x => x.trim())).toEqual(labels);

      if (width === 390 && style === "vintage-watercolor") {
        mkdirSync(resolve(root, "test-results"), { recursive: true });
        await page.screenshot({
          path: resolve(root, "test-results/vintage-bottom-nav-viewport.png"),
          fullPage: false
        });
      }
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      await page.waitForTimeout(100);
      const after = await inspectNav(page);
      expect(after.position).toBe("fixed");
      expect(after.bottomGap).toBeGreaterThanOrEqual(0);
      expect(after.bottomGap).toBeLessThanOrEqual(30);
      expect(after.left).toBeGreaterThanOrEqual(0);
      expect(after.right).toBeLessThanOrEqual(width);
      expect(after.buttonDetails.every(item => item.hit)).toBe(true);
      expect(Math.abs(after.bottomGap - before.bottomGap)).toBeLessThanOrEqual(1);
      if (width === 390 && style === "vintage-watercolor") {
        await page.screenshot({
          path: resolve(root, "test-results/vintage-bottom-nav-scrolled-viewport.png"),
          fullPage: false
        });
      }
    });
  }
}

test("desktop intentionally uses a header-adjacent navigation row", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto("/?previewStyle=vintage-watercolor#trip/overview");
  await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
  const info = await inspectNav(page);
  expect(info.position).toBe("relative");
  expect(info.count).toBe(5);
  expect(info.buttonDetails.every(item => item.hit)).toBe(true);
});

test("all five destinations retain a fixed mobile tab bar after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?previewStyle=vintage-watercolor#trip/overview");
  for (const view of ["now","trip","map","check","more"]) {
    await page.locator('#bottom-nav [data-view="' + view + '"]').click();
    await expect(page.locator('#bottom-nav [data-view="' + view + '"]')).toHaveClass(/active/);
    const info = await inspectNav(page);
    expect(info.position).toBe("fixed");
    expect(info.count).toBe(5);
    expect(info.bottomGap).toBeGreaterThanOrEqual(0);
    expect(info.bottomGap).toBeLessThanOrEqual(30);
  }
});