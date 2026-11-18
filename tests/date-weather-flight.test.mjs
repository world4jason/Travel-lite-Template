/* Date card / weather safety / flight canonicalization contracts. SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const dateSource = source("date-navigation.js");
const flightSource = source("flight-overview.js");
test("date cards remain first-class, horizontal, keyboard accessible, and retain legacy date control",()=>{
  assert.match(dateSource,/data-unified-date-card/);
  assert.match(dateSource,/aria-pressed/);
  assert.match(dateSource,/data-unified-date-select/);
  assert.match(dateSource,/data-unified-date-overview/);
  assert.match(dateSource,/data-unified-date-today/);
  assert.match(dateSource,/function setSharedDate/);
  assert.match(source("date-navigation.css"),/scroll-snap-type:\s*x proximity/);
});
test("past and future weather are data-driven; empty dates never show fake placeholders",()=>{
  assert.match(dateSource,/data-weather-state="empty"/);
  assert.match(dateSource,/source = diff < -92 \? "archive"/);
  assert.match(dateSource,/TravelLiteProviders\.recentWeather/);
  assert.match(dateSource,/TravelLiteProviders\.historicalWeather/);
  assert.match(dateSource,/data\?\.daily\?\.time\?\.indexOf\(date\)/);
  assert.match(dateSource,/code == null \|\| high == null \|\| low == null/);
  assert.match(dateSource,/Historical model weather/);
  assert.match(dateSource,/if \(!nav\.isConnected\) return/);
  assert.match(dateSource,/day\.weatherLocation/);
  assert.doesNotMatch(dateSource,/▦/);
  assert.match(source("date-navigation.css"),/unified-date-card-kind\[hidden\]/);
  assert.match(source("runtime-providers.js"),/historicalWeatherEndpoint/);
  assert.match(source("runtime-providers.js"),/past_days: String\(days\)/);
  assert.match(source("runtime-providers.js"),/start_date: startDate/);
});
test("flight cards use only source flight timeline items, no parallel flight schedule",()=>{
  const trip={timezone:"Asia/Tokyo"};
  const data={trip,ui:{locale:"zh-Hant"},days:[
    {date:"2030-06-01",items:[{id:"f1",type:"transport",transportMode:"flight",
      title:"IT212: TPE → KIX",start:"16:25",end:"18:40",timezone:"Asia/Taipei",
      flight:{number:"IT212",arrivalTimezone:"Asia/Tokyo",origin:{code:"TPE"},destination:{code:"KIX"}}}]},
    {date:"2030-06-02",items:[{id:"l1",type:"place",title:"Museum",start:"10:00",end:"12:00"}]}
  ]};
  const root={querySelector:()=>null};
  const escape=x=>String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;");
  const ctx={state:{data,selectedDate:"2030-06-01",view:"trip"},
    document:{querySelector:()=>root},escapeHtml:escape,escapeAttr:escape,
    renderTrip(){},renderMap(){},
    TravelLiteTime:{localDateTimeToEpoch:()=>0,zonedPartsAt:()=>({time:"19:40",date:"2030-06-01"})}};
  ctx.window=ctx;
  runInNewContext(flightSource,ctx);
  assert.equal(ctx.TravelLiteFlights.scheduledFlights().length,1);
  assert.equal(ctx.TravelLiteFlights.scheduledFlights()[0].item.id,"f1");
  assert.equal(ctx.TravelLiteFlights.arrival(ctx.TravelLiteFlights.scheduledFlights()[0]).time,"19:40");
});
test("published trip has no private flight bookings",()=>{
  const trip=JSON.parse(source("trip.json"));
  for(const day of trip.days||[])for(const item of day.items||[]){
    if(item.flight) {
      const keys=JSON.stringify(Object.keys(item.flight)).toLowerCase();
      assert.doesNotMatch(keys,/pnr|bookingcode|ticketnumber|boardingpass|passport/);
    }
  }
});

test("historical dates, recent past and upcoming dates choose their real provider", async () => {
  const fixtures = [
    ["2024-11-04","archive","historical"],
    ["2026-11-04","recent","historical"],
    ["2026-11-20","forecast","forecast"],
    ["2026-12-20",null,"empty"],
  ];
  for (const [date, expectedProvider, expectedState] of fixtures) {
    const names = [], children = {};
    for (const selector of [".unified-date-card-weather",".unified-date-card-temperature",".unified-date-card-kind"])
      children[selector] = {hidden:true,innerHTML:"",textContent:""};
    const card = {dataset:{unifiedDateCard:date,weatherState:"empty"},attrs:{},
      querySelector:selector => children[selector] || null,
      setAttribute(key,value){this.attrs[key]=value;}};
    const dom = {isConnected:true,querySelectorAll:selector => selector === "[data-unified-date-card]" ? [card] : []};
    const response = {daily:{time:[date],weather_code:[61],temperature_2m_max:[17],
      temperature_2m_min:[9],precipitation_sum:[2.5],precipitation_probability_max:[70]}};
    const payload = {trip:{timezone:"Asia/Tokyo",title:"Demo"},ui:{locale:"zh-Hant"},
      days:[{date,title:"Day",items:[{id:"point",title:"Park",type:"place",lat:34.7,lng:135.5}]}]};
    const context = {state:{data:payload,ready:false,view:"trip",selectedDate:date},
      document:{querySelector:()=>({querySelector:()=>null})},
      MutationObserver:class{observe(){}},addEventListener(){},queueMicrotask(){},
      escapeHtml:x=>String(x??""),escapeAttr:x=>String(x??""),
      zonedNow:()=>({date:"2026-11-18"}),
      TravelLiteProviders:{
        weather:async()=>{names.push("forecast");return response;},
        recentWeather:async()=>{names.push("recent");return response;},
        historicalWeather:async()=>{names.push("archive");return response;}
      }};
    context.window=context;
    const script = dateSource.replace("window.TravelLiteDateNav = Object.freeze({",
      "window.TravelLiteDateNav = Object.freeze({html,loadWeather,");
    runInNewContext(script,context);
    const html = context.TravelLiteDateNav.html("trip");
    assert.doesNotMatch(html,/▦|unified-date-card-temperature">—/);
    context.TravelLiteDateNav.loadWeather(dom);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(names[0]||null,expectedProvider,date+" API route");
    assert.equal(card.dataset.weatherState,expectedState,date+" card status");
    if (expectedState !== "empty") {
      assert.equal(children[".unified-date-card-kind"].hidden,false);
      assert.match(children[".unified-date-card-weather"].innerHTML,/<svg/);
      assert.match(children[".unified-date-card-temperature"].textContent,/17°/);
    } else {
      assert.equal(children[".unified-date-card-kind"].hidden,true);
    }
  }
});
