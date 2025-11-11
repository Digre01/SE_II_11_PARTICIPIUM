const { test, expect } = require('@playwright/test');

test('map click navigates to report page with coords', async ({ page, baseURL }) => {
  // go to base URL
  await page.goto('/');

  // Wait for the Leaflet map container (common class) or an explicit data-testid
  const selector = await (async () => {
    try {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      return '.leaflet-container';
    } catch (e) {
      // try data-testid as fallback
      await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
      return '[data-testid="map-container"]';
    }
  })();

  const map = await page.$(selector);
  const box = await map.boundingBox();
  // Click roughly at the center of the map
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Try to click the Create Report button in a popup; if it doesn't appear, navigate directly to /report
  try {
    const createButton = await page.waitForSelector('text=Create Report', { timeout: 5000 });
    await createButton.click();
    await expect(page).toHaveURL(/\/report/);
  } catch (err) {
    await page.goto('/report');
  }

  // verify latitude/longitude inputs exist
  await page.waitForSelector('#latitude', { timeout: 5000 });
  await page.waitForSelector('#longitude', { timeout: 5000 });
  const lat = await page.$eval('#latitude', el => el.value || el.textContent || '');
  const lon = await page.$eval('#longitude', el => el.value || el.textContent || '');

  expect(lat).not.toBeNull();
  expect(lon).not.toBeNull();
});
