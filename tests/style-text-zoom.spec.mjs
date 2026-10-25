/* Reviewer P1: text-only 200% reflow on narrow phones.
   These are real Chromium focus, geometry and last-card-clearance checks.
   Surface-role navigation remains the same five source-driven buttons.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

const looks = [
  { id: "editorial", name: "editorial-light", colorScheme: "light" },
  { id: "editorial", name: "editorial-dark", colorScheme: "dark" },
  ...[
    "storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor",
  ].map(id => ({ id, name: id, colorScheme: "light" })),
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
  await page.route("https://tiles.openfreemap.org/**", route => route.abort());
});

for (const look of looks) {
  for (const width of [320, 390]) {
    test("200% text reflow: " + look.name + " at " + width, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 568 });
      await page.emulateMedia({ colorScheme: look.colorScheme, reducedMotion: "reduce" });
      await page.goto("/?previewStyle=" + look.id + "#trip/day/2026-10-03");
      await expect(page.locator(".trip-v2-item")).toHaveCount(4);
      const nav = page.locator("#bottom-nav");
      await expect(nav.locator(".nav-item")).toHaveCount(5);
      await expect(nav).toHaveCSS("position", "fixed");

      // Increase *text* via root CSS, not deviceScaleFactor or bitmap zoom.
      await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
      await expect.poll(() => page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize)))
        .toBe(32);
      await expect.poll(() => nav.evaluate(node => {
        const parent = document.querySelector(".app-shell");
        return Math.abs(Number.parseFloat(
          getComputedStyle(parent).getPropertyValue("--mobile-nav-block-size")) -
          node.getBoundingClientRect().height);
      })).toBeLessThanOrEqual(1);

      // Use real keyboard focus; all controls must still be in tab order.
      const buttons = nav.locator(".nav-item");
      const metrics = await nav.evaluate(node => {
        const px = x => Number.parseFloat(x) || 0;
        const b = node.getBoundingClientRect();
        const buttons = [...node.querySelectorAll(".nav-item")];
        const labels = buttons.map(button => {
          const label = button.querySelector("span:last-child");
          const range = document.createRange();
          range.selectNodeContents(label);
          const labelBox = label.getBoundingClientRect();
          const buttonBox = button.getBoundingClientRect();
          return {
            text: label.textContent.trim(),
            lines: range.getClientRects().length,
            whiteSpace: getComputedStyle(label).whiteSpace,
            labelWidth: labelBox.width,
            availableWidth: buttonBox.width,
            buttonWidth: buttonBox.width,
            buttonHeight: buttonBox.height,
            inside: labelBox.left >= buttonBox.left - 1 &&
              labelBox.right <= buttonBox.right + 1,
          };
        });
        return {
          rootFontPx: px(getComputedStyle(document.documentElement).fontSize),
          navHeight: b.height,
          navTop: b.top,
          navBottom: b.bottom,
          navWidth: b.width,
          documentOverflow: document.documentElement.scrollWidth - innerWidth,
          shellClearance: px(getComputedStyle(document.querySelector(".app-shell")).paddingBottom),
          labels,
        };
      });
      expect(metrics.labels.map(x => x.text)).toEqual(["Now", "Trip", "Transport", "Places", "More"]);
      for (const label of metrics.labels) {
        expect(label.lines, label.text + " must occupy only one line").toBe(1);
        expect(label.whiteSpace).toBe("nowrap");
        expect(label.inside, label.text + " must fit inside its button").toBe(true);
        expect(label.buttonWidth, label.text + " touch target").toBeGreaterThanOrEqual(44);
        expect(label.buttonHeight, label.text + " touch target").toBeGreaterThanOrEqual(44);
      }
      expect(metrics.navTop).toBeGreaterThanOrEqual(0);
      expect(metrics.navBottom).toBeLessThanOrEqual(569);
      expect(metrics.documentOverflow).toBeLessThanOrEqual(1);

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const readLastCardGap = () => page.evaluate(() => {
        const navRect = document.querySelector("#bottom-nav").getBoundingClientRect();
        const last = [...document.querySelectorAll(".trip-v2-item")].at(-1)?.getBoundingClientRect();
        return last && navRect ? navRect.top - last.bottom : -Infinity;
      });
      await expect.poll(readLastCardGap).toBeGreaterThanOrEqual(12);
      const clearance = await readLastCardGap();

      await buttons.first().focus();
      await expect(buttons.first()).toBeFocused();
      for (let index = 1; index < 5; index++) {
        await page.keyboard.press("Tab");
        await expect(buttons.nth(index)).toBeFocused();
      }

      if (["risograph", "storybook", "vintage-watercolor"].includes(look.id)) {
        await page.screenshot({
          path: testInfo.outputPath("text-zoom-" + width + "-" + look.id + ".png"),
          animations: "disabled",
        });
      }
      const output = testInfo.outputPath("text-zoom-metrics.json");
      writeFileSync(output, JSON.stringify({
        appearance: look.name, width, height: 568,
        actualBottomClearancePx: clearance,
        ...metrics,
      }, null, 2) + "\n");
      await testInfo.attach("text-zoom-metrics", { path: output, contentType: "application/json" });

      // Verify the last and tallest row is a real functional tab, not just
      // text that happens to be visible in a static screenshot.
      await buttons.last().click();
      await expect(buttons.last()).toHaveClass(/active/);
      await expect(page.locator(".more-section").first()).toBeVisible();

      // Restoring ordinary text size must restore the compact 5-column visual
      // rhythm. ResizeObserver should decrease bottom padding automatically.
      await page.addStyleTag({ content: "html { font-size: 100% !important; }" });
      await expect.poll(() => page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize)))
        .toBe(16);
      await expect.poll(() => nav.evaluate(node => {
        const measured = Number.parseFloat(
          getComputedStyle(document.querySelector(".app-shell"))
            .getPropertyValue("--mobile-nav-block-size"));
        return Math.abs(measured - node.getBoundingClientRect().height);
      })).toBeLessThanOrEqual(1);
      const rows = await nav.locator(".nav-item").evaluateAll(nodes =>
        new Set(nodes.map(node => Math.round(node.getBoundingClientRect().top))).size);
      expect(rows, "Normal text size must keep a single five-tab row").toBe(1);
    });
  }
}
