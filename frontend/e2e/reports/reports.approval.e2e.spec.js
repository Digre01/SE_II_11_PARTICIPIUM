import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {
    fillRejectExplanation,
    gotoReports, gotoReview,
    selectFirstCategory
} from "../helpers/report.helpers.js";

test.describe("Review reports", () => {
    const BASE_USER = { username: 'staff1', password: 'staff1' };

    test('staff can view report details for review', async ({ page }) => {
        await loginAsUser(page, BASE_USER);

        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) {
            console.log('No review button found');
            return;
        }

        // Dropdown categorie
        const options = await page.$$('select.form-select option');
        expect(options.length).toBeGreaterThan(1);

        await expect(page.locator('.btn-success')).toBeVisible();
        await expect(page.locator('.btn-danger')).toBeVisible();
        await expect(page.locator('.btn-secondary')).toBeVisible();
    });

    test('staff can accept a report', async ({ page }) => {
        await loginAsUser(page, BASE_USER);

        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) {
            console.log('No review button found');
            return;
        }

        await selectFirstCategory(page);

        await page.click('.btn-success'); // Accetta
        await page.waitForURL('**/reports');
    });

    test('staff can reject a report with explanation', async ({ page }) => {
        await loginAsUser(page, BASE_USER);

        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) {
            console.log('No review button found');
            return;
        }

        const text = 'Insufficient info - test ' + Date.now();
        await fillRejectExplanation(page, text);

        const [response] = await Promise.all([
            page.waitForResponse(r =>
                r.url().includes('/review') && r.request().method() === 'PATCH'
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
        await loginAsUser(page, BASE_USER);

        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) return;

        await fillRejectExplanation(page, '');
        await page.click('.btn-danger');

        await expect(page.locator('.alert')).toBeVisible();
        expect(page.url()).toMatch(/\/review\/\d+/);
    });

})