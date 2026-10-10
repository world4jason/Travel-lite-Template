import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { renderStylePrompt } from "../render-style-prompt.mjs";
import { validateStyleBrief } from "../validate-style.mjs";

const inputDir = new URL("../examples/", import.meta.url);
const outputDir = new URL("../generated-prompts/", import.meta.url);
const briefs = readdirSync(inputDir).filter(name => name.endsWith(".json")).sort()
  .map(name => JSON.parse(readFileSync(new URL(name, inputDir), "utf8")));

test("all six Style Briefs deterministically produce a reusable fill-in prompt", () => {
  assert.equal(briefs.length, 6);
  for (const brief of briefs) {
    assert.equal(validateStyleBrief(brief).valid, true);
    const content = renderStylePrompt(brief);
    assert.equal(readFileSync(new URL(brief.id + ".md", outputDir), "utf8"), content);
    assert.ok(content.startsWith("# Travel Lite Style Pack 設計提示詞"));
    for (const marker of ["{{DESTINATION_OR_TRIP_CONTEXT}}",
      "{{TRIP_JSON_OR_CONFIRMED_ITINERARY}}", "{{REFERENCE_PHOTO_OR_NONE}}",
      "{{PRIORITY_DETAILS_OR_NONE}}", "{{EXTRA_STYLE_CONSTRAINTS_OR_NONE}}"]) {
      assert.ok(content.includes(marker), brief.id + " missing " + marker);
    }
    assert.ok(content.includes("來源沒給 HEX 就不能聲稱有"));
    assert.ok(content.includes("不移植輸出比例、固定文案或品牌標記"));
    assert.ok(content.includes("原始海報／明信片任務不能直接移植"));
    assert.ok(content.includes("Now / Trip / Map / Check / More"));
    assert.ok(content.includes("現成 CSS"));
    assert.ok(content.includes(brief.visual.material.technique));
  }
});

test("brand, poster copy and photo-only rules survive only as exclusions/conditions", () => {
  const retro = briefs.find(b => b.id === "taiwan-retro-poster");
  const content = renderStylePrompt(retro);
  const bannedSection = content.split("## 原始海報／明信片任務不能直接移植\n")[1];
  assert.ok(bannedSection.includes("MR.PARROT"));
  assert.ok(bannedSection.includes("3:4"));
  assert.ok(content.includes("照片或特定內容存在時才成立"));
  assert.ok(content.includes("沒有原始影像"));
});

test("rendering rejects arbitrary unsafe schema values before writing any style", () => {
  const bad = structuredClone(briefs[0]);
  bad.styleCss = "url(javascript:alert(1))";
  assert.throws(() => renderStylePrompt(bad), /Invalid Style Brief/);
});

test("a website-first minimal brief may have no photo conditions or poster instructions", () => {
  const next = structuredClone(briefs[0]);
  next.sourceTask = "website-style";
  next.constraints.conditional = [];
  next.webTranslation.excludedOriginalInstructions = [];
  next.audit.unknowns = [];
  assert.equal(validateStyleBrief(next).valid, true);
  const text = renderStylePrompt(next);
  assert.ok(text.includes("尚未指定"));
  assert.ok(text.includes("{{DESTINATION_OR_TRIP_CONTEXT}}"));
});
