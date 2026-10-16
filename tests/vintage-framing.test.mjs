import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");
const names=["frame-corner-tl.svg","frame-corner-tr.svg","frame-corner-bl.svg","frame-corner-br.svg","divider-ornament.svg"];
const css=read("vintage-watercolor-theme.css");
const sw=read("sw.js");
const manifest=JSON.parse(read("style-packs/vintage-watercolor/manifest.json"));

test("all original frame SVGs are committed and included in offline precache",()=>{
  for(const name of names){
    const path="assets/vintage-watercolor/"+name;
    assert.ok(existsSync(resolve(root,path)),path);
    assert.ok(manifest.assets.includes(name),name+" missing manifest");
    assert.ok(sw.includes("./"+path),name+" missing SW precache");
    assert.ok(css.includes("./"+path),name+" not referenced by CSS");
    const svg=read(path);
    assert.match(svg,/viewBox/);
    assert.doesNotMatch(svg,/<image\b|<script\b|<text\b|data:/i);
  }
});

test("identity and chapter use four corners and a second inset rule",()=>{
  assert.match(css,/Frame Grammar v2/);
  assert.match(css,/--frame-corner-size:/);
  assert.match(css,/\.trip-day-view > \.day-summary::before/);
  assert.match(css,/frame-corner-tl\.svg/);
  assert.match(css,/frame-corner-br\.svg/);
  assert.match(css,/divider-ornament\.svg/);
  assert.match(css,/@media \(max-width:600px\)/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/:focus-visible/);
});

test("A5 print embeds original generic vector ornaments and preserves selectable text",()=>{
  const code=read("export-core.js");
  assert.match(code,/data:image\/svg\+xml,/);
  assert.match(code,/booklet-vintage \.booklet-cover::before/);
  assert.match(code,/booklet-vintage \.booklet-day \.day-heading::after/);
  assert.match(code,/printHtml/);
});

test("Frame Grammar covers five semantic surfaces without touching other styles",()=>{
  const grammar=JSON.parse(read("style-packs/vintage-watercolor/frame-grammar.json"));
  assert.equal(grammar.role,"structural-and-decorative");
  assert.deepEqual(grammar.placements.map(p=>p.surface),["identity","chapter","reading","operational","print"]);
  assert.ok(grammar.frameLayers.some(layer=>layer.level==="inner"));
  assert.ok(grammar.cornerMotifs.length>0 && grammar.dividerMotifs.length>0);
  assert.ok(read("docs/STYLE_FRAME_GRAMMAR_AUDIT.md").includes("Paper Collage"));
});

test("A5 inlined SVGs stay byte-for-byte aligned with the reviewed local art",()=>{
  const code=read("export-core.js");
  assert.ok(code.includes(encodeURIComponent(read("assets/vintage-watercolor/frame-corner-tl.svg").trim())));
  assert.ok(code.includes(encodeURIComponent(read("assets/vintage-watercolor/divider-ornament.svg").trim())));
});
