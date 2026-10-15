import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../runtime-handoff.js", import.meta.url), "utf8");
function fixture(options, locale = "zh-TW", heading) {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  const context = {
    state: { data: { ui: { locale } } }, window: {}, root: { addEventListener() {} },
    URL, renderMap() {}, renderNow() {}, renderTrip() {}, itemActions() {},
    escapeHtml: escape, escapeAttr: escape
  };
  runInNewContext(source, context);
  return context.window.TravelLitePlanB(options, heading);
}

test("missing, empty or unnamed alternatives produce no UI", () => {
  assert.equal(fixture(undefined), "");
  assert.equal(fixture([]), "");
  assert.equal(fixture([{ note: "no option name" }]), "");
});

test("published alternatives stay collapsed and preserve order across categories", () => {
  const html = fixture([
    { title: "Replacement train", mode: "Train", category: "transport", checkedAt: "2026-09-01" },
    { title: "Indoor museum", category: "place" },
    { label: "Lunch cafe", category: "food" }
  ]);
  assert.match(html, /<details class="trip-alternatives">/);
  assert.doesNotMatch(html, /<details[^>]* open/);
  assert.match(html, /3 個選項/);
  assert.ok(html.indexOf("Replacement train") < html.indexOf("Indoor museum"));
  assert.ok(html.indexOf("Indoor museum") < html.indexOf("Lunch cafe"));
  assert.match(html, /資料核對 · 2026-09-01/);
  assert.match(fixture([{ title: "Market" }], "en", "Pocket picks"), /Pocket picks/);
});

test("bad protocols and HTML cannot enter rendered links or option text", () => {
  const html = fixture([{
    title: "<script>alert(1)</script>",
    note: "<img src=x onerror=alert(1)>",
    url: "javascript:alert(1)",
    sourceLinks: [{ label: "Operator", url: "https://example.org/info" },
      { label: "Bad", url: "data:text/html,attack" }]
  }]);
  assert.doesNotMatch(html, /<script>|<img|href="javascript:|href="data:/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /https:\/\/example.org\/info/);
  assert.doesNotMatch(html, /Bad|data-selected|whenToUse/i);
});
