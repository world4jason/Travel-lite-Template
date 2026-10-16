import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateStyleBrief } from "../validate-style.mjs";
import { renderStylePrompt } from "../render-style-prompt.mjs";

const read = url => JSON.parse(readFileSync(new URL(url, import.meta.url),"utf8"));
const previous = read("../examples/candy-geometry.json");
const frame = read("../../style-packs/vintage-watercolor/frame-grammar.json");
const clone = value => structuredClone(value);

test("Style Brief v1.0 remains valid; v1.1 requires separate Frame Grammar", () => {
  assert.equal(validateStyleBrief(previous).valid,true);
  const next = clone(previous);
  next.schemaVersion = "1.1.0";
  assert.equal(validateStyleBrief(next).valid,false);
  assert.match(validateStyleBrief(next).errors.join("\n"), /frameAndOrnament/);
  next.visual.frameAndOrnament = frame;
  assert.deepEqual(validateStyleBrief(next).errors,[]);
});

test("Typed framing maps multiple surfaces and the original reference evidence", () => {
  const next=clone(previous);
  next.schemaVersion="1.1.0";
  next.visual.frameAndOrnament=frame;
  const result=renderStylePrompt(next);
  assert.match(result,/Frame & Ornament Grammar/);
  for(const segment of ["outer","inner","section","identity","chapter","reading","operational","print","P1","mobile","desktop"]) {
    assert.ok(result.includes(segment), segment);
  }
  assert.equal(frame.placements.length,5);
});

test("Frame none is possible but must not contain fabricated ornament", () => {
  const next=clone(previous);
  next.schemaVersion="1.1.0";
  next.visual.frameAndOrnament={role:"none",frameLayers:[],cornerMotifs:[],dividerMotifs:[],labelFrames:[],
    placements:[{surface:"identity",treatment:"no framing in source",density:"none"}],
    responsive:{mobile:"none",desktop:"none",print:"none"},evidence:[]};
  assert.equal(validateStyleBrief(next).valid,true);
  next.visual.frameAndOrnament.cornerMotifs=["invented roses"];
  assert.equal(validateStyleBrief(next).valid,false);
  next.visual.frameAndOrnament.cornerMotifs=[];
  next.visual.frameAndOrnament.role="unknown";
  assert.equal(validateStyleBrief(next).valid,true);
  next.visual.frameAndOrnament.dividerMotifs=["imagined divider"];
  assert.equal(validateStyleBrief(next).valid,false);
});

test("Unknown frame fields, invalid line weights and arbitrary CSS are rejected", () => {
  const next=clone(previous);
  next.schemaVersion="1.1.0";
  next.visual.frameAndOrnament=clone(frame);
  next.visual.frameAndOrnament.frameLayers[0].weight="99px solid #fff";
  assert.equal(validateStyleBrief(next).valid,false);
  next.visual.frameAndOrnament=clone(frame);
  next.visual.frameAndOrnament.customCss="body{display:none}";
  assert.equal(validateStyleBrief(next).valid,false);
});
