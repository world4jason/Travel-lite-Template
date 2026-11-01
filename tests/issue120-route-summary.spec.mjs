/* #120: route visits are ordered occurrences, including returns and same-name stops.
   Uses the real index.html boot with an isolated all-TBD itinerary; never edits trip.json.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sourceText = readFileSync(new URL("../trip.json", import.meta.url), "utf8");
const source = JSON.parse(sourceText);
const fixedNow = Date.parse("2026-10-03T01:30:00Z"); // 10:30 Asia/Tokyo.
const appearances = [
  { name: "editorial-light", style: "editorial", scheme: "light" },
  { name: "editorial-dark", style: "editorial", scheme: "dark" },
  ...["storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print", "quiet-acrylic",
    "vintage-watercolor"].map(style => ({ name: style, style, scheme: "light" })),
];
const repeatCases = [
  { name: "explicit return", labels: ["Alpha", "Beta", "Alpha"], explicit: true },
  { name: "explicit consecutive", labels: ["Alpha", "Alpha", "Beta"], explicit: true },
  { name: "fallback return", labels: ["Alpha", "Beta", "Alpha"] },
  { name: "fallback consecutive", labels: ["Alpha", "Alpha", "Beta"] },
];

function fixture(cases = repeatCases, scheme = "light") {
  const trip = structuredClone(source);
  Object.assign(trip.trip, {
    id: "issue120-route-occurrences", title: "Published route visits", subtitle: "Source order",
    startDate: "2026-10-03", endDate: "2026-10-" + String(2 + cases.length).padStart(2, "0"),
    timezone: "Asia/Tokyo",
  });
  Object.assign(trip.ui, { locale: "en", defaultView: "trip", visualStyle: "editorial", theme: scheme });
  trip.highlights = [];
  trip.days = cases.map((entry, index) => ({
    id: "issue120-day-" + index,
    date: "2026-10-" + String(3 + index).padStart(2, "0"),
    label: "Day " + (index + 1), title: entry.name,
    ...(entry.explicit ? { routeSummary: entry.summary || entry.labels } : {}),
    items: (entry.itemLabels || entry.labels).map((label, itemIndex) => ({
      id: "issue120-" + index + "-" + itemIndex,
      // Explicit summaries must win over these deliberately different labels.
      title: entry.explicit ? "Published item " + (itemIndex + 1) : label,
      routeLabel: entry.explicit ? "Fallback item " + (itemIndex + 1) : label,
      type: "activity", start: "TBD",
    })),
  }));
  return trip;
}

async function boot(page, baseURL, trip, look, viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: look.scheme, reducedMotion: "reduce" });
  await page.addInitScript(({ now }) => {
    const RealDate = Date;
    globalThis.__issue120Now = now;
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [globalThis.__issue120Now])); }
      static now() { return globalThis.__issue120Now; }
    }
    globalThis.Date = FixedDate;
  }, { now: fixedNow });
  const origin = new URL(baseURL).origin;
  await page.route("**/*", route => new URL(route.request().url()).origin === origin
    ? route.continue() : route.abort());
  await page.route("**/trip.json", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(trip),
  }));
  await page.goto("/?previewStyle=" + look.style + "#trip/day/" + trip.days[0].date,
    { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => state.ready)).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.style);
  await expect(page.locator("html")).toHaveAttribute("data-theme", look.scheme);
  await expect(page.locator(".day-summary h2")).toHaveText(trip.days[0].title);
  await expect(page.locator("#bottom-nav .nav-item")).toHaveText(["Now", "Trip", "Transport", "Places", "More"]);
}

async function navigate(page, hash) {
  await page.evaluate(value => { location.hash = value; }, hash);
}

async function routeObservation(page) {
  return page.evaluate(() => ({
    endpoints: [...document.querySelectorAll('[data-surface-role="route-endpoints"] strong')]
      .map(node => node.textContent),
    count: document.querySelector(".trip-route-heading > span")?.textContent || null,
    steps: [...document.querySelectorAll('[data-surface-role="route-step"]')].map(node => ({
      number: node.querySelector("b")?.textContent,
      // Remove only the separate badge node, never a digit in a source label.
      label: [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE)
        .map(child => child.textContent).join(""),
    })),
  }));
}

async function expectTripRoute(page, labels) {
  if (!labels.length) {
    await expect(page.locator(".trip-route-summary")).toHaveCount(0);
    return;
  }
  await expect(page.locator(".trip-route-summary")).toHaveCount(1);
  expect(await routeObservation(page)).toEqual({
    endpoints: [labels[0], labels.at(-1)],
    count: labels.length + (labels.length === 1 ? " stop" : " stops"),
    steps: labels.length > 2 ? labels.map((label, index) => ({ number: String(index + 1), label })) : [],
  });
}

async function expectNowRoute(page, day, labels) {
  await page.evaluate(epoch => { globalThis.__issue120Now = epoch; }, Date.parse(day.date + "T01:30:00Z"));
  await navigate(page, "#now");
  await expect(page.locator(".today-brief-heading h2")).toHaveText(day.title);
  await expect(page.locator(".today-brief-list .today-brief-item")).toHaveCount(day.items.length);
  await expect(page.locator(".today-brief-list h3")).toHaveText(day.items.map(item => item.title));
  await expect(page.locator(".today-brief-sequence")).toHaveText(day.items.map((_, index) => String(index + 1)));
  await expect(page.locator(".companion-window, .companion-focus, .companion-later-list")).toHaveCount(0);
  expect(await page.evaluate(() => {
    const context = getNowContext();
    return { date: context.today.date, previous: context.previous, current: context.current,
      next: context.next, later: context.later };
  })).toEqual({ date: day.date, previous: null, current: null, next: null, later: [] });
  if (labels.length) await expect(page.locator(".today-brief-route")).toHaveText(labels.join(" → "));
  else await expect(page.locator(".today-brief-route")).toHaveCount(0);
  if (await page.locator("#shell-right").isVisible()) {
    const card = page.locator('#shell-right [data-today-brief="true"]');
    await expect(card).toHaveCount(1);
    if (labels.length) await expect(card.locator(".shell-context-route")).toHaveText(labels.join(" → "));
    else await expect(card.locator(".shell-context-route")).toHaveCount(0);
  }
}

async function expectUnchangedSource(page, trip) {
  expect(await page.evaluate(() => state.data.days)).toEqual(trip.days);
  expect(await page.evaluate(async () => (await TravelLiteStorage.get("snapshot:latest")).days)).toEqual(trip.days);
  expect(readFileSync(new URL("../trip.json", import.meta.url), "utf8")).toBe(sourceText);
}

async function screenshot(page, testInfo, name, locator) {
  const path = testInfo.outputPath(name + ".png");
  if (locator) await locator.screenshot({ path, animations: "disabled" });
  else await page.screenshot({ path, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

function newReport(page, trip, name) {
  return {
    name, sourceSha: process.env.TRAVEL_LITE_120_SOURCE_SHA || null,
    chromium: page.context().browser()?.version(), platform: process.platform,
    viewport: page.viewportSize(), locale: "en-US", timezone: "UTC",
    tripTimezone: "Asia/Tokyo", clockEpoch: fixedNow,
    fonts: process.env.TRAVEL_LITE_120_FONT_PROFILE || "remote fonts blocked; system fallback",
    providers: "remote providers blocked", serviceWorkers: "blocked",
    publishedSourceSha256: createHash("sha256").update(sourceText).digest("hex"),
    fixture: trip.days, observations: [], pageErrors: [],
  };
}

async function attachReport(testInfo, report) {
  await testInfo.attach("issue120-route-observations", {
    contentType: "application/json", body: Buffer.from(JSON.stringify(report, null, 2)),
  });
}

test.use({ locale: "en-US", timezoneId: "UTC" });

for (const look of appearances) {
  test("#120 ordered return and consecutive visits: " + look.name, async ({ page, baseURL }, testInfo) => {
    const trip = fixture(repeatCases, look.scheme);
    await boot(page, baseURL, trip, look);
    const report = newReport(page, trip, look.name);
    page.on("pageerror", error => report.pageErrors.push(error.message));
    try {
      for (const [index, entry] of repeatCases.entries()) {
        const day = trip.days[index];
        await navigate(page, "#trip/day/" + day.date);
        await expect(page.locator(".day-summary h2")).toHaveText(day.title);
        report.observations.push({ case: entry.name, trip: await routeObservation(page) });
        if (index === 0 && ["editorial-light", "storybook", "risograph", "vintage-watercolor"].includes(look.name)) {
          await page.locator(".trip-route-summary").scrollIntoViewIfNeeded();
          await screenshot(page, testInfo, look.name + "-return-phone");
        }
        await expectTripRoute(page, entry.labels);
        await expect(page.locator(".trip-v2-item.current, time.timeline-time")).toHaveCount(0);
        await expect(page.locator(".timeline-time--floating")).toHaveCount(day.items.length);
        await navigate(page, "#trip/overview");
        await expect(page.locator('.trip-overview-day[data-trip-day="' + day.date + '"] > p'))
          .toHaveText(entry.labels.join(" → "));
        await expectNowRoute(page, day, entry.labels);
        report.observations.at(-1).now = await page.locator(".today-brief-route").textContent();
        await expectUnchangedSource(page, trip);
      }
      expect(report.pageErrors).toEqual([]);
    } finally { await attachReport(testInfo, report); }
  });
}

test("#120 explicit authority, fallbacks and compact overview controls", async ({ page, baseURL }, testInfo) => {
  const cases = [
    { name: "empty summary fallback", labels: ["Alpha", "Beta", "Alpha"] },
    { name: "non-array summary fallback", labels: ["Alpha", "Alpha", "Beta"] },
    { name: "explicit blank remains authoritative", explicit: true, summary: [" ", null, {}, false], labels: [], itemLabels: ["Alpha", "Beta", "Alpha"] },
    { name: "mixed valid projection", explicit: true, summary: ["Alpha", " ", { label: "Beta", title: "Wrong" }, null, { title: "Alpha" }], labels: ["Alpha", "Beta", "Alpha"] },
    { name: "single stop", labels: ["Alpha"], explicit: true },
    { name: "unique stops", labels: ["Alpha", "Beta", "Gamma"], explicit: true },
    { name: "overview first five occurrences", labels: ["Alpha", "Alpha", "Beta", "Alpha", "Beta", "Alpha"], explicit: true },
  ];
  const trip = fixture(cases);
  trip.days[0].routeSummary = [];
  trip.days[1].routeSummary = "Not an array";
  await boot(page, baseURL, trip, appearances[0], { width: 1600, height: 900 });
  const report = newReport(page, trip, "source priority controls");
  try {
    for (const [index, entry] of cases.entries()) {
      const day = trip.days[index];
      await navigate(page, "#trip/day/" + day.date);
      await expect(page.locator(".day-summary h2")).toHaveText(day.title);
      report.observations.push({ case: entry.name, trip: await routeObservation(page) });
      await expectTripRoute(page, entry.labels);
      await navigate(page, "#trip/overview");
      const overview = entry.labels.length
        ? entry.labels.slice(0, 5).join(" → ") + (entry.labels.length > 5 ? " → …" : "")
        : "No route summary";
      await expect(page.locator('.trip-overview-day[data-trip-day="' + day.date + '"] > p')).toHaveText(overview);
      await expectNowRoute(page, day, entry.labels);
      await expectUnchangedSource(page, trip);
    }
  } finally { await attachReport(testInfo, report); }
});

async function assertShellAndText(page, selector) {
  const metrics = await page.locator(selector).evaluate(node => {
    const box = node.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(node);
    return {
      viewport: innerWidth, htmlWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
      box: { left: box.left, right: box.right, width: box.width },
      overflow: node.scrollWidth - node.clientWidth,
      textRects: [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0)
        .map(rect => ({ left: rect.left, right: rect.right })),
      textOverflow: getComputedStyle(node).textOverflow,
      lineClamp: getComputedStyle(node).webkitLineClamp,
    };
  });
  expect(metrics.htmlWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.box.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.box.right).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(metrics.textOverflow).not.toBe("ellipsis");
  expect(["none", "0", ""]).toContain(metrics.lineClamp);
  for (const rect of metrics.textRects) {
    expect(rect.left).toBeGreaterThanOrEqual(metrics.box.left - 1);
    expect(rect.right).toBeLessThanOrEqual(metrics.box.right + 1);
  }
  return metrics;
}

async function checkRouteRail(page) {
  const rail = page.locator(".trip-route-steps");
  // Centre the reading surface; scrollIntoViewIfNeeded alone may leave it
  // geometrically inside the viewport but behind the fixed bottom navigation.
  await rail.evaluate(node => node.scrollIntoView({ block: "center", inline: "nearest" }));
  const initial = await rail.evaluate(node => ({ width: node.clientWidth, scrollWidth: node.scrollWidth,
    viewport: innerWidth, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right }));
  expect(initial.left).toBeGreaterThanOrEqual(-1);
  expect(initial.right).toBeLessThanOrEqual(initial.viewport + 1);
  if (initial.scrollWidth > initial.width + 1) {
    // The rail must be keyboard-scrollable in the real browser, not merely
    // contain hidden DOM text. Do not add test-only tabindex/style repairs.
    await rail.focus();
    await expect(rail).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(rail).not.toBeFocused();
    await page.keyboard.press("Tab");
    await expect(rail).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => rail.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
  }
  await rail.evaluate(node => node.scrollIntoView({ block: "center", inline: "nearest" }));
  expect(await rail.evaluate(node => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
    return Boolean(hit && (hit === node || node.contains(hit)));
  })).toBe(true);
  const visits = [];
  for (const stop of await rail.locator('[data-surface-role="route-step"]').all()) {
    const visible = await stop.evaluate(node => {
      const rail = node.parentElement;
      const range = document.createRange();
      range.selectNodeContents(node);
      const bounds = () => ({ rail: rail.getBoundingClientRect(), text: range.getBoundingClientRect() });
      let { rail: clip, text } = bounds();
      rail.scrollLeft += text.left - clip.left;
      ({ rail: clip, text } = bounds());
      const startVisible = text.left >= clip.left - 1 && text.left < clip.right;
      rail.scrollLeft += text.right - clip.right;
      ({ rail: clip, text } = bounds());
      const endVisible = text.right <= clip.right + 1 && text.right > clip.left;
      return { startVisible, endVisible, label: node.textContent,
        scrollWidth: node.scrollWidth, clientWidth: node.clientWidth,
        textOverflow: getComputedStyle(node).textOverflow };
    });
    expect(visible.startVisible).toBe(true);
    expect(visible.endVisible).toBe(true);
    expect(visible.scrollWidth).toBeLessThanOrEqual(visible.clientWidth + 1);
    expect(visible.textOverflow).not.toBe("ellipsis");
    visits.push(visible);
  }
  await rail.evaluate(node => { node.scrollLeft = 0; });
  return { initial, visits };
}

const longLabels = [
  "京都駅八条口・集合場所 LongPublishedStationNameABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  "京都駅八条口・集合場所 LongPublishedStationNameABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  "往復先・河岸公園 RiversideVisitABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  "京都駅八条口・集合場所 LongPublishedStationNameABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
];
for (const look of appearances.filter(look => ["editorial-light", "editorial-dark", "storybook", "risograph", "vintage-watercolor"].includes(look.name))) {
  const viewports = [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1100, height: 900 }];
  if (look.name === "editorial-light") viewports.push({ width: 1600, height: 900 });
  for (const viewport of viewports) {
    test("#120 long repeated labels stay reachable: " + look.name + " at " + viewport.width,
      async ({ page, baseURL }, testInfo) => {
        const trip = fixture([{ name: "Return to the station", labels: longLabels, explicit: true }], look.scheme);
        await boot(page, baseURL, trip, look, viewport);
        const report = newReport(page, trip, look.name + " long route");
        try {
          await expectTripRoute(page, longLabels);
          await screenshot(page, testInfo, "trip-route-long-" + look.name + "-" + viewport.width,
            page.locator(".trip-route-summary"));
          const endpoints = [];
          for (const endpoint of ['.trip-route-endpoints > div:first-child strong', '.trip-route-endpoints .end strong']) {
            endpoints.push(await assertShellAndText(page, endpoint));
          }
          const rail = await checkRouteRail(page);
          report.observations.push({ endpoints, rail });
          await screenshot(page, testInfo, "trip-phone-" + look.name + "-" + viewport.width);
          await page.locator(".trip-route-steps").evaluate(node => { node.scrollLeft = node.scrollWidth; });
          await screenshot(page, testInfo, "trip-route-end-" + look.name + "-" + viewport.width,
            page.locator(".trip-route-summary"));
          await expectNowRoute(page, trip.days[0], longLabels);
          const now = await assertShellAndText(page, ".today-brief-route");
          report.observations.push({ now });
          if (viewport.width >= 1400) {
            report.observations.push({ rightRail: await assertShellAndText(page,
              '#shell-right [data-today-brief="true"] .shell-context-route') });
          }
          await screenshot(page, testInfo, "now-route-long-" + look.name + "-" + viewport.width,
            page.locator(".today-brief-route"));
          await page.locator(".today-brief-heading").scrollIntoViewIfNeeded();
          await screenshot(page, testInfo, "now-phone-" + look.name + "-" + viewport.width);
          await expectUnchangedSource(page, trip);
        } finally { await attachReport(testInfo, report); }
      });
  }
}
