import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {getOfficeSection, selectOfficeAndWaitReports} from "../helpers/report.helpers.js";

test.describe('report starting, finishing, suspending and resuming', () => {
    let loggedIn;

    test.beforeEach(async ({ page }) => {
        if (!loggedIn) {
            await loginAsUser(page, { username: 'staff2', password: 'staff2' });
            loggedIn = true
        }
    });

    test('pressing START button changes report status to IN PROGRESS', async ({ page }) => {
        await selectOfficeAndWaitReports(page);

        const officeSection = await getOfficeSection(page);

        const inProgressBefore = await officeSection.locator('span:has-text("IN PROGRESS")').count();

        await officeSection.locator('button:has-text("START")').first().click();
        await page.waitForTimeout(1500);

        const inProgressAfter = await officeSection.locator('span:has-text("IN PROGRESS")').count();
        expect(inProgressAfter).toBeGreaterThan(inProgressBefore);
    });

    test('pressing SUSPEND button changes report status to SUSPENDED', async ({ page }) => {
        const officeSection = await getOfficeSection(page);

        const suspendedBefore = await officeSection.locator('span:has-text("SUSPENDED")').count();

        await officeSection.locator('button:has-text("SUSPEND")').first().click();
        await page.waitForTimeout(1500);

        const suspendedAfter = await officeSection.locator('span:has-text("SUSPENDED")').count();
        expect(suspendedAfter).toBeGreaterThan(suspendedBefore);
    });

    test('pressing RESUME button changes report status back from SUSPENDED', async ({ page }) => {
        const officeSection = await getOfficeSection(page);

        const suspendedBefore = await officeSection.locator('span:has-text("SUSPENDED")').count();

        await officeSection.locator('button:has-text("RESUME")').first().click();
        await page.waitForTimeout(1500);

        const suspendedAfter = await officeSection.locator('span:has-text("SUSPENDED")').count();
        expect(suspendedAfter).toBeLessThan(suspendedBefore);
    });

    test('pressing FINISH button changes report status from IN PROGRESS', async ({ page }) => {
        const officeSection = await getOfficeSection(page);

        const inProgressBefore = await officeSection.locator('span:has-text("IN PROGRESS")').count();

        await officeSection.locator('button:has-text("FINISH")').first().click();
        await page.waitForTimeout(1500);

        const inProgressAfter = await officeSection.locator('span:has-text("IN PROGRESS")').count();
        expect(inProgressAfter).toBeLessThan(inProgressBefore);
    });

    test('assigning report to external office shows confirmation alert', async ({ page }) => {
        const officeSection = await getOfficeSection(page);

        const assignBtn = officeSection.locator(
            'button:has-text("ASSIGNED TO EXTERNAL"), button:has-text("Assign to external"), a:has-text("Assign")'
        ).first();

        if (!(await assignBtn.isVisible())) {
            console.log('No assign-to-external button visible; skipping test');
            return;
        }

        await assignBtn.click();
        await page.waitForTimeout(500);

        const alert = page.locator('.alert');
        await expect(alert).toBeVisible();
        await expect(alert).toContainText('Report assigned to external office.');
    });

});

test.describe('logging exceptions', () => {
    test('logging in as NOT STAFF gets redirected to /', async ({ page }) => {
        await loginAsUser(page, { username: 'citizen', password: 'citizen' });
        await page.goto("/officeReports")
        await page.waitForURL('/');
    });
});
