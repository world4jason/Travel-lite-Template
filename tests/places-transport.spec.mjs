import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const fixture=()=>JSON.parse(readFileSync(resolve(root,"trip.json"),"utf8"));
const tabIds=["now","trip","map","places","more"];

test("primary destinations are Now Trip Transport Places More with exactly five tabs",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#places");
  await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
  expect(await page.locator("#bottom-nav .nav-item").evaluateAll(
    nodes=>nodes.map(node=>node.dataset.view))).toEqual(tabIds);
  expect(await page.locator("#bottom-nav .nav-item").allTextContents()).toEqual([
    expect.stringMatching(/Now/),expect.stringMatching(/Trip/),
    expect.stringMatching(/Transport/),expect.stringMatching(/Places/),expect.stringMatching(/More/)
  ]);
  expect(await page.locator(".places-card").count()).toBeGreaterThanOrEqual(3);
  expect(await page.locator(".places-card").allTextContents()).not.toContain(expect.stringMatching(/Arrive at Haneda/));
  mkdirSync(resolve(root,"test-results"),{recursive:true});
  await page.screenshot({path:resolve(root,"test-results/places-mobile.png"),fullPage:false});
});

test("Places date filter, L0 card and L1 guide use real itinerary facts",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#places");
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page.locator(".places-card")).toHaveCount(2);
  await page.locator('[data-open-place="d2-sensoji"]').click();
  await expect(page.locator(".places-detail-heading h2")).toHaveText("Senso-ji");
  await expect(page.locator(".places-about")).toBeVisible();
  await expect(page).toHaveURL(/#places\/item\/d2-sensoji$/);
  await page.reload();
  await expect(page.locator(".places-detail-heading h2")).toHaveText("Senso-ji");
  await page.screenshot({path:resolve(root,"test-results/places-detail-mobile.png"),fullPage:false});
  await page.locator("[data-places-back]").click();
  await expect(page.locator(".places-card").first()).toBeVisible();
});

test("Trip item opens Places and back-to-day handoff preserves published itinerary day",async({page})=>{
  await page.goto("/#trip/day/2026-10-04");
  await expect(page.locator('[data-open-place="d2-sensoji"]')).toBeVisible();
  await page.locator('[data-open-place="d2-sensoji"]').click();
  await expect(page.locator(".places-detail-heading h2")).toHaveText("Senso-ji");
  await page.locator("[data-places-trip]").click();
  await expect(page.locator(".trip-day-view .day-summary")).toContainText("Asakusa");
});

test("More has device-only checklist and retains checked state with legacy #check link",async({page})=>{
  await page.goto("/#more");
  await expect(page.locator("[data-preparation]")).toHaveCount(1);
  await page.locator("[data-preparation] summary").click();
  const checkbox=page.locator('[data-check-key="before:passport"]');
  await expect(checkbox).toBeVisible();
  await page.locator("label.check-item").filter({has:checkbox}).click();
  await expect(page.locator("[data-check-progress]")).toContainText("1/");
  await page.locator('[data-view="places"]').click();
  await page.locator('[data-view="more"]').click();
  await page.locator("[data-preparation] summary").click();
  await expect(page.locator('[data-check-key="before:passport"]')).toBeChecked();
  await page.goto("/#check");
  await expect(page.locator('[data-check-key="before:passport"]')).toBeChecked();
  await expect(page.locator('[data-view="more"]')).toHaveClass(/active/);
});

test("legacy #map deep link still opens Transport and static published transfer text",async({page})=>{
  await page.goto("/#map/day/2026-10-03/stop/d1-haneda");
  await expect(page.locator('[data-view="map"]')).toHaveClass(/active/);
  await expect(page.locator(".runtime-map-panel")).toBeVisible();
  await expect(page.locator(".transport-day-context")).toHaveCount(1);
  await page.locator(".transport-day-context summary").click();
  await expect(page.locator(".transport-leg-list")).toContainText("Train");
  await expect(page.locator(".transport-leg-list")).not.toContainText("Last bus");
});

test("only explicit itemId references link booking & files; invalid URLs are never output",async({page})=>{
  const trip=fixture();
  trip.reservations.push({id:"test",itemId:"d2-sensoji",title:"Senso-ji demo slot",status:"pending",url:"https://example.org/booking"});
  trip.files.push({id:"valid-ticket",itemId:"d2-sensoji",title:"Ticket sample",url:"https://example.org/entry"});
  trip.files.push({id:"unsafe-ticket",itemId:"d2-sensoji",title:"Bad link",url:"javascript:alert(1)"});
  trip.reservations.push({id:"unlinked",title:"Senso-ji similar name",status:"confirmed"});
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-entry")).toContainText("Senso-ji demo slot");
  await expect(page.locator(".places-entry")).toContainText("Ticket sample");
  await expect(page.locator(".places-entry")).not.toContainText("Senso-ji similar name");
  await expect(page.locator('.places-entry a[href="https://example.org/booking"]')).toHaveCount(1);
  await expect(page.locator('.places-entry a[href="https://example.org/entry"]')).toHaveCount(1);
  await expect(page.locator('.places-entry a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.locator(".places-entry")).toContainText("Bad link");
});

test("missing guide, malicious script text, sparse content and 320px layouts degrade safely",async({page})=>{
  const trip=fixture();
  trip.days[0].items[2].title='<img src=x onerror="alert(1)">';
  trip.days[0].items[2].infoCard={title:"Fake",summary:"<script>alert(1)</script>",facts:["<svg/onload=alert(1)>"],
    sourceLinks:[{label:"Click",url:"javascript:alert(1)"}]};
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.setViewportSize({width:320,height:568});
  await page.goto("/#places/item/d1-shibuya");
  await expect(page.locator(".places-detail-heading h2")).toContainText('<img src=x onerror="alert(1)">');
  await expect(page.locator(".places-about")).toContainText("<script>alert(1)</script>");
  await expect(page.locator(".places-about script")).toHaveCount(0);
  await expect(page.locator(".places-about a[href^='javascript:']")).toHaveCount(0);
  const width=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
  expect(width[0]).toBeLessThanOrEqual(width[1]+1);
});

test("16 style appearances keep new Places view and mobile bottom navigation accessible",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const style of ["editorial","vintage-watercolor","storybook","risograph","paper-collage","quiet-acrylic"]){
    await page.goto("/?previewStyle="+style+"#places");
    await expect(page.locator(".places-heading")).toBeVisible();
    await expect(page.locator(".places-card").first()).toBeVisible();
    await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});

test("new Places and Transport modules are offline precached",async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,serviceWorkers:"allow"});
  try{
    const page=await context.newPage();
    await page.goto("/#places");
    await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,null,{timeout:15000});
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator(".places-heading")).toBeVisible();
    await page.goto("/#map");
    await expect(page.locator(".runtime-map-panel")).toBeVisible();
  }finally{
    await context.setOffline(false);
    await context.close();
  }
});

test("32-day source-backed place index uses reachable native day selection, not 32 overflowing chips",async({page})=>{
  const trip=fixture();
  const base=structuredClone(trip.days[1]);
  trip.days=Array.from({length:32},(_,index)=>{
    const date=new Date(Date.UTC(2026,9,3+index)).toISOString().slice(0,10);
    return {...structuredClone(base),date,id:"long-"+index,label:"Day "+(index+1),
      items:base.items.map((item)=>({...structuredClone(item),id:item.id+"-"+index}))};
  });
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.setViewportSize({width:320,height:568});
  await page.goto("/#places");
  await expect(page.locator("[data-places-select]")).toBeVisible();
  await expect(page.locator(".places-filters")).toHaveCount(0);
  await page.locator("[data-places-select]").selectOption("2026-10-12");
  await expect(page.locator(".places-card")).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test("old saved Check landing migrates to More with all device ticks retained",async({page})=>{
  await page.goto("/#more");
  await page.evaluate(async()=> {
    await TravelLiteStorage.set("sample-tokyo-2026:ui:view","check");
    await TravelLiteStorage.set("sample-tokyo-2026:checks",{"before:passport":true});
  });
  await page.goto("/");
  await expect(page.locator('[data-view="more"]')).toHaveClass(/active/);
  await page.locator("[data-preparation] summary").click();
  await expect(page.locator('[data-check-key="before:passport"]')).toBeChecked();
});

test("empty itinerary-only transport or accommodation has honest empty Places state",async({page})=>{
  const trip=fixture();
  trip.days=[trip.days[0]];
  trip.days[0].items=trip.days[0].items.slice(0,2);
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.goto("/#places");
  await expect(page.locator(".places-card")).toHaveCount(0);
  await expect(page.locator(".places-view .empty-state")).toBeVisible();
});

test("all registered style packs can render Places and its source-backed detail",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const style of ["editorial","storybook","candy","risograph","paper-collage","naive-city",
    "taiwan-poster","field-stamp","quiet-linocut","doodle-memory-grid","crayon-journal",
    "painterly-editorial","geometric-print","quiet-acrylic","vintage-watercolor"]){
    await page.goto("/?previewStyle="+style+"#places/item/d2-sensoji");
    await expect(page.locator(".places-detail-heading")).toBeVisible();
    await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});

test("capture real Transport, More and wide Places UI for artifact review",async({page})=>{
  mkdirSync(resolve(root,"test-results"),{recursive:true});
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#map/day/2026-10-03");
  await expect(page.locator(".transport-day-context")).toBeVisible();
  await page.locator(".transport-day-context summary").click();
  await page.screenshot({path:resolve(root,"test-results/transport-mvp-mobile.png"),fullPage:false});
  await page.goto("/#more");
  await page.locator("[data-preparation] summary").click();
  await page.screenshot({path:resolve(root,"test-results/more-preparation-mvp-mobile.png"),fullPage:false});
  await page.setViewportSize({width:1100,height:900});
  await page.goto("/#places");
  await expect(page.locator(".places-grid .places-card").first()).toBeVisible();
  await page.screenshot({path:resolve(root,"test-results/places-mvp-desktop.png"),fullPage:false});
});

test("capture explicitly linked synthetic entry and booking specimen",async({page})=>{
  const trip=fixture();
  trip.reservations.push({id:"sample-entry",itemId:"d2-sensoji",title:"Sample admission slot (synthetic)",status:"pending",url:"https://example.org/demo"});
  trip.files.push({id:"sample-file",itemId:"d2-sensoji",title:"Sample public information sheet (not a ticket)",type:"demo",url:"https://example.org/info"});
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-entry")).toContainText("synthetic");
  await page.screenshot({path:resolve(root,"test-results/places-entry-synthetic-mobile.png"),fullPage:false});
});

test("public relative file links work; More and Places refuse executable schemes",async({page})=>{
  const trip=fixture();
  trip.files.push({id:"public-demo",itemId:"d2-sensoji",title:"Public sample guide file",type:"PDF",url:"./sample-guide.pdf"});
  trip.files.push({id:"blocked",itemId:"d2-sensoji",title:"Unsafe file",type:"PDF",url:"javascript:alert(1)"});
  trip.reservations.push({id:"blocked-reservation",itemId:"d2-sensoji",title:"Untrusted booking link",url:"data:text/html,evil"});
  trip.links.push({label:"Unsafe utility URL",url:"javascript:alert(1)"});
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator('.places-entry a[href$="sample-guide.pdf"]')).toHaveCount(1);
  await expect(page.locator('.places-entry a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.locator('.places-entry a[href^="data:"]')).toHaveCount(0);
  await page.locator('[data-view="more"]').click();
  await expect(page.locator('[href^="javascript:"]')).toHaveCount(0);
  await expect(page.locator('[href^="data:"]')).toHaveCount(0);
  await expect(page.locator(".file-row").filter({hasText:"Unsafe file"})).toHaveCount(1);
  await expect(page.locator(".file-row").filter({hasText:"Unsafe file"}).locator("a")).toHaveCount(0);
});
