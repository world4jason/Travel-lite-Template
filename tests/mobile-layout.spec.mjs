import { test, expect } from "@playwright/test";

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
  { width: 820, height: 1180 },
  { width: 1100, height: 900 },
  { width: 1600, height: 900 },
];

function dateAt(index) {
  const date = new Date(Date.UTC(2026, 8, 1 + index));
  return date.toISOString().slice(0, 10);
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
          decision: {
            label: "TBD",
            prompt: "Use the backup boat if the published sailing still works?",
            options: [
              { id: "yes", label: "Use backup boat" },
              { id: "no", label: "Stay with the original plan" },
            ],
          },
        },
        { id: "today-current", start: "12:00", end: "13:30", title: "Dürnstein lunch and walk", location: "Dürnstein", lat: 48.395, lng: 15.52 },
        { id: "today-late", start: "16:00", end: "18:00", title: "Return to Vienna", location: "Vienna", lat: 48.2082, lng: 16.3738 },
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
    todos: [
      { id: "todo-1", label: `Confirm ${LONG_TOKEN} before leaving`, priority: "high" },
    ],
    checklists: [
      {
        id: "packing",
        title: "Before leaving the hotel",
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

async function boot(page, viewport, { untimedToday = false, hash = "" } = {}) {
  await page.setViewportSize(viewport);
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

  const trip = makeStressTrip({ untimedToday });
  await page.route("**/trip.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(trip),
    });
  });

  await page.goto(`/${hash}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#trip-title")).toContainText("32-day");
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

async function openView(page, view) {
  await page.locator(`#bottom-nav [data-view="${view}"]`).click();
  await page.waitForTimeout(30);
}

for (const viewport of FULL_MATRIX) {
  test(`page shell reflows at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await boot(page, viewport);

    for (const view of ["now", "trip", "map", "check", "more"]) {
      await openView(page, view);
      await assertNoDocumentOverflow(page);
    }

    if (viewport.width < 900) {
      await openView(page, "trip");
      await expect(page.locator(".long-trip-nav")).toBeVisible();
      await page.locator("[data-long-trip-select]").selectOption(TODAY);
      await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);
      await assertNoDocumentOverflow(page);
    }
  });
}

test("fully untimed current day renders Today Brief without widening the phone", async ({ page }) => {
  await boot(page, { width: 320, height: 568 }, { untimedToday: true });
  await expect(page.locator(".today-brief-card")).toBeVisible();
  await assertNoDocumentOverflow(page);
});

test("trip-day deep link survives phone -> compact -> wide -> phone resize", async ({ page }) => {
  await boot(page, { width: 390, height: 844 }, { hash: `#trip/day/${TODAY}` });
  await expect(page.locator(`[data-trip-day="${TODAY}"].active`)).toHaveCount(1);

  for (const viewport of [
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

test("enlarged text keeps core read-only views inside a 320px shell", async ({ page }) => {
  await boot(page, { width: 320, height: 568 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });

  for (const view of ["now", "trip", "check", "more"]) {
    await openView(page, view);
    await assertNoDocumentOverflow(page);
  }
});
