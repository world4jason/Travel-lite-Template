/* Role-based geometry acceptance for every available appearance.
   Runs during the normal Chromium suite, not only the optional 240-state audit.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { sideBorderViolations } from "./style-surface-guards.mjs";
import { readFileSync } from "node:fs";
const sourceTrip = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));

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
      outlineWidth: px(css.outlineWidth),
      outlineStyle: css.outlineStyle,
      outlineOffset: px(css.outlineOffset),
      text: el.textContent.trim().slice(0, 100),
    };
  });
}

function checkFrame(role, info, requiredInset) {
  // A left/right rule without a top/bottom rule still encloses text.
  // Check each side individually; `every(four borders)` was a false PASS.
  expect(sideBorderViolations(info, requiredInset),
    role + " has visible side rules or inset outlines without enough padding").toEqual([]);
}

for (const look of looks) {
  test("surface contract: " + look.name + " has no bordered zero-inset content", async ({ page }) => {
    await page.emulateMedia({ colorScheme: look.color });
    const preview = "/?previewStyle=" + look.id;
    const trip = structuredClone(sourceTrip);
    trip.costs.entries = [
      { id: "qa-cost", title: "Metro ticket", amount: 30000, category: "transit" },
    ];
    await page.route("**/trip.json", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(trip),
    }));

    await page.goto(preview + "#more");
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.id);
    await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
    // Mobile navigation is a functional, fixed shell control. Decorative
    // packs must not accidentally set it to position:relative (Risograph
    // previously did through a broad artwork stacking selector).
    const navigation = page.locator("#bottom-nav");
    await expect(navigation).toHaveCSS("position", "fixed");
    const initialNavTop = await navigation.evaluate(node => node.getBoundingClientRect().top);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => navigation.evaluate((node, expectedTop) =>
      Math.abs(node.getBoundingClientRect().top - expectedTop), initialNavTop))
      .toBeLessThanOrEqual(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    const section = page.locator('[data-surface-role="section"]').filter({
      has: page.locator("summary").filter({ hasText: "Reservations" })
    }).first();
    await expect(section).toBeVisible();
    const row = await geometry(page, '[data-surface-role="reading-row"].info-row');
    checkFrame("More / reading row / " + look.name, row, 12);

    // Costs is hidden in the default Tokyo fixture; it MUST be included here
    // with real rendered fixture data, otherwise framed summaries go unaudited.
    const costs = page.locator('[data-surface-role="section"]').filter({
      has: page.locator("summary").filter({ hasText: "Costs" }),
    }).first();
    await expect(costs).toBeVisible();
    await costs.locator("summary").first().click();
    const total = await geometry(page, '[data-surface-role="cost-summary"]');
    checkFrame("More / Costs total / " + look.name, total, 12);
    await expect(costs).toContainText("Metro ticket");


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
    const selectedStop = await geometry(page, '[data-surface-role="selected-stop"]');
    checkFrame("Transport / selected stop / " + look.name, selectedStop, 12);
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


test("negative control: side-only borders and inward outlines must fail geometry gate", async ({ page }) => {
  await page.goto("/?previewStyle=risograph#more");
  await expect(page.locator('[data-surface-role="reading-row"].info-row').first()).toBeVisible();
  await page.addStyleTag({ content: `
    :root[data-visual-style="risograph"] [data-surface-role="reading-row"].info-row {
      border-top: 0 !important;
      border-bottom: 0 !important;
      border-inline: 2px solid red !important;
      padding-inline: 0 !important;
    }
  ` });
  const info = await geometry(page, '[data-surface-role="reading-row"].info-row');
  expect(info.border[0]).toBe(0);
  expect(info.border[2]).toBe(0);
  expect(sideBorderViolations(info, 12)).toEqual(["right", "left"]);

  await page.addStyleTag({ content: `
    :root[data-visual-style="risograph"] [data-surface-role="reading-row"].info-row {
      border-inline: 0 !important;
      outline: 2px solid red !important;
      outline-offset: -3px !important;
    }
  ` });
  const outlined = await geometry(page, '[data-surface-role="reading-row"].info-row');
  expect(sideBorderViolations(outlined, 12)).toEqual(["right", "left"]);
});

test("actual More Appearance picker clears inherited frames, theme and stale tokens", async ({ page }) => {
  const trip = structuredClone(sourceTrip);
  trip.costs.entries = [{ id: "qa-switch-cost", title: "Metro fare", amount: 500 }];
  await page.route("**/trip.json", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(trip),
  }));
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
  const sourceTitle = (await sample()).title;
  expect((await sample()).border).toBe(2);

  // Mobile picker actually closes/reopens and restores focus; do not bypass
  // the UI by invoking chooseLocalStyle() directly from page.evaluate().
  const steps = [
    { choice: "risograph", style: "risograph", border: 0, inset: 0 },
    { choice: "vintage-watercolor", style: "vintage-watercolor", border: 2, inset: 13 },
    { choice: "editorial-dark", style: "editorial", border: 0, inset: 0, theme: "dark" },
    { choice: "editorial-light", style: "editorial", border: 0, inset: 0, theme: "light" },
    { choice: "storybook", style: "storybook", border: 2, inset: 13 },
  ];
  for (const step of steps) {
    await page.locator("[data-style-picker-open]").click();
    const dialog = page.locator("#style-picker-dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-style-choice="' + step.choice + '"]').click();
    await expect(dialog).toHaveJSProperty("open", false);
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", step.style);
    if (step.theme) await expect(page.locator("html")).toHaveAttribute("data-theme", step.theme);
    await expect.poll(() => page.evaluate(() =>
      document.activeElement?.hasAttribute("data-style-picker-open"))).toBe(true);
    await expect.poll(async () => (await sample()).border).toBe(step.border);
    expect((await sample()).inset).toBeGreaterThanOrEqual(step.inset);
    if (step.inset === 0) expect((await sample()).inset).toBe(0);
    expect((await sample()).title).toBe(sourceTitle);
    const costs = page.locator('[data-surface-role="section"]').filter({
      has: page.locator("summary").filter({ hasText: "Costs" }),
    }).first();
    await expect(costs).toBeVisible();
    await costs.locator("summary").first().click();
    const costGeometry = await geometry(page, '[data-surface-role="cost-summary"]');
    checkFrame("Appearance switch / Costs / " + step.choice, costGeometry, 12);
    // A new pack must not inherit the *previous* pack's frame token.
    const expectedCostBorder = step.style === "editorial" ? 0 : 2;
    expect(costGeometry.border[3]).toBe(expectedCostBorder);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
