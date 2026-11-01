/* Source-faithful Trip / Now route projection regressions (Issue #120).
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const sources = ["trip-view.js", "today-brief.js"].map((name) => ({
  name, source: readFileSync(new URL("../" + name, import.meta.url), "utf8"),
}));
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const decode = (value) => value?.replaceAll("&lt;", "<").replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const items = (labels) => labels.map((title, index) => ({ id: "stop-" + index, title, start: "TBD" }));

// Exercise the actual public renderers, not a copied routeStops implementation.
// Layout and full-boot behavior are covered separately by the Chromium suite.
function renderDay(fields) {
  const day = freeze({ date: "2026-11-01", label: "Day 1", title: "Published day", ...structuredClone(fields) });
  const before = JSON.stringify(day);
  let onDayClick;
  let nowHtml = "";
  const focus = { set outerHTML(html) { nowHtml = html; } };
  const root = {
    innerHTML: "",
    querySelectorAll(selector) {
      return selector === "[data-trip-day]" ? [{
        dataset: { tripDay: day.date },
        addEventListener(event, callback) { if (event === "click") onDayClick = callback; },
      }] : [];
    },
    querySelector(selector) { return selector === ".companion-focus" ? focus : null; },
  };
  const railCard = { dataset: {}, innerHTML: "" };
  const rightRail = { querySelector() { return railCard; } };
  const publishedContext = {
    phase: "during", today: day,
    previous: { id: "yesterday" }, current: null, next: { id: "tomorrow" }, later: [{ id: "later" }],
  };
  const context = {
    state: { data: { trip: { title: "Route regression", timezone: "UTC" }, ui: { locale: "en" }, days: [day] }, view: "trip" },
    root, URL, escapeHtml: escape, escapeAttr: escape,
    renderTrip() {}, renderNow() {}, getNowContext() { return publishedContext; },
    window: { location: { href: "https://example.test/trip/" }, addEventListener() {} },
    document: { querySelector(selector) { return selector === "#view-root" ? root : rightRail; } },
    getComputedStyle() { return { display: "block" }; },
    requestAnimationFrame(callback) { callback(); return 1; }, cancelAnimationFrame() {},
    MutationObserver: class { observe() {} },
    prettyDate(date) { return date; }, dateRangeLabel() { return day.date; },
    zonedNow() { return { date: day.date, minuteOfDay: 720 }; },
    toMinutes(value) { return value ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : NaN; },
    googleMapsOpenUrl() { return ""; }, TravelLiteStorage: { set() {} }, tripKey(key) { return key; },
  };
  for (const { name, source } of sources) runInNewContext(source, context, { filename: name });
  context.renderTrip();
  const overview = root.innerHTML;
  assert.equal(typeof onDayClick, "function", "the published day must be selectable from Overview");
  onDayClick();
  const trip = root.innerHTML;
  context.state.view = "now";
  context.renderNow();
  assert.equal(JSON.stringify(day), before, "rendering must not rewrite source labels, order, IDs, or times");
  return {
    overview, trip, now: nowHtml, rail: railCard.innerHTML,
    nowContext: context.getNowContext(), publishedContext,
  };
}

function assertRoute(fields, expected) {
  const rendered = renderDay(fields);
  const route = expected.join(" → ");
  const overviewRoute = expected.length ? expected.slice(0, 5).join(" → ") + (expected.length > 5 ? " → …" : "") : "No route summary";
  const overview = rendered.overview.match(/<button class="trip-overview-day[\s\S]*?<p>([\s\S]*?)<\/p>/);
  assert.equal(decode(overview?.[1]), overviewRoute, "Trip Overview keeps the ordered preview");
  const brief = rendered.now.match(/<p class="today-brief-route">([\s\S]*?)<\/p>/);
  const rail = rendered.rail.match(/<p class="shell-context-route">([\s\S]*?)<\/p>/);
  assert.equal(decode(brief?.[1]), expected.length ? route : undefined, "Now keeps every projected occurrence");
  assert.equal(decode(rail?.[1]), expected.length ? route : undefined, "Now's wide context rail agrees");
  if (!expected.length) {
    assert.doesNotMatch(rendered.trip, /class="trip-route-summary/);
    return rendered;
  }
  const count = rendered.trip.match(/class="trip-route-heading"[\s\S]*?<span>(\d+) stops?<\/span>/);
  assert.equal(Number(count?.[1]), expected.length, "Trip count describes visits, not unique names");
  const endpoints = [...rendered.trip.matchAll(/<small>(?:Start|End)<\/small><strong>([\s\S]*?)<\/strong>/g)]
    .map((match) => decode(match[1]));
  assert.deepEqual(endpoints, [expected[0], expected.at(-1)], "the final occurrence is the destination");
  const steps = [...rendered.trip.matchAll(/<span data-surface-role="route-step"><b>(\d+)<\/b>([\s\S]*?)<\/span>/g)]
    .map((match) => [Number(match[1]), decode(match[2])]);
  assert.deepEqual(steps, expected.length > 2 ? expected.map((label, index) => [index + 1, label]) : [],
    "the existing detailed rail threshold is unchanged; numbered visits retain source order");
  return rendered;
}

for (const [name, labels] of [
  ["return visits", ["Alpha", "Beta", "Alpha"]],
  ["consecutive same-name visits", ["Alpha", "Alpha", "Beta"]],
]) {
  test("explicit " + name + " preserve order, occurrence count and endpoint", () => {
    assertRoute({ routeSummary: labels, items: items(["Unrelated fallback"]) }, labels);
  });
  test("item fallback " + name + " preserve order, occurrence count and endpoint", () => {
    assertRoute({ items: items(labels) }, labels);
  });
}

for (const [name, fields] of [
  ["missing", {}], ["null", { routeSummary: null }],
  ["non-array string", { routeSummary: "Explicit-looking text" }],
  ["non-array object", { routeSummary: { label: "Not an array" } }],
  ["empty array", { routeSummary: [] }],
]) {
  test(name + " summary uses existing item fallback", () => {
    assertRoute({ ...fields, items: items(["Alpha", "Beta", "Alpha"]) }, ["Alpha", "Beta", "Alpha"]);
  });
}

test("nonempty invalid explicit summary stays authoritative after projection", () => {
  assertRoute({ routeSummary: [null, undefined, false, 0, 17, {}, [], { label: "" }], items: items(["Do not use fallback"]) }, []);
});

test("nonempty whitespace explicit summary stays authoritative after filtering", () => {
  assertRoute({ routeSummary: [" ", "\t\n", { label: " ", title: "Do not use title" }], items: items(["Do not use fallback"]) }, []);
});

test("mixed explicit entries retain string/label/title projection and truthy priority", () => {
  assertRoute({ routeSummary: ["Alpha", null, 7, true, "", " ", { label: "Beta", title: "Unused" },
    { label: "", title: "Alpha" }, { title: "Beta" }, { label: " ", title: "Unused blank label" }],
  items: items(["Unrelated fallback"]) }, ["Alpha", "Beta", "Alpha", "Beta"]);
});

test("item fallback keeps routeLabel then title then location, before blank filtering", () => {
  assertRoute({ items: [
    { routeLabel: "Alpha", title: "Unused title", location: "Unused location" },
    { routeLabel: "", title: "Beta", location: "Unused location" },
    { routeLabel: null, title: "", location: "Alpha" },
    { routeLabel: " ", title: "Do not use after blank routeLabel" },
    { title: "\t", location: "Do not use after blank title" },
    { location: "Beta" }, {},
  ] }, ["Alpha", "Beta", "Alpha", "Beta"]);
});

test("same labels with different casing or surrounding whitespace are never normalized", () => {
  const labels = [" Alpha ", "alpha", "ALPHA", " Alpha "];
  assertRoute({ routeSummary: labels, items: items(["Ignored"]) }, labels);
  assertRoute({ items: items(labels) }, labels);
});

for (const labels of [["Alpha"], ["Alpha", "Alpha"], ["Alpha", "Beta"], ["Alpha", "Beta", "Gamma"]]) {
  test("single / two / unique-stop control: " + labels.join(" → "), () => {
    assertRoute({ routeSummary: labels, items: items(labels) }, labels);
    assertRoute({ items: items(labels) }, labels);
  });
}

test("longer routes retain the existing five-visit overview preview and full day/Now sequence", () => {
  const labels = ["Alpha", "Beta", "Alpha", "Gamma", "Alpha", "Delta"];
  assertRoute({ routeSummary: labels, items: items(labels) }, labels);
});

test("all-TBD day retains repeats and every plan without fabricated timed neighbors", () => {
  for (const explicit of [true, false]) {
    const fields = { items: [
      { id: "arrival", title: "Alpha", start: "TBD" },
      { id: "visit", title: "Beta" },
      { id: "return", title: "Alpha", start: "" },
    ] };
    if (explicit) fields.routeSummary = ["Alpha", "Beta", "Alpha"];
    const rendered = assertRoute(fields, ["Alpha", "Beta", "Alpha"]);
    assert.equal((rendered.trip.match(/timeline-time--floating/g) || []).length, 3);
    assert.equal((rendered.now.match(/class="today-brief-item"/g) || []).length, 3);
    assert.match(rendered.now, /No fixed times in this itinerary/);
    assert.equal(rendered.nowContext.previous, null);
    assert.equal(rendered.nowContext.current, null);
    assert.equal(rendered.nowContext.next, null);
    assert.equal(rendered.nowContext.later.length, 0);
  }
});

test("timed-day control continues using the existing Now context", () => {
  const rendered = renderDay({ routeSummary: ["Alpha", "Beta", "Alpha"], items: [
    { id: "timed", title: "Alpha", start: "09:00", end: "10:00" },
    { id: "floating", title: "Beta", start: "TBD" },
  ] });
  assert.equal(rendered.now, "", "Today Brief must not replace a timed day's normal window");
  assert.equal(rendered.nowContext, rendered.publishedContext);
});

test("repeated HTML-like labels remain escaped in Trip and Now", () => {
  const labels = ["<img src=x onerror=alert(1)>", "A & B", "<img src=x onerror=alert(1)>"];
  const rendered = assertRoute({ routeSummary: labels, items: items(labels) }, labels);
  for (const html of [rendered.overview, rendered.trip, rendered.now, rendered.rail]) {
    assert.doesNotMatch(html, /<img src=x/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /A &amp; B/);
  }
});
