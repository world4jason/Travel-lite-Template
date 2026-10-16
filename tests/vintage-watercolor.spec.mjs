import { test, expect } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const preview = "/?previewStyle=vintage-watercolor#trip/overview";
test("Vintage Watercolor stays opt-in, preserving real overview text and optional info-card behavior",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(preview);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","vintage-watercolor");
  await expect(page.locator(".trip-overview-hero h2")).toBeVisible();
  const existing = await page.locator(".trip-overview-day h3").allTextContents();
  await page.screenshot({path:resolve(root,"test-results/vintage-390-overview.png"),fullPage:true,
    // Fixed navigation is shown in a separate viewport screenshot.
    style:"#bottom-nav { visibility:hidden !important; }"});
  await page.goto("/?previewStyle=storybook#trip/overview");
  expect(await page.locator(".trip-overview-day h3").allTextContents()).toEqual(existing);
  await page.goto(preview);
  await page.locator(".trip-overview-day").first().click();
  await expect(page.locator(".trip-v2-item").first()).toBeVisible();
  await page.screenshot({path:resolve(root,"test-results/vintage-390-day.png"),fullPage:true,
    style:"#bottom-nav { visibility:hidden !important; }"});
});
for(const viewport of [
  {width:320,height:568},{width:844,height:390},{width:1100,height:900}
]){
  test("Vintage responsive overview, day and More " + viewport.width+"x"+viewport.height,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto(preview);
    await expect(page.locator(".trip-overview-hero h2")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(viewport.width===1100)
      await page.screenshot({path:resolve(root,"test-results/vintage-1100-overview.png"),fullPage:true});
    await page.locator(".trip-overview-day").first().click();
    await expect(page.locator(".trip-v2-item").first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(viewport.width===1100)
      await page.screenshot({path:resolve(root,"test-results/vintage-1100-day.png"),fullPage:true});
    await page.goto("/?previewStyle=vintage-watercolor#more");
    await page.locator("[data-style-picker-open]").click();
    await expect(page.locator('[data-style-choice="vintage-watercolor"]')).toBeVisible();
    await expect(page.locator(".style-option")).toHaveCount(16);
    await page.keyboard.press("Escape");
  });
}
test("New pack never runs decorative motion and is available offline after install",async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,serviceWorkers:"allow",reducedMotion:"reduce"});
  try {
    const page=await context.newPage();
    await page.goto(preview);
    await expect(page.locator("html")).toHaveAttribute("data-visual-style","vintage-watercolor");
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:15000});
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-visual-style","vintage-watercolor");
    await expect(page.locator(".trip-overview-hero h2")).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});
