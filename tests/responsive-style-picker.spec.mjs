import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const sample = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));

test.use({viewport:{width:390,height:844}});
test.beforeEach(async({page})=>{
  await page.route("https://fonts.googleapis.com/**",r=>
    r.fulfill({status:200,contentType:"text/css",body:""}));
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
});
const sheet=page=>page.locator("#style-picker-dialog");
const trigger=page=>page.locator("[data-style-picker-open]");
const getPosition=page=>page.evaluate(()=>{
  const d=document.getElementById("style-picker-dialog"),b=d.getBoundingClientRect();
  const scroll=d.querySelector(".style-picker-scroll"),sb=scroll.getBoundingClientRect();
  const foot=d.querySelector(".style-picker-footer").getBoundingClientRect();
  return {dialog:{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height},
    scroll:{height:sb.height,top:sb.top,bottom:sb.bottom,
      contentHeight:scroll.scrollHeight,scrolled:scroll.scrollTop},
    footer:{top:foot.top,bottom:foot.bottom},width:innerWidth,height:innerHeight,
    bodyWidth:document.documentElement.scrollWidth,
    modal:d.matches(":modal"),columns:getComputedStyle(d.querySelector(".style-options")).gridTemplateColumns,
    activeInside:d.contains(document.activeElement),
    pageLocked:document.documentElement.classList.contains("style-picker-is-open")};
});
const open=async(page)=>{
  await trigger(page).click();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page)).toHaveJSProperty("open",true);
};

test("More is compact by default; all sixteen styles are hidden until requested",async({page})=>{
  await page.goto("/#more");
  await expect(trigger(page)).toBeVisible();
  await expect(sheet(page)).toHaveJSProperty("open",false);
  await expect(page.locator(".style-option")).toHaveCount(16);
  await expect(trigger(page)).toContainText("Editorial Light");
  const h=await page.locator(".style-settings").evaluate(el=>el.getBoundingClientRect().height);
  expect(h).toBeLessThanOrEqual(160);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await open(page);
  await expect(sheet(page).locator(".style-option:visible")).toHaveCount(16);
});

test("phone bottom sheet fits viewport, scrolls options but pins header/footer",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/#more");
  await open(page);
  const position=await getPosition(page);
  expect(position.dialog.x).toBeCloseTo(0,0);
  expect(position.dialog.right).toBeLessThanOrEqual(position.width+1);
  expect(position.dialog.bottom).toBeLessThanOrEqual(position.height+1);
  expect(position.dialog.height).toBeGreaterThan(400);
  expect(position.scroll.contentHeight).toBeGreaterThan(position.scroll.height);
  expect(position.modal).toBe(true);
  expect(position.pageLocked).toBe(true);
  expect(position.activeInside).toBe(true);
  expect(position.columns.trim().split(/\s+/).length).toBe(2);
  await sheet(page).locator('[data-style-choice="quiet-acrylic"]').scrollIntoViewIfNeeded();
  const after=await getPosition(page);
  expect(after.scroll.scrolled).toBeGreaterThan(0);
  expect(after.footer.bottom).toBeLessThanOrEqual(after.height+1);
  await sheet(page).locator('[data-style-choice="quiet-acrylic"]').click();
  await expect(sheet(page)).toHaveJSProperty("open",false);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","quiet-acrylic");
  await expect(trigger(page)).toContainText("Quiet Acrylic");
  expect(await page.evaluate(()=>document.activeElement?.hasAttribute("data-style-picker-open"))).toBe(true);
  await page.reload();
  await expect(trigger(page)).toContainText("Quiet Acrylic");
});

test("small 320×568 phone keeps all controls in viewport and close is reachable",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:320,height:568});
  await page.goto("/#more");
  await open(page);
  const before=await getPosition(page);
  expect(before.dialog.right).toBeLessThanOrEqual(321);
  expect(before.dialog.bottom).toBeLessThanOrEqual(569);
  expect(before.scroll.height).toBeGreaterThan(180);
  expect(before.bodyWidth).toBeLessThanOrEqual(322);
  await sheet(page).locator('[data-style-choice="quiet-linocut"]').scrollIntoViewIfNeeded();
  await expect(sheet(page).locator("[data-style-reset]")).toBeVisible();
  await expect(sheet(page).locator("[data-style-picker-close]").first()).toBeVisible();
  const snapshot=await getPosition(page);
  expect(snapshot.footer.top).toBeLessThan(568);
  expect(snapshot.scroll.bottom).toBeLessThanOrEqual(snapshot.footer.top+1);
  await sheet(page).locator("[data-style-picker-close]").first().click();
  await expect(sheet(page)).toHaveJSProperty("open",false);
  expect(await page.evaluate(()=>document.activeElement?.hasAttribute("data-style-picker-open"))).toBe(true);
});

test("Escape and backdrop close the sheet without altering saved style",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/#more");
  await open(page);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toHaveJSProperty("open",false);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","editorial");
  await open(page);
  const box=await getPosition(page);
  await page.mouse.click(box.width/2,Math.max(3,box.dialog.y-15));
  await expect(sheet(page)).toHaveJSProperty("open",false);
  expect(await page.evaluate(()=>document.activeElement?.hasAttribute("data-style-picker-open"))).toBe(true);
});

test("desktop side drawer stays open for live comparison and traps keyboard focus",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/#more");
  await open(page);
  const atStart=await getPosition(page);
  expect(atStart.dialog.width).toBeGreaterThanOrEqual(500);
  expect(atStart.dialog.right).toBeLessThanOrEqual(1441);
  expect(atStart.dialog.x).toBeGreaterThan(800);
  expect(atStart.dialog.y).toBeCloseTo(0,0);
  expect(atStart.dialog.bottom).toBeLessThanOrEqual(901);
  expect(atStart.columns.trim().split(/\s+/).length).toBe(3);
  expect(atStart.modal).toBe(true);
  await sheet(page).locator('[data-style-choice="quiet-linocut"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","quiet-linocut");
  await expect(sheet(page)).toHaveJSProperty("open",true);
  await expect(sheet(page).locator('[data-style-choice="quiet-linocut"]')).toHaveAttribute("aria-pressed","true");
  expect(await page.evaluate(()=>document.activeElement?.dataset.styleChoice)).toBe("quiet-linocut");
  await sheet(page).locator('[data-style-choice="painterly-editorial"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","painterly-editorial");
  await expect(sheet(page)).toHaveJSProperty("open",true);
  expect(await page.evaluate(()=>document.activeElement?.dataset.styleChoice)).toBe("painterly-editorial");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(()=>document.getElementById("style-picker-dialog").contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toHaveJSProperty("open",false);
  // Native dialog close dispatches asynchronously after open=false; wait for
  // our close listener to return focus to the newly rendered More trigger.
  await expect.poll(()=>page.evaluate(()=>document.activeElement?.hasAttribute("data-style-picker-open"))).toBe(true);
});

test("tablet drawer, compact desktop height and landscape resize preserve reachable controls",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:820,height:620});
  await page.goto("/#more");
  await open(page);
  let bounds=await getPosition(page);
  expect(bounds.dialog.x).toBeGreaterThan(200);
  expect(bounds.dialog.right).toBeLessThanOrEqual(821);
  await page.setViewportSize({width:720,height:490});
  bounds=await getPosition(page);
  expect(bounds.dialog.x).toBeCloseTo(0,0);
  expect(bounds.dialog.bottom).toBeLessThanOrEqual(491);
  expect(bounds.scroll.height).toBeGreaterThan(125);
  await expect(sheet(page).locator('[data-style-choice="field-stamp"]')).toHaveCount(1);
  await page.setViewportSize({width:1440,height:520});
  bounds=await getPosition(page);
  expect(bounds.dialog.right).toBeLessThanOrEqual(1441);
  expect(bounds.scroll.height).toBeGreaterThan(140);
  await sheet(page).locator("[data-style-picker-close]").last().click();
  await expect(sheet(page)).toHaveJSProperty("open",false);
});

test("reset from native modal returns to non-Editorial published default and keeps hash",async({page})=>{
  const trip=structuredClone(sample);
  trip.ui.visualStyle="storybook";
  trip.trip.id="style-bottomsheet-published-default";
  await page.route("**/trip.json",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.goto("/?foo=bar&previewStyle=crayon-journal#more");
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","crayon-journal");
  await open(page);
  await sheet(page).locator("[data-style-reset]").click();
  await expect(sheet(page)).toHaveJSProperty("open",false);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","storybook");
  expect(new URL(page.url()).searchParams.has("previewStyle")).toBe(false);
  expect(new URL(page.url()).searchParams.get("foo")).toBe("bar");
  expect(new URL(page.url()).hash).toBe("#more");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","storybook");
});

test("OS reduce-motion and manual preference suppress picker slide animation",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/#more");
  await open(page);
  expect(await sheet(page).evaluate(el=>getComputedStyle(el).animationName)).toBe("none");
  await sheet(page).locator("[data-style-picker-close]").first().click();
  await page.emulateMedia({reducedMotion:"no-preference"});
  await open(page);
  expect(await sheet(page).evaluate(el=>getComputedStyle(el).animationName)).not.toBe("none");
});

test.describe("responsive picker works after offline reload",()=>{
  test.use({serviceWorkers:"allow"});
  test("cached modal markup and all choices are available offline",async({page,context})=>{
    await page.goto("/#more");
    await trigger(page).waitFor();
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:15000});
    await open(page);
    await sheet(page).locator('[data-style-choice="quiet-linocut"]').click();
    await expect(page.locator("html")).toHaveAttribute("data-visual-style","quiet-linocut");
    await expect.poll(()=>page.evaluate(()=>
      TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("quiet-linocut");
    await context.setOffline(true);
    await page.reload({waitUntil:"domcontentloaded"});
    await expect(trigger(page)).toContainText("Quiet Linocut");
    await open(page);
    await expect(sheet(page).locator(".style-option:visible")).toHaveCount(16);
    await sheet(page).locator("[data-style-picker-close]").last().click();
    await expect(sheet(page)).toHaveJSProperty("open",false);
  });
});
