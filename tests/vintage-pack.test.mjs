import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const manifest = JSON.parse(read("style-packs/vintage-watercolor/manifest.json"));
function ratio(a,b) {
  const lum=(hex)=>{
    const channels=hex.match(/[a-f0-9]{2}/gi).slice(0,3).map(c=>parseInt(c,16)/255)
      .map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
}
test("prototype manifest has real, bundled assets and honest visual review status",()=>{
  assert.equal(manifest.id,"vintage-watercolor");
  assert.equal(manifest.visualStyle,"vintage-watercolor");
  assert.equal(manifest.stage,"implemented-reviewed");
  assert.match(manifest.visualReview,/Human review remains pending/);
  for(const asset of manifest.assets)
    assert.ok(existsSync(resolve(root,manifest.assetDirectory.replace("../../",""),asset)), asset);
  assert.ok(manifest.css.every(path=>existsSync(resolve(root,"style-packs/vintage-watercolor",path))));
  assert.ok(manifest.browserPreviews.length>=4,"browser review screenshots required");
  for(const preview of [...manifest.browserPreviews,...manifest.printPreviews])
    assert.ok(existsSync(resolve(root,"style-packs/vintage-watercolor",preview)),preview);
});
test("HTML uses bounded whitelisted pack, local SVG and offline cache; no remote style source",()=>{
  const app=read("app.js"),index=read("index.html"),sw=read("sw.js"),css=read("vintage-watercolor-theme.css");
  assert.match(app,/"vintage-watercolor": \{ css: \["storybook-style", "vintage-watercolor-style"\]/);
  assert.match(index,/id="vintage-watercolor-style"[^>]+ disabled/);
  assert.match(sw,/vintage-watercolor-theme\.css/);
  assert.match(sw,/assets\/vintage-watercolor\/hero\.svg/);
  assert.match(sw,/assets\/vintage-watercolor\/marker\.svg/);
  assert.match(css,/data-visual-style="vintage-watercolor"/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/:focus-visible/);
  assert.doesNotMatch(css,/@import|fonts\.googleapis|https?:\/\//i);
  assert.doesNotMatch(read("assets/vintage-watercolor/hero.svg"),/<text\b|<script\b|<image\b/i);
});
test("functional ink and muted text meet ordinary text contrast against paper",()=>{
  assert.ok(ratio(manifest.palette.ink,manifest.palette.paper)>=4.5);
  assert.ok(ratio(manifest.palette.muted,manifest.palette.paper)>=4.5);
  assert.ok(ratio(manifest.palette.antiqueGreen,manifest.palette.paper)>=4.5);
});
