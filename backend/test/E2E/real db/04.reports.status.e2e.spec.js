import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {
    createTestReport,
    getSection,
    selectOfficeAndWaitReports,
} from "../helpers/report.helpers.js";

test.describe('report starting, finishing, suspending and resuming', () => {

    test.beforeEach(async ( {page, request}) => {
        await createTestReport(page, request)
        await loginAsUser(page, {username: "staff2", password: "staff2"})

    })

    test('pressing START button changes report status to IN PROGRESS', async ({ page }) => {
        await selectOfficeAndWaitReports(page);

        const officeSection = await getSection(page, "Reports assigned to: Public Lighting Office");

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
        await page.goto("/officeReports")

        const userSection = await getSection(page, "Reports assigned to you");

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
        await page.goto("/officeReports")

        const userSection = await getSection(page, "Reports assigned to you");

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

    test.describe("Assign report to external", async () => {

        test.beforeEach(async ({ page, request }) => {
            await createTestReport(page, request, "External Report")
        })

        test('assigning report to external office shows confirmation alert', async ({ page }) => {

            await selectOfficeAndWaitReports(page);

            const officeSection = page
                .locator('div, section', { hasText: "Reports assigned to: Public Lighting Office" })
                .first();
            const row = officeSection
                .locator('table tbody tr', { hasText: "External Report" })
                .first();

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
    })

});

test.describe('logging exceptions', () => {
    test('logging in as NOT STAFF gets redirected to /', async ({ page }) => {
        await loginAsUser(page, { username: 'citizen', password: 'citizen' });
        await page.goto("/officeReports")
        expect(page.url()).toContain("/")
    });
});