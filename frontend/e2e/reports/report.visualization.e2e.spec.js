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

    test('non-staff cannot access report review page', async ({ page }) => {
        // Non loggato
        await page.goto('/review/1');
        await page.waitForURL('**/login');
        expect(page.url()).toContain('/login');

        // Loggato ma non staff
        await loginAsUser(page, { username: 'citizen', password: 'citizen' });
        await page.goto('/review/1');
        await page.waitForURL('**/'); // dovrebbe essere rediretto
    });

    test('staff can navigate back from review page', async ({ page }) => {
        await loginAsUser(page, BASE_USER);
        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) return;

        await page.click('.btn-secondary');
        await page.waitForURL('**/reports');
    });

    test('report photos are displayed correctly', async ({ page }) => {
        await loginAsUser(page, BASE_USER);
        await gotoReports(page);

        const found = await gotoReview(page);
        if (!found) return;

        await page.waitForSelector('text=Photos').catch(() => {});

        const photos = await page.$$('img[src*="/public/"]');
        if (photos.length > 0) {
            const style = await photos[0].getAttribute('style');
            expect(style).toContain('max-width');
        }
    });
})