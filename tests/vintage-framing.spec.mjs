import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const preview="/?previewStyle=vintage-watercolor#trip/overview";

async function inspectFrame(page) {
  return page.evaluate(()=>{
    const hero=document.querySelector(".trip-overview-hero");
    const header=document.querySelector(".trip-header");
    const section=document.querySelector(".trip-overview-section");
    const computed=getComputedStyle(hero);
    const b=hero.getBoundingClientRect();
    const title=hero.querySelector("h2").getBoundingClientRect();
    return {
      border:computed.borderTopWidth,
      images:computed.backgroundImage,
      inset:getComputedStyle(hero,"::before").borderTopStyle,
      headerImages:getComputedStyle(header).backgroundImage,
      section:section ? getComputedStyle(section).backgroundImage : "",
      overflow:document.documentElement.scrollWidth > innerWidth+1,
      titleSafe:title.left>=b.left+18 && title.right<=b.right-12,
    };
  });
}

for (const width of [320,390,844,1100]) {
  test("ornate frame survives accessible responsive layout " + width, async ({page})=>{
    await page.setViewportSize({width,height:width===844?390:width===1100?900:width===320?568:844});
    await page.goto(preview);
    await expect(page.locator(".trip-overview-hero h2")).toContainText("Tokyo Autumn");
    const info=await inspectFrame(page);
    expect(info.images).toContain("frame-corner-tl.svg");
    expect(info.images).toContain("frame-corner-tr.svg");
    expect(info.images).toContain("frame-corner-bl.svg");
    expect(info.images).toContain("frame-corner-br.svg");
    expect(info.headerImages).toContain("frame-corner");
    expect(info.section).toContain("divider-ornament.svg");
    expect(info.inset).toBe("solid");
    expect(info.overflow).toBe(false);
    expect(info.titleSafe).toBe(true);
    if ([390,1100].includes(width)) {
      mkdirSync(resolve(root,"test-results"),{recursive:true});
      await page.screenshot({path:resolve(root,"test-results/vintage-framed-overview-"+width+".png"),fullPage:true,
        // A full-page image flattens fixed elements into the middle of the long page.
        // Hide only during mobile documentation capture; viewport QA tests the actual nav.
        style:width===390?"#bottom-nav { visibility:hidden !important; }":undefined});
    }
    await page.locator(".trip-overview-day").first().click();
    await expect(page.locator(".trip-day-view .day-summary")).toBeVisible();
    const chapter=await page.evaluate(()=>{
      const node=document.querySelector(".trip-day-view > .day-summary");
      return {
        background:getComputedStyle(node).backgroundImage,
        inset:getComputedStyle(node,"::before").borderTopStyle,
        overflow:document.documentElement.scrollWidth>innerWidth+1
      };
    });
    expect(chapter.background).toContain("frame-corner-br.svg");
    expect(chapter.inset).toBe("solid");
    expect(chapter.overflow).toBe(false);
    if ([390,1100].includes(width))
      await page.screenshot({path:resolve(root,"test-results/vintage-framed-day-"+width+".png"),fullPage:true,
        style:width===390?"#bottom-nav { visibility:hidden !important; }":undefined});
  });
}
test("four corners and divider are local fetchable assets, not remote image dependencies",async({page})=>{
  await page.goto(preview);
  const results=await page.evaluate(async ()=>{
    const files=["frame-corner-tl.svg","frame-corner-tr.svg","frame-corner-bl.svg","frame-corner-br.svg","divider-ornament.svg"];
    return await Promise.all(files.map(async f=>{
      const response=await fetch("./assets/vintage-watercolor/"+f);
      return {f,ok:response.ok,text:await response.text()};
    }));
  });
  for(const result of results){
    expect(result.ok).toBe(true);
    expect(result.text).toContain("<svg");
    expect(result.text).not.toContain("<script");
    expect(result.text).not.toContain("<text");
  }
});

test("320px long multilingual titles do not cover borders or controls",async({page})=>{
  const trip=JSON.parse(readFileSync(resolve(root,"trip.json"),"utf8"));
  trip.trip.title="旅行回憶與超級超級長的 ViennaAutumnGrandHotelStayJourneyABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for(const day of trip.days) for(const item of day.items) {
    item.title += " 超長旅程名稱 SuperExtraLongTextABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  }
  await page.route("**/trip.json",route=>route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(trip)
  }));
  await page.setViewportSize({width:320,height:568});
  await page.goto(preview);
  await expect(page.locator(".trip-overview-hero h2")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator(".trip-overview-day").first().click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator(".trip-v2-item").first()).toBeVisible();
});

test("A5 Vintage prints original vector decorations; Classic stays unchanged and text selectable",async({page})=>{
  await page.goto("/#more");
  await page.locator("#travel-export-a5-style").selectOption("vintage");
  const pop=page.waitForEvent("popup");
  await page.locator('[data-travel-export="a5"]').click();
  const vintage=await pop;
  await vintage.waitForLoadState("domcontentloaded");
  const ornaments=await vintage.evaluate(()=>{
    const cover=document.querySelector(".booklet-vintage .booklet-cover");
    const day=document.querySelector(".booklet-vintage .booklet-day .day-heading");
    return {
      corner:getComputedStyle(cover,"::before").backgroundImage,
      divider:getComputedStyle(day,"::after").backgroundImage
    };
  });
  expect(ornaments.corner).toContain("data:image/svg+xml,");
  expect(ornaments.divider).toContain("data:image/svg+xml,");
  expect(await vintage.locator(".itinerary-item").count()).toBeGreaterThan(0);
  const pdf=await vintage.pdf({preferCSSPageSize:true,printBackground:true});
  expect(pdf.subarray(0,5).toString("utf8")).toBe("%PDF-");
  mkdirSync(resolve(root,"test-results"),{recursive:true});
  writeFileSync(resolve(root,"test-results/vintage-framed-a5.pdf"),pdf);
  await vintage.close();
  await page.locator("#travel-export-a5-style").selectOption("classic");
  const pop2=page.waitForEvent("popup");
  await page.locator('[data-travel-export="a5"]').click();
  const classic=await pop2;
  await classic.waitForLoadState("domcontentloaded");
  await expect(classic.locator(".booklet-vintage")).toHaveCount(0);
  await classic.close();
});

test("new corner ornaments do not leak into other Style Packs",async({page})=>{
  for(const id of ["risograph","paper-collage","field-stamp","quiet-acrylic"]){
    await page.goto("/?previewStyle="+id+"#trip/overview");
    await expect(page.locator("html")).toHaveAttribute("data-visual-style",id);
    await expect(page.locator(".trip-overview-hero")).toBeVisible();
    const hero=await page.evaluate(()=>getComputedStyle(document.querySelector(".trip-overview-hero")).backgroundImage);
    expect(hero).not.toContain("frame-corner-");
    expect(hero).not.toContain("divider-ornament.svg");
  }
});

test("all new frame SVGs survive the first offline reload",async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,serviceWorkers:"allow"});
  try {
    const page=await context.newPage();
    await page.goto(preview);
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:15000});
    const missing=await page.evaluate(async()=>{
      const names=["frame-corner-tl.svg","frame-corner-tr.svg","frame-corner-bl.svg","frame-corner-br.svg","divider-ornament.svg"];
      const cacheKeys=(await caches.keys()).filter(k=>k.startsWith("travel-lite:") && k.includes(":shell-v"));
      const cache=await caches.open(cacheKeys[0]);
      const entries=await Promise.all(names.map(name=>cache.match(new URL("./assets/vintage-watercolor/"+name,location.href))));
      return names.filter((_,i)=>!entries[i]);
    });
    expect(missing).toEqual([]);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator(".trip-overview-hero h2")).toContainText("Tokyo Autumn");
    const images=await page.evaluate(()=>getComputedStyle(document.querySelector(".trip-overview-hero")).backgroundImage);
    expect(images).toContain("frame-corner");
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});
