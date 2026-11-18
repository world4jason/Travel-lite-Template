/* Rendered Storybook timeline width/quiet-copy regression. */
import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));
const day=data.days.find(d=>d.items?.some(x=>x.type==="transport"))?.date||data.days[0].date;
test.beforeEach(async({page})=>{
  await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://api.open-meteo.com/**",r=>r.abort());
  await page.route("https://archive-api.open-meteo.com/**",r=>r.abort());
  await page.route("https://tiles.openfreemap.org/**",r=>r.abort());
});
async function open(page,style,width,zoom=100){
  await page.setViewportSize({width,height:850});
  await page.goto("/?previewStyle="+style+"#trip/day/"+day);
  await expect(page.locator(".trip-v2-timeline .trip-v2-item").first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-visual-style",style);
  if(zoom!==100)await page.evaluate(percent=>document.documentElement.style.fontSize=percent+"%",zoom);
}
async function widthMetrics(page){
  return page.locator(".trip-v2-timeline .trip-v2-item").first().evaluate(el=>{
    const style=getComputedStyle(el);
    const card=el.getBoundingClientRect();
    const content=el.querySelector(".timeline-content").getBoundingClientRect();
    const t=el.querySelector(".timeline-time").getBoundingClientRect();
    const title=el.querySelector(".timeline-content h3").getBoundingClientRect();
    return {tracks:style.gridTemplateColumns.trim().split(/\s+/).length,
      ratio:content.width/card.width,card:card.width,
      timeAbove:t.bottom<=title.top+1,
      within:content.left>=card.left+10&&content.right<=card.right-10,
      overflow:document.documentElement.scrollWidth-innerWidth};
  });
}
test("storybook remains a full-width time-over-content card at phone and desktop-site widths",async({page})=>{
  test.setTimeout(120000);
  for(const width of [320,390,430,980,1100]){
    await open(page,"storybook",width);
    const result=await widthMetrics(page);
    expect(result.tracks,"storybook must have one grid track at "+width).toBe(1);
    expect(result.ratio,"card content squeezed into a narrow side track at "+width).toBeGreaterThan(.78);
    expect(result.within,"card content bounds at "+width).toBe(true);
    expect(result.timeAbove,"time above description at "+width).toBe(true);
    expect(result.overflow,"horizontal overflow at "+width).toBeLessThanOrEqual(2);
  }
});
test("200% text zoom and long labels remain readable without squeezed track",async({page})=>{
  await open(page,"storybook",390,200);
  const result=await widthMetrics(page);
  expect(result.tracks).toBe(1);
  expect(result.ratio).toBeGreaterThan(.78);
  expect(result.within).toBe(true);
  expect(result.overflow).toBeLessThanOrEqual(2);
});
test("timeline no longer explains itself or displays boilerplate day notes by default",async({page})=>{
  await open(page,"storybook",390);
  await expect(page.locator(".trip-timeline-heading p")).toHaveCount(0);
  await expect(page.locator(".trip-day-view > .day-summary > .day-note")).toHaveCount(0);
  const body=await page.locator(".trip-day-view").innerText();
  expect(body).not.toContain("依時間排列：");
  expect(body).not.toContain("依實走順序串起交通與遊覽");
});

test("repeat-only transport labels and duration notes are not shown twice",async({page})=>{
  const target=data.days.flatMap(day=>(day.items||[]).map(item=>({day,item})))
    .find(({item})=>item.type==="transport" && item.location===item.title &&
      /^約\\s*\\d{2}:\\d{2}[-–]\\d{2}:\\d{2}[｜|]/.test(item.note||""));
  if(!target)return; // Template demo may intentionally have no redundant source
  await page.setViewportSize({width:390,height:850});
  await page.goto("/?previewStyle=storybook#trip/day/"+target.day.date);
  const card=page.locator('[data-timeline-item-id="'+target.item.id+'"]');
  await expect(card).toBeVisible();
  await expect(card.locator(".trip-item-top > div:first-child > p")).toHaveCount(0);
  const note=await card.locator(".timeline-note").allTextContents();
  expect(note.some(text=>text.includes(target.item.start+"–"+target.item.end))).toBe(false);
});
