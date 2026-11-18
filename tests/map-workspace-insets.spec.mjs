/* Rendered Map Workspace contract: frame and text inset must travel together.
 * Screenshots and real browser geometry are required, not just CSS lint.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";

const data=JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));
const selectedDay=data.days[0].date;
const framed=[
  "storybook","candy","paper-collage","naive-city","taiwan-poster",
  "field-stamp","quiet-linocut","doodle-memory-grid","crayon-journal",
  "painterly-editorial","geometric-print","quiet-acrylic"
];
const open=["editorial","risograph","vintage-watercolor"];

test.beforeEach(async({page})=>{
  await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({
    status:200,contentType:"text/css",body:""
  }));
  await page.route("https://fonts.gstatic.com/**",r=>r.abort());
  await page.route("https://api.open-meteo.com/**",r=>r.abort());
  await page.route("https://archive-api.open-meteo.com/**",r=>r.abort());
  await page.route("https://tiles.openfreemap.org/**",r=>r.abort());
});
async function visit(page,style,width=1280,zoom=100,color="light"){
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({colorScheme:color});
  await page.goto("/?previewStyle="+style+"#map/day/"+selectedDay);
  const panel=page.locator('[data-surface-role="map-workspace"]');
  await expect(panel,style+" must render the real Transport workspace").toBeVisible();
  await expect(panel.locator(".map-heading h2")).toBeVisible();
  if(zoom!==100)
    await page.evaluate(percent=>{document.documentElement.style.fontSize=percent+"%";},zoom);
  return panel;
}
async function geometry(panel){
  return panel.evaluate(node=>{
    const frame=node.getBoundingClientRect(),style=getComputedStyle(node);
    const px=v=>Number.parseFloat(v)||0;
    const borderL=px(style.borderLeftWidth),borderR=px(style.borderRightWidth);
    const measured=[".map-heading .eyebrow",".map-heading h2",".map-heading-copy",
      ".map-heading .button-link",".place-chips"]
      .flatMap(selector=>{
        const el=node.querySelector(selector);
        if(!el||!el.getClientRects().length||getComputedStyle(el).display==="none")return [];
        const r=el.getBoundingClientRect();
        return [{selector,left:r.left-frame.left-borderL,
          right:frame.right-borderR-r.right,elementWidth:r.width}];
      });
    return {
      borderLeft:borderL,borderRight:borderR,paddingLeft:px(style.paddingLeft),
      paddingRight:px(style.paddingRight),paddingTop:px(style.paddingTop),
      paddingBottom:px(style.paddingBottom),measured,
      scrollOverflow:Math.max(0,node.scrollWidth-node.clientWidth)
    };
  });
}
function verifyFramed(g,description){
  expect(g.borderLeft,description+" must have a left border").toBeGreaterThan(0);
  expect(g.borderRight,description+" must have a right border").toBeGreaterThan(0);
  for(const side of ["paddingLeft","paddingRight","paddingTop","paddingBottom"])
    expect(g[side],description+" "+side).toBeGreaterThanOrEqual(12);
  for(const field of g.measured){
    expect(field.left,description+" "+field.selector+" left text inset").toBeGreaterThanOrEqual(11.5);
    expect(field.right,description+" "+field.selector+" right text inset").toBeGreaterThanOrEqual(11.5);
  }
  expect(g.scrollOverflow,description+" map workspace must not horizontally overflow").toBeLessThanOrEqual(2);
}
test("all 12 framed looks have real border + inset; 3 intentionally open styles stay open",async({page})=>{
  test.setTimeout(120000);
  for(const style of framed){
    const panel=await visit(page,style);
    verifyFramed(await geometry(panel),style);
  }
  for(const style of open){
    const panel=await visit(page,style);
    const g=await geometry(panel);
    expect(g.borderLeft,style+" must remain open").toBe(0);
    expect(g.paddingLeft,style+" must not add a fake frame inset").toBe(0);
  }
  const editorialDark=await visit(page,"editorial",1280,100,"dark");
  expect((await geometry(editorialDark)).borderLeft).toBe(0);
});
test("framed map headings, station chips reflow across mobile and desktop + 200% text",async({page})=>{
  test.setTimeout(120000);
  for(const style of ["candy","paper-collage","storybook"]){
    for(const width of [320,390,1024,1280,1440,1920]){
      const panel=await visit(page,style,width);
      verifyFramed(await geometry(panel),style+" "+width+"px");
    }
    const panel=await visit(page,style,1280,200);
    verifyFramed(await geometry(panel),style+" at 200% text");
  }
});
test("geometry check fails if a framed style accidentally reintroduces zero padding",async({page})=>{
  const panel=await visit(page,"candy",1280);
  verifyFramed(await geometry(panel),"before injected regression");
  await page.addStyleTag({content:
    ':root[data-visual-style="candy"] [data-surface-role="map-workspace"]{padding:0!important}'});
  const bad=await geometry(panel);
  expect(bad.paddingLeft).toBe(0);
  expect(bad.measured.some(x=>x.left<11.5)).toBe(true);
});
