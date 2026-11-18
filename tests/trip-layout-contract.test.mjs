/* P1.10: layout contracts and no filler text. SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const css=source("journey-groups.css"),view=source("trip-view.js"),weather=source("date-navigation.js");
function genericGridOverrides(styles){
  return [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([,selector,body])=>selector.trim()===".trip-v2-timeline .trip-v2-item"&&/grid-template-columns\s*:/.test(body));
}
test("Journey decoration cannot take ownership of every Style Pack grid tracks",()=>{
  assert.equal(genericGridOverrides(css).length,0);
  assert.match(css,/:root\[data-visual-style="storybook"\]\s+\.trip-v2-timeline\s+\.trip-v2-item\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css,/grid-template-areas:"time" "content"/);
  assert.equal(genericGridOverrides(css+"\n.trip-v2-timeline .trip-v2-item {grid-template-columns: 105px 18px 1fr;}").length,1);
});
test("a map route stays clickable but does not repeat a second Google Maps phrase inside title",()=>{
  assert.match(view,/trip-journey-directions/);
  assert.match(view,/trip-journey-map-cta/);
  assert.doesNotMatch(view,/escapeHtml\(localized\("Google Maps 路線", "Directions"\)\)/);
  assert.match(css,/\.trip-journey-directions\s*\{\s*display:inline;/);
});
test("the UI avoids repeating its own chronology and everyday mechanics in helper subtitles",()=>{
  assert.doesNotMatch(view,/依時間排列：景點、交通、餐飲皆為獨立時段/);
  assert.doesNotMatch(view,/<p class="day-note">/);
  assert.match(view,/noteDetail/);
  assert.doesNotMatch(weather,/沒有資料仍可選日期/);
  const data=JSON.parse(source("trip.json"));
  assert.equal(data.days.filter(d=>/^依實走順序串起交通與遊覽/.test(d.note||"")).length,0);
});
