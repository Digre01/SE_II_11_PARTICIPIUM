import { test, expect } from '@playwright/test';
import {loginAsUser, logout} from "../helpers/common.helpers.js";
import {
    fillRejectExplanation,
    fillReportForm, gotoReports, gotoReview, selectFirstCategory,
} from "../helpers/report.helpers.js";
import {selectPointOnMap} from "../helpers/map.helpers.js";
import {AppDataSourcePostgres} from "../../../config/data-source.js";
import {Report} from "../../../entities/Reports.js";

test.describe("Full report creation flow", () => {

    test('create report with real backend', async ({ page }) => {
        await loginAsUser(page, { username: "citizen", password: "citizen" } )

        await page.goto('/');

        await selectPointOnMap(page);

        await page.waitForSelector('text=Create Report', { timeout: 5000 });
        await page.click('text=Create Report');

        await page.waitForSelector('#categoryId', { timeout: 10000 });
        const categoryValue = await page.$eval('#categoryId', el => {
            const options = Array.from(el.querySelectorAll('option'));
            const publicLighting = options
                .find(o => o.textContent?.trim().toLowerCase() === 'public lighting');
            return publicLighting?.value || '';
        });

        await fillReportForm(page, {
            title: `Test Report`,
            description: 'Testing public lighting issue via map click',
            categoryId: categoryValue,
            photos: [{
                name: 'lampione.png',
                mimeType: 'image/png',
                buffer: Buffer.from('test'),
            }],
        });

        await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 5000 });
        await page.click('button[type="submit"]');

        const successAlert = await page.locator('text=Report submitted successfully', { timeout: 5000 });
        await expect(successAlert).toBeVisible()

        const report = await AppDataSourcePostgres.getRepository(Report).findOneBy({
            title: "Test Report"
        })
        expect(report).not.toBe(null)
    });
})

test.describe("Review reports", () => {

    test('staff can view report details for review', async ({ page }) => {
        //await logout(page)
        await loginAsUser(page, { username: 'staff1', password: 'staff1' });

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

    test('staff cannot reject without explanation', async ({ page }) => {
        await loginAsUser(page, { username: 'staff1', password: 'staff1' });

        await page.click("text=Test Report")

        await fillRejectExplanation(page, '');
        await page.click('.btn-danger');

        await expect(page.locator('.alert')).toBeVisible();
        expect(page.url()).toMatch(/\/review\/\d+/);
    });

    test('staff can accept a report', async ({ page }) => {
        await loginAsUser(page, { username: 'staff1', password: 'staff1' });

        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) {
            console.log('No review button found');
            return;
        }

        await page.click("text=Test Report")

        await page.click('.btn-success');
        await page.waitForURL('**/reports');
    });
})