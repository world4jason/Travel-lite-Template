import { test, expect } from "@playwright/test";
const packs={
  "paper-collage":{css:"paper-collage-style",color:"rgb(250, 243, 228)",asset:"paper-collage/hero.svg"},
  "naive-city":{css:"naive-city-style",color:"rgb(250, 245, 233)",asset:"naive-city/hero.svg"},
  "taiwan-poster":{css:"taiwan-poster-style",color:"rgb(245, 231, 196)",asset:"taiwan-poster/hero.svg"},
  "field-stamp":{css:"field-stamp-style",color:"rgb(247, 240, 227)",asset:"field-stamp/hero.svg"},
};
const all=["editorial-light","editorial-dark","storybook","candy",
  "paper-collage","naive-city","risograph","taiwan-poster","field-stamp"];
test.use({viewport:{width:390,height:844},locale:"en-US"});
test.beforeEach(async({page})=>{
  await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
});

for(const [pack,spec] of Object.entries(packs)){
  test("extracted pack "+pack+" shows a distinct real SVG/CSS composition",async({page})=>{
    await page.goto("/?previewStyle="+pack+"#trip/overview",{waitUntil:"domcontentloaded"});
    await expect(page.locator("html")).toHaveAttribute("data-visual-style",pack);
    await expect(page.locator(".trip-overview-day")).toHaveCount(3);
    await expect.poll(()=>page.locator("#"+spec.css)
      .evaluate(el=>!el.disabled && Boolean(el.sheet))).toBe(true);
    const visual=await page.evaluate(()=>({
      bg:getComputedStyle(document.body).backgroundColor,
      art:getComputedStyle(document.querySelector(".trip-overview-hero"),"::after").backgroundImage,
      title:document.querySelector("#trip-title")?.textContent,
      nine:document.querySelectorAll(".style-option").length,
    }));
    expect(visual.bg).toBe(spec.color);
    expect(visual.art).toContain(spec.asset);
    expect(visual.title).toBe("Tokyo Autumn");
    const currentActive=await page.evaluate(()=>Object.fromEntries(
      ["storybook-style","candy-style","risograph-style","paper-collage-style",
      "naive-city-style","taiwan-poster-style","field-stamp-style"]
        .map(id=>[id,!document.getElementById(id).disabled])));
    for(const [id,active] of Object.entries(currentActive))
      expect(active,id).toBe(id===spec.css || (["paper-collage","naive-city","taiwan-poster","field-stamp"].includes(pack)
        && id==="storybook-style"));
    await page.locator(".trip-overview-day").first().click();
    await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
    await page.locator(".bottom-nav [data-view='more']").click();
    await expect(page.locator(".style-option")).toHaveCount(9);
    await expect(page.locator('[data-style-choice="'+pack+'"]')).toHaveAttribute("aria-pressed","true");
  });
}

test("nine choices include two Editorial color modes and seven independent packs",async({page})=>{
 await page.goto("/#more");
 await expect(page.locator(".style-option")).toHaveCount(9);
 for(const id of all)await expect(page.locator('[data-style-choice="'+id+'"]')).toHaveCount(1);
 await page.locator('[data-style-choice="editorial-dark"]').click();
 await expect(page.locator("html")).toHaveAttribute("data-visual-style","editorial");
 await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
 await expect(page.locator('[data-style-choice="editorial-dark"]')).toHaveAttribute("aria-pressed","true");
 await page.locator('[data-style-choice="editorial-light"]').click();
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
 await page.locator('[data-style-choice="taiwan-poster"]').click();
 await expect(page.locator("html")).toHaveAttribute("data-visual-style","taiwan-poster");
 await expect(page.locator("html")).toHaveAttribute("data-theme","light");
 await page.locator("[data-style-reset]").click();
 await expect(page.locator("html")).toHaveAttribute("data-visual-style","editorial");
 await expect(page.locator("html")).toHaveAttribute("data-theme","system");
 await expect(page.locator("[data-style-reset]")).toHaveAttribute("aria-pressed","true");
});

test("four new packs fit five functional views at 320/390/820/1600px",async({page})=>{
 await page.route("https://api.open-meteo.com/**",r=>r.abort());
 await page.route("https://cdn.jsdelivr.net/**",r=>r.abort());
 await page.route("https://tiles.openfreemap.org/**",r=>r.abort());
 for(const pack of Object.keys(packs)){
   await page.goto("/?previewStyle="+pack+"#trip/overview");
   for(const width of [320,390,820,1600]){
     await page.setViewportSize({width,height:width===320?568:width<900?844:900});
     for(const [view,selector] of [
        ["now","#view-root :is(.view-stack,.empty-state)"],
        ["trip","#view-root .trip-v2"],
        ["map","#view-root .runtime-map-panel"],
        ["check","#view-root .check-group"],
        ["more","#view-root .style-settings"]]){
       await page.locator('.bottom-nav [data-view="'+view+'"]').click();
       await expect(page.locator(selector).first()).toBeVisible();
       const bounds=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
       expect(bounds[0],pack+" "+view+" "+width+" overflows").toBeLessThanOrEqual(bounds[1]+2);
     }
   }
 }
});

test("reduced-motion disables paper and sketch floating animations",async({page})=>{
 for(const pack of ["paper-collage","naive-city"]){
   await page.emulateMedia({reducedMotion:"reduce"});
   await page.goto("/?previewStyle="+pack+"#trip/overview");
   await page.locator(".trip-overview-hero").waitFor();
   await expect.poll(()=>page.locator(".trip-overview-hero")
     .evaluate(el=>getComputedStyle(el,"::after").animationName)).toBe("none");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await expect.poll(()=>page.locator(".trip-overview-hero")
     .evaluate(el=>getComputedStyle(el,"::after").animationName)).not.toBe("none");
 }
});

test("no fixed postcard author, year or invented city tagline pollutes the trip",async({page})=>{
 for(const pack of Object.keys(packs)){
   await page.goto("/?previewStyle="+pack+"#trip/overview");
   await page.locator(".trip-overview-hero").waitFor();
   const content=await page.locator("#view-root").innerText();
   expect(content).not.toContain("MR.PARROT");
   expect(content).not.toContain("TAIWAN TRAVEL STUDIES");
   expect(content).not.toContain("No.01");
   await expect(page.locator("#trip-title")).toHaveText("Tokyo Autumn");
 }
});

test.describe("style assets available offline",()=>{
 test.use({serviceWorkers:"allow"});
 test("the four new stylesheet + hero assets are precached",async({page,context})=>{
   await page.goto("/#more");
   await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:12000});
   const paths=Object.entries(packs).flatMap(([id,info])=>
      ["./"+id+"-theme.css","./assets/"+info.asset]);
   const cached=await page.evaluate(async paths=>
      Promise.all(paths.map(async path=>Boolean(await caches.match(new URL(path,location.href).href)))),paths);
   expect(cached).toEqual(paths.map(()=>true));
   await page.locator('[data-style-choice="taiwan-poster"]').click();
   await expect.poll(()=>page.evaluate(() =>
     TravelLiteStorage.get("sample-tokyo-2026:visualStyle"))).toBe("taiwan-poster");
   await context.setOffline(true);
   await page.reload({waitUntil:"domcontentloaded"});
   await expect(page.locator("html")).toHaveAttribute("data-visual-style","taiwan-poster");
   await expect(page.locator(".style-option")).toHaveCount(9);
 });
});
