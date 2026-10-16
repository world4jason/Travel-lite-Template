import { test, expect } from "@playwright/test";

const sample = () => ({
  trip: {
    id: "five-round-qa", title: "Journey Fixture 東京",
    startDate: "2026-10-03", endDate: "2026-10-03",
    timezone: "Asia/Tokyo",
    updatedAt: "2026-09-02T12:00:00+09:00",
    publication: { state: "draft", humanGate: "waived" }
  },
  ui: { locale: "zh-TW", defaultView: "trip", bottomNav: ["now","trip","map","check","more"] },
  days: [{
    id: "day-1", date: "2026-10-03", label: "Day 1", title: "資料驗證行程",
    routeSummary: ["Station", "Deadline"],
    planB: [{ title: "Day shelter", category: "place", note: "Day backup" }],
    items: [
      {
        id: "station", title: "Station", location: "Tokyo", start: "12:00", end: "13:25",
        transferAfter: {
          label: "Transfer", mode: "Train", duration: "about 30 min",
          estimate: { minMinutes: 25, maxMinutes: 35, bufferMinutes: 15, basis: "researched" },
          checkedAt: "2026-09-01",
          sourceLinks: [{ label: "Rail authority", url: "https://example.org/rail" }],
          planB: [{ title: "Official shuttle", category: "transport", mode: "Bus",
            checkedAt: "2026-09-01", sourceLinks: [{ label: "Operator", url: "https://example.org/bus" }] }]
        }
      },
      {
        id: "deadline", title: "Deadline appointment", location: "Museum",
        start: "14:00", end: "15:00",
        arrivalDeadline: "2026-10-03T14:00:00+09:00",
        planB: [{ title: "Nearby café", category: "food", note: "Already curated" }],
        infoCard: { label: "About", title: "Short context", summary: "User-provided only" }
      },
      { id: "floating", title: "Floating choice", start: "TBD" }
    ]
  }],
  pocketPicks: [{ title: "Optional market", category: "place", note: "Pocket reference" }],
  essentials: [
    { title: "Airport transfer notes", category: "Airport transfer", body: "Follow official signs." },
    { title: "Local fare cards", category: "Local transit", summary: "Follow the ticket rules.",
      sourceLinks: [{ label: "Ticket office", url: "https://example.org/tickets" }] },
    { title: "Intercity rail", category: "Intercity", body: "Check the platform before boarding." }
  ],
  researchNotes: [{ category: "General", title: "Archive source",
    checkedAt: "2026-09-01", sourceLinks: [{ label: "Guide", url: "https://example.org/guide" }] }],
  highlights: [], checklists: [], todos: [], reservations: [], costs: { currency: "JPY", entries: [] },
  notes: [], files: [], contacts: [], journal: [], links: []
});

async function boot(page, fixture, url = "/#trip/overview", fixedDate = true) {
  if (fixedDate) {
    await page.addInitScript(() => {
      const ExistingDate = Date;
      const epoch = ExistingDate.parse("2026-10-03T04:00:00Z"); // 13:00 Asia/Tokyo
      class Frozen extends ExistingDate {
        constructor(...args) { super(...(args.length ? args : [epoch])); }
        static now() { return epoch; }
      }
      globalThis.Date = Frozen;
    });
  }
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/trip.json", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify(fixture)
  }));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#trip-title")).toContainText("Journey Fixture");
  await expect(page.locator("#bottom-nav [data-view]")).toHaveCount(5);
  return errors;
}

async function openDay(page) {
  await page.goto("/#trip/overview");
  await expect(page.locator(".trip-overview-day").first()).toBeVisible();
  await page.locator(".trip-overview-day").first().click();
  await expect(page.locator(".trip-day-view")).toBeVisible();
}

test("Plan B is opt-in, collapsed, source-ordered and never selects for the traveller", async ({page}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await boot(page, sample());
  await expect(page.locator(".trip-overview-view .trip-alternatives")).toHaveCount(1);
  await expect(page.locator(".trip-overview-view .trip-alternatives")).not.toHaveAttribute("open");
  await openDay(page);
  await expect(page.locator(".trip-alternatives")).toHaveCount(3);
  await expect(page.getByText("Official shuttle")).toHaveCount(1);
  await expect(page.getByText("Nearby café")).toHaveCount(1);
  await expect(page.getByText("Day shelter")).toHaveCount(1);
  await expect(page.locator(".trip-alternatives[open]")).toHaveCount(0);
  await page.locator(".trip-transfer .trip-alternatives > summary").click();
  await expect(page.locator(".trip-transfer .trip-alternatives")).toHaveAttribute("open", "");
  const state = await page.evaluate(() => ({
    preference: state.personalDecisionSelections,
    schedule: state.data.days[0].items.map(item => item.id)
  }));
  expect(state.schedule).toEqual(["station", "deadline", "floating"]);
  expect(state.preference || {}).toEqual({});
  expect(errors).toEqual([]);
});

test("Old trip JSON has zero Plan B, Essentials, Research Notes and publication notices", async ({page}) => {
  const trip = sample();
  delete trip.pocketPicks;
  delete trip.essentials;
  delete trip.researchNotes;
  delete trip.trip.publication;
  for (const day of trip.days) {
    delete day.planB;
    for (const item of day.items) {
      delete item.planB;
      if (item.transferAfter) {
        delete item.transferAfter.planB;
        delete item.transferAfter.sourceLinks;
        delete item.transferAfter.checkedAt;
        delete item.transferAfter.estimate;
      }
    }
  }
  await boot(page, trip);
  await expect(page.locator(".trip-alternatives, .trip-trust-notice")).toHaveCount(0);
  await openDay(page);
  await expect(page.locator(".trip-alternatives, .trip-trust-notice, .trip-transit-time")).toHaveCount(0);
  await page.goto("/#more");
  await expect(page.locator(".trip-research-notes, .travel-essential, .trip-trust-notice")).toHaveCount(0);
});

test("Travel Essentials is collapsed, preserves three types, and Research Notes cite historic dates", async ({page}) => {
  await boot(page, sample(), "/#more");
  await expect(page.getByText("Airport transfer notes")).toHaveCount(1);
  await expect(page.locator(".travel-essential h3", {hasText:"Local fare cards"})).toHaveCount(1);
  await expect(page.locator(".travel-essential h3", {hasText:"Intercity rail"})).toHaveCount(1);
  await expect(page.locator(".more-section[open] .travel-essential")).toHaveCount(0);
  await expect(page.locator(".trip-research-notes")).toHaveCount(1);
  await page.locator(".trip-research-notes > summary").click();
  await expect(page.locator(".trip-research-notes")).toHaveAttribute("open", "");
  await expect(page.getByText("Rail authority")).toHaveCount(1);
  await expect(page.getByText("資料核對 · 2026-09-01").first()).toBeVisible();
  await expect(page.locator(".trip-trust-notice")).toContainText("人工驗收未執行");
});

test("Structured transit computes only explicit source-backed leave-by and warns about tight schedules", async ({page}) => {
  const errors = await boot(page, sample());
  await openDay(page);
  await expect(page.locator(".trip-transit-time")).toHaveCount(1);
  await expect(page.locator(".trip-transit-time")).toContainText("13:10");
  await expect(page.locator(".trip-transit-time")).toContainText("較接近或衝突");
  await expect(page.locator(".trip-transfer-copy")).toContainText("25–35");
  await page.goto("/#now");
  await expect(page.locator(".trip-transit-now")).toContainText("13:10");
  expect(errors).toEqual([]);
});

for (const scenario of ["generic", "buffer", "bad-zone"]) {
  test("Transit does not fabricate leave-by: " + scenario, async ({page}) => {
    const trip=sample();
    if(scenario==="generic")delete trip.days[0].items[1].arrivalDeadline;
    if(scenario==="buffer")delete trip.days[0].items[0].transferAfter.estimate.bufferMinutes;
    if(scenario==="bad-zone")trip.days[0].items[1].arrivalDeadline="2026-10-03T14:00:00+08:00";
    await boot(page,trip);
    await openDay(page);
    await expect(page.locator(".trip-transit-time")).toHaveCount(0);
    await expect(page.locator(".trip-transfer-copy")).toContainText("25–35");
  });
}

test("Malicious option and source values remain inert", async ({page}) => {
  const trip = sample();
  trip.days[0].items[1].planB=[{
    title: "<img src=x onerror=alert(1)>", note: "<script>alert(1)</script>",
    url: "javascript:alert(1)",
    sourceLinks: [{ label: "unsafe", url: "data:text/html,evil" }]
  }];
  trip.essentials[0].body="<svg onload=alert(1)>";
  trip.researchNotes[0].title="<script>alert(2)</script>";
  const errors=await boot(page,trip);
  await openDay(page);
  await expect(page.locator(".trip-alternatives script, .trip-alternatives img")).toHaveCount(0);
  await expect(page.locator('.trip-alternatives a[href^="javascript:"], .trip-alternatives a[href^="data:"]')).toHaveCount(0);
  await page.goto("/#more");
  await expect(page.locator(".travel-essential svg, .trip-research-notes script")).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const viewport of [{width:320,height:568},{width:390,height:844},{width:1100,height:900}]) {
  test("All secondary options fit viewport " + viewport.width + "x" + viewport.height, async ({page}) => {
    await page.setViewportSize(viewport);
    await boot(page,sample());
    await openDay(page);
    await page.locator(".trip-transfer .trip-alternatives > summary").click();
    await expect(page.locator(".trip-transfer .trip-alternatives")).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth+1)).toBe(true);
    await page.goto("/#more");
    await expect(page.locator(".travel-essential").first()).toBeAttached();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth+1)).toBe(true);
  });
}

test("PWA precaches transit/trust runtime and styles for a first offline reload", async ({browser,baseURL}) => {
  const context=await browser.newContext({baseURL,serviceWorkers:"allow"});
  try {
    const page=await context.newPage();
    await page.goto("/", {waitUntil:"domcontentloaded"});
    await expect(page.locator("#trip-title")).toContainText("Tokyo Autumn");
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, {timeout:15000});
    const missing=await page.evaluate(async () => {
      const required=["journey-trust.js","journey-trust.css","journey-transit.js","journey-transit.css"];
      const cacheNames=(await caches.keys()).filter(key=>key.startsWith("travel-lite:") && key.includes(":shell-v"));
      const cache=await caches.open(cacheNames[0]);
      const matches=await Promise.all(required.map(file=>cache.match(new URL(file,location.href))));
      return required.filter((_,index)=>!matches[index]);
    });
    expect(missing).toEqual([]);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#trip-title")).toContainText("Tokyo Autumn");
    expect(await page.evaluate(()=>Boolean(window.TravelLiteTrust && window.TravelLiteTransit))).toBe(true);
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});
