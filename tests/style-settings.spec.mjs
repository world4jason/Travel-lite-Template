import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const sample = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const closeExternalFonts = async page => {
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
};
test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => closeExternalFonts(page));

const select = (page, id) => page.locator('[data-style-choice="' + id + '"]');
const active = (page, id) => expect(page.locator("html")).toHaveAttribute("data-visual-style", id);
const openMore = async page => {
  await page.locator('.bottom-nav [data-view="more"]').click();
  await expect(page.locator(".style-settings")).toBeVisible();
};
const pageStyles = async page => page.evaluate(() => Object.fromEntries(
  ["storybook-style", "candy-style", "risograph-style"]
    .map(id => [id, !document.getElementById(id).disabled])));

test("Settings / More lists nine selectable appearances and a visible follow-default control", async ({ page }) => {
  await page.goto("/#trip/overview");
  await active(page,"editorial");
  await openMore(page);
  await expect(page.locator(".style-settings")).toContainText("Choose a visual style");
  await expect(page.locator(".style-option")).toHaveCount(9);
  await expect(page.locator('[data-style-choice="editorial-light"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator("[data-style-reset]")).toContainText("Follow trip default");
  await expect(page.locator("[data-style-reset]")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".style-source")).toContainText("published trip");
  await expect(page.locator(".style-settings")).toBeInViewport();
});

test("switches all previously supported looks live without navigating or mutating shared trip data", async ({ page }) => {
  await page.goto("/#trip/overview");
  await openMore(page);
  // Same-document history/hash changes are not full reloads. Track the
  // lifetime of a document-local sentinel instead of navigation events.
  await page.evaluate(() => { window.__stylePageNonce = "stable-document"; });
  for (const [pack, body, enabled] of [
    ["candy", "rgb(255, 249, 239)", [true,true,false]],
    ["risograph","rgb(247, 241, 228)", [false,false,true]],
    ["storybook","rgb(255, 252, 246)", [true,false,false]],
    ["editorial-light",null,[false,false,false]],
  ]) {
    await select(page,pack).click();
    await active(page,pack === "editorial-light" ? "editorial" : pack);
    await expect(select(page,pack)).toHaveAttribute("aria-pressed","true");
    await expect(page.locator(".style-settings")).toBeVisible();
    await expect(page.locator("#trip-title")).toHaveText("Tokyo Autumn");
    await expect.poll(async () => Object.values(await pageStyles(page))).toEqual(enabled);
    if (body) await expect.poll(() =>
      page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(body);
    await expect(page.locator("#quick-theme-toggle")).toHaveJSProperty("hidden",pack !== "editorial-light");
    expect(await page.evaluate(() => window.__stylePageNonce)).toBe("stable-document");
    expect((await page.evaluate(() => state.data.ui.visualStyle))).toBe("editorial");
  }
  await expect(page.locator("[data-style-reset]")).toHaveAttribute("aria-pressed","false");
  await expect(page.locator(".style-source")).toContainText("Saved on this device");
});

test("selection persists across reload but does not change existing deep link or checklist", async ({ page }) => {
  await page.goto("/#trip/overview");
  await openMore(page);
  await select(page,"candy").click();
  await active(page,"candy");
  await expect.poll(() => page.evaluate(() =>
    TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("candy");
  await page.locator(".bottom-nav [data-view='check']").click();
  await page.locator("label:has(input[data-check-key])").first().click();
  await expect(page.locator("input[data-check-key]").first()).toBeChecked();
  // Storage completion is async. Navigation before it settles must not render
  // a stale checklist over the deep-linked day view.
  await page.goto("/#trip/day/2026-10-04");
  await expect(page.locator(".trip-day-view")).toBeVisible();
  await active(page,"candy");
  await page.reload({waitUntil:"domcontentloaded"});
  await active(page,"candy");
  await expect(page.locator(".trip-day-view")).toBeVisible();
  await page.locator(".bottom-nav [data-view='check']").click();
  await expect(page.locator("input[data-check-key]").first()).toBeChecked();
});

test("a shared preview URL overrides the device temporarily, and Settings clears the URL override when saving", async ({ page }) => {
  await page.goto("/#more");
  await openMore(page);
  await select(page,"candy").click();
  await active(page,"candy");
  await page.goto("/?foo=bar&previewStyle=risograph#more");
  await active(page,"risograph");
  await expect(page.locator(".style-source")).toContainText("Previewing a link");
  expect(await page.evaluate(() => TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("candy");

  await select(page,"storybook").click();
  await active(page,"storybook");
  expect(new URL(page.url()).searchParams.get("previewStyle")).toBe(null);
  expect(new URL(page.url()).searchParams.get("foo")).toBe("bar");
  expect(new URL(page.url()).hash).toBe("#more");
  await expect.poll(() => page.evaluate(() =>
    TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("storybook");
  await page.reload();
  await active(page,"storybook");
});

test("Follow trip default clears local selection and respects a published Storybook default", async ({ page }) => {
  const trip = structuredClone(sample);
  trip.ui.visualStyle = "storybook";
  trip.trip.id = "published-book-default-trip";
  await page.route("**/trip.json", route => route.fulfill({
    status:200, contentType:"application/json", body:JSON.stringify(trip),
  }));
  await page.goto("/#more");
  await openMore(page);
  await active(page,"storybook");
  await expect(page.locator("[data-style-reset]")).toContainText("Storybook");
  await select(page,"risograph").click();
  await active(page,"risograph");
  await expect(page.locator("[data-style-reset]")).toHaveAttribute("aria-pressed","false");
  await page.locator("[data-style-reset]").click();
  await active(page,"storybook");
  await expect(page.locator("[data-style-reset]")).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".style-source")).toContainText("published trip");
  expect(await page.evaluate(() => TravelLiteStorage.get("published-book-default-trip:visualStyle"))).toBe(null);
  await page.reload();
  await active(page,"storybook");
});

test("returning from light-only packs to Editorial restores stored dark theme and header toggle", async ({ page }) => {
  await page.goto("/#more");
  await openMore(page);
  await page.locator('button[data-theme="dark"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await select(page,"candy").click();
  await active(page,"candy");
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  await expect(page.locator("#quick-theme-toggle")).toBeHidden();
  await select(page,"editorial-dark").click();
  await active(page,"editorial");
  await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await expect(page.locator("#quick-theme-toggle")).toHaveJSProperty("hidden",false);
  await expect(page.locator('button[data-theme="dark"]')).toHaveClass(/active/);
});

test("the style picker supports keyboard input, manual motion preferences, and 320px mobile", async ({ page }) => {
  await page.setViewportSize({width:320,height:568});
  await page.goto("/#more");
  await openMore(page);
  const target = select(page,"candy");
  await target.focus();
  await page.keyboard.press("Enter");
  await active(page,"candy");
  await expect(page.locator(".style-settings")).toBeVisible();
  await expect(page.locator("[data-motion-choice]")).toHaveCount(2);
  await page.locator('[data-motion-choice="reduce"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-motion","reduce");
  await select(page,"risograph").click();
  await active(page,"risograph");
  await expect(page.locator("[data-motion-choice]")).toHaveCount(0);
  await select(page,"candy").click();
  await expect(page.locator('[data-motion-choice="reduce"]')).toHaveAttribute("aria-pressed","true");
  for (const width of [320,390,820,1100,1600]) {
    await page.setViewportSize({width,height:width<600?740:900});
    const w=await page.evaluate(() => ({viewport:innerWidth, doc:document.documentElement.scrollWidth}));
    expect(w.doc, String(width)).toBeLessThanOrEqual(w.viewport+2);
  }
});

test.describe("device-local chooser offline", () => {
  test.use({serviceWorkers:"allow"});
  test("styles and settings survive offline reload after first visit", async ({page,context}) => {
    await page.goto("/#more");
    await openMore(page);
    await page.waitForFunction(() => navigator.serviceWorker?.controller,null,{timeout:12000});
    const preloaded=await page.evaluate(async () =>
      Boolean(await caches.match(new URL("./style-settings.css",location.href).href)));
    expect(preloaded).toBe(true);
    await select(page,"risograph").click();
    await active(page,"risograph");
    await expect.poll(() => page.evaluate(() =>
      TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("risograph");
    await context.setOffline(true);
    await page.reload({waitUntil:"domcontentloaded"});
    await active(page,"risograph");
    await expect(page.locator(".style-option")).toHaveCount(9);
    await select(page,"candy").click();
    await active(page,"candy");
  });
});

test("choosing and resetting style does not raise JavaScript page errors",async({page})=>{
 const failures=[];
 page.on("pageerror",error=>failures.push(error.message));
 await page.goto("/#more");
 await page.locator("[data-style-choice='field-stamp']").click();
 await page.locator("[data-style-reset]").click();
 await expect(page.locator("html")).toHaveAttribute("data-visual-style","editorial");
 expect(failures).toEqual([]);
});
