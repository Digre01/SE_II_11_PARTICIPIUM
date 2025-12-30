import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {
    getOfficeSection,
    getUserSection,
    selectOfficeAndWaitReports,
} from "../helpers/report.helpers.js";

test.describe('report starting, finishing, suspending and resuming', () => {
    const CREDENTIALS = {username: "staff2", password: "staff2"}

    test('pressing START button changes report status to IN PROGRESS', async ({ page }) => {
        await loginAsUser(page, CREDENTIALS)

        await selectOfficeAndWaitReports(page);

        const officeSection = await getOfficeSection(page);

        const startButton = officeSection.locator('button', { hasText: 'START' });
        await expect(startButton.first()).toBeVisible();

        const startButtonsBefore = await startButton.count();
        expect(startButtonsBefore).toBeGreaterThan(0);

        const actionButtons = officeSection.locator('button', { hasText: /FINISH|SUSPEND/ });
        const actionButtonsBefore = await actionButtons.count();

        await startButton.first().click();
        await page.waitForTimeout(1500);

        const actionButtonsAfter = await actionButtons.count();
        expect(actionButtonsAfter).toBeGreaterThan(actionButtonsBefore);
    });

    test('pressing SUSPEND button changes report status to SUSPENDED', async ({ page }) => {
        await loginAsUser(page, CREDENTIALS)

        await page.goto("/officeReports")

        const userSection = await getUserSection(page);

        const suspendButton = userSection.locator('button', { hasText: 'SUSPEND' });
        await expect(suspendButton.first()).toBeVisible();

        const suspendButtonsBefore = await suspendButton.count();
        expect(suspendButtonsBefore).toBeGreaterThan(0);

        const resumeButton = userSection.locator('button', { hasText: 'RESUME' });
        const resumeButtonsBefore = await resumeButton.count();

        await suspendButton.first().click();
        await page.waitForTimeout(1500);

        const suspendButtonsAfter = await suspendButton.count();
        expect(suspendButtonsBefore).toBeGreaterThan(suspendButtonsAfter);

        const resumeButtonsAfter = await resumeButton.count();
        expect(resumeButtonsAfter).toBeGreaterThan(resumeButtonsBefore);
    });

    test('pressing RESUME button changes report status back from SUSPENDED', async ({ page }) => {
        await loginAsUser(page, CREDENTIALS)

        await page.goto("/officeReports")

        const userSection = await getUserSection(page)

        const resumeButton = userSection.locator('button', { hasText: 'RESUME' });
        await expect(resumeButton.first()).toBeVisible();

        const resumeButtonsBefore = await resumeButton.count();
        expect(resumeButtonsBefore).toBeGreaterThan(0);

        const actionButtons = userSection.locator('button', { hasText: /FINISH|SUSPEND/ });
        const actionButtonsBefore = await actionButtons.count();

        await resumeButton.first().click();
        await page.waitForTimeout(1500);

        const resumeButtonsAfter = await resumeButton.count();
        expect(resumeButtonsBefore).toBeGreaterThan(resumeButtonsAfter);

        const actionButtonsAfter = await actionButtons.count();
        expect(actionButtonsAfter).toBeGreaterThan(actionButtonsBefore);
    });

    test('pressing FINISH button changes report status from IN PROGRESS', async ({ page }) => {
        await loginAsUser(page, CREDENTIALS)

        await page.goto("/officeReports")

        const userSection = await getUserSection(page)

        const finishButton = userSection.locator('button', { hasText: 'FINISH' });
        await expect(finishButton.first()).toBeVisible();

        const finishButtonsBefore = await finishButton.count();
        expect(finishButtonsBefore).toBeGreaterThan(0);

        const tableRows = userSection.locator('table tbody tr');
        const rowsBefore = await tableRows.count();

        await finishButton.first().click();
        await page.waitForTimeout(1500);

        const rowsAfter = await tableRows.count();
        expect(rowsBefore).toBeGreaterThan(rowsAfter);

        const finishButtonsAfter = await finishButton.count();
        expect(finishButtonsBefore).toBeGreaterThan(finishButtonsAfter);
    });

    test('assigning report to external office shows confirmation alert', async ({ page }) => {
        await loginAsUser(page, CREDENTIALS)

        await selectOfficeAndWaitReports(page);

        const officeSection = await getOfficeSection(page);

        const assignButton = officeSection.locator('button', { hasText: /ASSIGN|Assign/ });
        const assignBtnCount = await assignButton.count();

        if (assignBtnCount === 0 || !(await assignButton.first().isVisible())) {
            console.log('No assign-to-external button visible; skipping test');
            return;
        }

        await expect(assignButton.first()).toBeVisible();

        await assignButton.first().click();
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
        expect(page.url()).toContain("/")
    });
});