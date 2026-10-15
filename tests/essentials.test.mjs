import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("function travelEssentialsSection(");
const end = source.indexOf("// Native modal dialog", start);
assert.ok(start >= 0 && end > start, "Essentials renderer must be defined");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const detailsSection = (title, count, body) =>
  count ? '<details class="panel more-section"><summary>' + escape(title) + '</summary>' + body + '</details>' : "";
const render = new Function("escapeHtml", "escapeAttr", "detailsSection", "URL",
  source.slice(start, end) + "\nreturn travelEssentialsSection;")(escape, escape, detailsSection, URL);

test("no Essentials entries means no More section", () => {
  assert.equal(render(undefined, "Travel Essentials"), "");
  assert.equal(render([], "Travel Essentials"), "");
  assert.equal(render([{ title: "Empty" }], "Travel Essentials"), "");
});

test("three independent categories and scoped dates render as closed read-only notes", () => {
  const html = render([
    { title: "Airport arrival", category: "Airport transfer", body: "Follow the official operator." },
    { title: "Urban transit", category: "Local transit", summary: "Read the ticket rules.", checkedAt: "2026-10-01" },
    { title: "Intercity ticket", category: "Intercity", body: "Check platform.", dayDate: "2026-10-03",
      sourceLinks: [{ label: "Operator", url: "https://example.org/transit" }] }
  ], "Travel Essentials", false);
  assert.match(html, /Airport arrival/);
  assert.match(html, /Urban transit/);
  assert.match(html, /Intercity ticket/);
  assert.match(html, /Researched · 2026-10-01/);
  assert.match(html, /2026-10-03/);
  assert.match(html, /https:\/\/example.org\/transit/);
  assert.doesNotMatch(html, /<details[^>]* open/);
});

test("malicious notes and source URLs cannot inject HTML or executable links", () => {
  const html = render([{
    title: "<script>alert(1)</script>", body: '<img src=x onerror=alert(1)>',
    sourceLinks: [{ label: "Unsafe", url: "javascript:alert(1)" }]
  }], "Essentials");
  assert.doesNotMatch(html, /<script>|<img|href="javascript:/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /Unsafe/);
});
