import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// MapLibre is served from node_modules instead of the CDN, and map styles get a minimal local style with no
// sources (tiles are blocked), so Map checks are hermetic and the attribution control settles immediately.
// The version must match the one runtime-features.js loads.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAPLIBRE_VERSION = JSON.parse(readFileSync(resolve(REPO_ROOT, "package.json"), "utf8")).devDependencies["maplibre-gl"];
const MAPLIBRE_DIST = resolve(REPO_ROOT, "node_modules/maplibre-gl/dist");
const MAPLIBRE_CDN = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/`;
if (!readFileSync(resolve(REPO_ROOT, "runtime-features.js"), "utf8").includes(MAPLIBRE_CDN)) {
  throw new Error(`runtime-features.js does not load ${MAPLIBRE_CDN}; update the maplibre-gl devDependency to match.`);
}

const MAP_STYLE_HOST = "https://tiles.openfreemap.org/";
const MINIMAL_MAP_STYLE = JSON.stringify({
  version: 8,
  name: "travel-lite-test",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#dde3e0" } }],
});

async function serveMapLibreLocally(page) {
  await page.route(`${MAP_STYLE_HOST}**`, (route) => (new URL(route.request().url()).pathname.startsWith("/styles/")
    ? route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: MINIMAL_MAP_STYLE })
    : route.abort()));
  await page.route(`${MAPLIBRE_CDN}**`, async (route) => {
    const path = new URL(route.request().url()).pathname.slice(new URL(MAPLIBRE_CDN).pathname.length);
    const file = path === "+esm" ? "maplibre-gl.mjs" : path.replace(/^dist\//, "");
    if (!/^[\w.-]+\.(mjs|css)$/.test(file)) return route.abort();
    await route.fulfill({
      status: 200,
      contentType: file.endsWith(".css") ? "text/css" : "text/javascript",
      headers: { "access-control-allow-origin": "*" },
      body: readFileSync(resolve(MAPLIBRE_DIST, file)),
    });
  });
}

const FIXED_NOW = Date.parse("2026-09-19T10:30:00Z");
const TODAY = "2026-09-19";
const LONG_TOKEN = "GrandHotelReservationReferenceABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MOBILE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const FULL_MATRIX = [
  ...MOBILE_VIEWPORTS,
  { width: 844, height: 390 },
  { width: 932, height: 430 },
  { width: 820, height: 1180 },
  { width: 1100, height: 900 },
  { width: 1600, height: 900 },
];

function isMobileShell(viewport) {
  return viewport.width < 900 || viewport.height <= 600;
}

function dateAt(index) {
  const date = new Date(Date.UTC(2026, 8, 1 + index));
  return date.toISOString().slice(0, 10);
}

// Every generated display string gets an unbroken token, so no single component can be missed by the fixture.
// Enum-like fields (status, type, icon) and times stay untouched so rendering logic still recognises them.
const LONG_TEXT_FIELDS = new Set([
  "title", "label", "location", "prompt", "subtitle", "name", "note", "summary",
  "routeLabel", "routeSummary", "reminders", "facts", "dateLabel", "duration",
]);
// Keys that are free text only under a specific parent; elsewhere the same key is an enum
// (e.g. transferAfter.mode is prose, decision.mode is "personal").
const LONG_TEXT_FIELDS_BY_PARENT = { mode: new Set(["transferAfter"]) };

function isLongTextField(key, parentKey) {
  if (LONG_TEXT_FIELDS.has(key)) return true;
  return LONG_TEXT_FIELDS_BY_PARENT[key]?.has(parentKey) ?? false;
}

function withLongText(value, key, parentKey) {
  // Arrays of strings (routeSummary, reminders, facts) inherit their parent key.
  if (Array.isArray(value)) return value.map((item) => withLongText(item, key, parentKey));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, withLongText(child, childKey, key)]));
  }
  if (typeof value === "string" && isLongTextField(key, parentKey) && !value.includes(LONG_TOKEN)) return `${value} ${LONG_TOKEN}`;
  return value;
}

function makeStressTrip({ untimedToday = false } = {}) {
  const days = Array.from({ length: 32 }, (_, index) => {
    const date = dateAt(index);
    return {
      id: `d${index + 1}`,
      date,
      label: `Day ${index + 1}`,
      title: `Central-Europe-and-Nordic-family-trip-day-${index + 1}-with-a-deliberately-long-generated-title`,
      routeSummary: [
        `Start-${index + 1}`,
        "VeryLongIntermediatePlaceNameWithoutNaturalBreakpoints",
        `End-${index + 1}`,
      ],
      reminders: ["Keep tickets available and confirm the operator app before departure."],
      items: [
        {
          id: `d${index + 1}-morning`,
          start: "09:00",
          end: "10:00",
          title: `Morning stop ${index + 1} · ${LONG_TOKEN}`,
          location: "MuseumQuartier-Langname-Für-Mobile-Reflow-Validation",
          lat: 48.203,
          lng: 16.359,
        },
        {
          id: `d${index + 1}-afternoon`,
          start: "14:00",
          end: "15:30",
          title: "Afternoon connection with 中文超長地點名稱與EnglishMixedContent",
          location: "Vienna",
          lat: 48.2082,
          lng: 16.3738,
        },
      ],
    };
  });

  const today = days.find((day) => day.date === TODAY);
  today.timezone = "Europe/Vienna";
  today.title = "Wachau・Dürnstein・Vienna 中文與VeryLongMixedLanguageTitle";
  today.routeSummary = ["Melk", "Danube cruise", "Dürnstein", "Vienna"];
  today.reminders = [
    "Keep the operator voucher ready before boarding.",
    `Long generated reminder: ${LONG_TOKEN}`,
  ];
  today.items = untimedToday
    ? [
        { id: "today-1", title: `Vatican-style untimed stop ${LONG_TOKEN}`, location: "Melk", lat: 48.227, lng: 15.331 },
        { id: "today-2", title: "Danube cruise · 中文未定時段活動", location: "Dürnstein", lat: 48.395, lng: 15.52 },
        { id: "today-3", title: "Vienna evening", location: "Vienna", lat: 48.2082, lng: 16.3738 },
      ]
    : [
        { id: "today-early", start: "08:30", end: "09:30", title: `Melk Abbey ${LONG_TOKEN}`, location: "Melk", lat: 48.227, lng: 15.331 },
        {
          id: "today-flex",
          start: "TBD",
          title: "Backup boat / 彈性活動 with a very long decision label",
          location: "Danube",
          externalLinks: [{ label: "Boat operator", url: "https://example.com/boat" }],
          decision: {
            label: "TBD",
            prompt: "Use the backup boat if the published sailing still works?",
            options: [
              { id: "yes", label: "Use backup boat" },
              { id: "no", label: "Stay with the original plan" },
            ],
          },
        },
        {
          id: "today-current",
          start: "12:00",
          end: "13:30",
          title: "Dürnstein lunch and walk",
          location: "Dürnstein",
          lat: 48.395,
          lng: 15.52,
          externalLinks: [
            { label: "Official site", url: "https://example.com/official" },
            { label: "Reservation", url: "https://example.com/reservation" },
          ],
          googleSearches: [{ label: "Nearby cafes", query: "cafe" }],
          transferAfter: { label: "Transfer", mode: "Train / walk", duration: "about 30 min", summary: "Use the saved route; check live timing in the operator app." },
          infoCard: {
            label: "Background",
            title: "Dürnstein",
            summary: "Short context useful while visiting.",
            facts: ["A useful historical fact.", "A useful visit-context fact."],
            sourceLinks: [{ label: "Wikipedia", url: "https://example.com/wiki" }],
          },
        },
        {
          id: "today-personal",
          start: "TBD",
          title: "Evening coffee spot",
          location: "Vienna",
          decision: {
            mode: "personal",
            label: "Your pick",
            prompt: "Which cafe do you prefer tonight?",
            options: [
              { id: "central", label: "Café Central" },
              { id: "sacher", label: "Café Sacher" },
            ],
          },
        },
        {
          id: "today-late",
          start: "16:00",
          end: "18:00",
          title: "Return to Vienna",
          location: "Vienna",
          lat: 48.2082,
          lng: 16.3738,
          externalLinks: [{ label: "Operator timetable", url: "https://example.com/timetable" }],
        },
      ];

  return {
    trip: {
      id: "mobile-stress-trip",
      title: "冰島・荷蘭・奧捷 32-day Read-only Companion with Long Title",
      subtitle: "32 days · mobile stress fixture",
      startDate: days[0].date,
      endDate: days.at(-1).date,
      timezone: "Europe/Vienna",
      updatedAt: "2026-09-19T12:00:00+02:00",
      revision: "mobile-stress-v1",
      accent: "#4f6f5e",
      center: { lat: 48.2082, lng: 16.3738 },
    },
    ui: {
      defaultView: "now",
      theme: "system",
      locale: "en",
      bottomNav: ["now", "trip", "map", "check", "more"],
    },
    providers: {
      mapStyle: "https://tiles.openfreemap.org/styles/liberty",
      mapStyleLight: "https://tiles.openfreemap.org/styles/liberty",
      mapStyleDark: "https://tiles.openfreemap.org/styles/dark",
      weatherEndpoint: "https://api.open-meteo.com/v1/forecast",
      googleMapsEmbedKey: "",
    },
    days,
    highlights: [
      { id: "night-lights", dateLabel: "Sep 18–20", title: "Autumn illumination", icon: "✦", status: "optional", note: "Use as an evening option if energy and weather are good." },
    ],
    todos: [
      { id: "todo-1", label: `Confirm ${LONG_TOKEN} before leaving`, priority: "high" },
    ],
    checklists: [
      {
        id: "packing",
        title: `出發前確認 Before leaving the hotel ${LONG_TOKEN}`,
        items: [
          { id: "passport", label: "Passport" },
          { id: "ticket", label: `Ticket ${LONG_TOKEN}` },
        ],
      },
    ],
    reservations: [
      {
        id: "hotel",
        type: "stay",
        title: `Hotel ${LONG_TOKEN}`,
        date: TODAY,
        time: "15:00 check-in",
        location: "Wien-Innere-Stadt-Extremely-Long-Location-Name",
        status: "confirmed",
      },
    ],
    costs: { currency: "EUR", entries: [] },
    notes: [
      { id: "note", title: "Long reference", body: LONG_TOKEN.repeat(2) },
    ],
    files: [],
    contacts: [],
    journal: [],
    links: [],
  };
}

async function boot(page, viewport, { untimedToday = false, hash = "", tripDelayMs = 0 } = {}) {
  await page.setViewportSize(viewport);
  await serveMapLibreLocally(page);
  await page.addInitScript(({ now }) => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [now]));
      }
      static now() { return now; }
    }
    globalThis.Date = FixedDate;
  }, { now: FIXED_NOW });

  const trip = withLongText(makeStressTrip({ untimedToday }));
  await page.route("**/trip.json", async (route) => {
    if (tripDelayMs) await new Promise((resolve) => setTimeout(resolve, tripDelayMs));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(trip),
    });
  });

  await page.goto(`/${hash}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#trip-title")).toContainText("32-day", { timeout: 5_000 + tripDelayMs });
  await expect(page.locator("#bottom-nav .nav-item")).toHaveCount(5);
  await page.waitForTimeout(60);
}

async function assertNoDocumentOverflow(page) {
  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(metrics.html, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.body, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.width + 1);

  const nav = await page.locator("#bottom-nav").boundingBox();
  expect(nav).not.toBeNull();
  expect(nav.x).toBeGreaterThanOrEqual(-1);
  expect(nav.x + nav.width).toBeLessThanOrEqual(metrics.width + 1);
}

// Interactive controls must be horizontally inside the viewport and must not overlap each other.
// 1. Bounds: horizontally inside the viewport (known horizontal scroll rails are exempt).
// 2. Same-layer overlap: fixed/sticky chrome and open <details> popover bodies are their own layers.
// 3. Reachability: each control is scrolled to the viewport centre and must be the hit-test target at its
//    own centre. Fixed/sticky chrome covering it is a failure; only an open <details> popover may cover it.
async function assertControlsReachable(page) {
  const problems = await page.evaluate(() => {
    const SELECTOR = "a[href], button, select, summary, input:not([type=hidden]), textarea";
    const HORIZONTAL_RAILS = ".day-tabs, .place-chips, .trip-route-steps";
    const width = window.innerWidth;
    const isRendered = (el) => {
      // checkVisibility() also excludes content-visibility:hidden subtrees, e.g. a closed <details> body.
      if (!el.checkVisibility({ visibilityProperty: true })) return false;
      const box = el.getBoundingClientRect();
      return box.width > 1 && box.height > 1;
    };
    const inScrollRail = (el) => Boolean(el.closest(HORIZONTAL_RAILS));
    const layerOf = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const { position } = getComputedStyle(node);
        if (position === "fixed" || position === "sticky") return node;
        const isOpenPopoverBody = node.parentElement?.matches("details[open]") && node.tagName !== "SUMMARY";
        if (position === "absolute" && isOpenPopoverBody) return node;
      }
      return null;
    };
    const describe = (el) => {
      const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
      return `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).trim().split(/\s+/).join(".") : ""}[${text}]`;
    };

    const controls = [...document.querySelectorAll(SELECTOR)]
      .filter((el) => isRendered(el) && !inScrollRail(el))
      .map((el) => ({ el, box: el.getBoundingClientRect(), layer: layerOf(el) }));
    const found = [];
    for (const { el, box } of controls) {
      if (box.left < -1 || box.right > width + 1) found.push(`outside viewport: ${describe(el)} ${Math.round(box.left)}..${Math.round(box.right)}`);
    }
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const a = controls[i];
        const b = controls[j];
        if (a.layer !== b.layer || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const overlapX = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
        const overlapY = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
        if (overlapX > 1 && overlapY > 1) found.push(`overlap: ${describe(a.el)} × ${describe(b.el)} (${Math.round(overlapX)}x${Math.round(overlapY)})`);
      }
    }

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const hitsControl = (el, hit) => {
      if (!hit) return false;
      if (hit === el || el.contains(hit)) return true;
      // A visually hidden checkbox is operated through its <label>.
      return hit.closest("label")?.control === el;
    };
    const coveredByOpenPopover = (hit) => {
      const body = hit?.closest("details[open] > :not(summary)");
      return Boolean(body && getComputedStyle(body).position === "absolute");
    };
    for (const el of [...document.querySelectorAll(SELECTOR)].filter(isRendered)) {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      const box = el.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      if (x < 0 || x >= width || y < 0 || y >= window.innerHeight) {
        found.push(`unreachable: ${describe(el)} centre stays at ${Math.round(x)},${Math.round(y)} after scrolling`);
        continue;
      }
      const hit = document.elementFromPoint(x, y);
      if (!hitsControl(el, hit) && !coveredByOpenPopover(hit)) found.push(`covered: ${describe(el)} by ${hit ? describe(hit) : "nothing"}`);
    }
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    return found;
  });
  expect(problems, problems.join("\n")).toEqual([]);
}

// MapLibre loads asynchronously, then adds its controls and markers. With MapLibre served locally the fixture
// must always initialise a real map, so a silent fallback fails here instead of skipping those controls.
// `action` triggers a (re-)render: opening Map, switching theme, or selecting another stop.
async function settleMap(page, action) {
  const fallback = page.locator("#runtime-map .map-library-fallback");
  const styleLoaded = page.waitForResponse((response) => response.url().startsWith(`${MAP_STYLE_HOST}styles/`))
    .then(() => "maplibre", () => "no-style");
  await action();
  const fellBack = fallback.waitFor({ timeout: 15_000 }).then(() => "fallback", () => "no-fallback");
  const outcome = await Promise.race([styleLoaded, fellBack]);
  expect(outcome, "MapLibre must initialise (served locally), not fall back").toBe("maplibre");
  await expect(fallback).toHaveCount(0);
  await expect(page.locator("#runtime-map .maplibregl-ctrl").first()).toBeVisible();
  await expect(page.locator("#runtime-map .map-marker").first()).toBeVisible();
}

async function openView(page, view) {
  const click = () => page.locator(`#bottom-nav [data-view="${view}"]`).click();
  if (view === "map") await settleMap(page, click);
  else await click();
  await page.waitForTimeout(30);
}

async function assertMapFullBleed(page) {
  const metrics = await page.evaluate(() => {
    const panel = document.querySelector(".runtime-map-panel");
    const shell = document.querySelector(".app-shell");
    if (!panel || !shell) return null;
    const panelBox = panel.getBoundingClientRect();
    const shellBox = shell.getBoundingClientRect();
    return {
      panelLeft: panelBox.left,
      panelRight: panelBox.right,
      shellLeft: shellBox.left,
      shellRight: shellBox.right,
    };
  });
  expect(metrics).not.toBeNull();
  expect(Math.abs(metrics.panelLeft - metrics.shellLeft), JSON.stringify(metrics)).toBeLessThanOrEqual(1);
  expect(Math.abs(metrics.panelRight - metrics.shellRight), JSON.stringify(metrics)).toBeLessThanOrEqual(1);
}

for (const viewport of FULL_MATRIX) {
  test(`page shell reflows at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await boot(page, viewport);

    for (const view of ["now", "trip", "map", "check", "more"]) {
      await openView(page, view);
      await assertNoDocumentOverflow(page);
      await assertControlsReachable(page);
      if (view === "map" && MOBILE_VIEWPORTS.some((candidate) =>
        candidate.width === viewport.width && candidate.height === viewport.height
      )) {
        await assertMapFullBleed(page);
        // Selecting another stop re-renders the map; its controls must stay reachable too.
        await settleMap(page, () => page.locator(".place-chip:not(.active)").first().click());
        await assertControlsReachable(page);
      }
    }

    if (isMobileShell(viewport)) {
      await openView(page, "trip");
      await expect(page.locator(".long-trip-nav")).toBeVisible();
      await expect(page.locator(".shell-context-left")).toBeHidden();
      await expect(page.locator(".shell-context-right")).toBeHidden();
      await page.locator("[data-long-trip-select]").selectOption(TODAY);
      await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);
      await assertNoDocumentOverflow(page);
    } else {
      await expect(page.locator(".shell-context-left")).toBeVisible();
    }
  });
}

for (const theme of ["light", "dark"]) {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`${theme} theme reflows at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await boot(page, viewport);
      await openView(page, "more");
      await page.locator(`[data-theme="${theme}"]`).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      for (const view of ["now", "trip", "map", "check", "more"]) {
        await openView(page, view);
        await assertNoDocumentOverflow(page);
        await assertControlsReachable(page);
        if (view === "map") await assertMapFullBleed(page);
      }
    });
  }
}

test("fully untimed current day renders Today Brief without widening the phone", async ({ page }) => {
  await boot(page, { width: 320, height: 568 }, { untimedToday: true });
  await expect(page.locator(".today-brief-card")).toBeVisible();
  await assertNoDocumentOverflow(page);
});

test("trip-day deep link survives portrait -> landscape phone -> desktop -> portrait resize", async ({ page }) => {
  await boot(page, { width: 390, height: 844 }, { hash: `#trip/day/${TODAY}` });
  await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);

  for (const viewport of [
    { width: 844, height: 390 },
    { width: 932, height: 430 },
    { width: 1100, height: 900 },
    { width: 1600, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(50);
    await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);
    await assertNoDocumentOverflow(page);
  }
});

test("trip-day deep link is applied even when trip.json takes longer than 5s", async ({ page }) => {
  test.setTimeout(45_000);
  await boot(page, { width: 390, height: 844 }, { hash: `#trip/day/${TODAY}`, tripDelayMs: 6_000 });
  await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);
  await expect(page).toHaveURL(new RegExp(`#trip/day/${TODAY}$`));
});

test("enhancement layers initialise on travel-lite-ready, not by polling", () => {
  // Guards the contract in docs/ARCHITECTURE.md: a timed poll can give up before a slow trip.json arrives.
  for (const file of ["companion-ux.js", "responsive-shell.js", "theme-shell.js", "long-trip-nav.js"]) {
    const source = readFileSync(resolve(REPO_ROOT, file), "utf8");
    expect(source, `${file} must initialise on travel-lite-ready`).toContain('"travel-lite-ready"');
    expect(source, `${file} must not poll for trip data`).not.toMatch(/setInterval\s*\(/);
  }
});

test("enhancement layers initialise when trip.json takes longer than 5s", async ({ page }) => {
  test.setTimeout(60_000);

  // Phone: long-trip navigator (long-trip-nav.js).
  await boot(page, { width: 390, height: 844 }, { hash: `#trip/day/${TODAY}`, tripDelayMs: 6_000 });
  await expect(page.locator(".long-trip-nav")).toBeVisible();
  await expect(page.locator("[data-long-trip-select]")).toHaveValue(TODAY);

  // Desktop: context rails (responsive-shell.js).
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.reload();
  await expect(page.locator("#trip-title")).toContainText("32-day", { timeout: 11_000 });
  await expect(page.locator(".shell-context-left [data-shell-day]")).toHaveCount(32);
  await expect(page.locator(".shell-context-right")).not.toBeEmpty();

  // Dark system theme: Map uses the dark style (theme-shell.js syncMapStyle).
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator("#trip-title")).toContainText("32-day", { timeout: 11_000 });
  // companion-ux applies the #trip/day deep link asynchronously after ready; let it finish first.
  await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);
  const styleRequest = page.waitForRequest((request) => request.url().startsWith(`${MAP_STYLE_HOST}styles/`));
  await openView(page, "map");
  expect((await styleRequest).url()).toBe(`${MAP_STYLE_HOST}styles/dark`);
});

test("Map opened on first load initialises MapLibre exactly once", async ({ page }) => {
  // A traveller who last used Map: the stored view makes app.js's first render start the map, and the
  // ready listeners (companion-ux, theme-shell) re-render it while the MapLibre import is still pending.
  await boot(page, { width: 390, height: 844 });
  await page.evaluate(() => TravelLiteStorage.set(tripKey("ui:view"), "map"));
  await page.route(`${MAPLIBRE_CDN}+esm`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fallback();
  });
  await page.goto("/");
  await expect(page.locator("#runtime-map .maplibregl-ctrl").first()).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1_000);
  await expect(page.locator("#runtime-map .maplibregl-canvas")).toHaveCount(1);
  await expect(page.locator("#runtime-map .maplibregl-ctrl-top-right .maplibregl-ctrl-group")).toHaveCount(1);
});

test("opened secondary-link menu stays inside a 320px shell", async ({ page }) => {
  await boot(page, { width: 320, height: 568 }, { hash: `#trip/day/${TODAY}` });
  const menu = page.locator(".trip-action-menu").first();
  await menu.locator("summary").click();
  await expect(menu.locator(".trip-action-menu-body")).toBeVisible();
  await assertNoDocumentOverflow(page);
  const box = await menu.locator(".trip-action-menu-body").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(321);
});

test("reachability check fails when fixed or sticky chrome covers content controls", async ({ page }) => {
  await boot(page, { width: 320, height: 568 }, { hash: `#trip/day/${TODAY}` });
  await assertControlsReachable(page);

  // Fixed chrome: an oversized bottom nav hides content controls even when they are scrolled to centre.
  await page.addStyleTag({ content: "#bottom-nav { height: 75vh !important; }" });
  await expect(assertControlsReachable(page)).rejects.toThrow(/covered: (?!button\.nav-item)[^\n]* by (?:nav\.bottom-nav|button\.nav-item)/);

  await page.reload();
  await expect(page.locator("#trip-title")).toContainText("32-day");
  await assertControlsReachable(page);

  // Sticky layer inside the scrolling content.
  await page.evaluate(() => {
    const cover = document.createElement("div");
    cover.className = "probe-sticky-cover";
    cover.style.cssText = "position: sticky; top: 0; height: 100vh; margin-bottom: -100vh; z-index: 30; background: transparent;";
    document.querySelector("#view-root").prepend(cover);
  });
  await expect(assertControlsReachable(page)).rejects.toThrow(/covered: .* by div\.probe-sticky-cover/);

  // A control that can never be scrolled into view is reported, not skipped.
  await page.reload();
  await expect(page.locator("#trip-title")).toContainText("32-day");
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.className = "probe-offscreen";
    button.textContent = "Offscreen";
    button.style.cssText = "position: absolute; top: -500px; left: 20px;";
    document.querySelector("#view-root").append(button);
  });
  await expect(assertControlsReachable(page)).rejects.toThrow(/unreachable: button\.probe-offscreen/);
});

test("Map fallback keeps controls reachable when MapLibre cannot load", async ({ page }) => {
  await boot(page, { width: 320, height: 568 });
  // Registered after boot, so it takes precedence over the local MapLibre route.
  await page.route(`${MAPLIBRE_CDN}**`, (route) => route.abort());
  await page.locator('#bottom-nav [data-view="map"]').click();
  await expect(page.locator("#runtime-map .map-library-fallback")).toBeVisible();
  await expect(page.locator("#runtime-map .maplibregl-ctrl")).toHaveCount(0);
  await assertNoDocumentOverflow(page);
  await assertControlsReachable(page);
});

test("opened disclosure menus and cards keep controls reachable at 320px", async ({ page }) => {
  await boot(page, { width: 320, height: 568 });
  const openEach = async (selector) => {
    const all = await page.locator(selector).all();
    for (const details of all) {
      await details.locator(":scope > summary").click();
      await assertNoDocumentOverflow(page);
      await assertControlsReachable(page);
      await details.locator(":scope > summary").click();
    }
    return all.length;
  };

  await openView(page, "now");
  // Focus, window-card, floating and later menus all render links in the fixture.
  expect(await openEach("details.companion-overflow")).toBeGreaterThanOrEqual(4);
  expect(await openEach(".view-stack details.info-card")).toBeGreaterThanOrEqual(1);

  await page.goto(`/#trip/day/${TODAY}`);
  await expect(page.locator(".trip-v2-item .info-card").first()).toBeVisible();
  expect(await openEach(".trip-v2-item details.info-card")).toBeGreaterThanOrEqual(1);
  expect(await openEach("details.trip-action-menu")).toBeGreaterThanOrEqual(1);
});

test("long-text fixture keeps enum fields intact: personal decisions stay personal", async ({ page }) => {
  await boot(page, { width: 320, height: 568 }, { hash: `#trip/day/${TODAY}` });
  await expect(page.locator('[data-personal-decision-item="today-personal"]')).toHaveCount(2);
  // Free-text mode under transferAfter must still be lengthened.
  await expect(page.locator(".trip-transfer").first()).toContainText(`Train / walk ${LONG_TOKEN}`);
  await assertNoDocumentOverflow(page);
});

test("enlarged text keeps core read-only views inside a 320px shell", async ({ page }) => {
  await boot(page, { width: 320, height: 568 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });

  for (const view of ["now", "trip", "check", "more"]) {
    await openView(page, view);
    await assertNoDocumentOverflow(page);
    await assertControlsReachable(page);
  }
});
