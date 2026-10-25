/* Static build-free guard for shared Style Pack role geometry.
   Browser-computed surface rules are checked by style-surface-role.spec.mjs.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findUnpairedSurfaceFrames } from "./style-surface-guards.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("semantic surface roles are stable markup in shared renderers, never pack-specific branches", () => {
  const app = read("app.js");
  const trip = read("trip-view.js");
  const map = read("runtime-features.js");
  const transport = read("transport-overview.js");
  for (const tag of ['class="info-row"', 'class="info-row compact-row"',
    'class="text-card"', 'class="text-card travel-essential"',
    'class="file-row"']) {
    const expression = tag.replaceAll('"', '\\"');
    // App source contains HTML strings, not actual mounted DOM.
    assert.ok(app.includes(tag + ' data-surface-role="reading-row"'),
      "Missing role on " + expression);
  }
  assert.match(app, /class="panel more-section" data-surface-role="section"/);
  assert.match(app, /class="panel more-section preparation-section" data-surface-role="section"/);
  assert.match(app, /class="cost-total" data-surface-role="cost-summary"/);
  assert.match(trip, /class="trip-route-endpoints" data-surface-role="route-endpoints"/);
  assert.match(trip, /<span data-surface-role="route-step"><b>/);
  assert.match(map, /class="map-panel runtime-map-panel composition-narrative" data-surface-role="map-workspace"/);
  assert.match(map, /class="selected-place-card map-selected-summary" data-surface-role="selected-stop"/);
  assert.match(transport, /details\.dataset\.surfaceRole="transport-context"/);
});

test("one shared last-loaded CSS file owns coupled reading row geometry", () => {
  const index = read("index.html");
  const contract = read("surface-contract.css");
  const styleIndex = index.indexOf('id="vintage-watercolor-style"');
  const contractIndex = index.indexOf('href="./surface-contract.css"');
  assert.ok(styleIndex >= 0 && contractIndex > styleIndex,
    "Surface contract MUST load after the last Style Pack overlay");
  for (const property of [
    "--ui-reading-row-frame", "--ui-reading-row-divider", "--ui-reading-row-padding",
    "--ui-reading-row-radius", "--ui-reading-row-fill",
  ]) assert.ok(contract.includes("var(" + property), property + " not controlled by role contract");
  assert.match(contract, /:root \[data-surface-role="reading-row"\]/);
  assert.match(contract, /:root \[data-surface-role="cost-summary"\]/);
  for (const key of ["--ui-cost-summary-frame", "--ui-cost-summary-padding",
    "--ui-cost-summary-radius", "--ui-cost-summary-fill"]) {
    assert.ok(contract.includes("var(" + key), "Cost total must pair " + key);
  }
  const storybook = read("storybook-theme.css");
  const riso = read("risograph-theme.css");
  assert.match(storybook, /--ui-reading-row-frame:\s*2px solid/);
  assert.match(storybook, /--ui-reading-row-padding:\s*13px;/);
  assert.match(riso, /--ui-reading-row-frame:\s*0;/);
  assert.match(riso, /--ui-reading-row-divider:\s*1px solid/);
  assert.match(riso, /--ui-reading-row-padding:\s*13px 0;/);
  assert.match(storybook, /--ui-cost-summary-frame:\s*2px solid/);
  assert.match(storybook, /--ui-cost-summary-padding:\s*13px;/);
  assert.match(riso, /--ui-cost-summary-frame:\s*2px solid/);
  assert.match(riso, /--ui-cost-summary-padding:\s*12px 16px;/);
});

test("offline assets and contract smoke suites are registered", () => {
  const sw = read("sw.js");
  const config = read("playwright.config.mjs");
  assert.match(sw, /"\.\/surface-contract\.css"/);
  assert.match(config, /"style-surface-role\.spec\.mjs"/);
  assert.match(config, /"style-surface-padding\.spec\.mjs"/);
  assert.match(config, /"style-surface-matrix\.spec\.mjs"/);
});

test("no theme may add an unpaired frame to reading rows OR cost summaries", () => {
  const names = [
    "storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor",
  ];
  for (const id of names) {
    const problems = findUnpairedSurfaceFrames(read(id + "-theme.css"));
    assert.deepEqual(problems, [],
      id + " adds framed reading/cost rows without corresponding inline insets");
  }
});

test("no NEW cross-role panel/map border groups beyond the existing legacy budget", () => {
  // All 14 packs currently contain one broad perimeter group inherited from
  // early theme creation. This is recorded migration debt, not proof that all
  // styles fail visually. New groups are forbidden; phase #116 removes them
  // gradually only after per-pack screenshots and functional Map QA.
  const names = [
    "storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor",
  ];
  for (const id of names) {
    const css = read(id + "-theme.css");
    const broadGroups = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(match => {
      const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
      return selector.includes(".panel") && selector.includes(".runtime-map-panel")
        && /(^|;)\s*border\s*:/.test(match[2]);
    });
    assert.ok(broadGroups.length <= 1,
      id + " added another mixed .panel + .runtime-map-panel frame rule; split by surface role instead");
  }
});
