import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const ids=["paper-collage","naive-city","taiwan-poster","field-stamp"];
const load=(id)=>JSON.parse(readFileSync(resolve(root,"style-packs",id,"manifest.json"),"utf8"));
const get=(file)=>readFileSync(resolve(root,file),"utf8");
function luminosity(hex) {
  const val=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
    .map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
  return .2126*val[0]+.7152*val[1]+.0722*val[2];
}
function contrast(a,b) {
  const v=luminosity(a),w=luminosity(b);
  return (Math.max(v,w)+.05)/(Math.min(v,w)+.05);
}
test("four additional styles have verified brief-to-pack manifests, not active CSS in trip.json",()=>{
 for(const id of ids) {
  const m=load(id),dir=resolve(root,"style-packs",id);
  assert.equal(m.id,id);
  assert.equal(m.visualStyle,id);
  assert.equal(m.stage,"implemented-reviewed");
  assert.equal(m.lightOnly,true);
  assert.equal(m.photoProvided,false);
  assert.equal(m.sourceColorMeasurements,false);
  assert.ok(existsSync(resolve(dir,m.sourceBriefPath)));
  const brief=JSON.parse(readFileSync(resolve(dir,m.sourceBriefPath),"utf8"));
  assert.equal(brief.stage,"brief-only");
  assert.equal(m.sourceBriefId,brief.id);
  assert.ok(existsSync(resolve(dir,m.generatedPromptPath)));
  assert.equal(m.implementationTier,brief.webTranslation.implementationTier);
  assert.equal(m.assets.length>=2,true);
  for(const asset of m.assets) {
    const content=readFileSync(resolve(dir,m.assetDirectory,asset),"utf8");
    assert.ok(content.includes("http://www.w3.org/2000/svg"));
    assert.ok(!/javascript:|<script\b|<foreignObject/.test(content));
  }
  for(const css of m.css) assert.ok(existsSync(resolve(dir,css)));
  assert.ok(m.materialRules.length>=3);
  assert.ok(/photo|source|trip|location|poster|source|brand/i.test(m.sourceVsOutputBoundary));
 }
 const j=JSON.parse(get("trip.json"));
 assert.equal(j.trip.title,"Tokyo Autumn");
 assert.equal(j.ui.visualStyle,undefined);
});

test("four material languages remain distinct in source rather than palette swaps",()=>{
 const paper=get("assets/paper-collage/hero.svg");
 const naive=get("assets/naive-city/hero.svg");
 const taiwan=get("assets/taiwan-poster/hero.svg");
 const stamp=get("assets/field-stamp/hero.svg");
 assert.match(paper,/feGaussianBlur/);
 assert.match(paper,/feOffset/);
 assert.match(paper,/fiber/);
 assert.match(naive,/stroke-linecap="round"/);
 assert.match(taiwan,/halftone/);
 assert.match(taiwan,/url\(#dust\)/);
 assert.match(stamp,/stroke-dasharray/);
 assert.ok((stamp.match(/stroke-width=/g)||[]).length>300,"carved texture has local engraved marks");
 const sources=[paper,naive,taiwan,stamp];
 assert.equal(new Set(sources.map(x=>x.length)).size,4);
 for(const p of sources)assert.ok(!p.includes("MR.PARROT"),"brand from postcard source should not appear");
});

test("structural reading inks on foregrounds remain WCAG AA",()=>{
 for(const [ink,bgs] of [
  ["#304C49",["#FAF3E4","#FFF9EE","#D3E4E6"]],
  ["#233C65",["#FAF5E9","#F4E5D5","#D8E6DF"]],
  ["#143C56",["#F5E7C4","#FAECCE","#E3AF50"]],
  ["#293C31",["#F7F0E3","#E7EADB","#EEE5D3"]]
 ]) {
   for(const bg of bgs)assert.ok(contrast(ink,bg)>=4.5,ink+" on "+bg+" "+contrast(ink,bg).toFixed(2));
 }
});

test("every registered pack is locally shippable and precached",()=>{
 const app=get("app.js"),html=get("index.html"),sw=get("sw.js");
 for(const id of ids){
  assert.ok(app.includes('"' + id + '": { css:'));
  assert.ok(html.includes(id+'-style'));
  assert.ok(html.includes(id+'-theme.css'));
  assert.ok(sw.includes("./"+id+"-theme.css"));
  const m=load(id);
  for(const asset of m.assets)assert.ok(sw.includes("./assets/"+id+"/"+asset));
 }
 const names=app.split("const choices = [")[1].split("];")[0];
 for(const id of ids) assert.ok(names.includes('"'+id+'"'));
 for(const id of ["editorial-light","editorial-dark"]) assert.ok(names.includes('"'+id+'"'));
});

test("no prompt or unverified image controls the styles' runtime data",()=>{
 const app=get("app.js");
 assert.ok(!app.includes("eval(") && !app.includes("new Function("));
 for(const name of ["taiwan-poster","field-stamp"]){
  const css=get(name+"-theme.css");
  assert.ok(!css.includes("MR.PARROT"));
  assert.ok(!css.includes("AUTO-DETECTED"));
  assert.ok(!css.includes("https://"));
 }
});
