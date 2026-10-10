import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateStyleBrief } from "../validate-style.mjs";

const dir = new URL("../examples/", import.meta.url);
const files = readdirSync(dir).filter(name => name.endsWith(".json")).sort();
const cases = files.map(file => JSON.parse(readFileSync(new URL(file, dir), "utf8")));
const byId = new Map(cases.map(c => [c.id, c]));
const duplicate = value => JSON.parse(JSON.stringify(value));

test("six unrelated prompts preserve six distinct visual languages", () => {
  assert.equal(cases.length, 6);
  assert.equal(new Set(cases.map(c => c.id)).size, 6);
  assert.equal(new Set(cases.map(c => c.visual.geometry.family)).size, 6);
  assert.equal(new Set(cases.map(c => c.visual.material.technique)).size, 6);
  for (const brief of cases) {
    const checked = validateStyleBrief(brief);
    assert.deepEqual(checked.errors, [], brief.id);
    assert.equal(checked.valid, true);
    assert.equal(brief.stage, "brief-only");
    assert.equal(brief.audit.photoProvided, false);
    assert.equal(brief.audit.basis, "text-only");
    assert.ok(brief.webTranslation.excludedOriginalInstructions.length >= 1);
    assert.ok(brief.constraints.conditional.some(c => /照|照片|photo|來源/i.test(c.when)));
    assert.ok(brief.audit.unknowns.some(x => /照|照片|原圖|原始圖像|原始影像|來源圖/i.test(x)),
      brief.id + " must not infer photo details");
  }
});

test("signature traits survive extraction and are not flattened into generic retro", () => {
  assert.equal(byId.get("candy-geometry").visual.palette.maxColors, 5);
  assert.equal(byId.get("candy-geometry").visual.geometry.edgeQuality, "rounded-clean");
  assert.equal(byId.get("paper-collage").visual.material.shadow, "contact-soft");
  assert.equal(byId.get("naive-city-sketch").visual.geometry.edgeQuality, "wobbly");
  assert.equal(byId.get("risograph-zine").visual.material.technique, "risograph");
  assert.equal(byId.get("taiwan-retro-poster").visual.material.technique, "screenprint");
  assert.equal(byId.get("field-stamp").visual.material.technique, "rubber-stamp");
  assert.equal(byId.get("field-stamp").visual.palette.maxColors, 4);
  assert.equal(byId.get("field-stamp").webTranslation.motion, "none");
});

test("missing photos never become fabricated hex measurements, locations or architecture", () => {
  for (const brief of cases) {
    for (const swatch of brief.visual.palette.swatches) {
      assert.equal(swatch.hex, null, brief.id + " invented a measured color");
      assert.equal(swatch.origin, "explicit");
    }
    assert.ok(brief.constraints.conditional.map(x => x.rule).join(" ").length > 10);
    assert.ok(brief.audit.unknowns.length >= 1);
  }
  assert.equal(byId.get("taiwan-retro-poster").visual.palette.swatches.length, 6);
  assert.equal(byId.get("risograph-zine").visual.palette.mode, "monochrome-plus-accent");
  assert.equal(byId.get("paper-collage").visual.palette.mode, "source-derived");
});

test("conflicts and image-only instructions are identified explicitly", () => {
  assert.ok(byId.get("candy-geometry").audit.conflicts.some(x => /五色|第六色/.test(x.issue)));
  assert.ok(byId.get("risograph-zine").audit.conflicts.some(x => /No labels|no extra text|文字/.test(x.issue)));
  assert.ok(byId.get("taiwan-retro-poster").webTranslation.excludedOriginalInstructions.some(x => /3:4/.test(x.instruction)));
  assert.ok(byId.get("taiwan-retro-poster").webTranslation.excludedOriginalInstructions.some(x => /MR.PARROT/.test(x.instruction)));
  assert.ok(byId.get("paper-collage").webTranslation.excludedOriginalInstructions.some(x => /年份/.test(x.instruction)));
});

test("unknown fields, invalid enum, injected CSS, fake photo status and malformed colors fail", () => {
  const original = byId.get("candy-geometry");
  const mutations = [
    brief => { brief.visual.customCss = "body{display:none}"; },
    brief => { brief.visual.material.technique = "url(javascript:bad)"; },
    brief => { brief.stage = "style-pack-complete"; },
    brief => { brief.audit.photoProvided = true; },
    brief => { brief.visual.palette.swatches[0].hex = "#FFF"; },
    brief => { brief.visual.palette.maxColors = 4; },
    brief => { brief.webTranslation.recommendedBase = "https://example.com/style.css"; },
    brief => { brief.visual.mood = ["可愛", "可愛"]; },
    brief => { delete brief.webTranslation.excludedOriginalInstructions; },
    brief => { brief.visual.geometry.outline.weight = 99; },
    brief => { brief.webTranslation.implementationTier = "token-variant"; brief.webTranslation.recommendedBase = "new-style-pack"; },
  ];
  for (const mutation of mutations) {
    const bad = duplicate(original);
    mutation(bad);
    assert.equal(validateStyleBrief(bad).valid, false, JSON.stringify(bad).slice(0, 190));
  }
});

test("every case documents website transfer, asset treatment and excluded deliverable syntax", () => {
  for (const brief of cases) {
    assert.ok(brief.webTranslation.transferable.length >= 2);
    assert.ok(brief.webTranslation.assetTreatment.length >= 1);
    assert.ok(brief.webTranslation.componentRisks.length >= 1);
    assert.ok(brief.webTranslation.excludedOriginalInstructions.every(x => x.instruction && x.reason));
    assert.notEqual(brief.webTranslation.implementationTier, "token-variant");
    assert.ok(["storybook", "new-style-pack"].includes(brief.webTranslation.recommendedBase));
  }
});

test("no speculative style briefs become live runtime CSS or replace the sample trip", () => {
  const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
  const trip = JSON.parse(readFileSync(resolve(root, "trip.json"), "utf8"));
  assert.ok(trip.days.length > 0);
  assert.ok(!["candy-geometry", "paper-collage", "field-stamp"].includes(trip.ui.visualStyle));
  assert.ok(cases.every(c => c.stage === "brief-only"));
});

test("future styles are not limited to six hardcoded visual vocabularies", () => {
  const next = duplicate(byId.get("candy-geometry"));
  next.id = "pixel-postcard";
  next.name.en = "Pixel Postcard";
  next.sourceTask = "website-redesign";
  next.visual.geometry.family = "pixel-grid";
  next.visual.geometry.edgeQuality = "pixel-sharp";
  next.visual.material.technique = "pixel-art";
  next.visual.material.depth = "isometric";
  next.visual.palette.mode = "duotone";
  next.visual.palette.maxColors = 2;
  next.visual.palette.swatches = next.visual.palette.swatches.slice(0, 2);
  assert.equal(validateStyleBrief(next).valid, true,
    validateStyleBrief(next).errors.join("\n"));
});

test("photo-backed outputs require an explicit text-and-image evidence basis", () => {
  const a = duplicate(byId.get("candy-geometry"));
  a.audit.photoProvided = true;
  assert.equal(validateStyleBrief(a).valid, false);
  a.audit.basis = "text-and-image";
  assert.equal(validateStyleBrief(a).valid, true,
    validateStyleBrief(a).errors.join("\n"));
});


test("short website-first prompts are valid without photo rules or postcard exclusions", () => {
  const website = duplicate(byId.get("candy-geometry"));
  website.id = "minimal-web";
  website.sourceTask = "website-design";
  website.visual.mood = ["minimal"];
  website.visual.geometry.motifs = [];
  website.visual.palette.mode = "adaptive";
  website.visual.palette.maxColors = null;
  website.visual.palette.swatches = [];
  website.visual.palette.usage = ["Use a calm limited color scheme"];
  website.constraints.must = ["Keep high contrast"];
  website.constraints.avoid = [];
  website.constraints.conditional = [];
  website.webTranslation.recommendedBase = "editorial";
  website.webTranslation.implementationTier = "token-variant";
  website.webTranslation.assetTreatment = [];
  website.webTranslation.excludedOriginalInstructions = [];
  website.webTranslation.transferable = ["Neutral typography tokens"];
  website.audit.unknowns = [];
  website.audit.conflicts = [];
  assert.deepEqual(validateStyleBrief(website).errors, []);
});
