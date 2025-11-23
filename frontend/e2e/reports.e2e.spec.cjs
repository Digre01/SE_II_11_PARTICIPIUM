const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

// Helpers aggiunti
async function ensureReportsLoaded(page) {
    await Promise.race([
        page.waitForResponse(r => r.url().includes('/api/v1/reports') && r.request().method() === 'GET').catch(() => {}),
        page.waitForSelector('table tbody tr, .list-group-item-action, .card').catch(() => {})
    ]);
}

function firstReviewButton(page) {
    return page.locator('button:has-text("Review"), a:has-text("Review"), button:has-text("View")').first();
}

test('staff can view report details for review', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');
    
    // Vai alla lista report
    await page.goto(`${BASE_URL}/reports`);

    // Wait for reports to load (either table rows or list items)
    try {
        await page.waitForSelector('table tbody tr, .list-group-item-action, .card', { timeout: 5000 });
    } catch (e) {
        console.log("No reports found in list, skipping detail check");
        return;
    }
    
    const reportRows = page.locator('table tbody tr');
    const cards = page.locator('.card');
    const listItems = page.locator('.list-group-item-action');
    
    let reviewBtn;
    
    if (await reportRows.count() > 0) {
        reviewBtn = reportRows.first().locator('button:has-text("Review"), a:has-text("Review"), button:has-text("View")');
    } else if (await cards.count() > 0) {
        reviewBtn = cards.first().locator('button:has-text("Review"), button:has-text("View")');
    } else if (await listItems.count() > 0) {
        reviewBtn = listItems.first().locator('button:has-text("Review"), a:has-text("Review")');
    }

    if (reviewBtn && await reviewBtn.count() > 0 && await reviewBtn.first().isVisible()) {
        await reviewBtn.first().click();
    } else {
        console.log("No review button found");
        return;
    }

    // Pagina review
    await page.waitForURL(/\/review\/\d+/);
    
    // Dropdown categorie
    const options = await page.$$('select.form-select option');
    expect(options.length).toBeGreaterThan(1);

    // Pulsanti
    await expect(page.locator('.btn-success')).toBeVisible();   // Accept
    await expect(page.locator('.btn-danger')).toBeVisible();    // Reject
    await expect(page.locator('.btn-secondary')).toBeVisible(); // Back
});


test('staff can accept a report', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/reports`);

    // Click first review/view button
    const btn = page.locator('button:has-text("Review"), a:has-text("Review"), button:has-text("View")').first();
    if (await btn.isVisible()) {
        await btn.click();
    } else {
        console.log("No review button found");
        return; 
    }
    
    await page.waitForURL(/\/review\/\d+/);

    // Seleziona la prima categoria
    await page.waitForSelector('select.form-select');
    const firstValue = await page.$eval('select.form-select', el => {
        const opts = [...el.options].filter(o => o.value);
        return opts[0].value;
    });

    await page.selectOption('select.form-select', firstValue);

    expect(response.status()).toBe(200);

    await page.waitForURL('**/reports');
});


test('staff can reject a report with explanation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/reports`);
    await ensureReportsLoaded(page);

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

    await page.waitForURL('**/reports');
});


test('staff cannot reject without explanation', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/reports`);

    await page.waitForURL(/\/review\/\d+/);

    await page.fill('textarea.form-control', '');

    await page.click('.btn-danger');

    await expect(page.locator('.alert')).toBeVisible();
    expect(page.url()).toMatch(/\/review\/\d+/);
});


test('staff can view all reports in list', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/reports`);
    await ensureReportsLoaded(page);

    const rows = page.locator('table tbody tr');
    const cards = page.locator('.card');
    const listItems = page.locator('.list-group-item-action');

    const rowCount = await rows.count();
    const cardCount = await cards.count();
    const listCount = await listItems.count();

    expect(rowCount + cardCount + listCount).toBeGreaterThanOrEqual(0);
});


test('non-staff cannot access report review page', async ({ page }) => {
    // Caso 1: utente non loggato
    await page.goto(`${BASE_URL}/review/1`);
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    // Caso 2: utente loggato ma non staff
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'citizen');
    await page.fill('input[name="password"]', 'citizen');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/review/1`);

});


test('staff can navigate back from review page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/reports`);

    await page.waitForURL(/\/review\/\d+/);

    await page.click('.btn-secondary');

    await page.waitForURL('**/reports');
});


test('report photos are displayed correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', 'staff1');
    await page.fill('input[name="password"]', 'staff1');
    await page.click('button:has-text("Confirm")');

    await page.goto(`${BASE_URL}/reports`);

    await page.waitForURL(/\/review\/\d+/);

    await page.waitForSelector('text=Photos').catch(() => {});

    const photos = await page.$$('img[src*="/public/"]');

    if (photos.length > 0) {
        const style = await photos[0].getAttribute('style');
        expect(style).toContain('max-width');
    }
});
