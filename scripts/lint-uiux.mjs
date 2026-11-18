/* Static UIUX gate. Browser layout geometry is the second required gate.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

const required = ["ui-icons.js","uiux-guard.css","trip-view.js","app.js",
  "places-view.js","runtime-features.js","index.html","sw.js","trip.json",
  "AGENTS.md","docs/UIUX.md","package.json","playwright.config.mjs",
  ".github/workflows/chronological-timeline.yml"];
const names=["train","subway","cable","bus","flight","drive","boat","walk",
  "route","map-pin","museum","ticket","sparkles"];
export function auditUIUX(files) {
  const errors=[],get=path=>String(files[path]||"");
  const icon=get("ui-icons.js"),trip=get("trip-view.js"),app=get("app.js");
  const css=get("uiux-guard.css"),index=get("index.html"),sw=get("sw.js");
  const check=(yes,why)=>{if(!yes)errors.push(why);};
  for(const name of names) {
    const pattern=new RegExp("^\\s*['\"]?"+name+"['\"]?:","m");
    check(pattern.test(icon),"Missing semantic SVG: "+name);
  }
  check(icon.includes("Object.freeze")&&icon.includes("shapes[name]"),
    "SVG icon lookup must use a fixed allowlist");
  check(trip.includes("TravelLiteIcons?.svg?.(item.transportMode)"),
    "Trip transport must use semantic SVG");
  check(trip.includes('TravelLiteIcons?.svg?.("map-pin")'),
    "Trip map action must use map-pin SVG");
  check(app.includes("TravelLiteIcons?.svg?.(VIEW_META[view].icon)"),
    "Navigation must use semantic SVG");
  for(const path of ["trip-view.js","app.js","places-view.js","journey-board.js"]) {
    if(!files[path])continue;
    const old=get(path).match(/[📍⌖◫≋]/u);
    check(!old,"Unsupported font glyph "+String(old?.[0])+" in "+path);
  }
  check(!/map-state-mark[^>]*>⌖/.test(get("runtime-features.js")),
    "Map fallback glyph must use SVG");
  check(css.includes("padding-inline-start: max(16px") &&
    css.includes("padding-inline-end: max(72px") &&
    css.includes('data-visual-style="storybook"'),
    "Framed Storybook cards must retain text and illustration insets");
  check(css.includes(".trip-highlight-title") && css.includes("overflow-wrap: anywhere"),
    "Long card titles need safe wrapping");
  try{
    const data=JSON.parse(get("trip.json"));
    for(const h of data.highlights||[])
      check(!h.icon||["museum","sparkles","map-pin","ticket"].includes(h.icon),
        "Invalid highlight.icon on "+h.id+": "+h.icon);
  }catch{errors.push("trip.json must be valid JSON")}
  check(index.includes("ui-icons.js") &&
    index.indexOf("ui-icons.js")<index.indexOf("app.js"),
    "ui-icons.js must load before app.js");
  check(index.includes("uiux-guard.css"),
    "index.html must load inset guard stylesheet");
  check(sw.includes("uiux-guard.css")&&sw.includes("ui-icons.js"),
    "Service Worker must precache icon and guard assets");
  check(get("docs/UIUX.md").includes("P1.7") &&
    get("docs/UIUX.md").includes("lint:uiux"),
    "UIUX.md must define P1.7 static+rendered checks");
  check(get("AGENTS.md").includes("lint:uiux"),
    "AGENTS.md must require UIUX lint");
  try {
    const pkg=JSON.parse(get("package.json"));
    check(String(pkg.scripts?.["lint:uiux"]||"").includes("scripts/lint-uiux.mjs"),
      "Missing npm lint:uiux");
    check(String(pkg.scripts?.["test:uiux:geometry"]||"").includes("uiux-safe-inset.spec.mjs"),
      "Missing npm test:uiux:geometry");
  }catch{errors.push("package.json must be valid JSON")}
  check(get("playwright.config.mjs").includes("uiux-safe-inset.spec.mjs"),
    "Playwright must include rendered geometry specs");
  check(get(".github/workflows/chronological-timeline.yml").includes("npm run lint:uiux")&&
    get(".github/workflows/chronological-timeline.yml").includes("npm run test:uiux:geometry"),
    "CI must run static lint AND browser geometry");
  return errors;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const files={};
  for(const path of [...required,"journey-board.js"])
    try{files[path]=readFileSync(resolve(path),"utf8")}catch{}
  const errors=auditUIUX(files);
  errors.forEach(reason=>console.error("UIUX LINT FAIL: "+reason));
  if(errors.length)process.exitCode=1;
  else console.log("PASS UIUX static lint: SVG allowlist, glyphs, insets, PWA and CI");
}
