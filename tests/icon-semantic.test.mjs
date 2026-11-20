/* Independent tests for semantic inline UI icons. No image generation.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditIconSystem} from "../scripts/verify-icon-catalog.mjs";

const read = file => readFileSync(new URL("../"+file,import.meta.url),"utf8");
const fixture = {
  iconSource:read("ui-icons.js"),
  catalog:JSON.parse(read("assets/icons/semantic-catalog.v1.json")),
  tripSource:read("trip-view.js"),
  appSource:read("app.js"),
  indexSource:read("index.html"),
  swSource:read("sw.js")
};
const issues = (change) => auditIconSystem({...fixture,...change}).join("\n");

test("real app ships all 21 semantic SVGs with safe labels, transport distinctions and PWA references",()=>{
  assert.deepEqual(auditIconSystem(fixture),[]);
});

test("map-pin is required: missing map locator must fail",()=>{
  const broken=fixture.iconSource.replace(/^\s*"map-pin":.*\n/m,"\n");
  assert.notEqual(broken,fixture.iconSource);
  assert.match(issues({iconSource:broken}),/Missing semantic icon: map-pin/);
});

test("walking cannot silently turn into a running person or a generic route glyph",()=>{
  const broken=fixture.iconSource.replace(/^\s*walk:.*\n/m,
    '    walk: \'<path d="M5 5h14"/>\',\n');
  assert.notEqual(broken,fixture.iconSource);
  assert.match(issues({iconSource:broken}),/Walking must use two footprints/);
});

test("train and subway cannot reuse the same silhouette",()=>{
  const lines=fixture.iconSource.split("\n");
  const train=lines.find(line=>/^\s*train:/.test(line));
  const subwayIdx=lines.findIndex(line=>/^\s*subway:/.test(line));
  assert.ok(train && subwayIdx>=0);
  lines[subwayIdx]=train.replace(/^\s*train:/,"    subway:");
  assert.match(issues({iconSource:lines.join("\n")}),/Train, metro, cable, and bus icon silhouettes must differ/);
});

test("functional SVG must remain screen-reader decorative inside labelled controls",()=>{
  const broken=fixture.iconSource.replace('aria-hidden="true" focusable="false"',
    'aria-hidden="false" focusable="true"');
  assert.notEqual(broken,fixture.iconSource);
  assert.match(issues({iconSource:broken}),/Missing accessible decorative-SVG markup/);
});

test("font-dependent map location glyph is forbidden",()=>{
  assert.match(issues({tripSource:fixture.tripSource+"\nconst oldLocator='⌖';\n"}),/Unsupported font-based icon/);
});

test("unknown icon injection is blocked and not an executable SVG",()=>{
  const broken=fixture.iconSource.replace('if (!Object.prototype.hasOwnProperty.call(shapes, name)) return "";',
    'if (!Object.prototype.hasOwnProperty.call(shapes, name)) return String(input);');
  assert.notEqual(broken,fixture.iconSource);
  assert.match(issues({iconSource:broken}),/Unknown icons must be rejected/);
});

test("missing PWA icon entry is rejected",()=>{
  const broken=fixture.swSource.replace(/^.*"(\.\/)?ui-icons\.js[^"]*".*,?\n/m,"\n");
  assert.notEqual(broken,fixture.swSource);
  assert.match(issues({swSource:broken}),/Icon assets must be loaded and PWA cached/);
});
