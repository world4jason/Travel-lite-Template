/* #109: global ID-only linking must never guess a source visit.
   Tests mutate an intercepted *copy* of trip.json; no published data edits.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const original = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url),"utf8"));

const data = () => structuredClone(original);
const collision = () => {
  const trip = data();
  trip.days[1].items[0].id = "d1-shibuya"; // Senso-ji collides with Shibuya walk
  trip.reservations.push({id:"ambiguous-one",itemId:"d1-shibuya",title:"Ambiguous admission marker",status:"confirmed",url:"https://example.org/one"});
  trip.reservations.push({id:"ambiguous-many",itemIds:["d1-shibuya","missing"],title:"Ambiguous group pass",status:"confirmed"});
  trip.files.push({id:"ambiguous-file",itemId:"d1-shibuya",title:"Ambiguous ticket filename",url:"https://example.org/ticket"});
  trip.files.push({id:"ambiguous-multifile",itemIds:["d1-shibuya"],title:"Ambiguous multi-file",url:"https://example.org/group"});
  return trip;
};
async function provide(page, trip) {
  await page.route("**/trip.json",route =>
    route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(trip)}));
}
test("two-day Senso-ji collision keeps source cards but never opens Shibuya or its booking",async({page},info)=>{
  await page.setViewportSize({width:320,height:568});
  await provide(page,collision());
  await page.goto("/#places");
  const warning=page.locator("[data-item-identity-warning]");
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("d1-shibuya");
  await expect(warning).toContainText("days[0].items[2]");
  await expect(warning).toContainText("days[1].items[0]");
  const cards=page.locator(".places-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.filter({hasText:"Senso-ji"})).toHaveCount(1);
  await expect(cards.filter({hasText:"Shibuya walk"})).toHaveCount(1);
  await expect(page.locator('[data-open-place="d1-shibuya"]')).toHaveCount(0);
  await expect(page.locator(".places-entry-chip")).toHaveCount(0);
  await expect(page.locator(".places-ambiguous-card")).toHaveCount(2);
  await page.screenshot({path:info.outputPath("duplicate-places-list-320.png"),animations:"disabled"});
  await page.goto("/#places/item/d1-shibuya");
  await expect(page.locator(".places-identity-warning")).toBeVisible();
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await expect(page.locator(".places-entry")).toHaveCount(0);
  await expect(page.locator('[data-places-trip],[data-places-transport]')).toHaveCount(0);
  await page.screenshot({path:info.outputPath("duplicate-id-deeplink-320.png"),animations:"disabled"});
  await page.locator("[data-places-back]").click();
  await expect(page.locator(".places-card")).toHaveCount(3);
  await page.locator('[data-view="more"]').click();
  await expect(page.locator(".info-row").filter({hasText:"Ambiguous admission marker"})).toHaveCount(1);
  await expect(page.locator(".file-row").filter({hasText:"Ambiguous ticket filename"})).toHaveCount(1);
});

test("Trip place action for duplicate ID is disabled, while unique Trip detail still works",async({page})=>{
  await provide(page,collision());
  await page.goto("/#trip/day/2026-10-04");
  await expect(page.locator(".trip-v2-item").filter({hasText:"Senso-ji"})).toHaveCount(1);
  const sensoji=page.locator(".trip-v2-item").filter({hasText:"Senso-ji"});
  await expect(sensoji.locator('[data-open-place="d1-shibuya"]')).toHaveCount(0);
  await expect(sensoji.locator(".trip-identity-warning")).toBeVisible();
  await page.goto("/#trip/day/2026-10-03");
  await expect(page.locator(".trip-v2-item").filter({hasText:"Shibuya walk"}).locator('[data-open-place="d1-shibuya"]')).toHaveCount(0);
  await page.goto("/#trip/day/2026-10-04");
  await page.locator('[data-open-place="d2-ueno"]').click();
  await expect(page.locator(".places-detail-heading")).toContainText("Ueno museums");
});

for(const width of [320,390,1100]){
  test("ambiguous Transport stop never selects the wrong day/venue at "+width,async({page},info)=>{
    await page.setViewportSize({width,height:width===1100?900:844});
    await provide(page,collision());
    await page.goto("/#map/day/2026-10-04/stop/d1-shibuya");
    await expect(page.locator(".runtime-map-panel")).toBeVisible();
    await expect(page.locator(".places-identity-warning")).toBeVisible();
    await expect(page.locator(".map-selected-summary")).toHaveCount(0);
    const disabled=page.locator(".place-chip").filter({hasText:"Senso-ji"});
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute("aria-pressed","false");
    await expect(disabled).not.toHaveClass(/active/);
    await expect(page.locator(".map-primary-handoff")).toHaveCount(0);
    await page.screenshot({path:info.outputPath("ambiguous-transport-"+width+".png"),animations:"disabled"});
    // Unique day source remains accessible and is not projected as an ambiguous booking.
    await page.locator('[data-runtime-map-date="2026-10-03"]').click();
    await expect(page.locator(".map-selected-summary")).toBeVisible();
    await expect(page.locator(".map-selected-summary")).not.toContainText("Shibuya walk");
  });
}

test("same-day duplicate and non-Place collision are caught globally",async({page})=>{
  const trip=data();
  trip.days[1].items[2].id="d2-sensoji"; // two Places within one day
  await provide(page,trip);
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await expect(page.locator(".places-identity-warning")).toContainText("days[1].items[0]");
  await expect(page.locator(".places-identity-warning")).toContainText("days[1].items[2]");
});

test("a non-Place item sharing a Place ID blocks that Place lookup",async({page})=>{
  const trip=data();trip.days[0].items[0].id="d2-sensoji"; // transport/nonplace collision
  await provide(page,trip);
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await expect(page.locator(".places-identity-warning")).toContainText("days[0].items[0]");
});

test("missing/empty fallback ID is preserved without guessing; collided fallback is rejected",async({page})=>{
  const trip=data();trip.days[1].items[0].id="";
  await provide(page,trip);
  await page.goto("/#places");
  const fallback=trip.days[1].id+"-item-1";
  await expect(page.locator('[data-open-place="'+fallback+'"]')).toHaveCount(1);
  await expect(page.locator(".places-identity-warning")).toHaveCount(0);
  trip.days[0].items[2].id=fallback;
  await page.unroute("**/trip.json");
  await provide(page,trip);
  await page.reload();
  await expect(page.locator(".places-identity-warning")).toBeVisible();
  await expect(page.locator('[data-open-place="'+fallback+'"]')).toHaveCount(0);
});

test("malformed or unknown ID-only deep links show no inferred place or booking",async({page})=>{
  await provide(page,collision());
  await page.goto("/#places/item/no-such-id");
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await expect(page.locator(".places-identity-warning")).toBeVisible();
  await page.goto("/#places/item/%E0%A4%A");
  await expect(page.locator(".places-detail-heading")).toHaveCount(0);
  await expect(page.locator(".places-identity-warning")).toBeVisible();
});

test("valid unique IDs and explicit admission links still work unchanged",async({page})=>{
  const trip=data();
  trip.reservations.push({id:"known",itemIds:["d2-sensoji"],title:"Unique Senso-ji reservation"});
  trip.files.push({id:"known-file",itemId:"d2-sensoji",title:"Unique Senso-ji file"});
  await provide(page,trip);
  await page.goto("/#places/item/d2-sensoji");
  await expect(page.locator(".places-identity-warning")).toHaveCount(0);
  await expect(page.locator(".places-entry")).toContainText("Unique Senso-ji reservation");
  await expect(page.locator(".places-entry")).toContainText("Unique Senso-ji file");
  await page.locator("[data-places-trip]").click();
  await expect(page.locator(".trip-day-view")).toContainText("Asakusa");
});

test("repeat reload does not mutate trip IDs or resurrect unsafe links",async({page})=>{
  const trip=collision();await provide(page,trip);
  for(let i=0;i<3;i++){
    await page.goto("/#places/item/d1-shibuya");
    await expect(page.locator(".places-detail-heading")).toHaveCount(0);
    await expect(page.locator(".places-identity-warning")).toBeVisible();
    expect(await page.evaluate(()=>state.data.days[1].items[0].id)).toBe("d1-shibuya");
    await page.reload();
  }
});

test("malicious duplicate source IDs render as text, never executable markup",async({page})=>{
  const trip=data(),bad='<img src=x onerror=alert(1)>';
  trip.days[0].items[2].id=bad;
  trip.days[1].items[0].id=bad;
  await provide(page,trip);
  await page.goto("/#places");
  await expect(page.locator("[data-item-identity-warning]")).toContainText(bad);
  await expect(page.locator("[data-item-identity-warning] img")).toHaveCount(0);
  await expect(page.locator(".places-ambiguous-card")).toHaveCount(2);
});


// Residual #109 review finding: a personal choice must never cross source items.
const personal = label => ({
  mode: "personal", prompt: `Preference ${label}`,
  options: [
    { id: "a", label: `A ${label}`, note: `First ${label}` },
    { id: "b", label: `B ${label}`, note: `Second ${label}` },
  ],
});
const personalTrip = () => {
  const trip = data();
  trip.days[0].items[0].decision = personal("Day1");
  trip.days[1].items[1].decision = personal("Day2");
  return trip;
};
const decisionCard = (page, label) => page.locator("#view-root .decision-card").filter({ hasText: `Preference ${label}` });
async function storedPersonal(page) {
  return page.evaluate(() => TravelLiteStorage.get(tripKey("personalDecisions")));
}
async function staleChoice(page, itemId, optionId) {
  return page.evaluate(async ({ itemId, optionId }) => {
    const originalSet = TravelLiteStorage.set;
    let writes = 0;
    TravelLiteStorage.set = async (...args) => { writes++; return originalSet.apply(TravelLiteStorage, args); };
    const button = document.createElement("button");
    button.dataset.personalDecisionItem = itemId;
    button.dataset.personalDecisionOption = optionId;
    document.querySelector("#view-root").append(button);
    button.click();
    await Promise.resolve();
    button.remove();
    TravelLiteStorage.set = originalSet;
    return writes;
  }, { itemId, optionId });
}

for (const width of [320, 390, 1100]) {
  test(`personal choices stay stored but unattributed after a cross-day ID collision at ${width}`, async ({ page }, info) => {
    const trip = personalTrip();
    const id = trip.days[0].items[0].id;
    await page.setViewportSize({ width, height: width === 1100 ? 900 : 844 });
    await provide(page, trip);
    await page.goto("/#trip/day/2026-10-03");
    const day1 = decisionCard(page, "Day1");
    await day1.getByRole("button", { name: "A Day1", exact: true }).click();
    await expect.poll(async () => (await storedPersonal(page))?.[id]).toBe("a");
    await expect(day1.getByRole("button", { name: "✓ A Day1", exact: true })).toHaveClass(/primary/);

    // A later published revision introduces the duplicate; old device data is
    // retained, but neither source item may claim ownership of that selection.
    trip.days[1].items[1].id = id;
    await page.unroute("**/trip.json");
    await provide(page, trip);
    await page.reload();
    await expect.poll(() => page.evaluate(key => state.personalDecisionSelections[key], id)).toBe("a");
    await expect(day1.locator("[data-personal-decision-unavailable]")).toBeVisible();
    await expect(day1.locator("[data-personal-decision-unavailable]")).toContainText("Ask the trip publisher");
    await expect(day1.locator("[data-personal-decision-item]")).toHaveCount(0);
    await expect(day1).toContainText("A Day1");
    await expect(day1).not.toContainText("✓ A Day1");
    await page.goto("/#trip/day/2026-10-04");
    const day2 = decisionCard(page, "Day2");
    await expect(day2.locator("[data-personal-decision-unavailable]")).toBeVisible();
    await expect(day2.locator("[data-personal-decision-unavailable]")).toContainText("Ask the trip publisher");
    await expect(day2.locator("[data-personal-decision-item]")).toHaveCount(0);
    await expect(day2).toContainText("A Day2");
    await expect(day2).not.toContainText("✓ A Day2");
    await day2.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`personal-collision-${width}.png`), animations: "disabled" });
    expect(await staleChoice(page, id, "b")).toBe(0);
    expect((await storedPersonal(page))[id]).toBe("a");
    expect(await page.evaluate(key => state.personalDecisionSelections[key], id)).toBe("a");
  });
}

test("unique personal selections persist without selecting another day's choice", async ({ page }) => {
  const trip = personalTrip();
  const id = trip.days[0].items[0].id;
  await provide(page, trip);
  await page.goto("/#trip/day/2026-10-03");
  await decisionCard(page, "Day1").getByRole("button", { name: "B Day1", exact: true }).click();
  await expect.poll(async () => (await storedPersonal(page))?.[id]).toBe("b");
  await page.goto("/#trip/day/2026-10-04");
  await expect(decisionCard(page, "Day2").getByRole("button", { name: "A Day2", exact: true })).toBeVisible();
  await expect(decisionCard(page, "Day2").locator("button.primary")).toHaveCount(0);
  await page.goto("/#trip/day/2026-10-03");
  await expect(decisionCard(page, "Day1").getByRole("button", { name: "✓ B Day1", exact: true })).toHaveClass(/primary/);
  await page.reload();
  await expect(decisionCard(page, "Day1").getByRole("button", { name: "✓ B Day1", exact: true })).toHaveClass(/primary/);
  expect(await staleChoice(page, id, "unpublished-option")).toBe(0);
  expect((await storedPersonal(page))[id]).toBe("b");
});

for (const invalid of [" invalid-id ", 123]) {
  test(`malformed personal item ID stays read-only: ${JSON.stringify(invalid)}`, async ({ page }) => {
    const trip = personalTrip();
    trip.days[0].items[0].id = invalid;
    await provide(page, trip);
    await page.goto("/#trip/day/2026-10-03");
    const card = decisionCard(page, "Day1");
    await expect(card.locator("[data-personal-decision-unavailable]")).toBeVisible();
    await expect(card.locator("[data-personal-decision-item]")).toHaveCount(0);
    await expect(card).toContainText("A Day1");
    expect(await staleChoice(page, String(invalid), "a")).toBe(0);
  });
}

test("a generated missing-ID fallback remains usable only while globally unique", async ({ page }) => {
  const trip = personalTrip();
  delete trip.days[0].items[0].id;
  const fallback = `${trip.days[0].id}-item-1`;
  await provide(page, trip);
  await page.goto("/#trip/day/2026-10-03");
  await decisionCard(page, "Day1").getByRole("button", { name: "A Day1", exact: true }).click();
  await expect.poll(async () => (await storedPersonal(page))?.[fallback]).toBe("a");
  trip.days[1].items[1].id = fallback;
  await page.unroute("**/trip.json");
  await provide(page, trip);
  await page.reload();
  await expect(decisionCard(page, "Day1").locator("[data-personal-decision-unavailable]")).toBeVisible();
  await page.goto("/#trip/day/2026-10-04");
  await expect(decisionCard(page, "Day2").locator("[data-personal-decision-unavailable]")).toBeVisible();
  await expect(decisionCard(page, "Day2")).not.toContainText("✓ A Day2");
  expect(await staleChoice(page, fallback, "b")).toBe(0);
  expect((await storedPersonal(page))[fallback]).toBe("a");
});

test("shared source decisions remain readable and reject synthetic personal controls", async ({ page }) => {
  const trip = personalTrip();
  const first = trip.days[0].items[0];
  const second = trip.days[1].items[1];
  first.decision.mode = "shared";
  second.decision.resolvedOptionId = "b";
  await provide(page, trip);
  await page.goto("/#trip/day/2026-10-03");
  await expect(decisionCard(page, "Day1")).toContainText("A Day1");
  await expect(decisionCard(page, "Day1").locator("[data-personal-decision-item]")).toHaveCount(0);
  expect(await staleChoice(page, first.id, "a")).toBe(0);
  expect(await staleChoice(page, "unknown-item-id", "a")).toBe(0);
  await page.goto("/#trip/day/2026-10-04");
  await expect(decisionCard(page, "Day2")).toContainText("✓ B Day2");
  expect(await staleChoice(page, second.id, "a")).toBe(0);
  // Even a duplicate source ID must not hide an explicit published resolution.
  second.id = first.id;
  await page.unroute("**/trip.json");
  await provide(page, trip);
  await page.reload();
  await expect(decisionCard(page, "Day2")).toContainText("✓ B Day2");
  await expect(decisionCard(page, "Day2").locator("[data-personal-decision-item]")).toHaveCount(0);
  expect(await staleChoice(page, first.id, "a")).toBe(0);
});

test("personal choice storage treats prototype-shaped unique IDs as own data", async ({ page }) => {
  const trip = personalTrip();
  trip.days[0].items[0].id = "__proto__";
  await provide(page, trip);
  await page.goto("/#trip/day/2026-10-03");
  await decisionCard(page, "Day1").getByRole("button", { name: "B Day1", exact: true }).click();
  // Read the own value inside the browser: transporting an object with a
  // __proto__ key can discard that key in the test driver's object serializer.
  await expect.poll(() => page.evaluate(async () => {
    const saved = await TravelLiteStorage.get(tripKey("personalDecisions"));
    return saved && Object.hasOwn(saved, "__proto__") ? saved["__proto__"] : null;
  })).toBe("b");
  await page.reload();
  await expect(decisionCard(page, "Day1").getByRole("button", { name: "✓ B Day1", exact: true })).toHaveClass(/primary/);
});
