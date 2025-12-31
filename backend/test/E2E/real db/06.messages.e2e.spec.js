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

  test('staff can send a real message and see it in the chat', async ({ page }) => {
    const input = await getMessageInput(page)
    await expect(input).toBeVisible();

    const messageText = `E2E test message ${Date.now()}`;

    await input.fill(messageText);

    await page.click('button[aria-label="Send"]');

    await expect(
        page.locator('.rounded', { hasText: messageText })
    ).toBeVisible();
  });

  /*test('shows system messages and message ordering', async ({ page }) => {
    await mockCurrentSession(page, { id: 42, username: 'alice', userType: 'staff' });

    const now = Date.now();
    const messages = [
      { id: 31, content: 'Second', createdAt: new Date(now - 60000).toISOString(), sender: { id: 99 } },
      { id: 30, content: 'First', createdAt: new Date(now - 3600000).toISOString(), sender: null, isSystem: true },
    ];

    console.log("messages created")
    await mockMessages(page, 200, route => {
      console.log('mockMessages triggered:', route.request().url());
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(messages),
      });
    });

    await mockConversations(page, [{ id: 200, report: { status: 'open' } }]);

    const response = await page.waitForResponse(resp =>
        resp.url().includes('/api/v1/conversations/200/messages') && resp.status() === 200
    );
    const fetched = await response.json();

    await gotoConversation(page, 200);

    const sorted = fetched.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    expect(sorted[0].content).toBe('First');
    expect(sorted[1].content).toBe('Second');
  });*/

  test('staff cannot send when report is resolved (send form absent)', async ({ page }) => {
    expect(await getMessageInput(page).count()).toBe(0);
  });

});

test.describe("Internal conversation", () => {
  test.beforeEach(async ({page, request}) => {
    await loginAsUser(page, {username: "staff2", password: "staff2"})

    await page.click('text=Notifications');

    await createTestReport(page, request, "External Report")

    await page.waitForSelector('li.list-group-item:has-text("External Report")', { timeout: 5000 });
    await page.click('li.list-group-item:has-text("External Report")');
  });

  test('internal conversation shows internal banner', async ({ page }) => {
    expect(await page.locator('text=Internal comments').count()).toBeGreaterThan(0);
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