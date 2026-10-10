/* Capture actual responsive screenshots of audited travel styles.
 * Optional MEGAN_LOCAL_REPO captures the same style atop Megan's data.
 */
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
const template=fileURLToPath(new URL("../",import.meta.url));
const megan=process.env.MEGAN_LOCAL_REPO ? resolve(process.env.MEGAN_LOCAL_REPO) : null;
const packs=["paper-collage","naive-city","taiwan-poster","field-stamp"];
const jobs=[{repo:template,port:4872,prefix:"template"}];
if(megan)jobs.push({repo:megan,port:4873,prefix:"megan"});
const children=[];
let browser;
try {
 for(const job of jobs) {
  const proc=spawn(process.execPath,["tests/serve.mjs"],{
   cwd:job.repo,env:{...process.env,TRAVEL_LITE_TEST_PORT:String(job.port)},stdio:"ignore"});
  children.push(proc);
  mkdirSync(join(job.repo,"style-packs","previews"),{recursive:true});
 }
 for(const job of jobs){
  let good=false;
  for(let attempt=0;attempt<100;attempt++){
    try{good=(await fetch("http://127.0.0.1:"+job.port+"/trip.json")).ok;if(good)break;}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  if(!good)throw new Error("No server "+job.port);
 }
 browser=await chromium.launch({headless:true});
 for(const job of jobs){
  for(const pack of packs){
   for(const mode of ["mobile","desktop"]){
    const wide=mode==="desktop";
    const ctx=await browser.newContext({viewport:wide?{width:1440,height:900}:{width:390,height:844},serviceWorkers:"block"});
    const page=await ctx.newPage();
    await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({status:200,contentType:"text/css",body:""}));
    await page.route("https://fonts.gstatic.com/**",r=>r.abort());
    await page.goto("http://127.0.0.1:"+job.port+"/?previewStyle="+pack+"#trip/overview",{waitUntil:"domcontentloaded"});
    await page.locator(".trip-overview-day").first().waitFor({timeout:10000});
    await page.waitForFunction(name=>{
      const link=document.getElementById(name+"-style");
      return link && !link.disabled && !!link.sheet;
    },pack,{timeout:10000});
    const output=join(job.repo,"style-packs","previews",pack+"-"+mode+".png");
    await page.screenshot({path:output,fullPage:true,animations:"disabled"});
    console.log("SCREENSHOT",job.prefix,pack,mode);
    await ctx.close();
   }
  }
 }
} finally{
 await browser?.close();
 for(const child of children)child.kill("SIGTERM");
}
