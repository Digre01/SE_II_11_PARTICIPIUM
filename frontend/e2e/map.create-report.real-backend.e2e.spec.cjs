const { test, expect } = require('@playwright/test');

test('create report with real backend (requires running backend and seeded user)', async ({ page }) => {
  // Navigate to login page and perform login as seeded citizen user
  await page.goto('/login');

  // Fill login form
  await page.fill('input[name="username"]', 'citizen');
  await page.fill('input[name="password"]', 'password');
  await Promise.all([
    page.waitForNavigation({ url: '**/' }),
    page.click('text=Confirm')
  ]);

  // Ensure we're logged in by checking for a logout button or home
  await page.waitForSelector('text=Logout', { timeout: 5000 }).catch(() => {});

  // Now interact with the map to select a point
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
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Try to open the Create Report popup/button
  try {
    const createButton = await page.waitForSelector('text=Create Report', { timeout: 3000 });
    await createButton.click();
    await expect(page).toHaveURL(/\/report/);
  } catch (err) {
    // fallback
    await page.goto('/report');
  }

  // Fill form fields and upload a tiny file
  await page.fill('#title', 'Real backend E2E test ' + Date.now());
  await page.fill('#description', 'Created during Playwright real-backend test');

  // Wait for categories to be loaded from backend and pick first option
  await page.waitForSelector('#categoryId', { timeout: 10000 });
  const firstOption = await page.$eval('#categoryId', el => el.querySelector('option')?.value);
  await page.selectOption('#categoryId', firstOption);

  // upload a small fake file
  await page.setInputFiles('#upload_foto', [{ name: 'real-e2e.png', mimeType: 'image/png', buffer: Buffer.from('test') }]);

  // ensure lat/lon are present
  await page.waitForSelector('#latitude');
  await page.waitForSelector('#longitude');

  // Submit form and wait for backend response
  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/v1/reports') && (resp.status() === 201 || resp.status() === 400)),
    page.click('text=Submit')
  ]);

  // Assert success status 201
  expect(response).not.toBeNull();
  const status = response.status();
  expect([201]).toContain(status);

  // Also assert success UI message appears
  await page.waitForSelector('text=Report submitted successfully', { timeout: 5000 });
});
