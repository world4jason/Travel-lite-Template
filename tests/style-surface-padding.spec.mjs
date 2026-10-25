/* Issue #113: real-app, full-cascade visual geometry regression checks.
   Screenshots are generated only by executing Chromium against the local site.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { serveMapLibreLocally } from "./maplibre-local.mjs";

const baseline = process.env.TRAVEL_LITE_QA_BASELINE === "1";
const sample = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const sizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1100, height: 900 },
];

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await serveMapLibreLocally(page);
});

async function noDocumentOverflow(page) {
  const { viewport, documentWidth } = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(documentWidth, "The document must not horizontally overflow").toBeLessThanOrEqual(viewport + 1);
}

async function openedMoreSection(page, title) {
  const section = page.locator(".more-section")
    .filter({ has: page.locator("summary").filter({ hasText: title }) }).first();
  await expect(section).toHaveCount(1);
  if (await section.getAttribute("open") === null) {
    await section.locator("summary").first().click();
  }
  await expect(section).toHaveAttribute("open", "");
  return section;
}

for (const size of sizes) {
  test("Vintage Transport Day 2 has no zero-inset parent frame at " + size.width, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await page.goto("/?previewStyle=vintage-watercolor#map/day/2026-10-04");
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", "vintage-watercolor");
    const panel = page.locator(".runtime-map-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".map-heading h2")).toContainText("Asakusa");
    await expect(panel.locator(".transport-day-context > summary")).toContainText("Published transfers");
    // Screenshots must show a real interactive map and its controls, not just
    // an unresolved "Loading planned stops" skeleton from blocked CDNs.
    await expect(panel.locator("#runtime-map .maplibregl-ctrl").first()).toBeVisible({timeout:15000});
    await expect(panel.locator("#runtime-map .map-marker").first()).toBeVisible();
    if (baseline) {
      await panel.screenshot({ path: testInfo.outputPath("vintage-transport-before.png") });
      const transfer = panel.locator(".transport-day-context");
      await transfer.locator(":scope > summary").focus();
      await page.keyboard.press("Enter");
      await expect(transfer).toHaveAttribute("open", "");
      await expect(transfer.locator(".transport-leg-list > li")).toHaveCount(2);
      await panel.screenshot({ path: testInfo.outputPath("vintage-transport-expanded-before.png") });
      return;
    }
    const geometry = await panel.evaluate(node => {
      const heading = node.querySelector(".map-heading");
      const transfer = node.querySelector(".transport-day-context");
      const firstLabel = transfer.querySelector("summary span");
      const chips = node.querySelector(".place-chips");
      const stage = node.querySelector(".map-stage");
      const number = value => Number.parseFloat(value) || 0;
      return {
        border: number(getComputedStyle(node).borderLeftWidth),
        headingDivider: number(getComputedStyle(heading).borderBottomWidth),
        summaryInset: number(getComputedStyle(transfer.querySelector("summary")).paddingLeft),
        textGap: firstLabel.getBoundingClientRect().left - transfer.getBoundingClientRect().left,
        headingToTransfer: transfer.getBoundingClientRect().top - heading.getBoundingClientRect().bottom,
        transferToChips: chips.getBoundingClientRect().top - transfer.getBoundingClientRect().bottom,
        mapWidth: stage.getBoundingClientRect().width,
        parentWidth: node.getBoundingClientRect().width,
      };
    });
    expect(geometry.border, "Full-bleed Transport must not have a parent outline").toBe(0);
    expect(geometry.headingDivider).toBeGreaterThan(0);
    expect(geometry.summaryInset).toBeGreaterThanOrEqual(16);
    expect(geometry.textGap).toBeGreaterThanOrEqual(15);
    expect(geometry.headingToTransfer).toBeGreaterThanOrEqual(12);
    expect(geometry.transferToChips).toBeGreaterThanOrEqual(12);
    expect(Math.abs(geometry.mapWidth - geometry.parentWidth), "Keep map pan/zoom area full width").toBeLessThanOrEqual(2);
    await noDocumentOverflow(page);
    await panel.screenshot({ path: testInfo.outputPath("vintage-transport-after.png") });
    const transfer = panel.locator(".transport-day-context");
    await transfer.locator(":scope > summary").focus();
    await page.keyboard.press("Enter");
    await expect(transfer).toHaveAttribute("open", "");
    await expect(transfer.locator(".transport-leg-list > li")).toHaveCount(2);
    await noDocumentOverflow(page);
    await panel.screenshot({ path: testInfo.outputPath("vintage-transport-expanded-after.png") });
  });

  test("Risograph Reservations and reading rows use open typography at " + size.width, async ({ page }, testInfo) => {
    const trip = structuredClone(sample);
    trip.files.push({ id: "qa-file", title: "Rail ticket", type: "ticket", url: "https://example.org/ticket" });
    trip.costs.entries.push({ id: "qa-cost", title: "Metro ticket", amount: 20, category: "transit" });
    trip.reservations.push({
      id: "qa-long", type: "stay", title: "東京飯店 SuperExtraLongHotelIdentifierABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      date: "2026-10-04", status: "pending"
    });
    await page.route("**/trip.json", route => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(trip),
    }));
    await page.setViewportSize(size);
    await page.goto("/?previewStyle=risograph#more");
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", "risograph");
    const reservations = await openedMoreSection(page, "Reservations");
    const row = reservations.locator(".info-row").first();
    await expect(row).toContainText("Shibuya hotel");
    if (baseline) {
      await reservations.screenshot({ path: testInfo.outputPath("risograph-reservations-before.png") });
      return;
    }
    const geometry = await row.evaluate(node => {
      const label = node.querySelector(".type-pill");
      const heading = node.querySelector("h3");
      const style = getComputedStyle(node);
      const number = value => Number.parseFloat(value) || 0;
      return {
        leftBorder: number(style.borderLeftWidth),
        rightBorder: number(style.borderRightWidth),
        topBorder: number(style.borderTopWidth),
        tagPadding: number(getComputedStyle(label).paddingLeft),
        labelToTitle: heading.getBoundingClientRect().top - label.getBoundingClientRect().bottom,
        parentPadding: number(getComputedStyle(node.parentElement).paddingLeft),
      };
    });
    expect(geometry.leftBorder).toBe(0);
    expect(geometry.rightBorder).toBe(0);
    expect(geometry.topBorder, "No duplicate rule against the section summary").toBe(0);
    expect(geometry.tagPadding).toBeGreaterThanOrEqual(8);
    expect(geometry.labelToTitle).toBeGreaterThanOrEqual(8);
    expect(geometry.parentPadding).toBeGreaterThanOrEqual(16);
    for (const title of ["Costs", "Trip notes", "Files & tickets"]) {
      const section = await openedMoreSection(page, title);
      const nestedRows = section.locator(".info-row,.file-row,.text-card");
      expect(await nestedRows.count()).toBeGreaterThan(0);
      for (const row of await nestedRows.all()) {
        expect(await row.evaluate(node => parseFloat(getComputedStyle(node).borderLeftWidth))).toBe(0);
      }
    }
    await noDocumentOverflow(page);
    await reservations.screenshot({ path: testInfo.outputPath("risograph-reservations-after.png") });
    // Exercise native disclosure keyboard behavior in both directions.
    // The published Reservations section starts open.
    await reservations.locator(":scope > summary").focus();
    await page.keyboard.press("Enter");
    await expect(reservations).not.toHaveAttribute("open", "");
    await expect(reservations.locator(".info-row").first()).toBeHidden();
    await page.keyboard.press("Enter");
    await expect(reservations).toHaveAttribute("open", "");
    await expect(reservations.locator(".info-row").first()).toContainText("Shibuya hotel");
    await noDocumentOverflow(page);
  });

  for (const look of ["risograph", "storybook"]) {
    test(look + " Costs total frame/text inset at " + size.width, async ({ page }, testInfo) => {
      const trip = structuredClone(sample);
      // The published fixture has zero cost entries: create visible Costs UI
      // so the regression cannot escape QA as an unrendered state.
      trip.costs.entries = [
        { id: "qa-cost", title: "車票 Metro ticket", category: "transit", amount: 35000 },
        { id: "qa-cost2", title: "ExtraExtraLong費用描述ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          category: "test", amount: 600 },
      ];
      await page.route("**/trip.json", route => route.fulfill({
        status: 200, contentType: "application/json", body: JSON.stringify(trip),
      }));
      await page.setViewportSize(size);
      await page.goto("/?previewStyle=" + look + "#more");
      const section = await openedMoreSection(page, "Costs");
      const summary = section.locator('.cost-total');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText("Total");
      await expect(section).toContainText("Metro ticket");
      await expect(section.locator('[data-surface-role="cost-summary"]')).toHaveCount(baseline ? 0 : 1);
      if (baseline) {
        await section.screenshot({ path: testInfo.outputPath(look + "-costs-before.png") });
        return;
      }
      const geometry = await summary.evaluate(node => {
        const style = getComputedStyle(node);
        const b = node.getBoundingClientRect();
        const total = node.querySelector("span").getBoundingClientRect();
        const value = node.querySelector("strong").getBoundingClientRect();
        const px = v => Number.parseFloat(v) || 0;
        return {
          leftBorder: px(style.borderLeftWidth),
          rightBorder: px(style.borderRightWidth),
          leftInset: px(style.paddingLeft),
          rightInset: px(style.paddingRight),
          leftTextGap: total.left - b.left,
          rightTextGap: b.right - value.right,
        };
      });
      expect(geometry.leftBorder).toBeGreaterThanOrEqual(2);
      expect(geometry.rightBorder).toBeGreaterThanOrEqual(2);
      const threshold = look === "risograph" ? 16 : 12;
      expect(geometry.leftInset).toBeGreaterThanOrEqual(threshold);
      expect(geometry.rightInset).toBeGreaterThanOrEqual(threshold);
      expect(geometry.leftTextGap).toBeGreaterThanOrEqual(threshold);
      expect(geometry.rightTextGap).toBeGreaterThanOrEqual(threshold);
      // Long mixed-language cost labels must wrap, but currency values must
      // stay horizontally readable (no "¥6\n0\n0" vertical stacks).
      const amounts = await section.locator(".info-row.compact-row > strong").evaluateAll(nodes =>
        nodes.map(node => {
          const rect = node.getBoundingClientRect();
          const parent = node.parentElement.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          return {
            nowrap: getComputedStyle(node).whiteSpace,
            fragments: range.getClientRects().length,
            left: rect.left,
            right: rect.right,
            parentLeft: parent.left,
            parentRight: parent.right,
          };
        }));
      expect(amounts).toHaveLength(2);
      for (const amount of amounts) {
        expect(amount.nowrap).toBe("nowrap");
        expect(amount.fragments).toBe(1);
        expect(amount.left).toBeGreaterThanOrEqual(amount.parentLeft);
        expect(amount.right).toBeLessThanOrEqual(amount.parentRight + 1);
      }
      await noDocumentOverflow(page);
      await section.screenshot({ path: testInfo.outputPath(look + "-costs-after.png") });
    });
  }

  test("Risograph Trip START/END and numbered route are borderless at " + size.width, async ({ page }, testInfo) => {
    await page.setViewportSize(size);
    await page.goto("/?previewStyle=risograph#trip/day/2026-10-03");
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", "risograph");
    const route = page.locator(".trip-route-summary");
    await expect(route).toBeVisible();
    await expect(route.locator(".trip-route-endpoints")).toContainText("Start");
    await expect(route.locator(".trip-route-endpoints")).toContainText("End");
    expect(await route.locator(".trip-route-steps > span").count()).toBeGreaterThanOrEqual(3);
    if (baseline) {
      await route.screenshot({ path: testInfo.outputPath("risograph-day-route-before.png") });
      return;
    }
    const geometry = await route.evaluate(node => {
      const endpoints = node.querySelector(".trip-route-endpoints");
      const step = node.querySelector(".trip-route-steps > span");
      const number = step.querySelector("b");
      const val = value => Number.parseFloat(value) || 0;
      return {
        endpointsBorder: val(getComputedStyle(endpoints).borderLeftWidth),
        stepsBorder: val(getComputedStyle(step).borderLeftWidth),
        stepsGap: val(getComputedStyle(step).gap),
        numberWidth: number.getBoundingClientRect().width,
        numberHeight: number.getBoundingClientRect().height,
      };
    });
    expect(geometry.endpointsBorder).toBe(0);
    expect(geometry.stepsBorder).toBe(0);
    expect(geometry.stepsGap).toBeGreaterThanOrEqual(8);
    expect(geometry.numberWidth).toBeGreaterThanOrEqual(24);
    expect(geometry.numberHeight).toBeGreaterThanOrEqual(24);
    await noDocumentOverflow(page);
    await route.screenshot({ path: testInfo.outputPath("risograph-day-route-after.png") });
  });
}

test("long mixed-language route endpoints and two-digit steps remain readable at 320px", async ({ page }) => {
  test.skip(baseline, "baseline run captures screenshots; geometry assertions target the repair");
  const trip = structuredClone(sample);
  trip.days[0].routeSummary = [
    "羽田空港 Haneda InternationalAirportABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    ...Array.from({ length: 10 }, (_, index) => "第" + (index + 1) + "站 Shibuya"),
    "惠比壽 Ebisu NightStationABCDEFGHIJKLMNOPQRST",
  ];
  await page.route("**/trip.json", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(trip),
  }));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/?previewStyle=risograph#trip/day/2026-10-03");
  await expect(page.locator(".trip-route-steps > span")).toHaveCount(12);
  await expect(page.locator(".trip-route-steps > span").nth(10).locator("b")).toHaveText("11");
  await noDocumentOverflow(page);
  const endpoint = await page.locator(".trip-route-endpoints").evaluate(node => {
    const bounds = node.getBoundingClientRect();
    return [...node.querySelectorAll("strong")].every(text => {
      const rect = text.getBoundingClientRect();
      return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
    });
  });
  expect(endpoint).toBe(true);
});
