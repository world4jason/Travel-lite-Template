/* Standalone semantic icon audit; never runs the cover generator.
 * Icons are functional UI, not destination images or arbitrary Style Pack art.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

function iconAPI(source) {
  const environment={window:{}};
  vm.runInNewContext(source,environment,{timeout:1000});
  return environment.window.TravelLiteIcons;
}
function shape(svg) {
  return String(svg).replace(/^.*?<svg[^>]*>/,"").replace(/<\/svg>[\s\S]*$/,"").trim();
}
export function auditIconSystem({iconSource,catalog,tripSource="",appSource="",indexSource="",swSource=""}) {
  const errors=[];
  const fail=(ok,msg)=>{if(!ok)errors.push(msg);};
  fail(catalog.schemaVersion===1,"Icon contract must be versioned");
  fail(Array.isArray(catalog.requiredIcons)&&catalog.requiredIcons.length===21,"Expected the 21 stable UI icons");
  const defs=catalog.requiredIcons||[];
  const names=defs.map(x=>x.name);
  fail(new Set(names).size===names.length,"Icon catalog contains duplicate keys");
  fail(catalog.scope?.includes("functional UI icons"),"Icon catalog must separate functional UI from generated artwork");
  for(const def of defs){
    fail(typeof def.name==="string" && /^[a-z][a-z0-9-]+$/.test(def.name),"Unsafe icon name");
    fail(Boolean(def.semantic&&def.label?.zhTW&&def.label?.en),"Icon needs semantic role and zh/en labels: "+def.name);
  }
  let api;
  try {api=iconAPI(iconSource);} catch(e){errors.push("Cannot load icon module: "+e.message);return errors;}
  fail(api && typeof api.svg==="function" && Array.isArray(Array.from(api.names||[])),"Missing allowlisted SVG renderer");
  for(const def of defs){
    const image=api.svg(def.name);
    fail(Boolean(image), "Missing semantic icon: "+def.name);
    if(!image)continue;
    fail(image.includes('viewBox="0 0 24 24"')&&image.includes('stroke="currentColor"')&&image.includes('fill="none"'),
      "Non-token or mis-sized SVG: "+def.name);
    fail(image.includes('aria-hidden="true"')&&image.includes('focusable="false"'),
      "Missing accessible decorative-SVG markup: "+def.name);
    fail(!/https?:\/\/|<script|<foreignObject/i.test(image),"Unsafe or externally dependent icon: "+def.name);
    fail(/<(path|circle|rect|line|polyline|polygon)\b/.test(image),"Empty SVG shape: "+def.name);
  }
  fail(api.svg("attacker<script>")===""&&api.svg("something-unknown")==="","Unknown icons must be rejected by fixed allowlist");
  const geos=["map-pin","map","route"].map(x=>shape(api.svg(x)));
  fail(geos.every(Boolean)&&new Set(geos).size===3,"Map pin, map workspace, and route icons must be distinct");
  const transports=["train","subway","cable","bus"].map(x=>shape(api.svg(x)));
  fail(transports.every(Boolean)&&new Set(transports).size===4,"Train, metro, cable, and bus icon silhouettes must differ");
  fail(shape(api.svg("walk")).includes("M4 16v-2.38")&&shape(api.svg("walk")).includes("M20 20v-2.38"),
    "Walking must use two footprints, never a running-person glyph");
  fail(tripSource.includes('TravelLiteIcons?.svg?.(item.transportMode)')&&
    tripSource.includes('TravelLiteIcons?.svg?.("map-pin")'),
    "Trip should render transport and Maps actions with semantic icons");
  fail(appSource.includes("TravelLiteIcons?.svg?.(VIEW_META[view].icon)"),
    "Navigation icons must use shared allowlisted SVG");
  fail(indexSource.includes("ui-icons.js")&&swSource.includes("ui-icons.js"),
    "Icon assets must be loaded and PWA cached");
  for(const [label,source] of [["trip",tripSource],["app",appSource]]){
    fail(!/[📍⌖◫≋]/u.test(source),"Unsupported font-based icon in "+label);
  }
  return errors;
}

function read(root,p){return fs.readFileSync(path.join(root,p),"utf8")}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const root=path.resolve(fileURLToPath(new URL("..",import.meta.url)));
 const payload={iconSource:read(root,"ui-icons.js"),
  catalog:JSON.parse(read(root,"assets/icons/semantic-catalog.v1.json")),
  tripSource:read(root,"trip-view.js"),appSource:read(root,"app.js"),
  indexSource:read(root,"index.html"),swSource:read(root,"sw.js")};
 const errors=auditIconSystem(payload);
 errors.forEach(error=>console.error("ICON QA FAIL: "+error));
 if(errors.length)process.exitCode=1;
 else console.log("PASS: 21 semantic icons, map/footprints/rail distinctions, safe SVG, accessibility and PWA");
}
