/* Same-origin project-site storage regressions. SPDX-License-Identifier: AGPL-3.0-or-later */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceTrip = JSON.parse(readFileSync(resolve(ROOT, 'trip.json'), 'utf8'));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

function trip(id, title) {
  const data = structuredClone(sourceTrip);
  data.trip.id = id;
  data.trip.title = title;
  return data;
}

// Two independently deployed projects, served at distinct PATHS on ONE origin.
// Do not rely on actual GitHub Pages or a second HTTP server.
async function mountSites(page, config) {
  await page.route(/\/site-(alpha|beta)\//, async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/^\/site-(alpha|beta)\/(.*)$/);
    if (!match) return route.continue();
    const [, site, path] = match;
    if (path === 'trip.json') {
      if (config.blocked.has(site)) return route.abort('failed');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(config.trips[site]),
      });
    }

    const file = resolve(ROOT, path || 'index.html');
    if (!file.startsWith(ROOT + sep)) return route.fulfill({ status: 404 });
    try {
      return await route.fulfill({
        status: 200,
        contentType: MIME[extname(file)] || 'application/octet-stream',
        body: await readFile(file),
      });
    } catch {
      return route.fulfill({ status: 404 });
    }
  });
}

async function visit(page, site, title) {
  await page.goto('/site-' + site + '/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#trip-title')).toHaveText(title);
  return page.evaluate(() => TravelLiteSiteStorage.siteId);
}

test('two same-origin trip sites keep separate offline snapshots and freshness', async ({ page }) => {
  const config = {
    trips: { alpha: trip('trip-alpha', 'Alpha getaway'), beta: trip('trip-beta', 'Beta getaway') },
    blocked: new Set(),
  };
  await mountSites(page, config);

  const a = await visit(page, 'alpha', 'Alpha getaway');
  const aUpdated = await page.evaluate(() => TravelLiteRuntimeStatus.lastNetworkAt);
  const b = await visit(page, 'beta', 'Beta getaway');
  const bUpdated = await page.evaluate(() => TravelLiteRuntimeStatus.lastNetworkAt);
  expect(a).not.toBe(b);
  expect(a).toMatch(/\/site-alpha\/$/);
  expect(b).toMatch(/\/site-beta\/$/);
  expect(aUpdated).toBeTruthy();
  expect(bUpdated).toBeTruthy();

  config.blocked.add('alpha');
  const offlineA = await visit(page, 'alpha', 'Alpha getaway');
  expect(offlineA).toBe(a);
  const stateA = await page.evaluate(() => ({
    source: TravelLiteRuntimeStatus.tripSource,
    updated: TravelLiteRuntimeStatus.lastNetworkAt,
  }));
  expect(stateA.source).toBe('cache');
  expect(stateA.updated).toBe(aUpdated);

  config.blocked.add('beta');
  await visit(page, 'beta', 'Beta getaway');
  const stateB = await page.evaluate(() => ({
    source: TravelLiteRuntimeStatus.tripSource,
    updated: TravelLiteRuntimeStatus.lastNetworkAt,
  }));
  expect(stateB.source).toBe('cache');
  expect(stateB.updated).toBe(bUpdated);
});

test('a duplicate trip.id does not share personal checks, notes, styles, or motion', async ({ page }) => {
  const config = {
    trips: { alpha: trip('duplicated-trip-id', 'Alpha trip'), beta: trip('duplicated-trip-id', 'Beta trip') },
    blocked: new Set(),
  };
  await mountSites(page, config);
  await visit(page, 'alpha', 'Alpha trip');
  await page.evaluate(async () => {
    await TravelLiteStorage.set(tripKey('checks'), { 'test:packing': true });
    await TravelLiteStorage.set(tripKey('personalNote'), 'ALPHA PRIVATE NOTE');
    await TravelLiteStorage.set(tripKey('visualStyle'), 'candy');
    await TravelLiteStorage.set(tripKey('ui:view'), 'trip');
    TravelLiteStorybookMotion.init(state.data.trip.id);
    TravelLiteStorybookMotion.set('reduce');
  });

  await visit(page, 'beta', 'Beta trip');
  const beta = await page.evaluate(async () => {
    TravelLiteStorybookMotion.init(state.data.trip.id);
    return {
      checks: state.checks,
      note: state.personalNote,
      style: state.visualStyle,
      view: state.view,
      motion: TravelLiteStorybookMotion.get(),
      storage: await TravelLiteStorage.get(tripKey('checks')),
    };
  });
  expect(beta).toEqual({
    checks: {}, note: '', style: 'editorial', view: 'now', motion: 'system', storage: null,
  });

  await page.evaluate(async () => {
    await TravelLiteStorage.set(tripKey('personalNote'), 'BETA PRIVATE NOTE');
    await TravelLiteStorage.set(tripKey('visualStyle'), 'risograph');
  });

  await visit(page, 'alpha', 'Alpha trip');
  const alpha = await page.evaluate(() => ({
    checks: state.checks,
    note: state.personalNote,
    style: state.visualStyle,
    view: state.view,
    motion: TravelLiteStorybookMotion.get(),
  }));
  expect(alpha).toEqual({
    checks: { 'test:packing': true },
    note: 'ALPHA PRIVATE NOTE',
    style: 'candy',
    view: 'trip',
    motion: 'reduce',
  });
});

test('localStorage fallback is also site-scoped when IndexedDB is unavailable', async ({ page }) => {
  await page.context().addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: undefined });
  });
  const config = {
    trips: { alpha: trip('same-id', 'Local Alpha'), beta: trip('same-id', 'Local Beta') },
    blocked: new Set(),
  };
  await mountSites(page, config);
  await visit(page, 'alpha', 'Local Alpha');
  await page.evaluate(async () => {
    await TravelLiteStorage.set(tripKey('personalNote'), 'only alpha');
  });
  await visit(page, 'beta', 'Local Beta');
  const beta = await page.evaluate(async () => ({
    mode: TravelLiteStorage.getMode(),
    note: await TravelLiteStorage.get(tripKey('personalNote')),
  }));
  expect(beta).toEqual({ mode: 'localStorage', note: null });
  await page.evaluate(async () => TravelLiteStorage.set(tripKey('personalNote'), 'only beta'));

  await visit(page, 'alpha', 'Local Alpha');
  expect(await page.evaluate(() => state.personalNote)).toBe('only alpha');
});

test('never imports an unscoped legacy snapshot belonging to another trip', async ({ page }) => {
  const config = {
    trips: { alpha: trip('same-id', 'Legacy Alpha'), beta: trip('same-id', 'Legacy Beta') },
    blocked: new Set(),
  };
  await mountSites(page, config);
  await visit(page, 'beta', 'Legacy Beta');

  // Simulate the pre-fix shared DB and pre-fix per-trip localStorage key.
  await page.evaluate(async (foreignTrip) => {
    localStorage.setItem('travel-lite:same-id:checks', JSON.stringify({ 'test:packing': true }));
    await new Promise((resolvePromise, rejectPromise) => {
      const request = indexedDB.open('travel-lite', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('kv', { keyPath: 'key' });
      };
      request.onerror = () => rejectPromise(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put({ key: 'snapshot:latest', value: foreignTrip });
        tx.oncomplete = () => { db.close(); resolvePromise(); };
        tx.onerror = () => rejectPromise(tx.error);
      };
    });
  }, config.trips.beta);

  config.blocked.add('alpha');
  await page.goto('/site-alpha/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#error-template')).toHaveCount(1);
  await expect(page.locator('#view-root')).toContainText('Could not load trip data');
  await expect(page.locator('#trip-title')).not.toHaveText('Legacy Beta');
});

// Review #84 follow-up: an ONLINE boot must also ignore the old site's
// unchecked localStorage/IndexedDB keys. The offline-snapshot test alone does
// not exercise the legacy checklist import path.
test('online boot ignores legacy checklist values, even with matching trip.id', async ({ page }) => {
  const config = {
    trips: { alpha: trip('same-id', 'New Alpha'), beta: trip('same-id', 'Old Beta') },
    blocked: new Set(),
  };
  await mountSites(page, config);
  await visit(page, 'beta', 'Old Beta');
  await page.evaluate(async () => {
    localStorage.setItem('travel-lite:same-id:checks', JSON.stringify({ 'test:packing': true }));
    await new Promise((resolvePromise, rejectPromise) => {
      const request = indexedDB.open('travel-lite', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('kv', { keyPath: 'key' });
      request.onerror = () => rejectPromise(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put({ key: 'same-id:checks', value: { 'test:packing': true } });
        tx.oncomplete = () => { db.close(); resolvePromise(); };
        tx.onerror = () => rejectPromise(tx.error);
      };
    });
  });

  await visit(page, 'alpha', 'New Alpha'); // successful trip.json fetch
  const result = await page.evaluate(async () => ({
    checks: state.checks,
    scopedChecks: await TravelLiteStorage.get(tripKey('checks')),
    legacyLocal: localStorage.getItem('travel-lite:same-id:checks'),
  }));
  expect(result.checks).toEqual({});
  expect(result.scopedChecks).toBeNull();
  expect(JSON.parse(result.legacyLocal)).toEqual({ 'test:packing': true });
});

test('updating published trip.json keeps same-site device choices and loads fresh facts', async ({ page }) => {
  const config = {
    trips: { alpha: trip('stable-id', 'Alpha first version'), beta: trip('other', 'Beta') },
    blocked: new Set(),
  };
  await mountSites(page, config);
  const firstSite = await visit(page, 'alpha', 'Alpha first version');
  await page.evaluate(async () => {
    await TravelLiteStorage.set(tripKey('checks'), { 'bag:passport': true });
    await TravelLiteStorage.set(tripKey('personalNote'), 'Remember the tickets');
    await TravelLiteStorage.set(tripKey('visualStyle'), 'candy');
    await TravelLiteStorage.set(tripKey('ui:view'), 'trip');
  });

  // Same site and trip ID; new published data, not a new application.
  config.trips.alpha.trip.title = 'Alpha revised itinerary';
  config.trips.alpha.days[0].items.push({
    id: 'added-stop', title: 'New confirmed stop', start: '16:00', type: 'place',
  });
  const revisited = await visit(page, 'alpha', 'Alpha revised itinerary');
  expect(revisited).toBe(firstSite);
  const result = await page.evaluate(() => ({
    checks: state.checks,
    note: state.personalNote,
    style: state.visualStyle,
    view: state.view,
    hasUpdatedStop: state.data.days[0].items.some((item) => item.id === 'added-stop'),
  }));
  expect(result).toEqual({
    checks: { 'bag:passport': true },
    note: 'Remember the tickets',
    style: 'candy',
    view: 'trip',
    hasUpdatedStop: true,
  });
});

test('a real Service Worker preserves this site\'s data through an offline reload', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, serviceWorkers: 'allow' });
  try {
    const offlinePage = await context.newPage();
    await offlinePage.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(offlinePage.locator('#trip-title')).toContainText('Tokyo Autumn');
    const initial = await offlinePage.evaluate(async () => {
      await TravelLiteStorage.set(tripKey('personalNote'), 'Offline local-only note');
      await TravelLiteStorage.set(tripKey('checks'), { 'offline:bag': true });
      return {
        siteId: TravelLiteSiteStorage.siteId,
        database: TravelLiteSiteStorage.databaseName,
      };
    });
    await offlinePage.waitForFunction(
      () => Boolean(navigator.serviceWorker?.controller), null, { timeout: 12_000 },
    );

    await context.setOffline(true);
    await offlinePage.reload({ waitUntil: 'domcontentloaded' });
    await expect(offlinePage.locator('#trip-title')).toContainText('Tokyo Autumn');
    const after = await offlinePage.evaluate(async () => ({
      siteId: TravelLiteSiteStorage.siteId,
      database: TravelLiteSiteStorage.databaseName,
      source: TravelLiteRuntimeStatus.tripSource,
      note: state.personalNote,
      checks: state.checks,
      scopeCaches: (await caches.keys()).filter((key) =>
        key.startsWith('travel-lite:' + new URL('./', location.href).pathname.replace(/[^a-z0-9]/gi, '-') + ':shell-v')),
    }));
    expect(after.siteId).toBe(initial.siteId);
    expect(after.database).toBe(initial.database);
    expect(after.source).toBe('cache');
    expect(after.note).toBe('Offline local-only note');
    expect(after.checks).toEqual({ 'offline:bag': true });
    expect(after.scopeCaches.length).toBeGreaterThanOrEqual(1);
  } finally {
    await context.close();
  }
});
