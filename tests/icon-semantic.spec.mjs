/* Manual Playwright visual/geometry gate. Never scheduled with GitHub Actions.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {test,expect} from "@playwright/test";
const styles=["editorial","storybook","candy","risograph","paper-collage","naive-city",
  "taiwan-poster","field-stamp","quiet-linocut","doodle-memory-grid","crayon-journal",
  "painterly-editorial","geometric-print","quiet-acrylic","vintage-watercolor"];

test("functional UI icons remain recognizable across 15 appearances",async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tools/icon-review.html");
  await expect(page.locator(".icon-proof-tile")).toHaveCount(21);
  for(const style of styles){
    await page.locator("#theme").selectOption(style);
    await expect(page.locator("html")).toHaveAttribute("data-visual-style",style);
    const detail=await page.locator(".icon-proof-tile .tl-ui-icon").evaluateAll(svgs=>
      svgs.map(svg=>({w:svg.getBoundingClientRect().width,h:svg.getBoundingClientRect().height,
        visibility:getComputedStyle(svg).visibility,display:getComputedStyle(svg).display})));
    expect(detail.length).toBe(21);
    expect(detail.every(x=>x.w>=18&&x.h>=18&&x.visibility!=="hidden"&&x.display!=="none"),
      "One or more icons hidden at "+style).toBeTruthy();
    const keys=await page.locator(".icon-proof-tile .icon-proof-key").allTextContents();
    for(const required of ["map-pin","map","route","walk","train","subway","cable","bus"])
      expect(keys).toContain(required);
  }
});

test("map-pin, footprints, metro and funicular remain accessible at 200% text",async({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto("/tools/icon-review.html");
  await page.addStyleTag({content:"body, .icon-proof {font-size:200% !important;} "});
  for(const key of ["map-pin","walk","train","subway","cable"]){
    const tile=page.locator(".icon-proof-tile").filter({has:page.locator(".icon-proof-key", {hasText:key})}).first();
    await expect(tile).toBeVisible();
    await expect(tile.locator("svg")).toHaveAttribute("aria-hidden","true");
    await expect(tile.locator("svg")).toHaveAttribute("focusable","false");
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
