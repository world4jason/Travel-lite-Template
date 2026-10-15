import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const trip = JSON.parse(readFileSync(resolve(root, "trip.json"), "utf8"));

test.beforeEach(async ({ page }) => {
  await page.route("**/trip.json", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(trip)
  }));
  await page.goto("/#more");
  await expect(page.locator("#travel-export-actions")).toBeVisible();
});

test("More offers three exports and A4 preview prints the shared itinerary", async ({ page }) => {
  await expect(page.locator("[data-travel-export]")).toHaveCount(3);
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator('[data-travel-export="a4"]').click()
  ]);
  await expect(popup.locator("h1")).toContainText("Tokyo Autumn");
  await expect(popup.locator("body")).toContainText("Arrive at Haneda");
  await expect(popup.locator("body")).toContainText("Check live flight status");
  await expect(popup.locator("#print-now")).toBeVisible();
  await popup.evaluate(() => { window.print = () => { window.__printInvoked = true; }; });
  await popup.locator("#print-now").click();
  expect(await popup.evaluate(() => window.__printInvoked)).toBe(true);
  expect(await popup.evaluate(() => [...document.styleSheets[0].cssRules]
    .some((rule) => rule.cssText.toLowerCase().includes("size: a4")))).toBe(true);
  const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
  expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  expect(pdf.byteLength).toBeGreaterThan(5_000);
  writeFileSync(resolve(root, "test-results", "export-a4.pdf"), pdf);
  await popup.close();
});

test("A5 preview includes cover, day overview, real PDF and no interactive site navigation", async ({ page }) => {
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator('[data-travel-export="a5"]').click()
  ]);
  await expect(popup.locator(".booklet-cover")).toContainText("Tokyo Autumn");
  await expect(popup.locator(".booklet-overview li")).toHaveCount(3);
  await expect(popup.locator(".booklet-day")).toHaveCount(3);
  await expect(popup.locator(".bottom-nav")).toHaveCount(0);
  expect(await popup.evaluate(() => [...document.styleSheets[0].cssRules]
    .some((rule) => rule.cssText.toLowerCase().includes("size: a5")))).toBe(true);
  const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
  expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  expect(pdf.byteLength).toBeGreaterThan(5_000);
  writeFileSync(resolve(root, "test-results", "export-a5.pdf"), pdf);
  await popup.close();
});

test("downloaded ICS includes timed events, stable UID, VALARM and skips TBD", async ({ page }) => {
  await page.locator("#travel-export-alarm").selectOption("30");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('[data-travel-export="ics"]').click()
  ]);
  expect(download.suggestedFilename()).toBe("sample-tokyo-2026.ics");
  const path = await download.path();
  const text = readFileSync(path, "utf8");
  expect(text).toContain("BEGIN:VCALENDAR\r\n");
  expect(text).toContain("TRIGGER:-PT30M\r\n");
  expect(text).toContain("DTSTART:20261003T013000Z");
  expect(text).toContain("UID:17-sample-tokyo-2026.2-d1.9-d1-haneda@travel-lite.invalid");
  expect(text).not.toContain("SUMMARY:Lunch\r\n");
  await expect(page.locator("#travel-export-status")).toContainText("skipped");
});

test("ICS import warning is visible in English and Traditional Chinese", async ({ page }) => {
  const warning = page.locator("#travel-export-ics-warning");
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("has not been manually verified");

  const zhTrip = structuredClone(trip);
  zhTrip.ui.locale = "zh-TW";
  await page.unroute("**/trip.json");
  await page.route("**/trip.json", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(zhTrip)
  }));
  await page.reload();
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("尚未經 Apple、Google 或 Outlook 行事曆的實際匯入人工驗收");
});

test("mobile export controls are reachable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const button of await page.locator("[data-travel-export]").all()) {
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    const bounds = await button.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(391);
  }
  await page.screenshot({ path: resolve(root, "test-results", "export-more-mobile.png"), fullPage: true });
  const width = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(width).toBeLessThanOrEqual(1);
});


test("32-day mixed-language A5 booklet paginates dense days without dropping stops", async ({ page }) => {
  const long = structuredClone(trip);
  long.trip.id = "long-trip-test";
  long.trip.title = "長途旅行 Long Trip";
  long.trip.startDate = "2026-10-01";
  long.trip.endDate = "2026-11-01";
  long.days = Array.from({ length: 32 }, (_, dayIndex) => {
    const date = new Date(Date.UTC(2026, 9, dayIndex + 1)).toISOString().slice(0, 10);
    return {
      id: "day-" + dayIndex, date, label: "Day " + (dayIndex + 1),
      title: "札幌 → 美瑛 → 富良野・旅行日程 " + (dayIndex + 1),
      timezone: "Asia/Tokyo",
      reminders: ["大型行李請於集合前準備，確認新幹線／巴士資訊。"],
      items: Array.from({ length: 13 }, (_, stopIndex) => ({
        id: "stop-" + stopIndex,
        start: (7 + stopIndex).toString().padStart(2, "0") + ":00",
        title: "Station " + stopIndex + " ・ 大雪山国家公園景點資訊",
        location: "非常長的地點名稱 Long place name for safe wrapping",
        note: "請確認交通方式與集合資訊；這不是實際導航路徑。"
      }))
    };
  });
  await page.unroute("**/trip.json");
  await page.route("**/trip.json", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(long)
  }));
  await page.reload();
  await expect(page.locator("#travel-export-actions")).toBeVisible();
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.locator('[data-travel-export="a5"]').click()
  ]);
  await expect(popup.locator(".booklet-day")).toHaveCount(32);
  await expect(popup.locator(".itinerary-item")).toHaveCount(416);
  const pdf = await popup.pdf({ preferCSSPageSize: true, printBackground: true });
  expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  expect(pdf.byteLength).toBeGreaterThan(100_000);
  writeFileSync(resolve(root, "test-results", "export-long-a5.pdf"), pdf);
  await popup.close();
});


test("installed PWA keeps the export launcher and ICS working after offline reload", async ({ browser, page }) => {
  const context = await browser.newContext({ serviceWorkers: "allow", acceptDownloads: true });
  try {
    const offlinePage = await context.newPage();
    await offlinePage.goto(page.url(), { waitUntil: "domcontentloaded" });
    await expect(offlinePage.locator("#travel-export-actions")).toBeVisible();
    await offlinePage.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 12_000 });
    await context.setOffline(true);
    await offlinePage.reload({ waitUntil: "domcontentloaded" });
    await expect(offlinePage.locator("#travel-export-actions")).toBeVisible();
    const [download] = await Promise.all([
      offlinePage.waitForEvent("download"),
      offlinePage.locator('[data-travel-export="ics"]').click()
    ]);
    expect(download.suggestedFilename()).toMatch(/\.ics$/);
    const [popup] = await Promise.all([
      offlinePage.waitForEvent("popup"),
      offlinePage.locator('[data-travel-export="a4"]').click()
    ]);
    await expect(popup.locator("h1")).toContainText("Tokyo Autumn");
    await popup.close();
  } finally {
    await context.close();
  }
});

// Review #76: the zero-export path must report the same count and reasons
// as a successful download, while never creating an empty ICS file.
async function loadExportFixture(page, data) {
  await page.unroute("**/trip.json");
  await page.route("**/trip.json", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(data)
  }));
  await page.reload();
  await expect(page.locator("#travel-export-actions")).toBeVisible();
  await page.evaluate(() => {
    window.__icsBlobAttempts = 0;
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (...args) => {
      window.__icsBlobAttempts += 1;
      return create(...args);
    };
  });
}

test("all-TBD trip shows zero-export skip count in zh-TW and never downloads", async ({ page }) => {
  const data = structuredClone(trip);
  data.ui.locale = "zh-TW";
  data.days = [{ ...data.days[0], id: "all-tbd", items: [
    { id: "tbd1", title: "Flexible museum", start: "TBD" },
    { id: "tbd2", title: "Free afternoon" }
  ] }];
  await loadExportFixture(page, data);
  let downloaded = false;
  page.on("download", () => { downloaded = true; });
  await page.locator('[data-travel-export="ics"]').click();
  await expect(page.locator("#travel-export-status"))
    .toContainText("已匯出 0 個活動；略過 2 個：2 個時間未定");
  expect(await page.evaluate(() => window.__icsBlobAttempts)).toBe(0);
  expect(downloaded).toBe(false);
});

test("invalid DST, zone, missing ID and TBD show all skip reasons without a download", async ({ page }) => {
  const data = structuredClone(trip);
  data.trip.timezone = "America/New_York";
  data.ui.locale = "en";
  data.days = [{ ...data.days[0], id: "invalid-day", date: "2026-03-08",
    timezone: "America/New_York", items: [
      { id: "dst-gap", title: "Nonexistent DST hour", start: "02:30" },
      { id: "bad-zone", title: "Invalid zone", start: "09:00", timezone: "Mars/Olympus" },
      { id: "missing-id", title: "Missing ID", start: "11:00" },
      { id: "tbd", title: "Untimed stop", start: "TBD" }
    ] }];
  await loadExportFixture(page, data);
  // normalizeData supplies missing IDs by design; emulate corrupted runtime
  // input after normalization to cover the exporter rejection path.
  await page.evaluate(() => {
    state.data.days[0].items.find((item) => item.title === "Missing ID").id = "";
  });
  let downloaded = false;
  page.on("download", () => { downloaded = true; });
  await page.locator('[data-travel-export="ics"]').click();
  const status = page.locator("#travel-export-status");
  await expect(status).toContainText("Exported 0 events. 4 skipped");
  await expect(status).toContainText("1 without fixed time");
  await expect(status).toContainText("1 invalid/ambiguous time");
  await expect(status).toContainText("1 invalid time zone");
  await expect(status).toContainText("1 missing stable ID");
  expect(await page.evaluate(() => window.__icsBlobAttempts)).toBe(0);
  expect(downloaded).toBe(false);
});
