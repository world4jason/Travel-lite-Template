import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const sample = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
test.use({ viewport: { width: 390, height: 844 }, locale: "en-US" });

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
});
const ready = async (page, pack) => {
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", pack);
  await expect(page.locator("#trip-title")).toHaveText("Tokyo Autumn");
  const names = pack === "candy" ? ["storybook-style", "candy-style"]
    : pack === "storybook" ? ["storybook-style"] : ["risograph-style"];
  for (const name of names) {
    await expect.poll(() => page.locator("#" + name).evaluate(el => !el.disabled && Boolean(el.sheet))).toBe(true);
  }
};
async function withTrip(page, changes) {
  const data = structuredClone(sample);
  changes(data);
  await page.route("**/trip.json", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) }));
  return data;
}

test("Candy is a true five-fill sticker style with editable labels and semantic timeline", async ({ page }) => {
  await withTrip(page, data => {
    data.days[0].illustration = "city";
    data.days[0].items[0].transportMode = "flight";
    data.days[0].items[0].mustGo = true;
    data.days[0].items[2].start = "TBD";
  });
  await page.goto("/?previewStyle=candy#trip/overview");
  await ready(page, "candy");
  const style = await page.locator(".trip-overview-hero").evaluate(node => ({
    bg: getComputedStyle(document.body).backgroundColor,
    hero: getComputedStyle(node).backgroundColor,
    art: getComputedStyle(node, "::after").backgroundImage,
    radius: getComputedStyle(node).borderRadius,
    font: getComputedStyle(node).fontFamily,
    selected: state.visualStyle,
    source: state.data.ui.visualStyle,
  }));
  expect(style.bg).toBe("rgb(255, 249, 239)");
  expect(style.hero).toBe("rgb(255, 229, 165)");
  expect(style.art).toContain("assets/candy/hero.svg");
  expect(parseInt(style.radius)).toBeGreaterThanOrEqual(30);
  expect(style.font).toContain("Huninn");
  expect(style.source).toBe("editorial");
  await expect(page.locator("#quick-theme-toggle")).toBeHidden();
  await page.screenshot({ path: "/tmp/tlt-phase2-candy-overview.png", fullPage: true });
  await page.locator(".trip-overview-day").first().click();
  await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
  await expect(page.locator(".transport-tag--flight")).toContainText("Flight");
  await expect(page.locator(".must-go-tag")).toHaveCount(1);
  await expect(page.locator(".timeline-time--floating")).toHaveCount(1);
  const img=await page.locator(".trip-v2-item[data-storybook-kind='plane'] .timeline-content")
    .evaluate(node => getComputedStyle(node,"::after").backgroundImage);
  expect(img).toContain("/assets/candy/plane.svg");
  await page.screenshot({ path: "/tmp/tlt-phase2-candy-day.png", fullPage: true });
});

test("Risograph has a distinct editorial print composition, halftone assets and static motion", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/?previewStyle=risograph#trip/overview");
  await ready(page,"risograph");
  await expect(page.locator("#storybook-style")).toHaveJSProperty("disabled",true);
  await expect(page.locator("#candy-style")).toHaveJSProperty("disabled",true);
  await expect(page.locator("#storybook-font")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme","light");
  const visual=await page.locator(".trip-overview-hero").evaluate(node=>({
    bg: getComputedStyle(document.body).backgroundColor,
    font: getComputedStyle(node.querySelector("h2")).fontFamily,
    radius: getComputedStyle(node).borderRadius,
    border: getComputedStyle(node).borderTopStyle,
    art: getComputedStyle(node,"::after").backgroundImage,
    grain: getComputedStyle(document.body,"::before").backgroundImage,
    animation: getComputedStyle(node,"::after").animationName,
  }));
  expect(visual.bg).toBe("rgb(247, 241, 228)");
  expect(visual.font).toMatch(/Georgia|serif/);
  expect(parseInt(visual.radius)).toBeLessThanOrEqual(3);
  expect(visual.art).toContain("/assets/risograph/hero.svg");
  expect(visual.grain).toContain("/assets/risograph/grain.svg");
  expect(visual.animation).toBe("none");
  await page.screenshot({ path: "/tmp/tlt-phase2-risograph-overview.png", fullPage: true });
  await page.locator(".trip-overview-day").first().click();
  await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
  await page.screenshot({ path: "/tmp/tlt-phase2-risograph-day.png", fullPage: true });
  await page.locator(".bottom-nav [data-view='more']").click();
  await expect(page.locator("[data-motion-choice]")).toHaveCount(0);
  await expect(page.locator(".settings-card")).toContainText("Static print-inspired");
});

test("Candy supports reduced-motion by OS and an editable per-trip preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?previewStyle=candy#trip/overview");
  await ready(page,"candy");
  const reduced=await page.locator(".trip-overview-hero").evaluate(x=>getComputedStyle(x,"::after").animationName);
  expect(reduced).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(()=>page.locator(".trip-overview-hero")
    .evaluate(x=>getComputedStyle(x,"::after").animationName)).toContain("storybook-float");
  await page.locator(".bottom-nav [data-view='more']").click();
  await page.locator("[data-motion-choice='reduce']").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion","reduce");
  await page.reload({waitUntil:"domcontentloaded"});
  await ready(page,"candy");
  await expect(page.locator("html")).toHaveAttribute("data-motion","reduce");
});

test("only registered style IDs can load; existing Editorial and Storybook stay isolated", async ({ page }) => {
  await page.goto("/?previewStyle=https://bad.invalid/style.css#trip/overview");
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","editorial");
  for(const id of ["storybook-style","candy-style","risograph-style"]){
    await expect(page.locator("#"+id)).toHaveJSProperty("disabled",true);
  }
  await page.goto("/?previewStyle=storybook#trip/overview");
  await ready(page,"storybook");
  await expect(page.locator("#candy-style")).toHaveJSProperty("disabled",true);
  await expect(page.locator("#risograph-style")).toHaveJSProperty("disabled",true);
  await expect(page.locator(".trip-overview-hero")).toBeVisible();
});

test("Candy and Risograph preserve all five views, 320–1600px responsive layout and deep-linked day", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**",route=>route.abort());
  await page.route("https://api.open-meteo.com/**",route=>route.abort());
  await page.route("https://tiles.openfreemap.org/**",route=>route.abort());
  for(const pack of ["candy","risograph"]){
    await page.goto("/?previewStyle="+pack+"#trip/overview");
    await ready(page,pack);
    for(const width of [320,390,820,1100,1600]){
      await page.setViewportSize({width,height:width>=900?900:width<=320?568:844});
      for(const [view,selector] of [
        ["now","#view-root :is(.view-stack,.empty-state)"],
        ["trip","#view-root .trip-v2"],
        ["map","#view-root .runtime-map-panel"],
        ["check","#view-root .check-group"],
        ["more","#view-root .settings-card"]]){
        await page.locator(".bottom-nav [data-view='"+view+"']").click();
        await expect(page.locator(selector).first(),pack+" "+view+" "+width).toBeVisible();
        const measured=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
        expect(measured.scroll,pack+" "+view+" "+width).toBeLessThanOrEqual(measured.width+2);
      }
    }
    await page.goto("/?previewStyle="+pack+"#trip/day/2026-10-04");
    await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(3);
  }
});

test.describe("both prototype packs offline", () => {
  test.use({ serviceWorkers: "allow" });
  for(const pack of ["candy","risograph"]){
    test(pack+" cached assets and itinerary survive an offline reload",async ({page,context})=>{
      await page.goto("/?previewStyle="+pack+"#trip/overview");
      await ready(page,pack);
      await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller),null,{timeout:12000});
      const assets=pack==="candy"?
        ["./candy-theme.css","./assets/candy/hero.svg","./assets/candy/train.svg"]:
        ["./risograph-theme.css","./assets/risograph/hero.svg","./assets/risograph/grain.svg"];
      const checks=await page.evaluate(async paths=>Promise.all(paths.map(async p=>Boolean(await caches.match(new URL(p,location.href).href)))),assets);
      expect(checks).toEqual(assets.map(()=>true));
      await context.setOffline(true);
      await page.reload({waitUntil:"domcontentloaded"});
      await ready(page,pack);
      await expect(page.locator(".trip-overview-day")).toHaveCount(3);
    });
  }
});

test("a 15-day trip keeps long-trip date navigation usable in both new styles", async ({ page }) => {
  await withTrip(page, data => {
    data.ui.defaultView = "trip";
    data.days = Array.from({length:15}, (_,n) => {
      const day=structuredClone(sample.days[0]);
      day.date=new Date(Date.UTC(2026,9,3+n)).toISOString().slice(0,10);
      day.id="day"+(n+1);
      day.label="Day "+(n+1);
      day.title="City stops, day "+(n+1);
      day.items=day.items.map(item=>({...item,id:day.id+"-"+item.id}));
      return day;
    });
    data.trip.endDate=data.days.at(-1).date;
  });
  await page.setViewportSize({width:320,height:568});
  for(const pack of ["candy","risograph"]){
    await page.goto("/?previewStyle="+pack+"#trip/day/2026-10-12");
    await ready(page,pack);
    await expect(page.locator("[data-long-trip-select]")).toHaveValue("2026-10-12");
    await expect(page.locator("ol.trip-v2-timeline > li")).toHaveCount(4);
    await page.locator("[data-long-trip-next]").click();
    await expect(page.locator("[data-long-trip-select]")).toHaveValue("2026-10-13");
    const width=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(322);
  }
});

test("style previews do not mutate private checklist state or the shared trip", async ({ page }) => {
  await page.goto("/?previewStyle=candy#check");
  await ready(page,"candy");
  const checks=page.locator("input[data-check-key]");
  await expect(checks.first()).toBeAttached();
  await page.locator("label:has(input[data-check-key])").first().click();
  await expect(checks.first()).toBeChecked();
  await page.waitForFunction(async () =>
    Object.values((await TravelLiteStorage.get("sample-tokyo-2026:checks")) || {}).includes(true)
  );
  await page.goto("/?previewStyle=risograph#check");
  await ready(page,"risograph");
  await expect(page.locator("input[data-check-key]").first()).toBeChecked();
  await page.goto("/#check");
  await expect(page.locator("html")).toHaveAttribute("data-visual-style","editorial");
  await expect(page.locator("input[data-check-key]").first()).toBeChecked();
  await expect.poll(()=>page.evaluate(()=>state.data.ui.visualStyle)).toBe("editorial");
});
