import {expect} from "@playwright/test";

export const mockCategories = async (page, categories) => {
    await page.route('**/api/v1/categories', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(categories),
        })
    );
};

export const captureReportPost = async (page) => {
    let capturedPost = null;

    await page.route('**/api/v1/reports', async route => {
        capturedPost = route.request();
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 123 }),
        });
    });

    return () => capturedPost;
};

export const navigateToCreateReport = async (page) => {
    try {
        const btn = await page.waitForSelector('text=Create Report', { timeout: 3000 });
        await btn.click();
        await expect(page).toHaveURL(/\/report/);
    } catch {
        await page.goto('/report');
    }
};

export const fillReportForm = async (page) => {
    await page.fill('#title', 'E2E test report');
    await page.fill('#description', 'Report created during E2E test');
    await page.selectOption('#categoryId', '1');

    await page.setInputFiles('#upload_foto', [{
        name: 'photo.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake'),
    }]);
};

export const getLatLon = async (page) => {
    await page.waitForSelector('#latitude');
    await page.waitForSelector('#longitude');

    const lat = await page.$eval('#latitude', el => String(el.value || el.textContent || ''));
    const lon = await page.$eval('#longitude', el => String(el.value || el.textContent || ''));

    return { lat, lon };
};

export async function gotoReports(page) {
    await page.goto(`/reports`);
    await page.waitForSelector('table tbody tr, .list-group-item-action, .card', { timeout: 5000 }).catch(() => {});
}

export async function gotoReview(page) {
    const btn = page.locator('button:has-text("Review"), a:has-text("Review"), button:has-text("View")').first();
    if (await btn.isVisible()) {
        await btn.click();
        await page.waitForURL(/\/review\/\d+/);
        return true;
    }
    return false;
}

export async function selectFirstCategory(page) {
    await page.waitForSelector('select.form-select');
    const firstValue = await page.$eval('select.form-select', el => [...el.options].filter(o => o.value)[0]?.value);
    await page.selectOption('select.form-select', firstValue);
}

export async function fillRejectExplanation(page, text) {
    await page.fill('textarea.form-control', text);
}

export async function waitForOfficeReports(page) {
    await page.goto(`/officeReports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.waitForSelector('text=Reports assigned to your office');
}

export async function getOfficeSection(page) {
    return page.locator('section, div').filter({ hasText: 'Reports assigned to your office' }).first();
}
