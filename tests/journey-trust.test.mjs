import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../journey-trust.js", import.meta.url), "utf8");
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
function fixture(data) {
  const context = { state: { data }, URL, escapeHtml: esc, escapeAttr: esc,
    window: {}, root: { querySelector() { return null; } },
    renderTrip() {}, renderNow() {}, renderMap() {}, renderCheck() {}, renderMore() {} };
  runInNewContext(source, context);
  return context.window.TravelLiteTrust;
}
test("legacy trip does not claim verification or invent an index", () => {
  const api = fixture({ trip: {}, days: [] });
  assert.equal(api.warningHtml(), "");
  assert.equal(api.researchNotesHtml(), "");
});
test("all publication states remain accurate data without global draft/NOT RUN banners", () => {
  for (const status of [
    { state: "draft", humanGate: "not-run" },
    { state: "draft", humanGate: "waived" },
    { state: "reviewed", humanGate: "passed" },
    { state: "final", humanGate: "passed" }
  ]) {
    const trip = { publication: { ...status } };
    const api = fixture({ ui: { locale: "zh-TW" }, trip, days: [] });
    assert.equal(api.warningHtml(), "", "no generic publication copy");
    assert.equal(api.warningHtml(true), "", "no repeated warning before Trip/Now/Map");
    assert.equal(api.publication().status, status.state, "original publication state remains");
    assert.equal(api.publication().humanGate, status.humanGate, "original review gate remains");
    assert.deepEqual(trip.publication, status, "do not silently upgrade source facts");
  }
});
test("source links and checked-at dates are retained when a generic banner is suppressed", () => {
  const api = fixture({ ui: { locale: "en" },
    trip: { publication: { state: "draft", humanGate: "waived" } },
    days: [{ items: [{ title: "Stop", transferAfter: { checkedAt: "2026-09-01", sourceLinks: [
      { label: "Operator", url: "https://example.org/route" }] } }] }] });
  assert.equal(api.warningHtml(), "");
  assert.match(api.researchNotesHtml(), /Researched · 2026-09-01/);
  assert.match(api.researchNotesHtml(), /https:\\/\\/example.org\\/route/);
});
test("No link is interpreted as human acceptance; unsafe sources are excluded", () => {
  const api = fixture({ trip: { publication: { state: "reviewed" } }, days: [],
    researchNotes: [{ title: "<script>", sourceLinks: [{ label: "bad", url: "javascript:alert(1)" },
      { label: "<b>", url: "https://example.org" }] }] });
  assert.doesNotMatch(api.warningHtml(), /Verified|Confirmed/);
  assert.match(api.researchNotesHtml(), /&lt;script&gt;/);
  assert.doesNotMatch(api.researchNotesHtml(), /href="javascript:|<script>|<b>/);
});

test("global pages never inject repetitive publication notices, while More keeps research", () => {
  assert.doesNotMatch(source, /trip-trust-notice|function attachNotice/);
  const inserted = [];
  const stack = {insertAdjacentHTML(where, html) {inserted.push({where, html});}};
  const context = {
    state: { data: {
      ui: { locale: "en" },
      trip: { publication: {state:"draft",humanGate:"not-run"} },
      days: [],
      researchNotes: [{title:"Provider check",sourceLinks:[{label:"Official operator",url:"https://example.org/info"}]}]
    }, selectedDate: "2026-11-20" },
    URL, escapeHtml: esc, escapeAttr: esc, window: {},
    root: {
      querySelector(selector) {return selector === ".view-stack" ? stack : null;},
      querySelectorAll() {return [];}
    },
    renderTrip() {}, renderNow() {}, renderMap() {}, renderCheck() {}, renderMore() {}
  };
  runInNewContext(source, context);
  for (const view of ["renderTrip","renderNow","renderMap","renderCheck","renderMore"]) context[view]();
  assert.equal(inserted.some(item => /trip-trust-notice|Human Gate NOT RUN|Draft or unreviewed/.test(item.html)), false);
  assert.ok(inserted.some(item => item.html.includes("Official operator")), "research links remain accessible");
});
