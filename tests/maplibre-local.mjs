/* Hermetic MapLibre route used for browser screenshot and QA.
   Uses pinned local npm resources and a source-free background map style;
   controls/markers remain the REAL MapLibre browser elements.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(readFileSync(resolve(root,"package.json"),"utf8")).devDependencies["maplibre-gl"];
const url = "https://cdn.jsdelivr.net/npm/maplibre-gl@" + version + "/";
const dist = resolve(root,"node_modules/maplibre-gl/dist");
const styleHost = "https://tiles.openfreemap.org/";
const style = JSON.stringify({
  version:8, name:"travel-lite-qa", sources:{},
  layers:[{id:"background",type:"background",paint:{"background-color":"#dde3e0"}}],
});
if (!readFileSync(resolve(root,"runtime-features.js"),"utf8").includes(url)) {
  throw new Error("MapLibre runtime pin mismatches package.json");
}

export async function serveMapLibreLocally(page) {
  await page.route(styleHost + "**", route =>
    new URL(route.request().url()).pathname.startsWith("/styles/")
      ? route.fulfill({status:200,contentType:"application/json",
          headers:{"access-control-allow-origin":"*"},body:style})
      : route.abort());
  await page.route(url + "**",async route=>{
    const request=new URL(route.request().url());
    const filename=request.pathname.slice(new URL(url).pathname.length);
    const path=filename==="+esm"?"maplibre-gl.mjs":filename.replace(/^dist\//,"");
    if(!/^[\w.-]+\.(mjs|css)$/.test(path))return route.abort();
    return route.fulfill({status:200,
      contentType:path.endsWith(".css")?"text/css":"text/javascript",
      headers:{"access-control-allow-origin":"*"},
      body:readFileSync(resolve(dist,path)),
    });
  });
}
