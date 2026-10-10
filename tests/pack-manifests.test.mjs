import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";

const project = fileURLToPath(new URL("../", import.meta.url));
const load = name => JSON.parse(readFileSync(resolve(project, "style-packs", name, "manifest.json"), "utf8"));
const candy = load("candy");
const riso = load("risograph");

const hexes = text => [...new Set(text.match(/#[0-9a-fA-F]{6}\b/g) || [])].map(c => c.toUpperCase());
function lum(color) {
  const v=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255)
    .map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return v[0]*.2126+v[1]*.7152+v[2]*.0722;
}
function contrast(a,b) {
  const x=lum(a),y=lum(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test("both manifests map validated source briefs to explicit reviewed code and assets", () => {
  for (const pack of [candy,riso]) {
    assert.equal(pack.status,"implemented-reviewed");
    assert.equal(pack.schemaVersion,1);
    assert.equal(pack.photoProvided,false);
    assert.equal(pack.sourceColorMeasurements,false);
    const directory=resolve(project,"style-packs",pack.id);
    const brief=JSON.parse(readFileSync(resolve(directory,pack.sourceBriefPath),"utf8"));
    assert.equal(brief.id,pack.sourceBriefId);
    assert.equal(brief.stage,"brief-only");
    assert.equal(brief.webTranslation.implementationTier,pack.implementationTier);
    assert.ok(existsSync(resolve(directory,pack.generatedPromptPath)));
    assert.ok(pack.css.length>0);
    assert.ok(pack.css.every(path=>existsSync(resolve(directory,path))));
    const assetDir=resolve(directory,pack.assetDirectory);
    assert.ok(pack.assets.every(f=>existsSync(join(assetDir,f))));
    assert.ok(pack.assets.every(f=>f.endsWith(".svg")));
    assert.equal(pack.browserPreviews.length,3);
    assert.ok(pack.browserPreviews.every(f=>existsSync(resolve(directory,f))));
  }
});

test("Candy SVGs use precisely the five authored fill colors, never extra photo colors", () => {
  const allowed=new Set(Object.values(candy.palette).map(x=>x.toUpperCase()));
  const directory=resolve(project,"assets/candy");
  for(const name of candy.assets){
    const svg=readFileSync(join(directory,name),"utf8");
    assert.ok(svg.includes("xmlns=\"http://www.w3.org/2000/svg\""),name);
    assert.ok(svg.includes("viewBox"),name);
    assert.ok(!svg.includes("linearGradient")&&!svg.includes("feTurbulence"),name);
    const used=hexes(svg);
    assert.ok(used.length>0,name);
    assert.ok(used.every(x=>allowed.has(x)),name+" contains unsupported "+used.join(","));
    assert.ok(!/<polygon\b/.test(svg),name+" should avoid sharp polygonal outlines");
    assert.ok(!/javascript:|<script/i.test(svg));
  }
  assert.equal(candy.assets.length,12);
});

test("accessible dark ink remains readable on all five Candy illustration fills", () => {
  for(const [role, color] of Object.entries(candy.palette)) {
    assert.ok(contrast(candy.contrastInk,color)>=4.5,
      "ink must pass WCAG 4.5 on "+role+"; got "+contrast(candy.contrastInk,color).toFixed(2));
  }
  assert.match(candy.contrastInkException,/accessibility/i);
});

test("Risograph remains materially distinct, while small accent text meets AA contrast", () => {
  const root=resolve(project,"assets/risograph");
  const hero=readFileSync(join(root,"hero.svg"),"utf8");
  const grain=readFileSync(join(root,"grain.svg"),"utf8");
  assert.ok(grain.length>10000);
  assert.ok(hero.includes('id="halftone"'));
  const used=hexes(hero);
  assert.ok(used.length>=2);
  assert.ok(used.every(x=>[riso.palette.ivory,riso.palette.indigo,riso.palette.printAccent]
    .map(v=>v.toUpperCase()).includes(x)));
  assert.ok(contrast(riso.palette.readableAccent,riso.palette.ivory)>=4.5);
  assert.ok(contrast(riso.palette.printAccent,riso.palette.ivory)<4.5);
  assert.match(riso.accentContrastNote,/editorial/i);
  assert.equal(riso.motion,"none");
  assert.equal(riso.css.length,1);
});

test("Style Pack selection is whitelisted and does not change sample trip", () => {
  const app=readFileSync(resolve(project,"app.js"),"utf8");
  for(const value of ["editorial","storybook","candy","risograph"]) {
    assert.ok(app.includes(value+":"),value);
  }
  assert.ok(!app.includes("eval(")&&!app.includes("new Function("));
  const sample=JSON.parse(readFileSync(resolve(project,"trip.json"),"utf8"));
  assert.equal(sample.trip.id,"sample-tokyo-2026");
  assert.equal(sample.days.length,3);
  assert.equal(sample.ui.visualStyle,undefined);
  const runtimeSw=readFileSync(resolve(project,"sw.js"),"utf8");
  for(const pack of [candy,riso]){
    for(const css of pack.css) {
      assert.ok(runtimeSw.includes(css.replace("../../","./")));
    }
    for(const asset of pack.assets) {
      assert.ok(runtimeSw.includes("./assets/"+pack.id+"/"+asset));
    }
  }
});
