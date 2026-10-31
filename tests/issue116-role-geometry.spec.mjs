/* #116: three role boundaries, real MapLibre controls and appearance changes.
   TRAVEL_LITE_116_CAPTURE_ONLY=1 records baseline observations; geometry
   assertions are explicitly NOT RUN in that mode. Boot/control checks remain.
   TRAVEL_LITE_TEST_SITE_ROOT selects the served checkout via tests/serve.mjs.
   Set TRAVEL_LITE_116_SOURCE_SHA when recording an exact-version QA run.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { serveMapLibreLocally } from "./maplibre-local.mjs";
import { sideBorderViolations } from "./style-surface-guards.mjs";

const source = JSON.parse(readFileSync(new URL("../trip.json", import.meta.url), "utf8"));
const packageInfo = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const captureOnly = process.env.TRAVEL_LITE_116_CAPTURE_ONLY === "1";
const mode = captureOnly ? "capture-only" : "assert";
const fixedNow = 1790991000000;
const sizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1100, height: 900 },
  { width: 1100, height: 600 },
];
const appearances = [
  { name: "editorial-light", style: "editorial", scheme: "light" },
  { name: "editorial-dark", style: "editorial", scheme: "dark" },
  ...["storybook", "candy", "risograph", "paper-collage", "naive-city",
    "taiwan-poster", "field-stamp", "quiet-linocut", "doodle-memory-grid",
    "crayon-journal", "painterly-editorial", "geometric-print",
    "quiet-acrylic", "vintage-watercolor"].map(style => ({ name: style, style, scheme: "light" })),
];
const representatives = ["editorial-light", "storybook", "risograph", "vintage-watercolor"]
  .map(name => appearances.find(look => look.name === name));
const coreRoles = new Set(["map-workspace", "route-endpoints", "route-step"]);
const dayIndex = 1;

function makeFixture({ scheme = "light", noCoordinates = false, personal = false } = {}) {
  const trip = structuredClone(source);
  trip.trip.id = "issue116-role-geometry";
  trip.ui = { ...trip.ui, locale: "en", visualStyle: "editorial", theme: scheme };
  const day = trip.days[dayIndex];
  day.title = "淺草・上野 SpatialReferenceABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  // Every label is unique: D2's existing repeated-label projection defect is
  // outside this test and outside the #116 geometry migration.
  day.routeSummary = Array.from({ length: 12 }, (_, index) =>
    "第" + String(index + 1).padStart(2, "0") + "站 東京 RouteReferenceABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
  if (personal) day.items[1].decision.mode = "personal";
  if (noCoordinates) {
    for (const item of day.items) {
      delete item.lat;
      delete item.lng;
    }
  }
  return trip;
}

function newReport(page, fixture, name) {
  return {
    name, mode,
    geometryAssertions: captureOnly ? "NOT RUN: capture-only" : "pending",
    functionalChecks: "pending",
    sourceSha: process.env.TRAVEL_LITE_116_SOURCE_SHA || null,
    servedCheckout: process.env.TRAVEL_LITE_TEST_SITE_ROOT || "current checkout",
    environment: {
      chromium: page.context().browser()?.version(),
      playwright: packageInfo.devDependencies["@playwright/test"],
      platform: process.platform, browserLocale: "en-US", browserTimezone: "UTC",
      fixtureLocale: fixture.ui.locale, tripTimezone: fixture.trip.timezone,
      clockEpoch: fixedNow, motion: "reduce", fonts: "remote fonts blocked",
      map: "pinned local MapLibre; source-free background; real controls/markers",
    },
    fixture: {
      version: "issue116-role-geometry-v1",
      publishedSourceSha256: createHash("sha256").update(JSON.stringify(source)).digest("hex"),
      trip: fixture.trip, ui: fixture.ui, day: fixture.days[dayIndex],
    },
    states: [], violations: [], pageErrors: [],
  };
}

async function saveReport(testInfo, report) {
  const path = testInfo.outputPath("issue116-role-geometry.json");
  writeFileSync(path, JSON.stringify(report, null, 2) + "\n");
  await testInfo.attach("issue116-role-geometry-" + mode, { path, contentType: "application/json" });
}

async function prepare(page, baseURL, trip, look, { blockMapLibrary = false } = {}) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: look.scheme, reducedMotion: "reduce" });
  await page.addInitScript(({ now }) => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now; }
    }
    globalThis.Date = FixedDate;
  }, { now: fixedNow });
  const origin = new URL(baseURL).origin;
  await page.route("**/*", route => new URL(route.request().url()).origin === origin
    ? route.continue() : route.abort());
  if (!blockMapLibrary) await serveMapLibreLocally(page);
  await page.route("**/trip.json", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(trip),
  }));
  return errors;
}

async function settleStyles(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')]
    .filter(link => !link.disabled && new URL(link.href).origin === location.origin)
    .every(link => Boolean(link.sheet)));
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function openTrip(page, trip, look) {
  const day = trip.days[dayIndex];
  await page.goto("/?previewStyle=" + look.style + "#trip/day/" + day.date, { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => state.ready)).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.style);
  await expect(page.locator(".trip-day-view .day-summary h2")).toHaveText(day.title);
  await expect(page.locator('[data-surface-role="route-step"]')).toHaveCount(day.routeSummary.length);
  await settleStyles(page);
}

async function mapReady(page) {
  await expect(page.locator("#runtime-map .map-library-fallback")).toHaveCount(0);
  await expect(page.locator("#runtime-map .maplibregl-ctrl-zoom-in")).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#runtime-map canvas.maplibregl-canvas")).toHaveCount(1);
  await expect(page.locator("#runtime-map .map-marker")).toHaveCount(2);
  await settleStyles(page);
}

async function openMap(page, trip, look) {
  const day = trip.days[dayIndex];
  await page.goto("/?previewStyle=" + look.style + "#map/day/" + day.date + "/stop/" + day.items[0].id,
    { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-surface-role="map-workspace"]')).toBeVisible();
  await expect(page.locator(".map-selected-summary h3")).toHaveText(day.items[0].title);
  await mapReady(page);
}

async function measure(locator, role, index = 0, textSelector = null) {
  await expect(locator).toBeVisible();
  await locator.evaluate(node => node.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" }));
  return locator.evaluate((node, settings) => {
    const css = getComputedStyle(node);
    const numeric = value => Number.parseFloat(value) || 0;
    const rect = node.getBoundingClientRect();
    const parent = node.parentElement.getBoundingClientRect();
    const box = r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
    const border = [css.borderTopWidth, css.borderRightWidth, css.borderBottomWidth, css.borderLeftWidth].map(numeric);
    let clipLeft = 0, clipRight = innerWidth;
    for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) {
        const bounds = ancestor.getBoundingClientRect();
        clipLeft = Math.max(clipLeft, bounds.left + numeric(style.borderLeftWidth));
        clipRight = Math.min(clipRight, bounds.right - numeric(style.borderRightWidth));
      }
    }
    const textRects = [];
    const roots = settings.textSelector ? [...node.querySelectorAll(settings.textSelector)] : [node];
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = walker.currentNode;
        if (!text.textContent.trim() || text.parentElement.closest('[aria-hidden="true"]')
            || !text.parentElement.checkVisibility({ visibilityProperty: true })) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        for (const textRect of range.getClientRects()) {
          if (textRect.width > 0 && textRect.height > 0) textRects.push(box(textRect));
        }
      }
    }
    const textLeft = textRects.length ? Math.min(...textRects.map(r => r.left)) : rect.left;
    const textRight = textRects.length ? Math.max(...textRects.map(r => r.right)) : rect.right;
    const tokens = Object.fromEntries([...css].filter(name =>
      /^--ui-(?:map-workspace|route-endpoints|route-step)-/.test(name))
      .map(name => [name, css.getPropertyValue(name).trim()]));
    return {
      role: settings.role, index: settings.index, tag: node.tagName,
      border, borderStyles: [css.borderTopStyle, css.borderRightStyle, css.borderBottomStyle, css.borderLeftStyle],
      borderColors: [css.borderTopColor, css.borderRightColor, css.borderBottomColor, css.borderLeftColor],
      padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft].map(numeric),
      inset: [numeric(css.paddingRight), numeric(css.paddingLeft)],
      radius: css.borderRadius, background: css.backgroundColor,
      backgroundImage: css.backgroundImage.replaceAll(location.origin, "<site>"),
      outlineWidth: numeric(css.outlineWidth), outlineStyle: css.outlineStyle,
      outlineOffset: numeric(css.outlineOffset), outlineColor: css.outlineColor,
      display: css.display, gap: css.gap, overflowX: css.overflowX, overflowY: css.overflowY,
      bounds: box(rect), parentBounds: box(parent),
      relativeBounds: {
        left: rect.left - parent.left, top: rect.top - parent.top,
        right: parent.right - rect.right, bottom: parent.bottom - rect.bottom,
        width: rect.width, height: rect.height,
      },
      textRects, textInset: [rect.right - border[1] - textRight, textLeft - rect.left - border[3]],
      inlineClip: { left: clipLeft, right: clipRight },
      scroll: { x: scrollX, y: scrollY, parentLeft: node.parentElement.scrollLeft },
      tokens,
    };
  }, { role, index, textSelector });
}

async function railReachability(locator) {
  return locator.evaluate(node => {
    const rail = node.closest(".trip-route-steps");
    const originalLeft = rail.scrollLeft;
    const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const overflowX = getComputedStyle(rail).overflowX;
    const numeric = value => Number.parseFloat(value) || 0;
    const textNodes = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()
          && !walker.currentNode.parentElement.closest('[aria-hidden="true"]')) textNodes.push(walker.currentNode);
    }
    const rectangles = () => textNodes.flatMap(text => {
      const range = document.createRange();
      range.selectNodeContents(text);
      return [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0)
        .map(rect => ({ left: rect.left, right: rect.right, parent: text.parentElement }));
    });
    const windowBounds = () => {
      const bounds = rail.getBoundingClientRect();
      let left = Math.max(0, bounds.left + rail.clientLeft);
      let right = Math.min(innerWidth, bounds.left + rail.clientLeft + rail.clientWidth);
      for (let parent = rail.parentElement; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent);
        if (["hidden", "clip", "auto", "scroll"].includes(css.overflowX)) {
          const rect = parent.getBoundingClientRect();
          left = Math.max(left, rect.left + numeric(css.borderLeftWidth));
          right = Math.min(right, rect.right - numeric(css.borderRightWidth));
        }
      }
      return { left, right };
    };
    const sample = () => {
      const text = rectangles();
      return { scrollLeft: rail.scrollLeft, textLeft: Math.min(...text.map(rect => rect.left)),
        textRight: Math.max(...text.map(rect => rect.right)), window: windowBounds() };
    };
    // Exercise the real rail's complete scroll range, then bring each end of
    // this chip's text into its visible window. A long chip need not fit in a
    // single frame; the intermediate text is reachable by continuous scroll.
    rail.scrollTo({ left: 0, behavior: "instant" });
    const atStart = sample();
    rail.scrollTo({ left: maximum, behavior: "instant" });
    const atEnd = sample();
    const clamp = value => Math.max(0, Math.min(maximum, value));
    rail.scrollTo({ left: clamp(atEnd.scrollLeft + atEnd.textLeft - atEnd.window.left), behavior: "instant" });
    const leading = sample();
    rail.scrollTo({ left: clamp(leading.scrollLeft + leading.textRight - leading.window.right), behavior: "instant" });
    const trailing = sample();
    const inWindow = (point, window) => window.right > window.left
      && point >= window.left - 1 && point <= window.right + 1;
    // Scrolling the outer rail cannot reveal text clipped inside the chip.
    // Keep those original hidden/clip ancestor boundaries as a separate check.
    const interiorClipping = rectangles().some(rect => {
      for (let parent = rect.parent; parent && parent !== rail; parent = parent.parentElement) {
        const css = getComputedStyle(parent);
        if (!["hidden", "clip"].includes(css.overflowX)) continue;
        const bounds = parent.getBoundingClientRect();
        if (rect.left < bounds.left + numeric(css.borderLeftWidth) - 1
            || rect.right > bounds.right - numeric(css.borderRightWidth) + 1) return true;
      }
      return false;
    });
    rail.scrollTo({ left: originalLeft, behavior: "instant" });
    return {
      overflowX, maximum, atStart, atEnd, leading, trailing, interiorClipping,
      userScrollable: maximum <= 1 || ["auto", "scroll"].includes(overflowX),
      leadingReachable: inWindow(leading.textLeft, leading.window),
      trailingReachable: inWindow(trailing.textRight, trailing.window),
    };
  });
}

async function timelineHeadingMeasurements(page) {
  return page.evaluate(() => {
    const heading = document.querySelector(".trip-timeline-heading > :is(h2,h3)");
    if (!heading) return null; // The original Editorial timeline has no heading.
    const list = document.querySelector(".trip-v2-timeline");
    const group = heading.parentElement;
    const anchor = group.parentElement.getBoundingClientRect();
    const sample = node => {
      if (!node) return null;
      const css = getComputedStyle(node), rect = node.getBoundingClientRect();
      return {
        tag: node.tagName, text: node === list ? null : node.textContent.trim(),
        marginTop: css.marginTop, marginBottom: css.marginBottom,
        fontSize: css.fontSize, letterSpacing: css.letterSpacing, lineHeight: css.lineHeight,
        relativeBounds: { left: rect.left - anchor.left, top: rect.top - anchor.top,
          right: anchor.right - rect.right, bottom: anchor.bottom - rect.bottom,
          width: rect.width, height: rect.height },
      };
    };
    return { heading: sample(heading), paragraph: sample(group.querySelector("p")),
      group: sample(group), list: sample(list) };
  });
}

async function tripMeasurements(page) {
  const records = [await measure(page.locator('[data-surface-role="route-endpoints"]'), "route-endpoints", 0, "strong, small")];
  const steps = page.locator('[data-surface-role="route-step"]');
  for (let index = 0; index < await steps.count(); index++) {
    const record = await measure(steps.nth(index), "route-step", index);
    record.railReachability = await railReachability(steps.nth(index));
    records.push(record);
  }
  await page.locator(".trip-route-steps").evaluate(node => { node.scrollLeft = 0; });
  return records;
}

async function mapMeasurements(page) {
  return [
    await measure(page.locator('[data-surface-role="map-workspace"]'), "map-workspace", 0, ".map-heading h2, .map-heading p"),
    await measure(page.locator(".map-heading"), "map-heading-compat"),
    await measure(page.locator(".map-stage"), "map-stage-compat", 0, ".map-library-fallback"),
    await measure(page.locator('[data-surface-role="selected-stop"]'), "selected-stop", 0, "h3, p, a"),
    await measure(page.locator('[data-surface-role="transport-context"]'), "transport-context", 0, ":scope > summary"),
  ];
}

function geometryFindings(records, label) {
  const findings = [];
  for (const record of records) {
    // The selected-stop threshold is the existing #113 compatibility guard;
    // no new transport-context or map-stage frame policy is introduced here.
    const minimum = record.role === "route-step" || record.role === "route-endpoints" ? 8
      : record.role === "map-workspace" || record.role === "selected-stop" ? 12 : null;
    if (minimum !== null) {
      const sides = sideBorderViolations(record, minimum);
      if (sides.length) findings.push(label + " " + record.role + "[" + record.index + "] framed zero/small inset: " + sides.join(","));
      const painted = sideBorderViolations({ ...record, inset: record.textInset }, minimum - 1);
      if (record.textRects.length && painted.length) findings.push(label + " " + record.role + "[" + record.index + "] text/frame gap: " + painted.join(","));
    }
    if (record.role === "route-step") {
      const rail = record.railReachability;
      if (!rail?.userScrollable || !rail.leadingReachable || !rail.trailingReachable)
        findings.push(label + " route-step[" + record.index + "] text cannot be fully reached through its horizontal rail");
      if (rail?.interiorClipping)
        findings.push(label + " route-step[" + record.index + "] text is clipped inside the chip");
    } else if (coreRoles.has(record.role)) {
      const clipped = record.textRects.some(rect =>
        rect.left < record.inlineClip.left - 1 || rect.right > record.inlineClip.right + 1);
      if (clipped) findings.push(label + " " + record.role + "[" + record.index + "] text clipped after scrolling into view");
    }
  }
  return findings;
}

async function documentGeometry(page) {
  return page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    htmlWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
    mobileShell: !matchMedia("(min-width: 900px) and (min-height: 601px)").matches,
  }));
}

async function recordGeometry(page, report, state, records) {
  const document = await documentGeometry(page);
  state.roles = records;
  state.document = document;
  state.geometryAssertions = captureOnly ? "NOT RUN: capture-only" : "PASS";
  if (!captureOnly) {
    const findings = geometryFindings(records, state.label);
    if (document.htmlWidth > document.width + 1 || document.bodyWidth > document.width + 1)
      findings.push(state.label + " document horizontal overflow");
    state.violations = findings;
    if (findings.length) state.geometryAssertions = "FAIL";
    report.violations.push(...findings);
  }
}

async function hitAndFocus(page, locator) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  const hit = await locator.evaluate(node => {
    node.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    const bounds = node.getBoundingClientRect();
    const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    return target === node || node.contains(target);
  });
  expect(hit, "The actual control centre must receive pointer input").toBe(true);
  await locator.focus();
  await expect(locator).toBeFocused();
  return locator.evaluate(node => {
    const css = getComputedStyle(node), bounds = node.getBoundingClientRect();
    return {
      label: node.getAttribute("aria-label") || node.textContent.trim(),
      focused: document.activeElement === node, hit: true,
      bounds: { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height },
      outline: [css.outlineWidth, css.outlineStyle, css.outlineColor, css.outlineOffset],
      boxShadow: css.boxShadow,
    };
  });
}

async function exerciseMap(page, day) {
  const zoomIn = page.locator("#runtime-map .maplibregl-ctrl-zoom-in");
  const zoomOut = page.locator("#runtime-map .maplibregl-ctrl-zoom-out");
  const focus = [await hitAndFocus(page, zoomIn)];
  await page.keyboard.press("Tab");
  await expect(zoomOut).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(zoomIn).toBeFocused();
  const separation = () => page.locator("#runtime-map .map-marker").evaluateAll(markers => {
    const [a, b] = markers.map(node => node.getBoundingClientRect());
    return Math.hypot(a.left + a.width / 2 - b.left - b.width / 2, a.top + a.height / 2 - b.top - b.height / 2);
  });
  const initialSeparation = await separation();
  expect(initialSeparation).toBeGreaterThan(1);
  await page.keyboard.press("Enter");
  // Wait for the full +1 zoom, not merely its first animation frame; an
  // immediate zoom-out would otherwise cancel the animation at a new target.
  await expect.poll(async () => Math.abs(await separation() - initialSeparation * 2)).toBeLessThanOrEqual(1);
  focus.push(await hitAndFocus(page, zoomOut));
  await page.keyboard.press("Enter");
  await expect.poll(async () => Math.abs(await separation() - initialSeparation)).toBeLessThanOrEqual(2);
  const target = day.items[2];
  const marker = page.getByRole("button", { name: "Select stop: " + target.title, exact: true });
  focus.push(await hitAndFocus(page, marker));
  await page.keyboard.press("Enter");
  await expect(page.locator(".map-selected-summary h3")).toHaveText(target.title);
  await mapReady(page);
  const disclosure = page.locator('[data-surface-role="transport-context"]');
  focus.push(await hitAndFocus(page, disclosure.locator(":scope > summary")));
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.locator(".transport-leg-list > li")).toHaveCount(2);
  return { focus, initialSeparation, selectedItemId: target.id, expandedTransfers: 2 };
}

async function contextFor(browser, baseURL) {
  return browser.newContext({ baseURL, viewport: { width: 390, height: 844 },
    locale: "en-US", timezoneId: "UTC", serviceWorkers: "block" });
}

test.use({ locale: "en-US", timezoneId: "UTC", serviceWorkers: "block" });

for (const look of appearances) {
  test("#116 role geometry " + mode + ": " + look.name, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(180000);
    const trip = makeFixture({ scheme: look.scheme });
    const report = newReport(page, trip, look.name);
    const errors = await prepare(page, baseURL, trip, look);
    try {
      for (const size of sizes) {
        await page.setViewportSize(size);
        const prefix = look.name + " " + size.width + "x" + size.height;
        await openTrip(page, trip, look);
        const endpoints = page.locator('[data-surface-role="route-endpoints"] strong');
        await expect(endpoints).toHaveText([trip.days[dayIndex].routeSummary[0], trip.days[dayIndex].routeSummary.at(-1)]);
        await expect(page.locator('[data-surface-role="route-step"] b'))
          .toHaveText(Array.from({ length: 12 }, (_, index) => String(index + 1)));
        const tripState = { label: prefix + " Trip", viewport: size };
        report.states.push(tripState);
        await recordGeometry(page, report, tripState, await tripMeasurements(page));
        tripState.timelineHeading = await timelineHeadingMeasurements(page);
        if (size.width === 390) {
          await page.locator(".trip-route-summary").screenshot({
            path: testInfo.outputPath("trip-390-" + mode + ".png"), animations: "disabled",
          });
          await page.locator(".trip-v2-timeline").screenshot({
            path: testInfo.outputPath("timeline-390-" + mode + ".png"), animations: "disabled",
          });
        }

        await openMap(page, trip, look);
        const mapState = { label: prefix + " Transport", viewport: size };
        report.states.push(mapState);
        await recordGeometry(page, report, mapState, await mapMeasurements(page));
        mapState.focusBeforeCapture = await hitAndFocus(page, page.locator("#runtime-map .maplibregl-ctrl-zoom-in"));
        if (size.width === 390) await page.locator('[data-surface-role="map-workspace"]').screenshot({
          path: testInfo.outputPath("transport-390-" + mode + ".png"), animations: "disabled",
        });
        mapState.interactions = await exerciseMap(page, trip.days[dayIndex]);
        const expanded = { label: prefix + " Transport expanded compatibility", viewport: size };
        report.states.push(expanded);
        await recordGeometry(page, report, expanded, await mapMeasurements(page));
        expect(await page.evaluate(() => state.data.days)).toEqual(trip.days);
      }
      expect(errors).toEqual([]);
      if (!captureOnly) expect(report.violations, report.violations.join("\n")).toEqual([]);
      report.functionalChecks = "PASS";
      report.geometryAssertions = captureOnly ? "NOT RUN: capture-only" : "PASS";
    } catch (error) {
      report.failure = String(error);
      throw error;
    } finally {
      report.pageErrors = errors;
      await saveReport(testInfo, report);
    }
  });
}

test("#116 Map fallback compatibility " + mode + ": four representative appearances", async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(180000);
  const report = { mode, name: "fallback compatibility", states: [], violations: [],
    sourceSha: process.env.TRAVEL_LITE_116_SOURCE_SHA || null,
    servedCheckout: process.env.TRAVEL_LITE_TEST_SITE_ROOT || "current checkout",
    geometryAssertions: captureOnly ? "NOT RUN: capture-only" : "pending" };
  try {
    for (const look of representatives) {
      for (const fallback of ["blocked-library", "no-coordinates"]) {
        const context = await contextFor(browser, baseURL);
        try {
          const page = await context.newPage();
          const trip = makeFixture({ scheme: look.scheme, noCoordinates: fallback === "no-coordinates" });
          const errors = await prepare(page, baseURL, trip, look, { blockMapLibrary: fallback === "blocked-library" });
          const day = trip.days[dayIndex];
          await page.goto("/?previewStyle=" + look.style + "#map/day/" + day.date + "/stop/" + day.items[0].id);
          const notice = page.locator("#runtime-map .map-library-fallback");
          await expect(notice).toBeVisible({ timeout: 15000 });
          await expect(notice).toContainText(fallback === "blocked-library" ? "Interactive map unavailable" : "No mapped stops for this day");
          await expect(page.locator("#runtime-map canvas, #runtime-map .maplibregl-ctrl")).toHaveCount(0);
          await expect(page.locator(".map-selected-summary h3")).toHaveText(day.items[0].title);
          await expect(page.locator(".map-primary-handoff")).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\//);
          await settleStyles(page);
          const state = { label: look.name + " " + fallback, viewport: page.viewportSize(),
            environment: newReport(page, trip, look.name).environment,
            fixture: newReport(page, trip, look.name).fixture, pageErrors: errors };
          report.states.push(state);
          await recordGeometry(page, report, state, await mapMeasurements(page));
          state.focus = await hitAndFocus(page, page.locator('[data-surface-role="transport-context"] > summary'));
          await page.keyboard.press("Enter");
          await expect(page.locator(".transport-leg-list > li")).toHaveCount(2);
          expect(await page.evaluate(() => state.data.days)).toEqual(trip.days);
          expect(errors).toEqual([]);
        } finally { await context.close(); }
      }
    }
    if (!captureOnly) expect(report.violations, report.violations.join("\n")).toEqual([]);
    report.functionalChecks = "PASS";
    report.geometryAssertions = captureOnly ? "NOT RUN: capture-only" : "PASS";
  } catch (error) {
    report.failure = String(error);
    throw error;
  } finally { await saveReport(testInfo, report); }
});

function comparable(records) {
  return records.filter(record => coreRoles.has(record.role)).map(record => ({
    role: record.role, index: record.index, border: record.border, borderStyles: record.borderStyles,
    borderColors: record.borderColors, padding: record.padding, radius: record.radius,
    background: record.background, backgroundImage: record.backgroundImage,
    outlineWidth: record.outlineWidth, outlineStyle: record.outlineStyle, outlineOffset: record.outlineOffset,
    relativeBounds: record.relativeBounds,
  }));
}

function compareGeometry(actual, expected, label) {
  const failures = [];
  if (actual.length !== expected.length) return [label + " role counts differ from a fresh load"];
  for (let index = 0; index < actual.length; index++) {
    const { relativeBounds: actualBounds, ...actualStyle } = actual[index];
    const { relativeBounds: expectedBounds, ...expectedStyle } = expected[index];
    if (JSON.stringify(actualStyle) !== JSON.stringify(expectedStyle))
      failures.push(label + " " + actual[index].role + "[" + actual[index].index + "] differs from fresh computed geometry");
    for (const side of Object.keys(expectedBounds)) {
      if (Math.abs(actualBounds[side] - expectedBounds[side]) > 1)
        failures.push(label + " " + actual[index].role + "[" + actual[index].index + "] relative " + side + " differs from fresh load");
    }
  }
  return failures;
}

test("#116 actual Appearance picker clears three-role geometry " + mode, async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(180000);
  const choices = ["storybook", "risograph", "vintage-watercolor", "editorial-dark", "storybook"];
  const fresh = {};
  const context = await contextFor(browser, baseURL);
  const page = await context.newPage();
  const trip = makeFixture({ personal: true });
  const report = newReport(page, trip, "actual-picker-cycle");
  try {
    for (const name of [...new Set(choices)]) {
      const look = appearances.find(entry => entry.name === name);
      const referenceContext = await contextFor(browser, baseURL);
      try {
        const reference = await referenceContext.newPage();
        const referenceTrip = makeFixture({ scheme: look.scheme, personal: true });
        const errors = await prepare(reference, baseURL, referenceTrip, look);
        await openTrip(reference, referenceTrip, look);
        const tripRecords = await tripMeasurements(reference);
        await openMap(reference, referenceTrip, look);
        const mapRecords = await mapMeasurements(reference);
        fresh[name] = comparable([...tripRecords, ...mapRecords]);
        expect(errors).toEqual([]);
      } finally { await referenceContext.close(); }
    }
    report.fresh = fresh;
    const initial = appearances[0];
    const errors = await prepare(page, baseURL, trip, initial);
    await openTrip(page, trip, initial);
    const day = trip.days[dayIndex], personal = day.items[1], option = personal.decision.options[0];
    const choice = page.locator('[data-personal-decision-item="' + personal.id + '"][data-personal-decision-option="' + option.id + '"]');
    await choice.click();
    const storedChoice = () => page.evaluate(async ({ key, itemId }) =>
      (await TravelLiteStorage.get(key))?.[itemId], { key: trip.trip.id + ":personalDecisions", itemId: personal.id });
    await expect.poll(storedChoice).toBe(option.id);
    await page.evaluate(() => { window.__issue116SameDocument = true; });
    for (const name of choices) {
      const look = appearances.find(entry => entry.name === name);
      await page.locator('#bottom-nav [data-view="more"]').click();
      await expect(page).toHaveURL(/#more$/);
      await page.locator("[data-style-picker-open]").click();
      const dialog = page.locator("#style-picker-dialog");
      await expect(dialog).toBeVisible();
      await dialog.locator('[data-style-choice="' + name + '"]').click();
      await expect(dialog).toHaveJSProperty("open", false);
      await expect(page.locator("html")).toHaveAttribute("data-visual-style", look.style);
      await expect(page.locator("html")).toHaveAttribute("data-theme", look.scheme);
      await expect(page).toHaveURL(/#more$/);
      await expect(page.locator("[data-style-picker-open]")).toBeFocused();
      await settleStyles(page);
      expect(await page.evaluate(() => ({ date: state.selectedDate, sameDocument: window.__issue116SameDocument })))
        .toEqual({ date: day.date, sameDocument: true });
      await expect.poll(storedChoice).toBe(option.id);

      await page.locator('#bottom-nav [data-view="trip"]').click();
      expect(await page.evaluate(() => state.selectedDate)).toBe(day.date);
      await page.locator('.trip-v2-tabs [data-trip-day="' + day.date + '"]').click();
      await expect(page).toHaveURL(new RegExp("#trip/day/" + day.date + "$"));
      await expect(choice).toHaveClass(/\bprimary\b/);
      await settleStyles(page);
      const tripRecords = await tripMeasurements(page);
      await page.locator('#bottom-nav [data-view="map"]').click();
      await expect(page).toHaveURL(new RegExp("#map/day/" + day.date + "/stop/" + day.items[0].id + "$"));
      await expect(page.locator(".map-selected-summary h3")).toHaveText(day.items[0].title);
      await mapReady(page);
      const mapRecords = await mapMeasurements(page);
      const state = { label: "Actual picker " + name, viewport: page.viewportSize(), freshKey: name };
      report.states.push(state);
      await recordGeometry(page, report, state, [...tripRecords, ...mapRecords]);
      state.comparable = comparable([...tripRecords, ...mapRecords]);
      if (!captureOnly) report.violations.push(...compareGeometry(state.comparable, fresh[name], state.label));
      expect(await page.evaluate(() => state.data.days)).toEqual(trip.days);
      await expect.poll(storedChoice).toBe(option.id);
    }
    report.pageErrors = errors;
    expect(errors).toEqual([]);
    if (!captureOnly) expect(report.violations, report.violations.join("\n")).toEqual([]);
    report.functionalChecks = "PASS";
    report.geometryAssertions = captureOnly ? "NOT RUN: capture-only" : "PASS";
  } catch (error) {
    report.failure = String(error);
    throw error;
  } finally {
    await saveReport(testInfo, report);
    await context.close();
  }
});
