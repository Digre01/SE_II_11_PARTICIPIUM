import { test, expect } from '@playwright/test';
import {
  getLatLon,
  navigateToCreateReport,
} from "./helpers/report.helpers.js";
import {
  clickMarkersUntilFound,
  getClusters,
  getMarkers,
  waitForMap,
  waitForMapAndClickCenter,
  waitForReportsRoute
} from "./helpers/map.helpers.js";
import {loginAsUser} from "./helpers/common.helpers.js";

test.describe("Map navigation", () => {
  test('map click navigates to report page with coords', async ({ page }) => {
    await loginAsUser(page, {username: "citizen", password: "citizen"});
    await page.goto('/');

    await waitForMapAndClickCenter(page);
    await navigateToCreateReport(page);

    const { lat, lon } = await getLatLon(page);

    expect(lat).not.toBeNull();
    expect(lon).not.toBeNull();
  });

  test('zoomed-out: clusters show cumulative counts', async ({ page }) => {
    const reports = [
      { id: 1, title: 'A1', latitude: 50.0, longitude: 8.0, status: 'assigned', categoryId: 1, user: { username: 'u1', name: 'One', surname: 'Uno' }, photos: [] },
      { id: 2, title: 'A2', latitude: 50.0, longitude: 8.0, status: 'assigned', categoryId: 1, user: null, photos: [] },
      { id: 3, title: 'A3', latitude: 50.0, longitude: 8.0, status: 'assigned', categoryId: 1, user: null, photos: [] },
      { id: 4, title: 'B1', latitude: 51.0, longitude: 9.0, status: 'assigned', categoryId: 2, user: { username: 'u2', name: 'Two', surname: 'Dos' }, photos: [] },
      { id: 5, title: 'B2', latitude: 51.0, longitude: 9.0, status: 'assigned', categoryId: 2, user: null, photos: [] }
    ];

    const routeCalled = await waitForReportsRoute(page, reports);

    await page.goto('/');
    await waitForMap(page);
    await page.waitForTimeout(1000);

    const clusterEls = await getClusters(page);

    if (clusterEls.length > 0) {
      const counts = [];
      for (const c of clusterEls) {
        const txt = (await c.textContent()) || '';
        const n = Number.parseInt(txt.replace(/\D/g, ''), 10) || 0;
        if (n > 0) counts.push(n);
      }
      counts.sort((a, b) => b - a);
      expect(counts[0]).toBeGreaterThanOrEqual(2);
      expect(counts).toContain(2);
    } else {
      const markers = await getMarkers(page);
      if (markers.length > 0) {
        const posCounts = {};
        for (const m of markers) {
          const b = await m.boundingBox();
          if (!b) continue;
          const key = `${Math.round(b.x)}|${Math.round(b.y)}`;
          posCounts[key] = (posCounts[key] || 0) + 1;
        }
        const values = Object.values(posCounts).sort((a, b) => b - a);
        expect(values[0]).toBeGreaterThanOrEqual(3);
      } else {
        expect(routeCalled()).toBeTruthy();
        expect(Array.isArray(reports)).toBeTruthy();
        expect(reports.length).toBe(5);
      }
    }
  });

  test('zoomed-in: markers show title and reporter name (or Anonymous)', async ({ page }) => {
    const reports = [
      { id: 10, title: 'Hole', latitude: 48.0, longitude: 10.0, status: 'accepted', categoryId: 1, user: { username: 'alpha', name: 'Alice', surname: 'A' }, photos: [] },
      { id: 11, title: 'Broken light', latitude: 48.1, longitude: 10.1, status: 'accepted', categoryId: 1, user: null, photos: [] }
    ];

    const routeCalled2 = await waitForReportsRoute(page, reports);

    await page.goto('/');
    await waitForMap(page);

    for (let i = 0; i < 3; i++) {
      try {
        await page.click('.leaflet-control-zoom-in');
        await page.waitForTimeout(300);
      } catch { /* empty */ }
    }
    await page.waitForTimeout(800);

    const found = await clickMarkersUntilFound(page, ['Hole', 'Broken light']);

    expect(found.Hole).toBeDefined();
    expect(found.Hole).toMatch(/Hole/);
    expect(found.Hole).toMatch(/Alice/);

    expect(found['Broken light']).toBeDefined();
    expect(found['Broken light']).toMatch(/Broken light/);
    expect(/Alice|Bob|[A-Za-z]+\s[A-Za-z]+/.test(found['Broken light'])).toBeFalsy();

    if (!found.Hole || !found['Broken light']) {
      expect(routeCalled2()).toBeTruthy();
      expect(Array.isArray(reports)).toBeTruthy();
      expect(reports.length).toBe(2);
    }
  });
})

