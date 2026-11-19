/* Human-readable Places classification and photo attribution in rendered UI. */
import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));
const all=data.days.flatMap(d=>d.items||[]);
const isLong=data.days.length>5;
const expected=all.filter(item=>["place","attraction","museum","landmark","nature","sight"].includes(item.type)).length;
test.beforeEach(async({page})=>{
 await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
 await page.route("https://fonts.gstatic.com/**",r=>r.abort());
 await page.route("https://commons.wikimedia.org/wiki/Special:FilePath/**",route=>
   route.fulfill({status:200,contentType:"image/svg+xml",
     body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130"><rect width="200" height="130" fill="#ddd"/></svg>'}));
});
test("Places index shows only venue destinations, not events, waiting or generic meals",async({page})=>{
 await page.goto("/#places");
 await expect(page.locator(".places-heading")).toBeVisible();
 await expect(page.locator(".places-card")).toHaveCount(expected);
 if(isLong){
   await expect(page.locator('[data-open-place="d04-s0-r45"]')).toHaveCount(0);
   await expect(page.locator('[data-open-place="d04-s0-r46"]')).toHaveCount(0);
   await expect(page.locator('[data-open-place="d02-osaka-tenmangu"]')).toHaveCount(1);
 }
});
test("known venue has source-backed short guide and rights attribution",async({page})=>{
 test.skip(!isLong,"Template example photo not required");
 await page.goto("/#places/item/d02-osaka-tenmangu");
 await expect(page.locator(".places-detail-heading h2")).toContainText("大阪天滿宮");
 await expect(page.locator(".places-about")).toContainText("菅原道真");
 await expect(page.locator(".places-source-link[href='https://osakatemmangu.or.jp/about']")).toHaveCount(1);
 await expect(page.locator(".places-photo-figure figcaption")).toContainText("CC0");
 await expect(page.locator(".places-photo")).toHaveAttribute("alt",/大阪天滿宮/);
});
test("waiting period remains in chronological day without being listed as a tourist attraction",async({page})=>{
 test.skip(!isLong,"Kansai-specific waiting block");
 await page.goto("/#trip/day/2026-11-07");
 await expect(page.locator('[data-timeline-item-id="d04-s0-r45"]')).toBeVisible();
 await expect(page.locator('[data-timeline-item-id="d04-s0-r45"]')).toContainText("15:15");
});
