/* Rendered-geometry acceptance. Static CSS lint is never treated as a visual pass.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {test,expect} from "@playwright/test";
const looks=["editorial","storybook","candy","risograph","paper-collage",
  "naive-city","taiwan-poster","field-stamp","quiet-linocut",
  "doodle-memory-grid","crayon-journal","painterly-editorial",
  "geometric-print","quiet-acrylic","vintage-watercolor"];

test.beforeEach(async({page})=>{
  await page.route("https://fonts.googleapis.com/**",route=>route.fulfill({
    status:200,contentType:"text/css",body:""
  }));
  await page.route("https://fonts.gstatic.com/**",route=>route.abort());
  await page.route("https://api.open-meteo.com/**",route=>route.abort());
  await page.route("https://archive-api.open-meteo.com/**",route=>route.abort());
});
async function openOverview(page,style,width,zoom=100) {
  await page.setViewportSize({width,height:900});
  await page.goto("/?previewStyle="+style+"#trip/overview");
  await expect(page.locator(".trip-highlight-card").first()).toBeVisible();
  if(zoom!==100)
    await page.evaluate(z=>document.documentElement.style.fontSize=z+"%",zoom);
}
async function insetViolations(page) {
  return await page.locator(".trip-highlight-card, .trip-overview-day, .trip-open-decision")
    .evaluateAll(cards=>cards.filter(el=>el.getClientRects().length).flatMap(el=>{
      const outer=el.getBoundingClientRect(),style=getComputedStyle(el);
      const leftBorder=parseFloat(style.borderLeftWidth)||0;
      const rightBorder=parseFloat(style.borderRightWidth)||0;
      if(leftBorder<.5&&rightBorder<.5)return []; // open editorial divider row
      return [...el.querySelectorAll("h3,p,.trip-highlight-meta,.trip-overview-day-meta,.trip-open-decision > strong")]
        .filter(node=>node.getClientRects().length).flatMap(node=>{
          const b=node.getBoundingClientRect();
          const left=b.left-outer.left-leftBorder;
          const right=outer.right-rightBorder-b.right;
          const err=Math.min(left,right)<11.5 ||
            b.right>outer.right+1 || b.left<outer.left-1;
          return err?[{card:el.className,text:(node.textContent||"").trim().slice(0,65),
            left:Math.round(left*10)/10,right:Math.round(right*10)/10}]:[];
        });
    }));
}
test("every visual look preserves framed card text insets on mobile",async({page})=>{
  for(const style of looks){
    await page.emulateMedia({colorScheme:"light"});
    await openOverview(page,style,390);
    expect(await insetViolations(page),style+" bordered text inset").toEqual([]);
  }
  await page.emulateMedia({colorScheme:"dark"});
  await openOverview(page,"editorial",390);
  expect(await insetViolations(page),"editorial dark bordered text inset").toEqual([]);
});
test("320/1100px + 200 percent text still reflows framed Storybook cards",async({page})=>{
  for(const style of ["storybook","editorial"]){
    for(const width of [320,1100]){
      await openOverview(page,style,width);
      expect(await insetViolations(page),style+" "+width+"px").toEqual([]);
    }
    await openOverview(page,style,390,200);
    expect(await insetViolations(page),style+" 200% text").toEqual([]);
  }
});
test("geometry guard is not a no-op: clipped framed text must be rejected",async({page})=>{
  await openOverview(page,"storybook",390);
  await page.addStyleTag({content:":root[data-visual-style='storybook'] .trip-highlight-card{padding-left:0!important}"});
  expect((await insetViolations(page)).length).toBeGreaterThan(0);
});
test("map, metro and train symbols are true distinguishable SVGs",async({page})=>{
  await openOverview(page,"storybook",390);
  const info=await page.evaluate(()=>{
    const icon=window.TravelLiteIcons;
    return {metro:icon.svg("subway"),train:icon.svg("train"),
      map:icon.svg("map-pin"),
      cards:document.querySelectorAll(".trip-highlight-icon svg").length,
      nav:document.querySelector("#bottom-nav")?.innerHTML||""};
  });
  expect(info.train).toContain("tl-ui-icon--train");
  expect(info.metro).toContain("tl-ui-icon--subway");
  expect(info.train).not.toBe(info.metro);
  expect(info.map).toContain("tl-ui-icon--map-pin");
  expect(info.cards).toBeGreaterThan(0);
  expect(info.nav).toContain("tl-ui-icon--map-pin");
});
