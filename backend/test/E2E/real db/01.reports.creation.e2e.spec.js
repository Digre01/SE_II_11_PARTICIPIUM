import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {
    createTestReport,
    fillRejectExplanation,
    gotoReports
} from "../helpers/report.helpers.js";
import {getTestReport} from "../helpers/requests.helpers.js";


test.describe("Full report creation flow", () => {

    test('create report with real backend', async ({ page, request }) => {
        await createTestReport(page, request);

        expect(await getTestReport(page, request)).toBeDefined()
    });

    test.describe("Report evaluation", () => {

        test.beforeEach(async ({ page }) => {
            await loginAsUser(page, { username: 'staff1', password: 'staff1' });
            await gotoReports(page);
        })

        test('staff can view report details for review', async ({ page }) => {
            await page.click('h5:text("Test Report")');

            await expect(page.locator('.btn-success')).toBeVisible();
            await expect(page.locator('.btn-danger')).toBeVisible();
        });

        test('staff cannot reject without explanation', async ({ page }) => {

            await page.click('h5:text("Test Report")');

            await fillRejectExplanation(page, '');
            await page.click('.btn-danger');

            await expect(page.locator('.alert')).toBeVisible();
            expect(page.url()).toMatch(/\/review\/\d+/);
        });

        test('staff can accept a report', async ({ page, request }) => {

            await page.click('h5:text("Test Report")');
            await page.locator("h3", {hasText: "Review report"})

            await page.click('.btn-success');
            await gotoReports(page);

            const testReport = await getTestReport(page, request)
            expect(testReport.status).toBe("assigned")
        });
    })
})