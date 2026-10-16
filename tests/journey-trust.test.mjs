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
test("Draft/waived retains NOT RUN warning, including when source links exist", () => {
  const api = fixture({ ui: { locale: "en" }, trip: { publication: { state: "draft", humanGate: "waived" } },
    days: [{ items: [{ title: "Stop", transferAfter: { checkedAt: "2026-09-01", sourceLinks: [
      { label: "Operator", url: "https://example.org/route" }] } }] }] });
  assert.match(api.warningHtml(), /Human Gate NOT RUN \/ waived/);
  assert.match(api.warningHtml(), /do not confirm tickets or reservations/);
  assert.match(api.researchNotesHtml(), /Researched · 2026-09-01/);
  assert.match(api.researchNotesHtml(), /https:\/\/example.org\/route/);
});
test("No link is interpreted as human acceptance; unsafe sources are excluded", () => {
  const api = fixture({ trip: { publication: { state: "reviewed" } }, days: [],
    researchNotes: [{ title: "<script>", sourceLinks: [{ label: "bad", url: "javascript:alert(1)" },
      { label: "<b>", url: "https://example.org" }] }] });
  assert.doesNotMatch(api.warningHtml(), /Verified|Confirmed/);
  assert.match(api.researchNotesHtml(), /&lt;script&gt;/);
  assert.doesNotMatch(api.researchNotesHtml(), /href="javascript:|<script>|<b>/);
});
