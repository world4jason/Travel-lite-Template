/* Static build-free guard for shared Style Pack role geometry.
   Browser-computed surface rules are checked by style-surface-role.spec.mjs.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { findUnpairedSurfaceFrames } from "./style-surface-guards.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const geometryRoles = ["route-endpoints", "route-step", "map-workspace"];
const geometryTokens = {
  "route-endpoints": { padding: "padding", border: "frame", "border-radius": "radius",
    background: "fill", outline: "outline", "outline-offset": "outline-offset" },
  "route-step": { padding: "padding", border: "frame", "border-radius": "radius", background: "fill" },
  "map-workspace": { padding: "padding", border: "frame", "border-radius": "radius",
    background: "fill", outline: "outline", "outline-offset": "outline-offset" },
};

// Conservative source lint, not a CSS parser or proof of the computed cascade.
// Split selector lists/combinators only outside functions, attributes and quotes,
// so a named surface inside :is() is checked without mistaking its descendants
// (route numbers, arrows, map stage/chrome) for the surface itself.
function splitCssLevel(value, separator) {
  const parts = [];
  let start = 0, parentheses = 0, brackets = 0, quote = "";
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "\\") { i++; continue; }
    if (quote) { if (char === quote) quote = ""; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === "(") parentheses++;
    else if (char === ")") parentheses--;
    else if (char === "[") brackets++;
    else if (char === "]") brackets--;
    else if (!parentheses && !brackets && separator.test(char)) {
      if (value.slice(start, i).trim()) parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (value.slice(start).trim()) parts.push(value.slice(start).trim());
  return parts;
}

function subjectSyntax(subject) {
  let plain = "";
  const functions = [];
  for (let i = 0; i < subject.length;) {
    const head = /^:([a-z-]+)\(/i.exec(subject.slice(i));
    if (!head) { plain += subject[i++]; continue; }
    const start = i + head[0].length;
    let end = start, depth = 1, quote = "";
    for (; end < subject.length && depth; end++) {
      const char = subject[end];
      if (char === "\\") { end++; continue; }
      if (quote) { if (char === quote) quote = ""; continue; }
      if (char === '"' || char === "'") quote = char;
      else if (char === "(") depth++;
      else if (char === ")") depth--;
    }
    functions.push({ name: head[1].toLowerCase(), argument: subject.slice(start, end - 1) });
    i = end;
  }
  return { plain, functions };
}

const roleAttribute = role => new RegExp('\\[data-surface-role\\s*=\\s*["\']' + role + '["\']\\s*\\]');
function excludesRole(argument, role) {
  return splitCssLevel(argument, /,/).some(part => {
    const { plain, functions } = subjectSyntax(part);
    if (!functions.length && roleAttribute(role).exec(plain)?.[0] === plain) return true;
    return !plain && functions.length === 1 && ["is", "where"].includes(functions[0].name)
      && excludesRole(functions[0].argument, role);
  });
}

function targetsSurface(selector, role) {
  return splitCssLevel(selector, /,/).some(branch => {
    const parts = splitCssLevel(branch, /[\s>+~]/);
    const { plain, functions } = subjectSyntax(parts.pop() || "");
    const ancestors = parts.join(" ");
    if (plain.includes("::") || functions.some(fn => fn.name === "not" && excludesRole(fn.argument, role))) return false;
    if (roleAttribute(role).test(plain)) return true;
    if (role === "route-endpoints" && /\.trip-route-endpoints(?![\w-])/.test(plain)) return true;
    if (role === "map-workspace" && /\.(?:runtime-map-panel|map-panel)(?![\w-])/.test(plain)) return true;
    if (role === "route-step" && /^span(?=$|[.#:\[])/.test(plain)
        && /\.trip-route-steps(?![\w-])/.test(ancestors)) return true;
    return functions.some(fn => ["is", "where"].includes(fn.name)
      && splitCssLevel(fn.argument, /,/).some(part => targetsSurface(ancestors + " " + part, role)));
  });
}

function cssRules(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({
    selector: match[1].trim(),
    declarations: new Map(match[2].split(";").flatMap(entry => {
      const declaration = /^\s*([\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(entry);
      return declaration ? [[declaration[1].toLowerCase(), declaration[2]]] : [];
    })),
  }));
}

function findDirectGeometry(css, roles) {
  return cssRules(css).flatMap(({ selector, declarations }) => {
    const properties = [...declarations.keys()].filter(name => /^(?:all|(?:border|padding|background|outline)(?:-[\w-]+)?)$/.test(name));
    return properties.length ? roles.filter(role => targetsSurface(selector, role))
      .map(role => ({ role, selector, properties })) : [];
  });
}

function incompleteConsumers(css, roles) {
  const rules = cssRules(css);
  return roles.flatMap(role => {
    const owner = rules.filter(rule => new RegExp('^:root\\s+' + roleAttribute(role).source + '$').test(rule.selector));
    if (owner.length !== 1) return [{ role, ownerRules: owner.length }];
    const missing = Object.entries(geometryTokens[role]).filter(([property, token]) =>
      !new RegExp('^var\\(\\s*--ui-' + role + '-' + token + '\\s*[,)]')
        .test(owner[0].declarations.get(property) || "")).map(([property]) => property);
    return missing.length ? [{ role, missing }] : [];
  });
}

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

test("Map and Route roles have complete token consumers in the shared geometry owner", () => {
  assert.deepEqual(incompleteConsumers(read("surface-contract.css"), geometryRoles), []);
});

test("component and pack rules cannot reclaim Map or Route frame, inset or paint", () => {
  const styles = readdirSync(new URL("../", import.meta.url))
    .filter(name => name.endsWith(".css") && name !== "surface-contract.css");
  for (const path of styles) {
    assert.deepEqual(findDirectGeometry(read(path), geometryRoles), [],
      path + " writes Map/Route geometry directly; set the paired role tokens instead");
  }
});

test("ownership guard catches shorthand, side overrides and mixed groups without claiming child surfaces", () => {
  const roles = Object.keys(geometryTokens);
  const bad = [
    ['.trip-route-endpoints { border-inline-end: 1px solid; padding: 4px; }', "route-endpoints"],
    [':root[data-visual-style="candy"] .trip-route-steps > span { background-color: red; }', "route-step"],
    ['@media (max-width: 520px) { :root :is(.panel, .runtime-map-panel) { outline-offset: -2px; border: 0; } }', "map-workspace"],
    ['[data-surface-role="route-step"] { all: unset; }', "route-step"],
    ['.map-panel { padding: 18px; }', "map-workspace"],
    ['.other:not([data-surface-role="map-workspace"]) .runtime-map-panel { border-radius: 8px; }', "map-workspace"],
  ];
  for (const [css, role] of bad) {
    assert.deepEqual(findDirectGeometry(css, roles).map(problem => problem.role), [role], css);
  }
  const allowed = `
    .trip-route-endpoints { --ui-route-endpoints-frame: 1px solid; }
    .trip-route-endpoints > span { padding: 4px; }
    .trip-route-steps span b { border-radius: 4px; background: yellow; }
    .trip-route-endpoints::before { border: 1px solid; }
    .runtime-map-panel .runtime-map-stage { border: 2px solid; }
    .runtime-map-panel > .panel-heading { padding: 12px; }
    :is(.panel, .runtime-map-panel) > .runtime-map-stage { border: 1px solid; }
    :is(.runtime-map-panel > .panel-heading, .runtime-map-stage) { padding: 8px; }
    .map-panel:not(:where([data-surface-role="map-workspace"])) { padding: 18px; }
    .runtime-map-panel { --ui-map-workspace-padding: 16px; box-shadow: 0 1px 2px black; overflow: hidden; }
  `;
  assert.deepEqual(findDirectGeometry(allowed, roles), []);
});

test("consumer guard rejects a missing inset and a token from the wrong role", () => {
  const contract = read("surface-contract.css");
  const missingInset = contract.replace(/\bpadding\s*:\s*var\(--ui-route-endpoints-padding[^;]*;/, "");
  assert.notEqual(missingInset, contract, "negative case must actually remove the owner inset");
  assert.deepEqual(incompleteConsumers(missingInset, ["route-endpoints"]),
    [{ role: "route-endpoints", missing: ["padding"] }]);
  const wrongRole = contract.replace("var(--ui-route-step-fill", "var(--ui-route-endpoints-fill");
  assert.notEqual(wrongRole, contract, "negative case must actually replace the step fill token");
  assert.deepEqual(incompleteConsumers(wrongRole, ["route-step"]),
    [{ role: "route-step", missing: ["background"] }]);
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

test("all migrated packs have zero mixed panel/map frame groups", () => {
  // #116 removed the map member from each legacy perimeter group. Mixed
  // typography/material groups remain valid, but the former frame budget is 0.
  const names = [
    "storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor",
  ];
  for (const id of names) {
    const css = read(id + "-theme.css");
    const broadGroups = cssRules(css).filter(({ selector, declarations }) =>
      /\.panel(?![\w-])/.test(selector) && targetsSurface(selector, "map-workspace")
      && [...declarations.keys()].some(property => /^(?:all|(?:border|outline)(?:-[\w-]+)?)$/.test(property)));
    assert.deepEqual(broadGroups.map(rule => rule.selector), [],
      id + " restored a mixed .panel + map workspace frame rule; use the role tokens instead");
  }
});
