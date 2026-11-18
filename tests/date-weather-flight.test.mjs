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
