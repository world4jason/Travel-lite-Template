/* Role-based geometry acceptance for every available appearance.
   Runs during the normal Chromium suite, not only the optional 240-state audit.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";

const looks = [
  { id: "editorial", name: "editorial-light", color: "light" },
  { id: "editorial", name: "editorial-dark", color: "dark" },
  ...[
    "storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor",
  ].map(id => ({ id, name: id, color: "light" })),
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.route("https://tiles.openfreemap.org/**", route => route.abort());
});

async function geometry(page, selector) {
  const node = page.locator(selector).first();
  await expect(node, selector + " must exist in the real rendered DOM").toBeVisible();
  return node.evaluate(el => {
    const css = getComputedStyle(el);
    const px = value => Number.parseFloat(value) || 0;
    return {
      border: [css.borderTopWidth, css.borderRightWidth,
        css.borderBottomWidth, css.borderLeftWidth].map(px),
      borderStyles: [css.borderTopStyle, css.borderRightStyle,
        css.borderBottomStyle, css.borderLeftStyle],
      inset: [px(css.paddingRight), px(css.paddingLeft)],
      radius: css.borderRadius,
      background: css.backgroundColor,
      text: el.textContent.trim().slice(0, 100),
    };
  });
}

function checkFrame(role, info, requiredInset) {
  const isFramed = info.border.every((n, i) =>
    n > 0 && !["none", "hidden"].includes(info.borderStyles[i]));
  if (isFramed) {
    expect(info.inset[0], role + " right text-to-frame inset").toBeGreaterThanOrEqual(requiredInset);
    expect(info.inset[1], role + " left text-to-frame inset").toBeGreaterThanOrEqual(requiredInset);
  }
}

for (const look of looks) {
  test("surface contract: " + look.name + " has no bordered zero-inset content", async ({ page }) => {
    await page.emulateMedia({ colorScheme: look.color });
    const preview = "/?previewStyle=" + look.id;

    await page.goto(preview + "#more");
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.id);
    await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
    const section = page.locator('[data-surface-role="section"]').filter({
      has: page.locator("summary").filter({ hasText: "Reservations" })
    }).first();
    await expect(section).toBeVisible();
    const row = await geometry(page, '[data-surface-role="reading-row"].info-row');
    checkFrame("More / reading row / " + look.name, row, 12);

    await page.goto(preview + "#trip/day/2026-10-03");
    await expect(page.locator('[data-surface-role="route-endpoints"]')).toBeVisible();
    const endpoints = await geometry(page, '[data-surface-role="route-endpoints"]');
    checkFrame("Trip / route endpoints / " + look.name, endpoints, 8);
    const step = await geometry(page, '[data-surface-role="route-step"]');
    checkFrame("Trip / numbered route step / " + look.name, step, 8);

    await page.goto(preview + "#map/day/2026-10-04");
    await expect(page.locator('[data-surface-role="map-workspace"]')).toBeVisible();
    const map = await geometry(page, '[data-surface-role="map-workspace"]');
    checkFrame("Transport / map workspace / " + look.name, map, 12);
    await expect(page.locator('[data-surface-role="transport-context"] > summary')).toContainText("Published transfers");

    if (look.id === "vintage-watercolor" || look.id === "risograph") {
      // Both print-like styles deliberately leave the map work area unframed,
      // even though each pack frames other, noninteractive content surfaces.
      expect(map.border[3], look.name + " map workspace must be open").toBe(0);
      expect(map.border[1], look.name + " map workspace must be open").toBe(0);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, look.name + " whole-document horizontal overflow").toBeLessThanOrEqual(1);
  });
}


test("switching Storybook → Risograph → Storybook → Editorial clears stale row geometry", async ({ page }) => {
  await page.goto("/?previewStyle=storybook#more");
  const row = page.locator('[data-surface-role="reading-row"].info-row').first();
  await expect(row).toBeVisible();
  const sample = async () => row.evaluate(node => {
    const style = getComputedStyle(node);
    return {
      border: Number.parseFloat(style.borderLeftWidth),
      inset: Number.parseFloat(style.paddingLeft),
      title: node.querySelector("h3")?.textContent,
    };
  });
  await expect.poll(async () => (await sample()).border).toBe(2);
  expect((await sample()).inset).toBeGreaterThanOrEqual(12);
  const sourceTitle = (await sample()).title;

  // Use the app's real validated style selection path, not a manual CSS toggle.
  await page.evaluate(async () => chooseLocalStyle("risograph"));
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", "risograph");
  await expect.poll(async () => (await sample()).border).toBe(0);
  expect((await sample()).inset).toBe(0);

  await page.evaluate(async () => chooseLocalStyle("storybook"));
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", "storybook");
  await expect.poll(async () => (await sample()).border).toBe(2);
  expect((await sample()).inset).toBeGreaterThanOrEqual(12);

  await page.evaluate(async () => chooseLocalStyle("editorial-light"));
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", "editorial");
  await expect.poll(async () => (await sample()).border).toBe(0);
  expect((await sample()).inset).toBe(0);
  expect((await sample()).title).toBe(sourceTitle);
});
