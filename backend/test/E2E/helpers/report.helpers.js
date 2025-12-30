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

export async function fillReportForm(page, data) {
    if (data.title) await page.fill('#title', data.title);
    if (data.description) await page.fill('#description', data.description);

    if (data.categoryId) {
        await page.waitForSelector('#categoryId', { timeout: 10000 });
        await page.selectOption('#categoryId', data.categoryId);
    }

    if (data.photos && data.photos.length > 0) {
        await page.setInputFiles('#upload_foto', data.photos);
    }

    await page.waitForSelector('#latitude');
    await page.waitForSelector('#longitude');
}

export async function getLastReport() {
    const res = await fetch('http://localhost:3000/api/v1/reports', {
        method: 'GET',
        credentials: 'include'
    });

    const reports = await res.json();
    console.log(reports)
    if (!reports || reports.length === 0) return null;

    reports.sort((a, b) => b.id - a.id);    //ordino decrescente e prendo il primo
    return reports[0];
}

export async function deleteReport(reportId){
    const res = await fetch(`http://localhost:3000/api/v1/test/reports/${reportId}`, {
        method: 'DELETE',
        credentials: "include"
    });

    if (!res.ok) throw new Error(`Failed to delete report ${reportId}`);
    const data = await res.json();
    console.log(data.message);
}

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

export async function getOfficeSection(page, officeName = "Public Lighting Office") {
    return page.locator('section, div').filter({ hasText: `Reports assigned to: ${officeName}` }).first();
}

export async function getUserSection(page) {
    return page.locator('section, div').filter({ hasText: "Reports assigned to you" }).first();
}

export async function selectOfficeAndWaitReports(page, officeName = "Public Lighting Office") {
    await page.goto(`/officeReports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.waitForSelector('select', { timeout: 5000 });

    const value = await page.$eval(
        'select',
        (select, officeName) => {
            const option = Array.from(select.options).find(o => o.textContent?.trim() === officeName);
            return option?.value || "";
        },
        officeName
    );

    if (!value) throw new Error(`Office "${officeName}" not found in dropdown`);

    await page.selectOption('select', value);

    await page.waitForSelector('table tbody tr', { timeout: 5000 });
}