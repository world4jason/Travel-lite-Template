/* Tests for owner-selected Overview images; no browser/UI changes without contracts.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../overview-artwork.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../overview-artwork.css", import.meta.url), "utf8");
const picker = fs.readFileSync(new URL("../tools/overview-artwork-picker.html", import.meta.url), "utf8");
const trip = JSON.parse(fs.readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const browser = { window: {}, document: { baseURI: "https://example.com/trip/index.html" },
  location: { origin: "https://example.com" }, URL };
vm.runInNewContext(source, browser);
const artwork = browser.window.TravelLiteOverviewArtwork;
const fixture = () => ({
  trip: { overviewArtwork: {
    subjectIds: ["fireworks", "parade", "pilgrimage", "onsen"],
    images: [
      { src: "./assets/overview/watercolor.webp", alt: "Watercolor travel art", styleId: "vintage-watercolor", fit: "contain" },
      { src: "./assets/overview/photo.webp", alt: "Real photograph" },
    ],
  } },
  ui: { locale: "zh-TW" },
  days: [{ items: [{ id:"fireworks",type:"event" },{ id:"parade",type:"event" },
    { id:"pilgrimage",type:"place" },{ id:"onsen",type:"break" }] }],
});

test("without owner choice there is no generic artwork or empty hero", () => {
  const noArt = structuredClone(trip);
  delete noArt.trip.overviewArtwork;
  assert.equal(artwork.render(noArt, "editorial"), "");
});

test("real event/place/break IDs drive art; selected style chooses only matching image", () => {
  const d=fixture();
  const rendered=artwork.render(d,"vintage-watercolor");
  assert.match(rendered,/watercolor\.webp/);
  assert.doesNotMatch(rendered,/photo\.webp/);
  assert.match(rendered,/data-artwork-fit="contain"/);
  assert.match(rendered,/旅程主視覺/);
  const fallback=artwork.render(d,"risograph");
  assert.doesNotMatch(fallback,/watercolor\.webp/);
  assert.match(fallback,/photo\.webp/);
});

test("refuses unknown subject IDs, duplicate IDs, and more than six selections", () => {
  const d=fixture();d.trip.overviewArtwork.subjectIds=["not-on-trip"];
  assert.equal(artwork.render(d,"editorial"),"");
  d.trip.overviewArtwork.subjectIds=["fireworks","fireworks"];
  assert.equal(artwork.render(d,"editorial"),"");
  d.trip.overviewArtwork.subjectIds=["fireworks","parade","pilgrimage","onsen","a","b","c"];
  assert.equal(artwork.render(d,"editorial"),"");
});

test("rejects dangerous URLs and missing alt; never injects markup", () => {
  const d=fixture();
  d.trip.overviewArtwork.images=[
    {src:"javascript:alert(1)",alt:"bad"},
    {src:"//evil.example/image.jpg",alt:"bad"},
    {src:"http://evil.example/image.jpg",alt:"bad"},
    {src:"https://example.com/good.webp",alt:'<img onerror="alert(1)">',fit:"giant"}
  ];
  const first=artwork.render(d,"editorial");
  assert.match(first,/good\.webp/); // Up to 48 candidates may be stored; unsafe URLs are filtered.
  d.trip.overviewArtwork.images.pop();
  assert.equal(artwork.render(d,"editorial"),"");
  d.trip.overviewArtwork.images=[{src:"./safe.webp",alt:'<img onerror="alert(1)">'}];
  const safe=artwork.render(d,"editorial");
  assert.match(safe,/&lt;img onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(safe,/alt="<img/);
});

test("one-to-three *displayed* images, many Style Pack variants, and no runtime generation", () => {
  const d=fixture();
  d.trip.overviewArtwork.images=[{src:"./a.webp",alt:"A"},{src:"./b.webp",alt:"B"},{src:"./c.webp",alt:"C"}];
  const rendered=artwork.render(d,"editorial");
  assert.equal((rendered.match(/<figure/g)||[]).length,3);
  assert.doesNotMatch(source,/api\.openai\.com|OPENAI_API_KEY|\bfetch\s*\(/);
});

test("15 pack-specific artwork variants safely select exactly one scene", () => {
  const d=fixture();
  const styles=["editorial","storybook","candy","risograph","paper-collage","naive-city",
    "taiwan-poster","field-stamp","quiet-linocut","doodle-memory-grid","crayon-journal",
    "painterly-editorial","geometric-print","quiet-acrylic","vintage-watercolor"];
  d.trip.overviewArtwork.images=styles.map((styleId,atlasSlice)=>({
    styleId,atlasSlice,src:"./assets/overview/atlas.avif",alt:"illustration of selected memories"
  }));
  for(let i=0;i<styles.length;i++){
    const html=artwork.render(d,styles[i]);
    assert.equal((html.match(/<figure/g)||[]).length,1);
    assert.match(html,new RegExp('data-atlas-slice="'+i+'"'));
    assert.match(html,/data-count="1"/);
  }
  d.trip.overviewArtwork.images=Array.from({length:4},(_,i)=>({
    src:"./same-"+i+".avif",alt:"same style",styleId:"editorial",atlasSlice:i
  }));
  assert.equal((artwork.render(d,"editorial").match(/<figure/g)||[]).length,3);
  d.trip.overviewArtwork.images=Array.from({length:49},(_,i)=>({src:"./"+i+".avif",alt:"safe"}));
  assert.equal(artwork.render(d,"editorial"),"");
});

test("out-of-range sprite indices do not pass as style-controlled CSS", () => {
  const d=fixture();
  d.trip.overviewArtwork.images=[{src:"./atlas.avif",alt:"Safe",styleId:"editorial",atlasSlice:999}];
  assert.doesNotMatch(artwork.render(d,"editorial"),/data-atlas-slice/);
  assert.match(css,/data-atlas-slice="14"/);
});

test("publisher picker handles actual event and break types without mutating trip data", () => {
  assert.match(picker,/'event','break'/);
  assert.match(picker,/subjectIds:ids/);
  assert.match(picker,/imageCount:Number/);
  assert.match(picker,/download-brief/);
  assert.doesNotMatch(picker,/api\.openai\.com/);
});

test("Overview DOM, size cap and PWA references are wired", () => {
  const view=fs.readFileSync(new URL("../trip-view.js",import.meta.url),"utf8");
  assert.match(view,/TravelLiteOverviewArtwork\?\.render/);
  assert.match(view,/TravelLiteOverviewArtwork\?\.bind/);
  assert.match(html,/overview-artwork\.js\?v=/);
  assert.match(html,/overview-artwork\.css\?v=/);
  assert.match(sw,/overview-artwork\.js\?v=/);
  assert.match(sw,/overview-artwork\.css\?v=/);
  assert.match(css,/178px/);
  assert.match(css,/data-artwork-fit="contain"/);
});
