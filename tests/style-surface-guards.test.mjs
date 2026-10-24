/* Deliberately broken CSS/geometry must fail the guards before PR #115 can merge.
   These Node tests are build-free and execute the SAME helpers as Playwright.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test } from "node:test";
import assert from "node:assert/strict";
import { sideBorderViolations, findUnpairedSurfaceFrames } from "./style-surface-guards.mjs";

const geometry = (border, inset, styles = ["none", "solid", "none", "solid"]) =>
  ({ border, inset, borderStyles: styles, outlineWidth: 0, outlineStyle: "none", outlineOffset: 0 });

test("P1-A: right/left-only borders with zero padding CANNOT silently pass", () => {
  assert.deepEqual(sideBorderViolations(geometry([0, 1, 0, 1], [0, 0]), 12), ["right", "left"]);
  assert.deepEqual(sideBorderViolations(geometry([0, 0, 0, 1], [0, 0]), 12), ["left"]);
  assert.deepEqual(sideBorderViolations(geometry([0, 1, 0, 0], [0, 0]), 12), ["right"]);
  assert.deepEqual(sideBorderViolations(geometry([0, 1, 0, 1], [12, 0]), 12), ["left"]);
  assert.deepEqual(sideBorderViolations(geometry([0, 1, 0, 1], [16, 16]), 12), []);
  assert.deepEqual(sideBorderViolations(geometry([1, 0, 1, 0], [0, 0], ["solid", "none", "solid", "none"]), 12), []);
  assert.deepEqual(sideBorderViolations(geometry([0, 0, 0, 0], [0, 0]), 12), []);
});

test("P1-A: negative-outline-offset collision also fails, positive focus outline is allowed", () => {
  const info = geometry([0, 0, 0, 0], [0, 0]);
  info.outlineWidth = 2;
  info.outlineStyle = "solid";
  info.outlineOffset = -3;
  assert.deepEqual(sideBorderViolations(info, 12), ["right", "left"]);
  info.outlineOffset = 3;
  assert.deepEqual(sideBorderViolations(info, 12), []);
});

test("P1-B: lint catches border shorthand, side-only and logical inline borders", () => {
  const broken = [
    '.info-row { border: 1px solid black; padding: 13px 0; }',
    '.info-row { border-left: 1px solid black; }',
    '.file-row { border-right: 1px solid black; }',
    '.text-card { border-inline: 2px solid black; padding-inline: 0; }',
    '.cost-total { border-inline-start: 2px solid black; padding: 9px 0 14px; }',
    '.cost-total { border-left-width: 2px; }',
    '.info-row { outline: 1px solid red; outline-offset: -2px; }',
    '[data-surface-role="reading-row"] { border-inline-end: 2px solid blue; }'
  ];
  for (const css of broken) {
    assert.notDeepEqual(findUnpairedSurfaceFrames(css), [], "Unsafe CSS was not detected: " + css);
  }
});

test("P1-B: allow open dividers, reset borders and genuinely inset framed rows", () => {
  const valid = [
    '.info-row { border: 0; padding: 13px 0; }',
    '.info-row { border-top: 1px solid black; padding: 13px 0; }',
    '.info-row { border-inline: none; padding: 13px 0; }',
    '.cost-total { border: 2px solid black; padding: 12px 16px; }',
    '.text-card { border-left: 1px solid black; padding: 13px 16px 13px 14px; }',
    '.info-row { outline: 2px solid red; outline-offset: 3px; }',
  ];
  for (const css of valid) {
    assert.deepEqual(findUnpairedSurfaceFrames(css), [], "Safe CSS was rejected: " + css);
  }
});
