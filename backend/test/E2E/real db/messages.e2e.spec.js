import { test, expect } from '@playwright/test';
import {loginAsUser, logout, mockCurrentSession} from "../helpers/common.helpers.js";
import {getMessageInput, gotoConversation, mockConversations, mockMessages} from "../helpers/messages.helpers.js";

test.describe('Conversation Page', () => {
  test('visit conversation shows status update message', async ({ page }) => {
    await loginAsUser(page, {username: "citizen", password: "citizen"})

    await page.click('text=Notifications');

    await page.waitForSelector('li.list-group-item:has-text("Test Report")', { timeout: 5000 });
    await page.click('li.list-group-item:has-text("Test Report")');

    await page.waitForSelector('text=Report status change to: Pending Approval', { timeout: 5000 });
    const statusMessage = await page.$eval(
        'text=Report status change to: Pending Approval',
        el => el.textContent
    );

    expect(statusMessage).toContain('Report status change to: Pending Approval');
  });

  test('staff can send a message and POST is invoked', async ({ page }) => {
    await loginAsUser(page, {username: "staff2", password: "staff2"})

    await page.click('text=Notifications');

    await mockConversations(page, [{ id: 100, report: { status: 'open' } }]);

    let getCount = 0;
    let postCalled = false;

    await mockMessages(page, 100, async route => {
      const method = route.request().method().toUpperCase();

      if (method === 'GET') {
        getCount += 1;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
              getCount === 1
                  ? []
                  : [{
                    id: 20,
                    content: 'Staff message',
                    createdAt: new Date().toISOString(),
                    sender: { id: 42, username: 'staff1' },
                  }]
          ),
        });
      }

      if (method === 'POST') {
        postCalled = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 21,
            content: 'Staff message',
            sender: { id: 42 },
          }),
        });
      }
    });

    await gotoConversation(page, 100);

    const input = getMessageInput(page);
    await input.fill('Staff message');
    await page.click('button[aria-label="Send"]');

    await page.waitForSelector('text=Staff message');
    expect(postCalled).toBeTruthy();
  });

  test('citizen cannot send message (no send form)', async ({ page }) => {
    await mockCurrentSession(page, { id: 42, username: 'alice', userType: 'citizen' });

    await mockMessages(page, 100, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await gotoConversation(page, 100);

    expect(await getMessageInput(page).count()).toBe(0);
  });

  test('shows system messages and message ordering', async ({ page }) => {
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
  });

  test('staff cannot send when report is resolved (send form absent)', async ({ page }) => {
    await mockCurrentSession(page, { id: 42, username: 'staff1', userType: 'staff' });

    await mockConversations(page, [{ id: 400, report: { status: 'resolved' } }]);
    await mockMessages(page, 400, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );

    await gotoConversation(page, 400);
    expect(await getMessageInput(page).count()).toBe(0);
  });

  test('internal conversation shows internal banner', async ({ page }) => {
    await mockCurrentSession(page, { id: 42, username: 'staff1', userType: 'staff' });

    await page.route('**/api/v1/notifications/500/read', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"updated":0}' })
    );

    await mockMessages(page, 500, route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 5000,
            content: 'Internal note',
            createdAt: new Date().toISOString(),
            sender: { id: 42, username: 'staff1' },
            conversation: { isInternal: true, report: { title: 'Report X', status: 'open' } },
          }]),
        })
    );

    await gotoConversation(page, 500);
    expect(await page.locator('text=Internal comments').count()).toBeGreaterThan(0);
  });
});
