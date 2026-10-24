/* Issue #113: optional 16 appearance x 5 primary tabs x 3 viewport Chromium run.
   This checks real routes and overflow, not subjective Human Visual Review.
   Run: TRAVEL_LITE_FULL_STYLE_QA=1 npm run test:mobile -- --grep "style surface matrix"
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

const appearances = [
  { name: "editorial-light", style: "editorial", scheme: "light" },
  { name: "editorial-dark", style: "editorial", scheme: "dark" },
  ...[
    "storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor",
  ].map(style => ({ name: style, style, scheme: "light" })),
];
const sizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1100, height: 900 },
];
const tabs = [
  { id: "now", selector: "#view-root > *" },
  { id: "trip", selector: ".trip-route-summary" },
  { id: "map", selector: ".runtime-map-panel" },
  { id: "places", selector: ".places-view" },
  { id: "more", selector: ".more-section" },
];

test.describe("style surface matrix: 16 appearances x 5 tabs x 3 sizes (opt-in)", () => {
  test.skip(process.env.TRAVEL_LITE_FULL_STYLE_QA !== "1",
    "240 real browser-state checks require the explicit TRAVEL_LITE_FULL_STYLE_QA=1 gate");

  for (const look of appearances) {
    test("style surface matrix: " + look.name, async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      await page.route("https://fonts.googleapis.com/**", route =>
        route.fulfill({ status: 200, contentType: "text/css", body: "" }));
      await page.route("https://fonts.gstatic.com/**", route => route.abort());
      await page.route("https://tiles.openfreemap.org/**", route => route.abort());
      const states = [];
      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.emulateMedia({ colorScheme: look.scheme, reducedMotion: "reduce" });
        try {
          await page.goto("/?previewStyle=" + look.style + "#trip/overview");
          await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.style);
          await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
        } catch (error) {
          for (const tab of tabs) {
            states.push({ appearance: look.name, width: size.width, height: size.height,
              tab: tab.id === "map" ? "transport" : tab.id,
              status: "NOT RUN", reason: "Could not initialise appearance: " + String(error).slice(0, 240) });
          }
          continue;
        }

        for (const tab of tabs) {
          const state = { appearance: look.name, width: size.width,
            height: size.height, tab: tab.id === "map" ? "transport" : tab.id };
          try {
            await page.locator("#bottom-nav [data-view='" + tab.id + "']").click();
            await expect(page.locator("#bottom-nav [data-view='" + tab.id + "']")).toHaveClass(/active/);
            // Trip/day is the route layout with START/END and numbered steps;
            // every other tab uses its normal published destination.
            if (tab.id === "trip") {
              await page.goto("/?previewStyle=" + look.style + "#trip/day/2026-10-03");
            }
            await expect(page.locator(tab.selector).first()).toBeVisible();
            if (tab.id === "map") {
              await expect(page.locator(".map-stage")).toBeVisible();
              await expect(page.locator(".transport-day-context")).toBeVisible();
            }
            if (tab.id === "more") {
              const reservations = page.locator(".more-section")
                .filter({ has: page.locator("summary").filter({ hasText: "Reservations" }) }).first();
              await expect(reservations.locator(".info-row").first()).toBeVisible();
            }
            const metrics = await page.evaluate(() => ({
              viewportWidth: innerWidth,
              documentWidth: document.documentElement.scrollWidth,
            }));
            if (metrics.documentWidth > metrics.viewportWidth + 1) {
              throw new Error("horizontal overflow " + metrics.documentWidth + " > " + metrics.viewportWidth);
            }
            state.status = "PASS";
            state.reason = "Route rendered and no document overflow (automated smoke only)";
          } catch (error) {
            state.status = "FAIL";
            state.reason = String(error).slice(0, 400);
            try {
              await page.screenshot({
                path: testInfo.outputPath("FAIL-" + size.width + "-" + tab.id + ".png"),
                fullPage: false,
              });
            } catch {
              state.reason += "; failure screenshot unavailable";
            }
          }
          states.push(state);
        }
      }
      const output = testInfo.outputPath("browser-state-matrix.json");
      writeFileSync(output, JSON.stringify(states, null, 2) + "\n");
      await testInfo.attach("browser-state-matrix", { path: output, contentType: "application/json" });
      expect(states).toHaveLength(15);
      const failures = states.filter(entry => entry.status !== "PASS");
      expect(failures, "Every entry is independent; all results remain in the JSON attachment").toEqual([]);
    });
  }
});
