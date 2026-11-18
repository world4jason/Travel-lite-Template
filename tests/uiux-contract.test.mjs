/* UI/UX contract linkage gate. SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const agents = read("AGENTS.md"), uiux = read("docs/UIUX.md");

test("AGENTS.md requires agents to fully read UIUX.md before UI or trip generation work", () => {
  const front = agents.split("## AGPL compliance")[0];
  assert.match(front, /docs\/UIUX\.md/);
  assert.match(front, /MUST|必須|強制/);
  assert.match(front, /test:uiux/);
  assert.match(front, /test:timeline/);
});

test("UI/UX has ordered P0, P1, P2 with mandatory canonical time blocks and five tabs", () => {
  const p0 = uiux.indexOf("## P0"), p1 = uiux.indexOf("## P1"), p2 = uiux.indexOf("## P2");
  assert.ok(p0 > 0 && p1 > p0 && p2 > p1, "priority levels must be explicit and ordered");
  for (const id of ["P0.1", "P0.2", "P0.3", "P0.4", "P0.5", "P0.6"])
    assert.ok(uiux.includes("### " + id), "missing core UX rule " + id);
  assert.match(uiux, /Chronological Itinerary Timeline/);
  assert.match(uiux, /P0\.1a/);
  assert.match(uiux, /P1\.8/);
  assert.match(uiux, /Journey/);
  assert.match(uiux, /Time-blocked Schedule/);
  assert.match(uiux, /10:00–11:00/);
  assert.match(uiux, /11:00–11:30/);
  assert.match(uiux, /11:30–13:00/);
  assert.match(uiux, /13:00–15:00/);
  assert.match(uiux, /type: transport/);
  assert.match(uiux, /Now \/ Trip \/ Transport \/ Places \/ More/);
  assert.match(uiux, /state\.selectedDate/);
  assert.match(uiux, /不可|不得/);
});

test("all mandatory contract references exist and schema/README link back to UIUX", () => {
  for (const path of ["docs/CHRONOLOGICAL_TIMELINE_CONTRACT.md", "docs/TRIP_SCHEMA.md",
    "docs/MAINTENANCE.md", "docs/STYLE_SURFACE_CONTRACT.md"]) {
    // Some trip forks omit the generic Style Surface documentation; check it when present.
    if (path.includes("STYLE_SURFACE") && !existsSync(new URL(path, root))) continue;
    assert.ok(existsSync(new URL(path, root)), "missing mandatory document: " + path);
  }
  assert.match(read("docs/TRIP_SCHEMA.md"), /UIUX\.md/);
  assert.match(read("README.md"), /docs\/UIUX\.md/);
  assert.match(read("docs/MAINTENANCE.md"), /test:uiux/);
  assert.match(read("docs/CHRONOLOGICAL_TIMELINE_CONTRACT.md"), /UIUX\.md/);
});

test("test and CI scripts enforce reading contract without replacing chronology QA", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts["test:uiux"] || "", /uiux-contract\.test\.mjs/);
  assert.match(pkg.scripts["test:timeline"] || "", /chronological-timeline/);
  const flow = read(".github/workflows/chronological-timeline.yml");
  assert.match(flow, /npm run test:uiux/);
  assert.match(flow, /npm run test:timeline/);
});

test("Kansai-specific requirements can only extend, never replace the universal contract", () => {
  const path = "docs/UIUX_KANSAI.md";
  if (!existsSync(new URL(path, root))) return;
  const local = read(path);
  assert.match(agents.split("## AGPL compliance")[0], /UIUX_KANSAI\.md/);
  assert.match(local, /UIUX\.md/);
  assert.match(local, /P0\/P1/);
});
