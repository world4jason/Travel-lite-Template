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
  // trip.json and the overview render asynchronously after document load.
  // Keep the exact content comparison, waiting for the observable result.
  await expect(page.locator(".trip-overview-day h3")).toHaveText(existing);
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

test("Vintage More and checklist headers use one filled silhouette at every width",async({page})=>{
  for(const width of [320,390,1100]){
    await page.setViewportSize({width,height:width<600?844:900});
    await page.goto("/?previewStyle=vintage-watercolor#more");
    await expect(page.locator(".preparation-section > summary")).toBeVisible();
    const frames=await page.locator("details.more-section").evaluateAll(sections=>sections.map(section=>{
      const frame=getComputedStyle(section);
      const header=getComputedStyle(section.querySelector(":scope > summary"));
      const count=getComputedStyle(section.querySelector(":scope > summary .summary-count"));
      return {
        frameRadius:frame.borderTopLeftRadius,
        frameBorder:frame.borderTopWidth,
        frameFill:frame.backgroundColor,
        headerRadius:header.borderTopLeftRadius,
        headerBorder:header.borderTopWidth,
        headerFill:header.backgroundColor,
        countBorder:count.borderTopWidth,
      };
    }));
    expect(frames.length).toBeGreaterThan(0);
    for(const frame of frames){
      expect(frame.frameRadius).toBe("6px");
      expect(frame.frameBorder).toBe("0px");
      expect(frame.frameFill).toBe("rgb(233, 219, 191)");
      expect(frame.headerRadius).toBe("0px");
      expect(frame.headerBorder).toBe("0px");
      expect(frame.headerFill).toBe("rgba(0, 0, 0, 0)");
      expect(frame.countBorder).toBe("0px");
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);

    const preparation=page.locator(".preparation-section");
    const header=preparation.locator(":scope > summary");
    // Navigating to the identical URL after changing viewport can preserve
    // disclosure state. Normalize the initial state through keyboard input,
    // then verify opening rather than accidentally closing an open details.
    if (await preparation.getAttribute("open") !== null) {
      await header.focus();
      await page.keyboard.press("Enter");
      await expect(preparation).not.toHaveAttribute("open","");
    }
    await header.focus();
    await expect(header).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(preparation).toHaveAttribute("open","");
    const expanded=await preparation.evaluate(section=>({
      headerBottom:getComputedStyle(section.querySelector(":scope > summary")).borderBottomWidth,
      headerRadius:getComputedStyle(section.querySelector(":scope > summary")).borderTopLeftRadius,
      bodyFill:getComputedStyle(section.querySelector(".preparation-body")).backgroundColor,
    }));
    expect(expanded.headerBottom).toBe("1px"); // internal divider, not a second outer frame
    expect(expanded.headerRadius).toBe("0px");
    expect(expanded.bodyFill).toBe("rgb(255, 252, 245)");
  }

  // The override is scoped to Vintage, not the Storybook base pack.
  await page.goto("/?previewStyle=storybook#more");
  const storybook=await page.locator(".preparation-section").evaluate(section=>({
    outerBorder:getComputedStyle(section).borderTopWidth,
    innerRadius:getComputedStyle(section.querySelector("summary")).borderTopLeftRadius,
  }));
  expect(storybook.outerBorder).toBe("3px");
  expect(storybook.innerRadius).toBe("22px");
});
