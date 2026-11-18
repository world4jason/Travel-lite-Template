/* End-to-end source grouping, directions and desktop text/overflow tests.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
const base=JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));
const sample=structuredClone(base);
const day=sample.days[0];
day.items=[
 {id:"fixture-p0",type:"place",title:"參觀行程",start:"09:00",end:"10:00"},
 {id:"fixture-l1",type:"transport",transportMode:"walk",title:"大阪天滿宮附近商業街 → 南森町站",start:"10:00",end:"10:10"},
 {id:"fixture-l2",type:"transport",transportMode:"subway",title:"谷町線：南森町 → 谷町四丁目",start:"10:10",end:"10:20"},
 {id:"fixture-l3",type:"transport",transportMode:"train",title:"中央線：谷町四丁目 → 生駒站",start:"10:20",end:"10:50"},
 {id:"fixture-l4",type:"transport",transportMode:"walk",title:"生駒站 → 近鐵生駒纜車鳥居前站",start:"10:50",end:"11:10"},
 {id:"fixture-p1",type:"place",title:"參拜寶山寺",start:"11:10",end:"12:00"}
];
day.routeSummary=["大阪天滿宮附近商業街","南森町站","鳥居前站","參拜寶山寺"];
const date=day.date;

test.beforeEach(async({page})=>{
  await page.route("**/trip.json",route=>route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify(sample)
  }));
  await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({
    status:200,contentType:"text/css",body:""
  }));
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://tiles.openfreemap.org/**",r=>r.abort());
  await page.route("https://api.open-meteo.com/**",r=>r.abort());
  await page.route("https://archive-api.open-meteo.com/**",r=>r.abort());
});
async function journeyPage(page,style="editorial"){
  await page.goto("/?previewStyle="+style+"#trip/day/"+date);
  await expect(page.locator(".trip-day-view")).toBeVisible();
  await expect(page.locator('.trip-v2-item[data-journey-group="true"]')).toHaveCount(1);
}
test("one A-to-B block, direct Google Maps URL, all transfer legs retained",async({page})=>{
  await journeyPage(page,"storybook");
  const card=page.locator('.trip-v2-item[data-journey-group="true"]');
  await expect(card.locator(".timeline-time--range")).toContainText("10:00");
  await expect(card.locator(".timeline-time--range")).toContainText("11:10");
  const url=new URL(await card.locator("a.trip-journey-directions").getAttribute("href"));
  expect(url.hostname).toBe("www.google.com");
  expect(url.pathname).toBe("/maps/dir/");
  expect(url.searchParams.get("origin")).toBe("大阪天滿宮附近商業街");
  expect(url.searchParams.get("destination")).toBe("近鐵生駒纜車鳥居前站");
  expect(url.searchParams.get("travelmode")).toBe("transit");
  await expect(card.locator(".trip-journey-details")).not.toHaveAttribute("open","");
  await card.locator(".trip-journey-details > summary").click();
  const ids=await card.locator("[data-timeline-leg-id]").evaluateAll(nodes=>nodes.map(x=>x.dataset.timelineLegId));
  expect(ids).toEqual(["fixture-l1","fixture-l2","fixture-l3","fixture-l4"]);
  await expect(card.locator(".tl-ui-icon--walk")).toHaveCount(2);
  await expect(card.locator(".tl-ui-icon--subway")).toHaveCount(1);
  await expect(card.locator(".tl-ui-icon--train")).toHaveCount(1);
});
async function geometry(page){
  return await page.evaluate(()=>{
    const viewport=window.innerWidth,docs=document.documentElement;
    const offenders=[...document.querySelectorAll(
      "#view-root,.trip-v2,.trip-day-view,.trip-v2-timeline,.trip-stop-wrap,.trip-v2-item,.timeline-content,.trip-journey-directions,.trip-journey-details,.trip-journey-leg,.runtime-map-panel,.map-heading,.tl-board,.tl-leg"
    )].filter(el=>el.getClientRects().length).flatMap(el=>{
      const b=el.getBoundingClientRect();
      return b.left<-1||b.right>viewport+1?[{name:el.className,left:b.left,right:b.right,viewport}]:[];
    });
    return {docOverflow:docs.scrollWidth>viewport+2?docs.scrollWidth-viewport:0,offenders};
  });
}
test("desktop Trip journey and Transport map panels do not clip at wide widths",async({page})=>{
  for(const width of [1024,1280,1440,1920]){
    await page.setViewportSize({width,height:900});
    await journeyPage(page,"storybook");
    await page.locator(".trip-journey-details > summary").click();
    expect(await geometry(page),"Trip width "+width).toEqual({docOverflow:0,offenders:[]});
    await page.goto("/?previewStyle=storybook#map/day/"+date);
    await expect(page.locator(".runtime-map-panel")).toBeVisible();
    const g=await geometry(page);
    expect(g.docOverflow,"Transport width "+width).toBe(0);
    expect(g.offenders,"Transport width "+width).toEqual([]);
  }
});
test("long station names reflow at 200% text rather than being silently clipped",async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await journeyPage(page,"storybook");
  await page.locator(".trip-journey-details > summary").click();
  await page.evaluate(()=>{document.documentElement.style.fontSize="200%";});
  const g=await geometry(page);
  expect(g.docOverflow).toBe(0);
  expect(g.offenders).toEqual([]);
});
