/* Places ≠ personal activity; licensed site-backed guide contract.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const placesSource=source("places-view.js");
function directory(){
  const window={location:{href:"https://example.org/"}};
  const context={window,location:{hash:"",pathname:"/",search:""},
    root:{addEventListener(){}},
    state:{data:{days:[]}},
    TravelLiteStorage:{get:async()=>null,set(){}},tripKey:x=>x};
  vm.runInNewContext(placesSource,context);
  return context.window.TravelLitePlaces;
}
const isPlace=directory().isPlace;
test("published activity, rest and ceremony never become Places merely from coordinates",()=>{
  const basic={id:"x",title:"豬名川河岸看書、等待花火",location:"豬名川河岸",
    lat:34.82,lng:135.41,mapQuery:"豬名川河川敷",infoCard:{summary:"Has a map"}};
  for(const type of ["break","rest","wait","event","activity","transport","stay","food","procedure"]){
    assert.equal(isPlace({...basic,type}),false,"misclassified "+type);
  }
  assert.equal(isPlace({...basic,type:"place"}),true);
  assert.equal(isPlace({...basic,type:"restaurant",venueName:"Named cafe"}),true);
  assert.equal(isPlace({...basic,type:"restaurant",venueName:""}),false);
});
test("only real curated places are in the source index; visits retain identity and schedule",()=>{
 const data=JSON.parse(source("trip.json"));
 const items=data.days.flatMap(day=>day.items||[]);
 const placeItems=items.filter(x=>isPlace(x));
 const excluded=items.filter(x=>["break","event"].includes(x.type));
 // It is valid for a trip to have zero researched attractions.
 assert.ok(excluded.every(x=>!isPlace(x)));
 const ids=new Set(items.map(x=>x.id));
 assert.equal(ids.size,items.length,"source IDs must remain unique");
 for(const item of placeItems)assert.equal(item.type==="place"||item.type==="restaurant",true);
 assert.ok(placeItems.every(x=>x.infoCard?.summary && x.infoCard?.sourceLinks?.length),
   "each published attraction has a source-backed guide");
});
test("rights-cleared photos have explicit image identity, author, license and source page",()=>{
 const data=JSON.parse(source("trip.json"));
 const photos=data.days.flatMap(x=>x.items||[]).filter(x=>x.infoCard?.image);
 for(const item of photos){
  const info=item.infoCard;
  assert.match(info.image,/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//);
  assert.match(info.imageSource,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(info.imageAlt?.length>4);
  assert.ok(info.imageCredit?.includes("Wikimedia Commons"));
  assert.match(info.imageLicense,/^(?:CC(?:0| BY)|Public domain)/);
 }
 // Images are optional when rights or source imagery is unavailable.
});
test("published Place detail uses source-backed guide and never uses schedule note as an excerpt",()=>{
 assert.match(placesSource,/const excerpt = info\.summary \|\| label/);
 assert.doesNotMatch(placesSource,/info\.summary \|\| item\.note \|\|/);
 assert.match(placesSource,/places-photo-figure/);
 assert.match(placesSource,/imageCredit/);
 assert.match(placesSource,/imageLicense/);
 assert.match(placesSource,/addEventListener\("error"/);
});

test("Places uses an explicit venueName and never turns scheduled action copy into the venue heading",()=>{
  assert.match(placesSource,/function displayPlaceName\(item\)/);
  assert.match(placesSource,/typeof item\?\.venueName === "string"/);
  assert.match(placesSource,/escapeHtml\(displayPlaceName\(item\)\)/);
  assert.doesNotMatch(placesSource,/<span class="places-card-title">\$\{escapeHtml\(item\.title\)\}/);
});
