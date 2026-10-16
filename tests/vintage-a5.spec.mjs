import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function openA5(page, variant) {
  await page.goto("/#more");
  await expect(page.locator("#travel-export-a5-style")).toBeVisible();
  await page.locator("#travel-export-a5-style").selectOption(variant);
  const popupPromise = page.waitForEvent("popup");
  await page.locator('[data-travel-export="a5"]').click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  return popup;
}

test("Classic stays default, Vintage is a separate selectable HTML A5", async ({page}) => {
  await page.goto("/#more");
  await expect(page.locator("#travel-export-a5-style")).toHaveValue("classic");
  const classic = await openA5(page,"classic");
  await expect(classic.locator(".booklet-vintage")).toHaveCount(0);
  const classicStops = await classic.locator(".itinerary-item").allTextContents();

  const vintage = await openA5(page,"vintage");
  await expect(vintage.locator(".booklet-vintage")).toHaveCount(1);
  const vintageStops = await vintage.locator(".itinerary-item").allTextContents();
  expect(vintageStops).toEqual(classicStops);
  await expect(vintage.locator("h1")).toContainText("Tokyo Autumn");
  expect(await vintage.evaluate(() => [...document.styleSheets[0].cssRules].some(
    rule => rule.cssText.toLowerCase().includes("size: a5")))).toBe(true);
  const pdf = await vintage.pdf({preferCSSPageSize:true,printBackground:true});
  expect(pdf.subarray(0,5).toString("utf8")).toBe("%PDF-");
  mkdirSync(resolve(root,"test-results"), {recursive:true});
  writeFileSync(resolve(root,"test-results/vintage-a5-sample.pdf"),pdf);
  await classic.close();
  await vintage.close();
});

test("Vintage A5 produces dense, text-selectable multiple print pages without changing items", async ({page}) => {
  const data = {
    trip: {id:"dense-vintage-qa",title:"中文與 English * long booklet",
      timezone:"Asia/Tokyo",startDate:"2026-10-03",endDate:"2026-10-08"},
    ui: {locale:"zh-TW",defaultView:"more",bottomNav:["now","trip","map","check","more"]},
    days: Array.from({length:6},(_,d) => ({
      id:"d"+d,date:"2026-10-"+String(d+3).padStart(2,"0"),
      label:"Day "+(d+1),title:"Dense 東京行程 chapter "+d,
      routeSummary:["駅前","Museum","Shopping"],
      reminders:["雙重核對 platform/exit gates"],
      items:Array.from({length:22},(_,i) => ({
        id:"d"+d+"i"+i,
        title:"Stop "+i+" 活動細節 / very long venue name AABBCCDD".repeat(i%3+1),
        start:i%9===0?"TBD":String(8+Math.floor(i/3)%12).padStart(2,"0")+":"+String((i%3)*15).padStart(2,"0"),
        location:"東京駅 / station "+i,
        note:"Walk, transfer, check tickets and keep safe—travel details remain editable source text."
      }))
    })),
    costs:{currency:"JPY",entries:[]},notes:[],files:[],links:[],checklists:[],todos:[],reservations:[]
  };
  await page.route("**/trip.json",route => route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(data)
  }));
  const vintage = await openA5(page,"vintage");
  await expect(vintage.locator(".itinerary-item")).toHaveCount(132);
  await expect(vintage.locator(".booklet-day")).toHaveCount(6);
  await expect(vintage.locator(".itinerary-item").first()).toContainText("東京駅");
  await expect(vintage.locator(".itinerary-item").first()).toContainText("時間未定");
  expect(await vintage.evaluate(()=>document.body.innerText.includes("Dense 東京行程"))).toBe(true);
  const pdf=await vintage.pdf({preferCSSPageSize:true,printBackground:true});
  expect(pdf.byteLength).toBeGreaterThan(15000);
  mkdirSync(resolve(root,"test-results"),{recursive:true});
  writeFileSync(resolve(root,"test-results/vintage-a5-dense.pdf"),pdf);
  await vintage.close();
});
