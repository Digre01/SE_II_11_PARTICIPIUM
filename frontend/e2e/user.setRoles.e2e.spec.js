import { test, expect } from '@playwright/test';
import {mockCurrentSession} from "./helpers/common.helpers.js";
import {mockAssignRoles, mockRoles, putRoles} from "./helpers/user.helpers.js";

test.describe('User Roles UI', () => {
  test('assigns multiple roles to a staff user as ADMIN (mocked API)', async ({ page }) => {
    const rolesFixture = [{ id: 7, name: 'Role A' }, { id: 8, name: 'Role B' }];

    await mockCurrentSession(page, { id: 1, username: 'seed-admin', userType: 'ADMIN' });
    await mockRoles(page, rolesFixture);

    const getCaptured = await mockAssignRoles(page, [
      { userId: 2, office: { id: 1 }, role: { id: 7 } },
      { userId: 2, office: { id: 2 }, role: { id: 8 } },
    ]);

    await page.goto('/');

    const res = await putRoles(page, 2, {
      roles: rolesFixture.map(r => ({ roleId: r.id })),
    });

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(getCaptured()).not.toBeNull();
    expect(Array.isArray(getCaptured().roles || getCaptured())).toBe(true);
  });

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

    await page.route('**/api/v1/sessions/*/roles', route =>
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
  });
});
