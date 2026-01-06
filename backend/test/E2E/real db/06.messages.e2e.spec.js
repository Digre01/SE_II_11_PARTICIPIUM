import { test, expect } from '@playwright/test';
import {loginAsUser} from "../helpers/common.helpers.js";
import {getMessageInput} from "../helpers/messages.helpers.js";
import {createTestReport} from "../helpers/report.helpers.js";

test.describe('Conversation Page', () => {

  test.beforeEach(async ({page}) => {
    await loginAsUser(page, {username: "staff2", password: "staff2"})

    await page.click('text=Notifications');

    await page.waitForSelector('li.list-group-item:has-text("Test Report")', { timeout: 5000 });
    await page.click('li.list-group-item:has-text("Test Report")');
  });

  test('staff cannot send when report is resolved (send form absent)', async ({ page }) => {
    expect(await getMessageInput(page).count()).toBe(0);
  });

});

test.describe("Internal conversation", () => {
  test.beforeEach(async ({page, request}) => {
    await createTestReport(page, request, "External Report")

    await loginAsUser(page, {username: "staff2", password: "staff2"})

    await page.click('text=Notifications');

    await page.waitForSelector('li.list-group-item:has-text("External Report")', { timeout: 5000 });
    await page.click('li.list-group-item:has-text("External Report")');
  });
})

test.describe("Citizen messages tests", () => {

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, {username: "citizen", password: "citizen"})

    await page.click('text=Notifications');

    await page.waitForSelector('li.list-group-item:has-text("Test Report")', { timeout: 5000 });
    await page.click('li.list-group-item:has-text("Test Report")');
  })

  test('visit conversation shows status update message', async ({ page }) => {
    await page.waitForSelector('text=Report status change to: Pending Approval', { timeout: 5000 });
    const statusMessage = await page.$eval(
        'text=Report status change to: Pending Approval',
        el => el.textContent
    );

    expect(statusMessage).toContain('Report status change to: Pending Approval');
  });

  test('citizen cannot send message (no send form)', async ({ page }) => {
    expect(await getMessageInput(page).count()).toBe(0);
  });
})