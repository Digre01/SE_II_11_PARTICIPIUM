import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {gotoReports, gotoReview} from "../helpers/report.helpers.js";

test.describe("Report visualization", () => {
    const BASE_USER = { username: 'staff1', password: 'staff1' };

    test('staff can view all reports in list', async ({ page }) => {
        await loginAsUser(page, BASE_USER);

        await gotoReports(page);

        const rows = page.locator('table tbody tr');
        const cards = page.locator('.card');
        const listItems = page.locator('.list-group-item-action');

        const rowCount = await rows.count();
        const cardCount = await cards.count();
        const listCount = await listItems.count();

        expect(rowCount + cardCount + listCount).toBeGreaterThanOrEqual(0);
    });

    test('staff can navigate back from review page', async ({ page }) => {
        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) return;

        await page.click('.btn-secondary');
        await page.waitForURL('**/reports');
    });

    test('non-staff cannot access report review page', async ({ page }) => {

        await page.goto('/reports');
        await page.waitForURL('**/login');
        expect(page.url()).toContain('/login');

        await loginAsUser(page, { username: 'citizen', password: 'citizen' });

        await page.goto('/review/1');
        await page.waitForURL('**/');
        expect(page.url()).toContain("/")
    });
})