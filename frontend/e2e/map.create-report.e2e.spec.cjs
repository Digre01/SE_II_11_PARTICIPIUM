const { test, expect } = require('@playwright/test');

test('full create-report flow sends coords in POST body', async ({ page }) => {
  // Intercept categories fetch so the Select has options
  await page.route('**/api/v1/categories', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Other' }])
  }));

  // Capture the outgoing report POST
  let capturedPost = null;
  await page.route('**/api/v1/reports', async route => {
    const req = route.request();
    capturedPost = req;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 123 }) });
  });

  // Go to app
  await page.goto('/');

  // Wait for the map container
  const selector = await (async () => {
    try {
      await page.waitForSelector('.leaflet-container', { timeout: 10000 });
      return '.leaflet-container';
    } catch (e) {
      await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
      return '[data-testid="map-container"]';
    }
  })();

  const map = await page.$(selector);
  const box = await map.boundingBox();
  // Click roughly center to create a selectedPoint
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Click the Create Report button in the popup if present, otherwise navigate
  try {
    const createButton = await page.waitForSelector('text=Create Report', { timeout: 3000 });
    await createButton.click();
    await expect(page).toHaveURL(/\/report/);
  } catch (err) {
    await page.goto('/report');
  }

  // Fill required fields
  await page.fill('#title', 'E2E test report');
  await page.fill('#description', 'Report created during E2E test');
  // select the first category (we intercepted categories to include id 1)
  await page.selectOption('#categoryId', '1');

  // upload a small fake file
  await page.setInputFiles('#upload_foto', [{ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('fake') }]);

  // Ensure lat/lon inputs exist and capture their values
  await page.waitForSelector('#latitude');
  await page.waitForSelector('#longitude');
  const lat = await page.$eval('#latitude', el => String(el.value || el.textContent || ''));
  const lon = await page.$eval('#longitude', el => String(el.value || el.textContent || ''));

  // Submit the form
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/v1/reports') && resp.status() === 201),
    page.click('text=Submit')
  ]);

  // Inspect the captured multipart post body contains latitude and longitude values
  expect(capturedPost).not.toBeNull();
  const raw = capturedPost.postData();
  expect(raw).toContain('name="latitude"');
  expect(raw).toContain(String(lat));
  expect(raw).toContain('name="longitude"');
  expect(raw).toContain(String(lon));
});
