/* Ensure the static UIUX rule actually rejects known regressions. */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {auditUIUX} from "../scripts/lint-uiux.mjs";
const paths=["ui-icons.js","uiux-guard.css","journey-groups.js","journey-groups.css","trip-view.js","app.js",
  "places-view.js","runtime-features.js","index.html","sw.js","trip.json",
  "AGENTS.md","docs/UIUX.md","package.json","playwright.config.mjs",
  ".github/workflows/chronological-timeline.yml","journey-board.js"];
const files=Object.fromEntries(paths.filter(path=>existsSync(new URL("../"+path,import.meta.url)))
  .map(path=>[path,readFileSync(new URL("../"+path,import.meta.url),"utf8")]));
test("checked-in UI files obey SVG + inset + dual-gate lint",()=>{
  assert.deepEqual(auditUIUX(files),[]);
});
test("reject an unknown font-dependent map icon",()=>{
  assert.match(auditUIUX({...files,"trip-view.js":files["trip-view.js"]+"\\nconst bad='⌖';\\n"}).join(" "),/glyph/);
});
test("reject removing actual framed text inset",()=>{
  const broken=files["uiux-guard.css"].replace("padding-inline-start: max(16px","padding-inline-start: 0");
  assert.match(auditUIUX({...files,"uiux-guard.css":broken}).join(" "),/insets/);
});
test("reject an unapproved source-highlight Unicode icon",()=>{
  const d=JSON.parse(files["trip.json"]);
  if(!d.highlights?.length)return;
  d.highlights[0].icon="◫";
  assert.match(auditUIUX({...files,"trip.json":JSON.stringify(d)}).join(" "),/highlight.icon/);
});

test("reject removing one-click Google Maps endpoints from Journey projection",()=>{
  const broken=files["journey-groups.js"].replace("encodeURIComponent(route.from)","String(route.from)");
  assert.match(auditUIUX({...files,"journey-groups.js":broken}).join(" "),/encode origin/);
});
test("reject removing desktop Journey width constraints",()=>{
  const broken=files["journey-groups.css"].replace("#view-root .map-heading","[missing-selector]");
  assert.match(auditUIUX({...files,"journey-groups.css":broken}).join(" "),/Desktop Journey/);
});
