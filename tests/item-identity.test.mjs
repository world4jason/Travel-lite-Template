/* Fail-closed itinerary item ID audit. Node source-path and collision tests.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

const global = { window: {} };
runInNewContext(readFileSync(new URL("../item-identity.js", import.meta.url), "utf8"), global);
const audit = global.window.TravelLiteItemIds.audit;
const copy = value => JSON.parse(JSON.stringify(value));
const example = () => [
  {date:"2026-10-03",items:[{id:"same",title:"Shibuya"},{id:"unique",type:"transport"}]},
  {date:"2026-10-04",items:[{id:"same",title:"Senso-ji"},{id:"other",type:"place"}]},
];

test("globally audits every item type and preserves deterministic source paths", () => {
  const days=example();const result=audit(days);
  assert.equal(result.hasIssues,true);
  assert.equal(result.isAmbiguous("same"),true);
  assert.equal(result.isUnique("same"),false);
  assert.equal(result.resolveUnique("same"),null);
  assert.equal(result.resolveUnique("unique").item,days[0].items[1]);
  assert.equal(result.resolveUnique("other").day,days[1]);
  assert.deepEqual(copy(result.diagnostics), [
    {id:"same",kind:"duplicate",paths:["days[0].items[0]","days[1].items[0]"]},
  ]);
  assert.deepEqual(copy(audit(days).diagnostics),copy(result.diagnostics));
  assert.deepEqual(copy(days),copy(example()),"the published source must not be rewritten");
});

test("same-day duplicates and non-Place items block every ID-only resolver", () => {
  const days=[{items:[{id:"a",type:"transport"},{id:"a",type:"place"},{id:"b",type:"stay"}]}];
  const result=audit(days);
  assert.equal(result.resolveUnique("a"),null);
  assert.equal(result.isUnique("b"),true);
  assert.deepEqual(copy(result.diagnostics[0].paths),["days[0].items[0]","days[0].items[1]"]);
});

test("invalid IDs never coerce to valid or leak item/booking fields in diagnostics", () => {
  const days=[{items:[
    {id:"",title:"Private booking 999"},
    {id:" ",title:"Do not expose"},
    {id:123,type:"transport"},
    {id:"valid",title:"Retained"},
    {id:"__proto__",title:"Valid literal key"},
  ]}];
  const result=audit(days);
  assert.equal(result.isUnique("valid"),true);
  assert.equal(result.isUnique("__proto__"),true);
  assert.equal(result.isUnique(123),false);
  assert.equal(result.resolveUnique(" "),null);
  assert.equal(result.hasIssues,true);
  assert.deepEqual(copy(result.diagnostics.map(x=>x.paths[0])), [
    "days[0].items[0]","days[0].items[1]","days[0].items[2]",
  ]);
  assert.equal(JSON.stringify(result.diagnostics).includes("Private booking"),false);
});

test("normal globally unique itinerary has no warning; repeated audits do not change input", () => {
  const days=example();days[1].items[0].id="sensoji";
  const old=copy(days);
  const first=audit(days), second=audit(days);
  assert.equal(first.hasIssues,false);
  assert.equal(first.diagnostics.length,0);
  assert.equal(first.isUnique("sensoji"),true);
  assert.equal(first.isUnique("unknown"),false);
  assert.deepEqual(copy(first.diagnostics),copy(second.diagnostics));
  assert.deepEqual(copy(days),old);
});

test("publish CLI rejects duplicate paths without printing private booking records", () => {
  const folder=mkdtempSync(join(tmpdir(),"travel-lite-identity-"));
  try {
    const data={days:example(),reservations:[{title:"PRIVATE BOOKING SECRET"}]};
    const source=join(folder,"trip.json");
    writeFileSync(source,JSON.stringify(data));
    const run=()=>spawnSync(process.execPath,[new URL("../scripts/check-item-ids.mjs",import.meta.url).pathname,source],{encoding:"utf8"});
    const first=run(),second=run();
    assert.equal(first.status,1);
    assert.equal(first.stderr,second.stderr);
    assert.match(first.stderr,/days\[0\]\.items\[0\]/);
    assert.match(first.stderr,/days\[1\]\.items\[0\]/);
    assert.doesNotMatch(first.stderr,/PRIVATE BOOKING SECRET/);
    data.days[1].items[0].id="different";
    writeFileSync(source,JSON.stringify(data));
    const clean=run();
    assert.equal(clean.status,0);
    assert.match(clean.stdout,/PASS/);
  } finally { rmSync(folder,{recursive:true,force:true}); }
});
