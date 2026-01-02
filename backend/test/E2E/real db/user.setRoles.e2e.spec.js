import { test, expect } from '@playwright/test';
import {loginAsUser, mockCurrentSession} from "../helpers/common.helpers.js";

test.describe('User Roles UI', () => {
  test('assigns Waste Management Officer role to staff user 2 as ADMIN', async ({ page }) => {
    await loginAsUser(page, { username: "admin", password: "admin" });

    await page.goto("/modify_roles");

    await page.waitForSelector('text=Modify Role to Staff');

    await page.selectOption('select[name="userId"]', '4');

    await page.waitForSelector('input[type="checkbox"]');

    await page.locator('label', { hasText: 'Waste Management Officer' }).click();

    await page.click('button:has-text("Save Roles")');

    const successAlert = page.locator('text=Roles updated successfully');
    await expect(successAlert).toBeVisible();
  });
   /*
  test('cancels all roles when ADMIN sends empty array (mocked API)', async ({ page }) => {
    await mockCurrentSession(page, { id: 1, username: 'seed-admin', userType: 'ADMIN' });
    await mockRoles(page, []);

    const getCaptured = await mockAssignRoles(page, []);

    await page.goto('/');

    const res = await putRoles(page, 2, { roles: [] });

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
    expect(getCaptured()).not.toBeNull();
  });

  test('accepts numeric shorthand `roleIds` array and applies roles (mocked API)', async ({ page }) => {
    const rolesFixture = [{ id: 11 }, { id: 12 }];

    await mockCurrentSession(page, { id: 1, username: 'seed-admin', userType: 'ADMIN' });
    await mockRoles(page, rolesFixture);

    const getCaptured = await mockAssignRoles(page, [
      { userId: 3, office: { id: 11 }, role: { id: 11 } },
      { userId: 3, office: { id: 12 }, role: { id: 12 } },
    ]);

    await page.goto('/');

    const res = await putRoles(page, 3, {
      roleIds: rolesFixture.map(r => r.id),
    });

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(getCaptured()).not.toBeNull();
  });

  test('blocks assign action for non-ADMIN (mocked API)', async ({ page }) => {
    await mockCurrentSession(page, { id: 5, username: 'regular-user', userType: 'USER' });
    await mockRoles(page, [{ id: 21, name: 'Some Role' }]);

    await page.route('les', route =>
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden' }),
        })
    );

    await page.goto('/');

    const res = await putRoles(page, 5, {
      roles: [{ roleId: 21 }],
    });

    expect(res.status).toBe(403);
    expect(res.body).toBeTruthy();
    expect(res.body.error).toBe('Forbidden');
  });*/
});
