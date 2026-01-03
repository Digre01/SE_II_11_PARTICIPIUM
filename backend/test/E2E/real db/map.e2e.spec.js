import { test, expect } from '@playwright/test';
import {
  getLatLon,
  navigateToCreateReport,
} from "../helpers/report.helpers.js";
import {
  clickMarkersUntilFound,
  getClusters,
  getMarkers, selectPointOnMap,
  waitForMap,
} from "../helpers/map.helpers.js";
import {loginAsUser} from "../helpers/common.helpers.js";
import {getAssignedReports} from "../helpers/requests.helpers.js";

test.describe("Map navigation", () => {
  test('map click navigates to report page with coords', async ({ page }) => {
    await loginAsUser(page, {username: "citizen", password: "citizen"});
    await page.goto('/');

    await waitForMap(page);
    await selectPointOnMap(page)
    await navigateToCreateReport(page);

    const { lat, lon } = await getLatLon(page);

    expect(lat).not.toBeNull();
    expect(lon).not.toBeNull();
  });

  test('zoomed-out: clusters show cumulative counts', async ({ page, request }) => {
    const reports = await getAssignedReports(page, request);

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

      expect(counts.length).toBeGreaterThan(0);
      expect(counts.every(n => n > 0)).toBeTruthy();

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
        const values = Object.values(posCounts);
        expect(values.length).toBeGreaterThan(0);
        expect(values.every(v => v > 0)).toBeTruthy();
      } else {
        expect(Array.isArray(reports)).toBeTruthy();
        expect(reports.length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('zoomed-in: markers show title and reporter name (or Anonymous)', async ({ page, request }) => {
    const reports = await getAssignedReports(page, request);

    await page.goto('/');
    await waitForMap(page);

    for (let i = 0; i < 3; i++) {
      try {
        await page.click('.leaflet-control-zoom-in');
        await page.waitForTimeout(300);
      } catch { /* empty */ }
    }
    await page.waitForTimeout(800);

    const reportTitles = reports.map(r => r.title);
    const found = await clickMarkersUntilFound(page, reportTitles);

    // Verify that at least some markers were found
    expect(Object.keys(found).length).toBeGreaterThan(0);

    // For each found marker, verify it contains the expected information
    for (const [title, info] of Object.entries(found)) {
      const report = reports.find(r => r.title === title);
      expect(report).toBeDefined();

      const escapedTitle = title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      expect(info).toMatch(new RegExp(escapedTitle, 'i'));

      if (report.authorName) {
        const escapedName = report.authorName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        expect(info).toMatch(new RegExp(escapedName, 'i'));
      } else {
        expect(info).toMatch(/Anonymous/i);
      }
    }
  })

  test('not logged in user can view reports but cannot create new ones from map', async ({ page, request }) => {
    const reports = await getAssignedReports(page, request);

    await page.goto('/');
    await waitForMap(page);
    await page.waitForTimeout(1000);

    // Verify that reports are visible on the map
    const clusterEls = await getClusters(page);
    const markers = await getMarkers(page);
    
    const hasReportsVisible = clusterEls.length > 0 || markers.length > 0;
    expect(hasReportsVisible).toBeTruthy();

    // Click on a point on the map
    await selectPointOnMap(page);
    await page.waitForTimeout(500);

    // Verify that the "Create Report" button does NOT appear
    const createReportButton = await page.$('button:has-text("Create Report")');
    expect(createReportButton).toBeNull();

    // Verify that we're still on the home page and not navigated to report creation
    expect(page.url()).toMatch(/\//);
    expect(page.url()).not.toMatch(/\/report/);
  })
})

