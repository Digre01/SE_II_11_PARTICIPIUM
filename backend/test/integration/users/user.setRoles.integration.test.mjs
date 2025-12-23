import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { setupAuthorizationMock, setupEmailUtilsMock } from "../mocks/common.mocks.js";
import { mockController } from "../mocks/userMocks/user.setRoles.mocks.js";

await setupAuthorizationMock({ allowUnauthorizedThrough: false });
await setupEmailUtilsMock();

const { default: app } = await import('../../../app.js');

describe('Integration: user roles (mocked controller)', () => {
  const mockAdmin = { id: 1, username: 'admin', userType: 'ADMIN' };
  const mockStaff = { id: 2, username: 'staff', userType: 'STAFF' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PUT /:id/roles -> 200 sets multiple roles as ADMIN', async () => {
    const returned = [{ roleId: 2, officeId: 3 }, { roleId: 4, officeId: 5 }];
    mockController.setUserRoles.mockResolvedValueOnce(returned);

    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .set('Authorization', 'Bearer admin')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roles: [{ roleId: 2 }, { roleId: 4 }] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(returned);
    expect(mockController.setUserRoles).toHaveBeenCalledWith(42, [{ roleId: 2 }, { roleId: 4 }]);
  });

  it('PUT /:id/roles -> 200 cancels all roles when empty array provided', async () => {
    const returned = [];
    mockController.setUserRoles.mockResolvedValueOnce(returned);

    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .set('Authorization', 'Bearer admin')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roles: [] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(returned);
    expect(mockController.setUserRoles).toHaveBeenCalledWith(42, []);
  });

  it('PUT /:id/roles -> 403 when non-admin tries to set roles', async () => {
    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .set('Authorization', 'Bearer staff')
        .send({ roles: [{ roleId: 2 }] });

    expect(res.status).toBe(403);
    expect(mockController.setUserRoles).not.toHaveBeenCalled();
  });

  it('PUT /:id/roles -> 401 when not authenticated', async () => {
    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .send({ roles: [{ roleId: 2 }] });

    expect(res.status).toBe(401);
    expect(mockController.setUserRoles).not.toHaveBeenCalled();
  });

  it('PUT /:id/roles -> 200 accepts numeric shorthand `roleIds` array', async () => {
    const payload = [{ roleId: 7 }, { roleId: 8 }];
    mockController.setUserRoles.mockImplementationOnce((userId, data) => {
      expect(data).toEqual(payload);
      return payload;
    });

    const res = await request(app)
        .put('/api/v1/sessions/99/roles')
        .set('Authorization', 'Bearer admin')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roleIds: [7, 8] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
  });

  it('PUT /:id/roles -> 400 when payload is invalid (not an array)', async () => {
    const res = await request(app)
        .put('/api/v1/sessions/101/roles')
        .set('Authorization', 'Bearer admin')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roles: 'invalid' });

    expect(res.status).toBe(400);
    expect(mockController.setUserRoles).not.toHaveBeenCalled();
  });
});
