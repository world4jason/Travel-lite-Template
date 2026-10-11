import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const sample=JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));
const styleMap={
 "quiet-linocut":"rgb(244, 237, 221)",
 "doodle-memory-grid":"rgb(251, 246, 234)",
 "crayon-journal":"rgb(250, 242, 230)",
 "painterly-editorial":"rgb(244, 247, 241)",
 "geometric-print":"rgb(245, 240, 229)",
 "quiet-acrylic":"rgb(252, 250, 243)"
};
const all=Object.keys(styleMap);
const navigate=async(page,id,route="trip/overview")=>{
 await page.goto("/?previewStyle="+id+"#"+route,{waitUntil:"domcontentloaded"});
 await expect(page.locator("html")).toHaveAttribute("data-visual-style",id);
 await expect.poll(()=>page.locator("#"+id+"-style")
   .evaluate(x=>!x.disabled && Boolean(x.sheet))).toBe(true);
};
test.use({viewport:{width:390,height:844}});
test.beforeEach(async({page})=>{
 await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
 await page.route("https://fonts.gstatic.com/**",r=>r.abort());
});
for(const [id,color] of Object.entries(styleMap)){
 test("new Style Pack "+id+" uses original art and preserved trip facts",async({page})=>{
  await navigate(page,id);
  await expect(page.locator("#trip-title")).toHaveText("Tokyo Autumn");
  await expect(page.locator(".trip-overview-day")).toHaveCount(3);
  const actual=await page.locator(".trip-overview-hero").evaluate(el=>({
    bg:getComputedStyle(document.body).backgroundColor,
    image:getComputedStyle(el,"::after").backgroundImage,
    width:document.documentElement.scrollWidth,
    style:state.data.ui.visualStyle
  }));
  expect(actual.bg).toBe(color);
  expect(actual.image).toContain("assets/"+id+"/hero.svg");
  expect(actual.width).toBeLessThanOrEqual(392);
  expect(actual.style).toBe("editorial");
  await page.locator(".trip-overview-day").first().click();
  await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
  const marker=await page.locator(".day-summary").evaluate(el=>
    getComputedStyle(el,"::after").backgroundImage);
  expect(marker).toContain("assets/"+id+"/marker.svg");
  await page.locator(".bottom-nav [data-view='more']").click();
  await expect(page.locator(".style-option")).toHaveCount(15);
  await expect(page.locator('[data-style-choice="'+id+'"]')).toHaveAttribute("aria-pressed","true");
 });
}
test("fifteen styles available without extra duplicate Riso entries",async({page})=>{
 await page.goto("/#more");
 await page.locator(".style-option").first().waitFor();
 const ids=await page.locator("[data-style-choice]").evaluateAll(nodes=>nodes.map(x=>x.dataset.styleChoice));
 expect(ids.length).toBe(15);
 expect(new Set(ids).size).toBe(15);
 expect(ids).toEqual(expect.arrayContaining(all));
 expect(ids.filter(x=>x==="risograph")).toHaveLength(1);
 expect(ids).not.toContain("riso-editorial");
 expect(ids).not.toContain("vintage-zine-duplicate");
});
test("crayon journal respects OS motion and device setting; other new styles stay static",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});
 await navigate(page,"crayon-journal");
 await expect.poll(()=>page.locator(".trip-overview-hero")
 .evaluate(el=>getComputedStyle(el,"::after").animationName)).toBe("none");
 await page.emulateMedia({reducedMotion:"no-preference"});
 await expect.poll(()=>page.locator(".trip-overview-hero")
 .evaluate(el=>getComputedStyle(el,"::after").animationName)).toContain("crayon-drift");
 await page.locator(".bottom-nav [data-view='more']").click();
 await page.locator('[data-motion-choice="reduce"]').click();
 await expect(page.locator("html")).toHaveAttribute("data-motion","reduce");
 await expect.poll(()=>page.locator(".style-option[data-style-choice='crayon-journal']")
 .getAttribute("aria-pressed")).toBe("true");
 for(const id of ["quiet-linocut","geometric-print","painterly-editorial"]){
   await page.locator('[data-style-choice="'+id+'"]').click();
   await expect(page.locator("[data-motion-choice]")).toHaveCount(0);
 }
});
test("new prompt copy cannot invent magazine captions, coordinates or exact city claims",async({page})=>{
 for(const id of all){
   await navigate(page,id);
   const visible=await page.locator("#view-root").innerText();
   for(const forbidden of ["Gathered Scenes","Zine v1.3","MR.PARROT","NO.07","RAISE & ROAR","SEA BREEZE","NO.03"]){
    expect(visible,id+" introduced "+forbidden).not.toContain(forbidden);
   }
   const actual=await page.evaluate(()=>JSON.stringify(state.data.days));
   expect(JSON.parse(actual).length).toBe(sample.days.length);
 }
});
test("all six new packs keep all five views and no sideways overflow from 320 to 1600",async({page})=>{
 await page.route("https://api.open-meteo.com/**",r=>r.abort());
 await page.route("https://cdn.jsdelivr.net/**",r=>r.abort());
 await page.route("https://tiles.openfreemap.org/**",r=>r.abort());
 for(const id of all){
   await navigate(page,id);
   for(const width of [320,390,820,1600]){
     await page.setViewportSize({width,height:width<=320?568:width<900?844:900});
     for(const [view,sel] of [
      ["now","#view-root :is(.view-stack,.empty-state)"],
      ["trip","#view-root .trip-v2"],
      ["map","#view-root .runtime-map-panel"],
      ["check","#view-root .check-group"],
      ["more","#view-root .style-settings"]]){
       await page.locator('.bottom-nav [data-view="'+view+'"]').click();
       await expect(page.locator(sel).first(),id+" "+view+" "+width).toBeVisible();
       const widths=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
       expect(widths.doc,id+" "+view+" "+width).toBeLessThanOrEqual(widths.viewport+2);
     }
   }
 }
});
test.describe("second prompt pack offline cache",()=>{
 test.use({serviceWorkers:"allow"});
 test("six CSS and six heroes are precached and retain preference offline",async({page,context})=>{
   await page.goto("/#more");
   await page.locator(".style-option").first().waitFor();
   await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:15000});
   const paths=all.flatMap(id=>["./"+id+"-theme.css","./assets/"+id+"/hero.svg"]);
   const cache=await page.evaluate(async paths=>Promise.all(paths.map(async p=>
      Boolean(await caches.match(new URL(p,location.href).href)))),paths);
   expect(cache).toEqual(paths.map(()=>true));
   await page.locator('[data-style-choice="quiet-acrylic"]').click();
   await expect.poll(()=>page.evaluate(()=>
     TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("quiet-acrylic");
   await context.setOffline(true);
   await page.reload({waitUntil:"domcontentloaded"});
   await expect(page.locator("html")).toHaveAttribute("data-visual-style","quiet-acrylic");
   await expect(page.locator(".style-option")).toHaveCount(15);
 });
});
