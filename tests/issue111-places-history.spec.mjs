/* #111 Places: day-filter URL + per-trip storage + native Back/Forward.
   Uses real browser history, not manually injected popstate objects.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const trip = JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));

test("native Back/Forward traverses filtered Places list and its detail",async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/#places");
  await expect(page.locator(".places-card")).toHaveCount(3);
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  await expect(page.locator('[data-places-date="2026-10-04"]')).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".places-card")).toHaveCount(2);
  await page.screenshot({path:testInfo.outputPath("places-filter-day2-390.png"),animations:"disabled"});
  await page.locator('[data-open-place="d2-sensoji"]').click();
  await expect(page).toHaveURL(/#places\/item\/d2-sensoji$/);
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.goBack();
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  await expect(page.locator(".places-card")).toHaveCount(2);
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/#places\/item\/d2-sensoji$/);
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.screenshot({path:testInfo.outputPath("places-native-forward-detail-390.png"),animations:"disabled"});
  await page.locator("[data-places-back]").click();
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  await expect(page.locator(".places-card")).toHaveCount(2);
});

test("day filter survives refresh and same trip tab transitions, without changing Trip day",async({page})=>{
  await page.goto("/#trip/day/2026-10-03");
  await expect(page.locator(".trip-day-view")).toContainText("Arrival");
  await page.locator('[data-view="places"]').click();
  await expect(page.locator(".places-card")).toHaveCount(3);
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  await page.reload();
  await expect(page.locator(".places-card")).toHaveCount(2);
  await expect(page.locator('[data-places-date="2026-10-04"]')).toHaveAttribute("aria-pressed","true");
  await page.locator('[data-view="trip"]').click();
  expect(await page.evaluate(() => state.selectedDate)).toBe("2026-10-03");
  // Trip view may show its Overview after reload; the day context is intact.
  await page.locator('[data-view="places"]').click();
  await expect(page.locator(".places-card")).toHaveCount(2);
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
});

test("native history over day filters restores all, day1, day2, without stale counts",async({page})=>{
  await page.goto("/#places");
  await page.locator('[data-places-date="2026-10-03"]').click();
  await expect(page.locator(".places-card")).toHaveCount(1);
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page.locator(".places-card")).toHaveCount(2);
  await page.goBack();
  await expect(page).toHaveURL(/#places\/day\/2026-10-03$/);
  await expect(page.locator(".places-card")).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/#places$/);
  await expect(page.locator(".places-card")).toHaveCount(3);
  await page.goForward();
  await expect(page.locator(".places-card")).toHaveCount(1);
  await page.goForward();
  await expect(page.locator(".places-card")).toHaveCount(2);
});

test("explicit direct date route overrides saved filter; invalid date fails to All days",async({page})=>{
  await page.goto("/#places");
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page.locator(".places-card")).toHaveCount(2);
  await page.goto("/#places/day/2026-10-03");
  await expect(page.locator(".places-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-places-date="2026-10-03"]')).toHaveAttribute("aria-pressed","true");
  await page.goto("/#places/day/2099-01-01");
  await expect(page.locator(".places-card")).toHaveCount(3);
  await expect(page).toHaveURL(/#places$/);
});

test("direct detail link and in-app Back restore device-selected Places filter",async({page})=>{
  await page.goto("/#places");
  await page.locator('[data-places-date="2026-10-04"]').click();
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.reload();
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.locator("[data-places-back]").click();
  await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  await expect(page.locator(".places-card")).toHaveCount(2);
});

test("Places detail Trip/Transport handoffs and native Back preserve correct visit",async({page})=>{
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.locator("[data-places-transport]").click();
  await expect(page).toHaveURL(/#map\/day\/2026-10-04\/stop\/d2-sensoji$/);
  await expect(page.locator(".map-selected-summary")).toContainText("Senso-ji");
  await page.goBack();
  await expect(page).toHaveURL(/#places\/item\/d2-sensoji$/);
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.locator("[data-places-trip]").click();
  await expect(page).toHaveURL(/#trip\/day\/2026-10-04$/);
  await expect(page.locator(".trip-day-view")).toContainText("Asakusa");
  await page.goBack();
  await expect(page).toHaveURL(/#places\/item\/d2-sensoji$/);
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
});

test("native browser history retains legacy #map and #check compatibility",async({page})=>{
  await page.goto("/#map/day/2026-10-04/stop/d2-sensoji");
  await expect(page.locator(".map-selected-summary")).toContainText("Senso-ji");
  await page.goto("/#check");
  await expect(page.locator('[data-view="more"]')).toHaveClass(/active/);
  await expect(page.locator(".check-group").first()).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#map\/day\/2026-10-04\/stop\/d2-sensoji$/);
  await expect(page.locator(".map-selected-summary")).toContainText("Senso-ji");
});

test("32-day filter uses native select and survives Back/Forward/reload",async({page},info)=>{
  const long=structuredClone(trip),base=structuredClone(trip.days[1]);
  long.days=Array.from({length:32},(_,n)=>{
    const date=new Date(Date.UTC(2026,9,3+n)).toISOString().slice(0,10);
    return {...structuredClone(base),date,id:"long-"+n,label:"Day "+(n+1),items:base.items.map(item=>({...structuredClone(item),id:item.id+"-"+n}))};
  });
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(long)}));
  await page.setViewportSize({width:320,height:568});
  await page.goto("/#places");
  await expect(page.locator("[data-places-select]")).toBeVisible();
  await page.locator("[data-places-select]").selectOption("2026-10-12");
  await expect(page).toHaveURL(/#places\/day\/2026-10-12$/);
  await expect(page.locator(".places-card")).toHaveCount(2);
  await page.screenshot({path:info.outputPath("places-32day-filter-320.png"),animations:"disabled"});
  await page.goBack();
  await expect(page).toHaveURL(/#places$/);
  await expect(page.locator("[data-places-select]")).toHaveValue("all");
  await page.goForward();
  await expect(page.locator("[data-places-select]")).toHaveValue("2026-10-12");
  await page.reload();
  await expect(page.locator("[data-places-select]")).toHaveValue("2026-10-12");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test("ambiguous #109 Place ID remains fail-closed after Back/Forward",async({page})=>{
  const invalid=structuredClone(trip);
  invalid.days[1].items[0].id="d1-shibuya";
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(invalid)}));
  await page.goto("/#places");
  await page.locator('[data-places-date="2026-10-04"]').click();
  await page.goto("/#places/item/d1-shibuya");
  await expect(page.locator(".places-identity-warning")).toBeVisible();
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await page.goBack();
  await expect(page.locator(".places-card")).toHaveCount(2);
  await page.goForward();
  await expect(page.locator(".places-identity-warning")).toBeVisible();
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
});

for(const width of [320,390,1100]){
  test("Places date route responsive and stable at "+width,async({page},testInfo)=>{
    await page.setViewportSize({width,height:width===1100?900:844});
    await page.goto("/?previewStyle=vintage-watercolor#places/day/2026-10-04");
    await expect(page.locator(".places-card")).toHaveCount(2);
    await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
    await expect(page.locator('[data-places-date="2026-10-04"]')).toHaveAttribute("aria-pressed","true");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:testInfo.outputPath("places-deeplink-"+width+".png"),animations:"disabled"});
    await page.reload();
    await expect(page.locator(".places-card")).toHaveCount(2);
  });
}

test("device-local day filter remains available on an offline PWA reload",async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,serviceWorkers:"allow"});
  try {
    const page=await context.newPage();
    await page.goto("/#places");
    await page.waitForFunction(()=>!!navigator.serviceWorker?.controller,null,{timeout:15000});
    await page.locator('[data-places-date="2026-10-04"]').click();
    await expect(page.locator(".places-card")).toHaveCount(2);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator(".places-card")).toHaveCount(2);
    await expect(page).toHaveURL(/#places\/day\/2026-10-04$/);
  } finally {await context.setOffline(false);await context.close();}
});

test("Trip-to-Places detail creates a usable native Back entry",async({page})=>{
  await page.goto("/#trip/day/2026-10-04");
  await expect(page.locator('[data-open-place="d2-sensoji"]')).toBeVisible();
  await page.locator('[data-open-place="d2-sensoji"]').click();
  await expect(page).toHaveURL(/#places\/item\/d2-sensoji$/);
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
  await page.goBack();
  await expect(page).toHaveURL(/#trip\/day\/2026-10-04$/);
  await expect(page.locator(".trip-day-view")).toContainText("Asakusa");
  await page.goForward();
  await expect(page.locator(".places-detail-heading")).toContainText("Senso-ji");
});

test("date filter is keyed by trip.id and never leaks to an unrelated trip",async({page})=>{
  await page.goto("/#places");
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page.locator(".places-card")).toHaveCount(2);
  const other=structuredClone(trip);
  other.trip.id="separate-trip-with-same-dates";
  await page.route("**/trip.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(other)}));
  await page.goto("/#places");
  await expect(page.locator('[data-places-date="2026-10-04"]')).toHaveAttribute("aria-pressed","false");
  await expect(page.locator(".places-card")).toHaveCount(3);
  expect(await page.evaluate(async()=>await TravelLiteStorage.get("separate-trip-with-same-dates:places:date"))).toBe(null);
});

test("malformed Places date hash fails to a stable All days route",async({page})=>{
  await page.goto("/#places/day/%E0%A4%A");
  await expect(page.locator(".places-card")).toHaveCount(3);
  await expect(page).toHaveURL(/#places$/);
  await page.locator('[data-places-date="2026-10-04"]').click();
  await expect(page.locator(".places-card")).toHaveCount(2);
});
