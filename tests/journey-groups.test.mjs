/* Door-to-door journey projection, source-identity and route safety.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../journey-groups.js",import.meta.url),"utf8");
const window={};
vm.runInNewContext(source,{window});
const api=window.TravelLiteJourneys;
const item=(id,title,mode,start,end,extra={})=>
  ({id,type:"transport",title,transportMode:mode,start,end,...extra});
const legs=[
  item("walk-1","大阪天滿宮 → 南森町站","walk","12:10","12:20"),
  item("metro-1","谷町線：南森町 → 谷町四丁目","subway","12:20","12:30"),
  item("rail-1","中央線：谷町四丁目 → 生駒","train","12:30","13:10"),
  item("walk-2","生駒 → 鳥居前站","walk","13:10","13:15"),
];
test("four consecutive transit legs project to one visible source-ordered Journey",()=>{
  const sourceItems=structuredClone(legs);
  const result=api.groupItems(sourceItems,"zh-Hant");
  assert.equal(result.length,1);
  assert.equal(result[0].kind,"journey");
  assert.equal(result[0].item.start,"12:10");
  assert.equal(result[0].item.end,"13:15");
  assert.equal(result[0].item.title,"大阪天滿宮 → 鳥居前站");
  assert.deepEqual(JSON.parse(JSON.stringify(result[0].legs.map(x=>x.id))),legs.map(x=>x.id));
  assert.deepEqual(sourceItems,legs,"source items and timestamps must never be mutated");
});
test("Google Maps origin/destination and travel mode use known names, no GPS needed",()=>{
  const journey=api.groupItems(legs)[0];
  const url=api.directionsUrl(journey);
  const route=new URL(url);
  assert.equal(route.origin,"https://www.google.com");
  assert.equal(route.pathname,"/maps/dir/");
  assert.equal(route.searchParams.get("api"),"1");
  assert.equal(route.searchParams.get("origin"),"大阪天滿宮");
  assert.equal(route.searchParams.get("destination"),"鳥居前站");
  assert.equal(route.searchParams.get("travelmode"),"transit");
  assert.equal(route.searchParams.has("waypoints"),false);
  const walking=api.groupItems([legs[0],{...legs[3],start:"12:20"}])[0];
  assert.equal(new URL(api.directionsUrl(walking)).searchParams.get("travelmode"),"walking");
});
test("visits and explicit journey boundaries prevent unrelated travel grouping",()=>{
  const visit={id:"stop",type:"place",title:"午餐",start:"13:15",end:"14:00"};
  assert.equal(api.groupItems([...legs.slice(0,2),visit,...legs.slice(2)]).filter(x=>x.kind==="journey").length,2);
  assert.equal(api.groupItems([legs[0],{...legs[1],journeyStart:true}]).length,2);
  assert.equal(api.groupItems([{...legs[0],journeyId:"a"},{...legs[1],journeyId:"b"}]).length,2);
  assert.equal(api.groupItems([legs[0],{...legs[1],journeyId:"a"}]).length,2);
});
test("missing endpoints and flights fail closed (no fabricated route)",()=>{
  const unknown=api.groupItems([item("x","Wait for bus","bus","10:00","10:10"),
    item("y","Board shuttle","bus","10:10","10:20")])[0];
  assert.equal(unknown.route,null);
  assert.equal(api.directionsUrl(unknown),"");
  const flying=api.groupItems([item("a","Airport A → Airport B","flight","10:00","11:00"),
    item("b","Airport B → Hotel","walk","11:00","11:15")])[0];
  assert.equal(api.directionsUrl(flying),"");
});
test("real published itinerary retains every leg ID after display projection",()=>{
  const published=JSON.parse(readFileSync(new URL("../trip.json",import.meta.url),"utf8"));
  let sourceCount=0,renderedCount=0,journeys=0;
  for(const day of published.days||[]){
    const entries=api.groupItems(day.items,published.ui?.locale);
    sourceCount+=day.items.length;
    renderedCount+=entries.length;
    journeys+=entries.filter(x=>x.kind==="journey").length;
    const reconstructed=entries.flatMap(x=>x.kind==="journey"?x.legs:[x.item]);
    assert.deepEqual(JSON.parse(JSON.stringify(reconstructed.map(x=>x.id))),
      day.items.map(x=>x.id),"all source IDs survive projection: "+day.date);
  }
  assert.ok(renderedCount<=sourceCount);
  if(published.days.length>5)assert.ok(journeys>=10,"long trips should project meaningful journeys");
});
test("walk mode is an outlined footprints SVG, not a running-human glyph",()=>{
  const iconSource=readFileSync(new URL("../ui-icons.js",import.meta.url),"utf8");
  assert.match(iconSource,/walk:\s*'<path d="M4 16v-2\.38/);
  assert.doesNotMatch(iconSource,/walk:\s*'<circle cx="12" cy="4"/);
});
