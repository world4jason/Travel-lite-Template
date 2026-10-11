import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateStyleBrief } from "../style-generator/validate-style.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const packs=["quiet-linocut","doodle-memory-grid","crayon-journal",
  "painterly-editorial","geometric-print","quiet-acrylic"];
const src=path=>readFileSync(resolve(root,path),"utf8");
const hex=(s)=>s.match(/#[0-9a-fA-F]{6}\b/g)||[];
function luminance(color) {
 const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255)
 .map(n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4));
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
function ratio(a,b) {
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test("all six sources are text-only valid Briefs with distinct design materials",()=>{
 const names=new Set(), families=new Set(),techniques=new Set();
 for(const id of packs){
   const brief=JSON.parse(src("style-generator/examples/"+id+".json"));
   const m=JSON.parse(src("style-packs/"+id+"/manifest.json"));
   assert.equal(brief.stage,"brief-only");
   assert.equal(brief.audit.photoProvided,false);
   assert.equal(brief.audit.basis,"text-only");
   assert.equal(validateStyleBrief(brief).valid,true,JSON.stringify(validateStyleBrief(brief).errors));
   assert.ok(brief.audit.unknowns.join(" ").includes("照片"));
   assert.ok(brief.webTranslation.excludedOriginalInstructions.length>0);
   assert.equal(m.sourceBriefId,id);
   assert.equal(m.visualStyle,id);
   assert.equal(m.stage,"implemented-reviewed");
   assert.equal(m.sourceColorMeasurements,false);
   assert.equal(m.photoProvided,false);
   assert.ok(m.materialRules.length>=3);
   assert.equal(m.assets.length,2);
   assert.equal(m.browserPreviews.length,3);
   assert.ok(m.browserPreviews.every(x=>existsSync(resolve(root,"style-packs",id,x))));
   assert.ok(existsSync(resolve(root,"style-generator/generated-prompts/"+id+".md")));
   assert.ok(m.css.every(x=>existsSync(resolve(root,"style-packs/"+id,x))));
   assert.ok(m.assets.every(x=>existsSync(resolve(root,"assets/"+id,x))));
   names.add(m.displayName);
   families.add(brief.visual.geometry.family);
   techniques.add(brief.visual.material.technique);
 }
 assert.equal(names.size,6);
 assert.equal(families.size,6);
 assert.equal(techniques.size,6);
});
test("material evidence is observable in locally authored SVGs, not palette-only skins",()=>{
 const lino=src("assets/quiet-linocut/hero.svg");
 assert.match(lino,/clipPath id="tear"/);
 assert.match(lino,/stroke-dasharray/);
 assert.match(lino,/translate\(565 228\)/);
 const doodle=src("assets/doodle-memory-grid/hero.svg");
 for(const index of [1,2,3,4,5,6,7,8,9])assert.ok(doodle.includes("<!-- "+index+" "), "missing doodle "+index);
 assert.match(doodle,/stroke-linecap="round"/);
 const crayon=src("assets/crayon-journal/hero.svg");
 assert.match(crayon,/stroke-dasharray/);
 assert.ok(crayon.match(/stroke=/g).length>200);
 const painter=src("assets/painterly-editorial/hero.svg");
 assert.match(painter,/feDisplacementMap/);
 assert.match(painter,/feTurbulence/);
 assert.ok((painter.match(/stroke-width=/g)||[]).length>100);
 const hard=src("assets/geometric-print/hero.svg");
 assert.ok((hard.match(/<polygon /g)||[]).length>10);
 assert.ok(!/\sstroke=|linearGradient|radialGradient|<filter\b/.test(hard));
 const quiet=src("assets/quiet-acrylic/hero.svg");
 assert.match(quiet,/translate\(474 242\)/);
 assert.ok(!quiet.includes("feTurbulence"));
 for(const svg of [lino,doodle,crayon,painter,hard,quiet]){
   assert.ok(!/MR\.PARROT|Zine v1\.3|No\.07|Gathered Scenes|SEA BREEZE/.test(svg));
   assert.ok(!/<script\b|javascript:|foreignObject/.test(svg));
 }
});
test("each new pack has readable text/surface and locally whitelisted CSS",()=>{
 const app=src("app.js"),index=src("index.html"),sw=src("sw.js");
 for(const id of packs) {
   const css=src(id+"-theme.css");
   const vars=Object.fromEntries([...css.matchAll(/--(bg|ink|surface|surface-2|accent-soft):\s*(#[0-9A-Fa-f]{6})/g)]
     .map((match)=>[match[1],match[2]]));
   assert.ok(vars.bg && vars.ink && vars.surface);
   for(const target of [vars.bg,vars.surface])assert.ok(ratio(vars.ink,target)>=4.5,
     id+" "+vars.ink+" on "+target+" lacks 4.5:1 contrast ("+ratio(vars.ink,target).toFixed(2)+")");
   assert.ok(index.includes('id="'+id+'-style"'));
   assert.ok(app.includes('"'+id+'": { css:'));
   assert.ok(sw.includes("./"+id+"-theme.css"));
   for(const asset of ["hero.svg","marker.svg"])assert.ok(sw.includes("./assets/"+id+"/"+asset));
   assert.ok(!css.includes("https://") && !css.includes("MR.PARROT"));
 }
});
test("same prompt does not create unneeded duplicates of existing Risograph Zine",()=>{
 const app=src("app.js");
 assert.ok(!app.includes('"riso-editorial": { css:'));
 assert.ok(!app.includes('"vintage-zine-duplicate": { css:'));
 assert.equal((app.match(/risograph: \{ css:/g)||[]).length,1);
});
test("neither website runtime nor user-supplied travel facts were modified by prompt extraction",()=>{
 const trip=JSON.parse(src("trip.json"));
 assert.equal(trip.days.length,3);
 assert.equal(trip.trip.title,"Tokyo Autumn");
 const app=src("app.js");
 assert.ok(!app.includes("eval("));
 assert.ok(!app.includes("new Function("));
});
