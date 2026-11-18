/* Regression tests: pair every map-workspace frame with real inset.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditMapWorkspaceInsets} from "../scripts/check-map-workspace-insets.mjs";
const names=[
  "runtime.css","surface-contract.css","index.html","storybook-theme.css",
  "candy-theme.css","risograph-theme.css","paper-collage-theme.css",
  "naive-city-theme.css","taiwan-poster-theme.css","field-stamp-theme.css",
  "quiet-linocut-theme.css","doodle-memory-grid-theme.css",
  "crayon-journal-theme.css","painterly-editorial-theme.css",
  "geometric-print-theme.css","quiet-acrylic-theme.css",
  "vintage-watercolor-theme.css"
];
const source=Object.fromEntries(names.map(path=>[path,
  readFileSync(new URL("../"+path,import.meta.url),"utf8")]));
test("every bundled Style Pack has an explicit map-workspace frame/inset pair",()=>{
  assert.deepEqual(auditMapWorkspaceInsets(source),[]);
});
test("a framed theme with zero inset fails",()=>{
  const modified=source["candy-theme.css"].replace(
    "--ui-map-workspace-padding: clamp(16px, 1.5vw, 24px)",
    "--ui-map-workspace-padding: 0");
  assert.notEqual(modified,source["candy-theme.css"]);
  assert.match(auditMapWorkspaceInsets({...source,"candy-theme.css":modified}).join("\n"),
    /candy-theme\.css.*paired >=12px/);
});
test("a framed theme missing padding fails, including Template",()=>{
  const modified=source["paper-collage-theme.css"].replace(
    /--ui-map-workspace-padding:\s*clamp\(16px,\s*1\.5vw,\s*24px\);/,"");
  assert.notEqual(modified,source["paper-collage-theme.css"]);
  assert.match(auditMapWorkspaceInsets({...source,"paper-collage-theme.css":modified}).join("\n"),
    /paper-collage-theme\.css.*paired >=12px/);
});
test("intentionally open Riso/Vintage maps stay open without artificial inset",()=>{
  for(const path of ["risograph-theme.css","vintage-watercolor-theme.css"]){
    const broken=source[path].replace("--ui-map-workspace-padding:0",
      "--ui-map-workspace-padding:16px");
    assert.notEqual(broken,source[path]);
    assert.match(auditMapWorkspaceInsets({...source,[path]:broken}).join("\n"),
      /open map workspace must set BOTH/);
  }
});
test("a newly added Style Pack cannot bypass the audit",()=>{
  const modified=source["index.html"].replace("</head>",
    '<link id="future-style" rel="stylesheet" href="./future-theme.css" disabled /></head>');
  assert.match(auditMapWorkspaceInsets({...source,"index.html":modified}).join("\n"),
    /future-theme\.css: unreviewed Style Pack/);
});

test("rendered panel must account for border and padding in the same width",()=>{
  const broken=source["surface-contract.css"].replace("box-sizing: border-box;","");
  assert.notEqual(broken,source["surface-contract.css"]);
  assert.match(auditMapWorkspaceInsets({...source,"surface-contract.css":broken}).join("\n"),
    /border-box sizing/);
});
