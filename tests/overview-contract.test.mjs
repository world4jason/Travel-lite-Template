/* Compact Overview / unified appearance contract.
 * SPDX-License-Identifier: AGPL-3.0-or-later */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const files = Object.fromEntries([
  "trip-view.js", "overview-compact.css", "companion-ux.js", "app.js",
  "index.html", "sw.js", "theme-shell.js", "manifest.webmanifest", "trip.json", "docs/UIUX.md", "docs/uiux/TRIP.md",
  "docs/uiux/SHARED.md"
].map((path) => [path, read(path)]));

function overviewDefects(source) {
  const issues = [];
  const view = source["trip-view.js"];
  const css = source["overview-compact.css"];
  const rail = source["companion-ux.js"];
  const app = source["app.js"];
  const index = source["index.html"];
  const sw = source["sw.js"];
  if (source["theme-shell.js"].includes('document.createElement("button")') ||
      source["theme-shell.js"].includes('button.addEventListener("click"'))
    issues.push("top quick theme switcher duplicates Style Picker");
  const manifest = JSON.parse(source["manifest.webmanifest"]);
  if (manifest.background_color !== "#f5f6f2" || manifest.theme_color !== "#f5f6f2")
    issues.push("PWA splash default must be Light");
  const data = JSON.parse(source["trip.json"]);
  const compact = view.slice(view.indexOf("function overviewModeIcons"), view.indexOf("function renderOverview"));
  const side = rail.slice(rail.indexOf('if (currentTripMode() === "overview") {'));
  const sideOverview = side.slice(0, side.indexOf("} else {"));

  if (!compact.includes("day.items") || compact.includes("day.mobility")) issues.push("overview must derive modes from source items");
  if (!compact.includes("dayRouteText(day)")) issues.push("overview route summary missing");
  if (!view.includes('trip-overview-compact-hero')) issues.push("compact hero missing");
  if (!view.includes('trip-overview-compact-day')) issues.push("compact day missing");
  if (!view.includes('localized("行程項目", "itinerary items")') || view.includes("planned stops")) issues.push("incorrect itinerary count label");
  if (!css.includes("trip-overview-compact-hero::after") ||
      !css.includes("trip-overview-compact-day::after") ||
      !/content:\s*none\s*!important/.test(css)) issues.push("large pseudo illustration not disabled");
  if (!/@container\s*\(min-width:\s*840px\)/.test(css)) issues.push("container width responsive grid missing");
  if (sideOverview.includes("shell-stat-grid") || sideOverview.includes("flattenItems().length"))
    issues.push("right rail duplicates overview counts");
  if (!sideOverview.includes("right.innerHTML = reservations ?")) issues.push("right rail should hide without distinct content");
  if (app.includes('class="theme-switcher"') || app.includes('querySelectorAll("[data-theme]")'))
    issues.push("duplicate theme controls");
  if (!app.includes('"editorial-light"') || !app.includes('"editorial-dark"'))
    issues.push("style picker missing Light/Dark choices");
  if (data.ui.theme !== "light" || data.ui.visualStyle !== "editorial" ||
      !index.includes('data-theme="light"')) issues.push("clean template must start Light");
  if (!index.includes("overview-compact.css?v=") || !sw.includes("overview-compact.css?v="))
    issues.push("overview css missing from page/PWA shell");
  if (!source["docs/UIUX.md"].includes("P1.12 Compact Trip Overview") ||
      !source["docs/UIUX.md"].includes("P1.13 One appearance selector"))
    issues.push("product contract missing");
  return issues;
}

test("shipped template satisfies compact Overview and one appearance selector", () => {
  assert.deepEqual(overviewDefects(files), []);
});
test("reject generic stickers re-entering the Overview", () => {
  const broken = {...files, "overview-compact.css": files["overview-compact.css"].replace(/content:\s*none\s*!important/, "content: ''")};
  assert.match(overviewDefects(broken).join(" "), /pseudo illustration/);
});
test("reject second Light/Dark/System switcher underneath the 16-style picker", () => {
  const broken = {...files, "app.js": files["app.js"] + '\nconst duplicate = \'class="theme-switcher"\';'};
  assert.match(overviewDefects(broken).join(" "), /duplicate theme controls/);
});
test("reject inherited counted items being described as tourist stops", () => {
  const broken = {...files, "trip-view.js": files["trip-view.js"].replace(
    'localized("行程項目", "itinerary items")', 'localized("景點數", "planned stops")')};
  assert.match(overviewDefects(broken).join(" "), /incorrect itinerary count label/);
});
test("reject Overview depending on a Kansai-only mobility field", () => {
  const broken = {...files, "trip-view.js": files["trip-view.js"].replace(
    "dayRouteText(day);", "day.mobility?.route || dayRouteText(day);")};
  assert.match(overviewDefects(broken).join(" "), /source items/);
});
test("reject redundant right rail stats returning", () => {
  const broken = {...files, "companion-ux.js": files["companion-ux.js"].replace(
    'right.innerHTML = reservations ?', 'right.innerHTML = flattenItems().length && reservations ?')};
  assert.match(overviewDefects(broken).join(" "), /duplicates overview counts/);
});

test("reject a second quick theme toggle in the global header", () => {
  const broken = {...files, "theme-shell.js": files["theme-shell.js"] + '\nbutton.addEventListener("click", toggleTheme);'};
  assert.match(overviewDefects(broken).join(" "), /quick theme switcher/);
});
