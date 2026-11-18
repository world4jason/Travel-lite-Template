/* Paired map-workspace frame/inset lint for every bundled Style Pack.
 * A visible map panel border must never inherit the 0px open-workspace inset.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

const THEME_FILES=[
  "storybook-theme.css","candy-theme.css","risograph-theme.css",
  "paper-collage-theme.css","naive-city-theme.css","taiwan-poster-theme.css",
  "field-stamp-theme.css","quiet-linocut-theme.css","doodle-memory-grid-theme.css",
  "crayon-journal-theme.css","painterly-editorial-theme.css",
  "geometric-print-theme.css","quiet-acrylic-theme.css","vintage-watercolor-theme.css"
];
const OPEN_THEMES=new Set(["risograph-theme.css","vintage-watercolor-theme.css"]);
const token=(body,name)=>{
  const match=body.match(new RegExp("--"+name+"\\s*:\\s*([^;]+);"));
  return match ? match[1].trim() : null;
};
const isZero=v=>/^(?:0(?:px|rem|em)?|none)(?:\s*!important)?$/i.test(v||"");
function minimumPadding(value){
  if(!value)return NaN;
  let match=value.match(/^clamp\(\s*(\d+(?:\.\d+)?)px\s*,/i);
  if(match)return Number(match[1]);
  match=value.match(/^(\d+(?:\.\d+)?)px(?:\s*!important)?$/i);
  if(match)return Number(match[1]);
  return NaN; // Unknown token arithmetic cannot prove a 12px safe inset
}
function mapRules(css){
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([,selector,body])=>
      selector.includes(".runtime-map-panel") &&
      body.includes("--ui-map-workspace-frame:"))
    .map(([,selector,body])=>({
      selector:selector.trim(),
      frame:token(body,"ui-map-workspace-frame"),
      padding:token(body,"ui-map-workspace-padding")
    }));
}
export function auditMapWorkspaceInsets(files){
  const errors=[];
  const get=file=>String(files[file]||"");
  const baseline=get("runtime.css"),surface=get("surface-contract.css");
  if(!/\.runtime-map-panel\s*\{[^}]*--ui-map-workspace-padding:\s*0\s*;/s.test(baseline) ||
     !/\.runtime-map-panel\s*\{[^}]*--ui-map-workspace-frame:\s*0\s*;/s.test(baseline))
    errors.push("runtime.css: open Editorial workspace must keep paired zero frame/inset baseline");
  const mapRole=surface.match(/:root\s+\[data-surface-role="map-workspace"\]\s*\{([^}]*)\}/)?.[1]||"";
  if(!mapRole.includes("padding: var(--ui-map-workspace-padding, 0)") ||
     !mapRole.includes("border: var(--ui-map-workspace-frame, 0)") ||
     !/box-sizing:\s*border-box/.test(mapRole) ||
     !/min-width:\s*0/.test(mapRole))
    errors.push("surface-contract.css: map-workspace must pair frame/inset with border-box sizing");
  const index=get("index.html");
  const installed=[...index.matchAll(/<link\b[^>]*href="\.\/([^"]+-theme\.css)"[^>]*\bdisabled\b/g)]
    .map(m=>m[1]);
  for(const path of installed)
    if(!THEME_FILES.includes(path))errors.push(path+": unreviewed Style Pack must declare map frame/inset pair");
  for(const path of THEME_FILES){
    if(!installed.includes(path))errors.push(path+": audited Style Pack missing from index.html");
    const rules=mapRules(get(path));
    if(rules.length!==1){
      errors.push(path+": expected exactly one map-workspace frame rule, found "+rules.length);
      continue;
    }
    const {frame,padding}=rules[0],isOpen=OPEN_THEMES.has(path);
    if(isOpen){
      if(!isZero(frame)||!isZero(padding))
        errors.push(path+": open map workspace must set BOTH frame and padding to zero");
      continue;
    }
    if(isZero(frame))errors.push(path+": framed map workspace missing real border");
    const px=minimumPadding(padding);
    if(!Number.isFinite(px)||px<12)
      errors.push(path+": framed map workspace needs explicit paired >=12px padding, got "+String(padding));
  }
  return errors;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const paths=["runtime.css","surface-contract.css","index.html",...THEME_FILES];
  const files={};
  for(const path of paths){
    try{files[path]=readFileSync(resolve(path),"utf8")}
    catch{files[path]=""}
  }
  const errors=auditMapWorkspaceInsets(files);
  errors.forEach(error=>console.error("MAP WORKSPACE LINT FAIL: "+error));
  if(errors.length)process.exitCode=1;
  else console.log("PASS map-workspace frame/inset: 12 framed themes and 2 intentional open themes");
}
