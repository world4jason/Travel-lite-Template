import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const template=fileURLToPath(new URL("../",import.meta.url));
const megan=process.env.MEGAN_LOCAL_REPO
  ? resolve(process.env.MEGAN_LOCAL_REPO) : null;
const jobs=[{repo:template,port:5057,name:"Template"}];
if(megan)jobs.push({repo:megan,port:5058,name:"Megan"});
const processes=[];
let browser;
try{
  for(const job of jobs){
    mkdirSync(join(job.repo,"style-packs","previews"),{recursive:true});
    const proc=spawn(process.execPath,["tests/serve.mjs"],{
      cwd:job.repo,
      env:{...process.env,TRAVEL_LITE_TEST_PORT:String(job.port)},
      stdio:"ignore",
    });
    processes.push(proc);
    let ready=false;
    for(let i=0;i<100;i++){
      try{
        if((await fetch("http://127.0.0.1:"+job.port+"/trip.json")).ok){ready=true;break;}
      }catch{}
      await new Promise(r=>setTimeout(r,100));
    }
    if(!ready)throw Error("Could not start preview server "+job.name);
  }
  browser=await chromium.launch({headless:true});
  for(const job of jobs){
    for(const [mode,width,height] of [["mobile",390,844],["desktop",1440,900]]){
      const ctx=await browser.newContext({viewport:{width,height},
        reducedMotion:"reduce",serviceWorkers:"block",locale:"zh-TW"});
      const page=await ctx.newPage();
      await page.route("https://fonts.googleapis.com/**",r=>r.fulfill({
        status:200,contentType:"text/css",body:""}));
      await page.route("https://fonts.gstatic.com/**",r=>r.abort());
      await page.goto("http://127.0.0.1:"+job.port+"/#more",{
        waitUntil:"domcontentloaded"});
      await page.locator("[data-style-picker-open]").waitFor({timeout:14000});
      await page.screenshot({
        path:join(job.repo,"style-packs","previews",
          "style-picker-"+mode+"-compact.png"),
        animations:"disabled"
      });
      await page.locator("[data-style-picker-open]").click();
      await page.locator("#style-picker-dialog").waitFor({state:"visible"});
      await page.waitForTimeout(250);
      await page.screenshot({
        path:join(job.repo,"style-packs","previews",
          "style-picker-"+mode+(mode==="mobile"?"-sheet":"-drawer")+".png"),
        animations:"disabled",
      });
      if(mode==="mobile"){
        await page.locator(".style-picker-scroll").evaluate(
          el=>{el.scrollTop=el.scrollHeight;});
        await page.screenshot({
          path:join(job.repo,"style-packs","previews",
            "style-picker-mobile-scrolled.png"),
          animations:"disabled",
        });
      }
      console.log("SCREENSHOTS_OK",job.name,mode);
      await ctx.close();
    }
  }
}finally{
  await browser?.close();
  for(const p of processes)p.kill("SIGTERM");
}
