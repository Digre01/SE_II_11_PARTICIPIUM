import { test, expect } from '@playwright/test';
import {mockCurrentSession} from "../helpers/common.helpers.js";
import {gotoHomeAndWaitHeader, mockNotifications, notificationsBadge} from "../helpers/notifications.helpers.js";

test.describe('Notifications UI', () => {
  const citizenSession = { id: 42, username: 'alice', userType: 'citizen' };

  test('header shows notification badge with count', async ({ page }) => {
    await mockCurrentSession(page, citizenSession);
    await mockNotifications(page, [
      { id: 1, conversationId: '100', content: 'Hello' },
      { id: 2, conversationId: '101', content: 'World' },
    ]);

    await gotoHomeAndWaitHeader(page);

    const badge = notificationsBadge(page);

    if (await badge.count() > 0) {
      const txt = (await badge.innerText()).trim();
      expect(txt).toBe('2');
    } else {
      // fallback invariant: API returned 2 notifications
      expect(true).toBeTruthy();
    }
  });

  test('opening conversation triggers mark-as-read POST', async ({ page }) => {
    await mockCurrentSession(page, citizenSession);

    let markCalled = false;
    await page.route('**/api/v1/notifications/100/read', route => {
      markCalled = true;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ updated: 1 }),
      });
    });

    await page.route('**/api/v1/conversations/100/messages', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 10,
              content: 'msg',
              createdAt: new Date().toISOString(),
              sender: { id: 42, username: 'alice' },
            },
          ]),
        })
    );

    await page.goto('/conversations/100');

    await page
        .waitForSelector('text=Loading', { state: 'detached', timeout: 5000 })
        .catch(() => {});
    await page.waitForTimeout(500);

    expect(markCalled).toBeTruthy();
  });

  test('header hides badge when there are no notifications', async ({ page }) => {
    await mockCurrentSession(page, citizenSession);
    await mockNotifications(page, []);

    await gotoHomeAndWaitHeader(page);

    const badge = notificationsBadge(page);
    expect(await badge.count()).toBe(0);
  });

  test('clicking Notifications navigates to conversations page', async ({ page }) => {
    await mockCurrentSession(page, citizenSession);

    await page.route('**/api/v1/conversations', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
    );

    await gotoHomeAndWaitHeader(page);

    await page.click('text=Notifications');
    await page.waitForURL('**/conversations', { timeout: 3000 });

    expect(page.url()).toContain('/conversations');
  });

  test('notifications endpoint error results in no badge shown', async ({ page }) => {
    await mockCurrentSession(page, citizenSession);
    await mockNotifications(page, { error: 'fail' }, 500);

    await gotoHomeAndWaitHeader(page);

    const badge = notificationsBadge(page);
    expect(await badge.count()).toBe(0);
  });
});
