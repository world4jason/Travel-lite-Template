/* Canonical itinerary projection: consecutive travel legs are one visible
 * door-to-door journey. Source items/IDs/times stay untouched.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
(() => {
  "use strict";
  const ROUTE_ARROW = /\s*(?:→|➜|➡|->)\s*/;
  const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
  const tr = (zh,en,locale) => /^zh/i.test(locale||"") ? zh : en;
  function clean(value) {
    return typeof value==="string" ? value.trim().replace(/\s+/g," ").slice(0,240) : "";
  }
  function routeFromLeg(item) {
    const structured = item?.route && typeof item.route==="object" ? item.route : {};
    const from = clean(item?.from || structured.from || item?.origin?.name);
    const to = clean(item?.to || structured.to || item?.destination?.name);
    if(from && to && from!==to) return {from,to};
    // Only use an explicit published A -> B string. Never geocode, guess
    // endpoints from a service name, or imply a real-time route.
    const candidate = [item?.location,item?.title].find(s=>
      typeof s==="string" && ROUTE_ARROW.test(s));
    if(!candidate) return {from:"",to:""};
    const parts = candidate.split(ROUTE_ARROW).map(clean).filter(Boolean);
    if(parts.length<2) return {from:"",to:""};
    const first = parts[0].replace(/^(?:(?:JR|京阪|近鐵|南海|阪急|地下鐵|地鐵|巴士|公車|列車|步行|[^\s：:]{1,14}線)[^：:]{0,15})[：:]\s*/u,"").trim();
    const last=parts.at(-1);
    if(!first || !last || first===last) return {from:"",to:""};
    return {from:first,to:last};
  }
  function sameJourney(current,next) {
    if(!next || next.type!=="transport" || next.journeyStart===true ||
        current.journeyEnd===true || current.transportMode==="flight" ||
        next.transportMode==="flight") return false;
    // Explicit source grouping boundaries always take priority.
    const a=clean(current.journeyId),b=clean(next.journeyId);
    if(a!==b) return false;
    if(current.timezone && next.timezone && current.timezone!==next.timezone) return false;
    return true;
  }
  function groupItems(items,locale="zh-Hant") {
    const published=Array.isArray(items)?items:[];
    const entries=[];
    for(let i=0;i<published.length;){
      const first=published[i];
      if(first?.type!=="transport"){
        entries.push({kind:"item",item:first,first,last:first,legs:[]});i++;continue;
      }
      const legs=[first];
      while(i+legs.length<published.length &&
        sameJourney(legs.at(-1),published[i+legs.length]))legs.push(published[i+legs.length]);
      i+=legs.length;
      if(legs.length===1){entries.push({kind:"item",item:first,first,last:first,legs:[]});continue;}
      const last=legs.at(-1),startPoint=routeFromLeg(first).from,
        endPoint=routeFromLeg(last).to;
      const hasRoute=Boolean(startPoint && endPoint && startPoint!==endPoint);
      const route = hasRoute ? {from:startPoint,to:endPoint} : null;
      const title=route ? route.from + " → " + route.to :
        tr("交通與轉乘", "Transport & transfers",locale);
      // A display-only item: all published source legs remain unchanged.
      const summary={...first,id:first.id,type:"transport",transportMode:"",
        title,start:first.start,end:last.end,endDate:last.endDate||first.endDate,
        note:"",location:"",mapsUrl:"",mapQuery:"",googleQuery:""};
      entries.push({kind:"journey",item:summary,first,last,legs,route});
    }
    return entries;
  }
  function directionsUrl(journey) {
    const route=journey?.route;
    if(!route?.from || !route?.to || route.from===route.to) return "";
    const modes=journey.legs.map(x=>x.transportMode);
    // Flights cannot be represented as a ground route. Do not claim otherwise.
    if(modes.includes("flight")) return "";
    const mode=modes.every(x=>x==="walk")?"walking":
      modes.every(x=>x==="drive")?"driving":"transit";
    return "https://www.google.com/maps/dir/?api=1&origin="+
      encodeURIComponent(route.from)+"&destination="+encodeURIComponent(route.to)+
      "&travelmode="+mode;
  }
  function countJourneys(items) {
    return groupItems(items).filter(x=>x.kind==="journey").length;
  }
  window.TravelLiteJourneys=Object.freeze({groupItems,routeFromLeg,directionsUrl,countJourneys});
})();
