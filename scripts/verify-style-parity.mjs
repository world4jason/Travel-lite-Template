/* Cross-repo style acceptance: shared implementation hashes + real browser
 * computed-style parity, with distinct legitimate trip data.
 * MEGAN_LOCAL_REPO=... node scripts/verify-style-parity.mjs
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const template = fileURLToPath(new URL("../", import.meta.url));
const megan = process.env.MEGAN_LOCAL_REPO;
if (!megan) throw new Error("Supply MEGAN_LOCAL_REPO to compare two sites");
const target = resolve(megan);
const shared = ["app.js", "trip-view.js", "theme-shell.js", "storybook-decor.js",
 "style-settings.css", "storybook-theme.css", "candy-theme.css",
 "risograph-theme.css", "paper-collage-theme.css", "naive-city-theme.css",
 "taiwan-poster-theme.css", "field-stamp-theme.css"];
const digest = file => createHash("sha256").update(readFileSync(file)).digest("hex");
for (const name of shared)
  assert.equal(digest(join(template,name)),digest(join(target,name)),
    name+" shared implementation drifted");
const styles = ["storybook","candy","paper-collage","naive-city","risograph","taiwan-poster","field-stamp"];
const compareProps = () => {
  const css = getComputedStyle(document.documentElement);
  const hero = document.querySelector(".trip-overview-hero");
  const heroCss=getComputedStyle(hero);
  const day=document.querySelector(".trip-overview-day");
  const dayCss=getComputedStyle(day);
  return {
    style:document.documentElement.dataset.visualStyle,
    rootBg:css.getPropertyValue("--bg").trim(),
    surface:css.getPropertyValue("--surface").trim(),
    ink:css.getPropertyValue("--ink").trim(),
    text:css.getPropertyValue("--text").trim(),
    displayFont:css.getPropertyValue("--font-display").trim(),
    bodyBg:getComputedStyle(document.body).backgroundColor,
    heroBg:heroCss.backgroundColor,
    heroBorder:heroCss.borderTopWidth+" "+heroCss.borderTopStyle+" "+heroCss.borderTopColor,
    heroRadius:heroCss.borderTopLeftRadius,
    dayBg:dayCss.backgroundColor,
    dayBorder:dayCss.borderTopWidth+" "+dayCss.borderTopStyle+" "+dayCss.borderTopColor,
    dayRadius:dayCss.borderTopLeftRadius,
  };
};

const ports=[4862,4863];
const servers=[];
let browser;
try {
 for(const [index,repo] of [template,target].entries()) {
   const child=spawn(process.execPath,["tests/serve.mjs"],{
    cwd:repo,env:{...process.env,TRAVEL_LITE_TEST_PORT:String(ports[index])},stdio:"ignore"
   });
   servers.push(child);
 }
 for (const port of ports) {
   let ready=false;
   for(let i=0;i<80;i++){
     try{const res=await fetch("http://127.0.0.1:"+port+"/trip.json"); if(res.ok){ready=true;break;}}
     catch{}
     await new Promise(r=>setTimeout(r,110));
   }
   if(!ready)throw new Error("Cannot start parity test server on "+port);
 }
 browser=await chromium.launch({headless:true});
 for(const id of styles){
   const observations=[];
   for(const port of ports){
    const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block",locale:"zh-TW"});
    const page=await ctx.newPage();
    await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
    await page.route("https://fonts.gstatic.com/**",r=>r.abort());
    await page.goto("http://127.0.0.1:"+port+"/?previewStyle="+id+"#trip/overview",{waitUntil:"domcontentloaded"});
    await page.locator(".trip-overview-day").first().waitFor({timeout:12000});
    await page.waitForFunction(styleId=>document.documentElement.dataset.visualStyle===styleId
      && [...document.querySelectorAll("link[id$='-style']:not([disabled])")].every(x=>Boolean(x.sheet)),
      id,{timeout:12000});
    const row=await page.evaluate(compareProps);
    const dateCount=await page.locator(".trip-overview-day").count();
    assert.equal(row.style,id);
    assert.equal(dateCount,port===ports[0]?3:5);
    observations.push(row);
    await ctx.close();
   }
   assert.deepEqual(observations[1],observations[0],id+" CSS computed styles differ");
   console.log("PARITY_STYLE_PASS",id,observations[0].bodyBg);
 }
 // Editorial Light/Dark variants are aliases of the same shared Editorial pack.
 for(const style of ["editorial-light","editorial-dark"]){
  const observations=[];
  for(const port of ports) {
    const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
    const page=await ctx.newPage();
    await page.goto("http://127.0.0.1:"+port+"/#more");
    await page.locator('[data-style-choice="'+style+'"]').click();
    await page.waitForFunction(color=>{
      const links=[...document.querySelectorAll("link[id$='-style']")];
      const activeOverrides=links.some(link=>!link.disabled);
      return document.documentElement.dataset.theme===color
        && document.documentElement.dataset.visualStyle==="editorial"
        && !activeOverrides
        && getComputedStyle(document.body).backgroundColor==="rgba(0, 0, 0, 0)";
    },style==="editorial-dark"?"dark":"light",{timeout:15000});
    const row=await page.evaluate(()=>({
      theme:document.documentElement.dataset.theme,
      bg:getComputedStyle(document.body).backgroundColor,
      text:getComputedStyle(document.documentElement).getPropertyValue("--text").trim(),
    }));
    observations.push(row);
    await ctx.close();
  }
  assert.deepEqual(observations[0],observations[1]);
  console.log("PARITY_STYLE_PASS",style,observations[0].theme);
 }
 console.log("STYLE_PARITY_COMPLETE nine appearances, shared CSS hashes and live browser styles");
} finally {
 await browser?.close();
 for(const child of servers)child.kill("SIGTERM");
}
