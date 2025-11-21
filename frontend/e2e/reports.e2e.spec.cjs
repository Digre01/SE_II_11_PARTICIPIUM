const { test, expect } = require('@playwright/test');

test('staff can view report details for review', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")')
    ]);

    // Verifica logout nel menu (header)
    await expect(page.locator('text=Logout')).toBeVisible();

    // Vai alla lista report
    await page.goto('/reports');
    await page.waitForSelector('text=Pending Reports');

    // Seleziona il primo report disponibile
    const firstReportLink = page.locator('.list-group-item-action').first();
    await firstReportLink.click();

    // Pagina review
    await page.waitForURL(/\/review\/\d+/);
    await page.waitForSelector('text=Review Report');

    // Dettagli
    await expect(page.locator('h5')).toBeVisible();
    await expect(page.locator('text=Coordinates:')).toBeVisible();
    await expect(page.locator('text=Status:')).toBeVisible();

    // Dropdown categorie
    const options = await page.$$('select.form-select option');
    expect(options.length).toBeGreaterThan(1);

    // Pulsanti
    await expect(page.locator('.btn-success')).toBeVisible();   // Accept
    await expect(page.locator('.btn-danger')).toBeVisible();    // Reject
    await expect(page.locator('.btn-secondary')).toBeVisible(); // Back
});


test('staff can accept a report', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")'),
    ]);

    await page.goto('/reports');

    // Apri il primo report
    await page.locator('.list-group-item-action').first().click();
    await page.waitForURL(/\/review\/\d+/);

    // Seleziona la prima categoria
    await page.waitForSelector('select.form-select');
    const firstValue = await page.$eval('select.form-select', el => {
        const opts = [...el.options].filter(o => o.value);
        return opts[0].value;
    });

    await page.selectOption('select.form-select', firstValue);

    // Accept → PATCH /api/v1/reports/:id/review
    const [response] = await Promise.all([
        page.waitForResponse(r =>
            r.url().includes('/review') &&
            r.request().method() === 'PATCH'
        ),
        page.click('.btn-success')
    ]);

    expect(response.status()).toBe(200);

    // Messaggio e redirect
    //await expect(page.locator('.alert-info')).toHaveText(/Report assigned|Report rejected/);
    await page.waitForURL('/reports');
});


test('staff can reject a report with explanation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")')
    ]);

    await page.goto('/reports');

    // Apri un report
    await page.locator('.list-group-item-action').first().click();
    await page.waitForURL(/\/review\/\d+/);

    const text = "Insufficient info - test " + Date.now();
    await page.fill('textarea.form-control', text);

    const [response] = await Promise.all([
        page.waitForResponse(r =>
            r.url().includes('/review') &&
            r.request().method() === 'PATCH'
        ),
        page.click('.btn-danger')
    ]);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('rejected');
    expect(data.reject_explanation).toBe(text);

    //await expect(page.locator('.alert-info')).toHaveText(/Report assigned|Report rejected/);
    await page.waitForURL('/reports');
});


test('staff cannot reject without explanation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")')
    ]);

    await page.goto('/reports');

    await page.locator('.list-group-item-action').first().click();
    await page.waitForURL(/\/review\/\d+/);

    // No explanation
    await page.fill('textarea.form-control', '');

    await page.click('.btn-danger');

    await page.waitForSelector('text=Please provide an explanation for rejection');
    await expect(page).toHaveURL(/\/review\/\d+/);
});


test('staff can view all reports in list', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")')
    ]);

    await page.goto('/reports');

    await page.waitForResponse(r =>
        r.url().includes('/reports') &&
        r.request().method() === 'GET'
    );

    await page.waitForSelector('text=Pending Reports');

    const links = await page.$$('.list-group-item-action');
    expect(links.length).toBeGreaterThan(0);
});


test('non-staff cannot access report review page', async ({ page }) => {
    // Caso 1: utente non loggato
    await page.goto('/review/1');
    await page.waitForURL('/login', { timeout: 10000 });
    expect(page.url()).toBe(page.url().includes('/login') ? page.url() : '/login');

    // Caso 2: utente loggato ma non staff
    await page.goto('/login');
    await page.fill('input[name="username"]', 'citizen');
    await page.fill('input[name="password"]', 'citizen');
    await Promise.all([
        page.waitForNavigation(),
        page.click('text=Confirm'),
    ]);

    await page.goto('/review/1');
    // Dovrebbe essere rediretto alla home
    await page.waitForURL('/', { timeout: 10000 });
    expect(page.url()).toBe('http://localhost:5173/');
});


test('staff can navigate back from review page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")')
    ]);

    await page.goto('/reports');

    await page.locator('.list-group-item-action').first().click();
    await page.waitForURL(/\/review\/\d+/);

    await page.click('.btn-secondary');

    await page.waitForURL('/reports');
});


test('report photos are displayed correctly', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await Promise.all([
        page.waitForNavigation(),
        page.click('button:has-text("Confirm")')
    ]);

    await page.goto('/reports');

    await page.locator('.list-group-item-action').first().click();
    await page.waitForURL(/\/review\/\d+/);

    await page.waitForSelector('text=Photos');

    const photos = await page.$$('img[src*="/public/"]');

    if (photos.length > 0) {
        const style = await photos[0].getAttribute('style');
        expect(style).toContain('max-width');
    }
});
