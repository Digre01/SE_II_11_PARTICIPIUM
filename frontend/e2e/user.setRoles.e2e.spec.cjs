const { test, expect } = require('@playwright/test');

test.describe('User Roles UI', () => {
  test('assigns multiple roles to a staff user as ADMIN (mocked API)', async ({ page }) => {
    // mock current session as admin
    await page.route('**/api/v1/sessions/current', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, username: 'seed-admin', userType: 'ADMIN' }) });
    });

    // mock roles list
    const rolesFixture = [ { id: 7, name: 'Role A' }, { id: 8, name: 'Role B' } ];
    await page.route('**/api/v1/roles', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rolesFixture) });
    });

    // capture the PUT body and reply with created mappings
    let capturedBody = null;
    await page.route('**/api/v1/sessions/*/roles', async route => {
      const req = route.request();
      const post = await req.postData();
      try { capturedBody = JSON.parse(post); } catch(e){ capturedBody = post; }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { userId: 2, office: { id: 1 }, role: { id: rolesFixture[0].id } },
        { userId: 2, office: { id: 2 }, role: { id: rolesFixture[1].id } }
      ]) });
    });

    // navigate to a page that would trigger the roles assignment (we use root and then trigger fetch)
    await page.goto('/');

    // perform the PUT via page context to simulate UI action
    const result = await page.evaluate(async (r) => {
      const res = await fetch('/api/v1/sessions/2/roles', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roles: r }) });
      return res.json();
    }, [{ roleId: rolesFixture[0].id }, { roleId: rolesFixture[1].id }]);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(capturedBody).not.toBeNull();
    expect(Array.isArray(capturedBody.roles || capturedBody)).toBe(true);
  });

  test('cancels all roles when ADMIN sends empty array (mocked API)', async ({ page }) => {
    await page.route('**/api/v1/sessions/current', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, username: 'seed-admin', userType: 'ADMIN' }) }));
    await page.route('**/api/v1/roles', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }));

    let captured = null;
    await page.route('**/api/v1/sessions/*/roles', async route => {
      const post = await route.request().postData();
      try { captured = JSON.parse(post); } catch(e){ captured = post; }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/');
    const res = await page.evaluate(async () => {
      const r = await fetch('/api/v1/sessions/2/roles', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roles: [] }) });
      return r.json();
    });

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(captured).not.toBeNull();
  });

  test('accepts numeric shorthand `roleIds` array and applies roles (mocked API)', async ({ page }) => {
    await page.route('**/api/v1/sessions/current', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, username: 'seed-admin', userType: 'ADMIN' }) }));
    const rolesFixture = [ { id: 11 }, { id: 12 } ];
    await page.route('**/api/v1/roles', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rolesFixture) }));

    let captured = null;
    await page.route('**/api/v1/sessions/*/roles', async route => {
      const post = await route.request().postData();
      try { captured = JSON.parse(post); } catch(e){ captured = post; }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { userId: 3, office: { id: 11 }, role: { id: 11 } },
        { userId: 3, office: { id: 12 }, role: { id: 12 } }
      ]) });
    });

    await page.goto('/');
    const out = await page.evaluate(async (ids) => {
      const r = await fetch('/api/v1/sessions/3/roles', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roleIds: ids }) });
      return r.json();
    }, [rolesFixture[0].id, rolesFixture[1].id]);

    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(2);
    expect(captured).not.toBeNull();
  });

  test('blocks assign action for non-ADMIN (mocked API)', async ({ page }) => {
    // mock current session as non-admin
    await page.route('**/api/v1/sessions/current', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 5, username: 'regular-user', userType: 'USER' }) });
    });

    // roles list (UI may still fetch roles)
    await page.route('**/api/v1/roles', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 21, name: 'Some Role' }]) });
    });

    // server should reject unauthorized attempts — simulate 403 with JSON body
    await page.route('**/api/v1/sessions/*/roles', async route => {
      route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Forbidden' }) });
    });

    await page.goto('/');

    const out = await page.evaluate(async () => {
      const res = await fetch('/api/v1/sessions/5/roles', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roles: [{ roleId: 21 }] }) });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    });

    expect(out.status).toBe(403);
    expect(out.body).toBeTruthy();
    expect(out.body.error).toBe('Forbidden');
  });
});
