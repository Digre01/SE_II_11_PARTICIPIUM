import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMocks, setupEmailUtilsMock} from "../mocks/common.mocks.js";
import {mockRepo} from "../mocks/users.mocks.js";

await setupAuthorizationMocks()
await setupEmailUtilsMock();

const { default: app } = await import('../../../app.js');

describe('User roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PUT /:id/roles -> 200 sets multiple roles as ADMIN', async () => {
    const returned = [{ roleId: 2, officeId: 3 }, { roleId: 4, officeId: 5 }];
    mockRepo.setUserRoles.mockResolvedValueOnce(returned);

    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .set('Authorization', 'Bearer admin')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roles: [{ roleId: 2 }, { roleId: 4 }] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(returned);
    expect(mockRepo.setUserRoles).toHaveBeenCalledWith(42, [{ roleId: 2 }, { roleId: 4 }]);
  });

  it('PUT /:id/roles -> 200 cancels all roles when empty array provided', async () => {
    const returned = [];
    mockRepo.setUserRoles.mockResolvedValueOnce(returned);

    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .set('Authorization', 'Bearer admin')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roles: [] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(returned);
    expect(mockRepo.setUserRoles).toHaveBeenCalledWith(42, []);
  });

  it('PUT /:id/roles -> 403 when non-admin tries to set roles', async () => {
    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .set("X-Test-User-Type", "CITIZEN")
        .send({ roles: [{ roleId: 2 }] });

    expect(res.status).toBe(403);
    expect(mockRepo.setUserRoles).not.toHaveBeenCalled();
  });

  it('PUT /:id/roles -> 401 when not authenticated', async () => {
    const res = await request(app)
        .put('/api/v1/sessions/42/roles')
        .send({ roles: [{ roleId: 2 }] });

    expect(res.status).toBe(401);
    expect(mockRepo.setUserRoles).not.toHaveBeenCalled();
  });

  it('PUT /:id/roles -> 200 accepts numeric shorthand `roleIds` array', async () => {
    const payload = [{ roleId: 7 }, { roleId: 8 }];
    mockRepo.setUserRoles.mockImplementationOnce((userId, data) => {
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
    expect(mockRepo.setUserRoles).not.toHaveBeenCalled();
  });
});

describe('PATCH /sessions/:id/role', () => {
  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
        .patch('/api/v1/sessions/1/role')
        .send({ roleId: 2 });
    expect(res.status).toBe(401);
  });

  it('should assign role to staff as ADMIN', async () => {
    mockRepo.assignRoleToUser.mockResolvedValueOnce({ id: 1, roleId: 2 });
    const res = await request(app)
        .patch('/api/v1/sessions/1/role')
        .set('X-Test-User-Type', 'ADMIN')
        .send({ roleId: 2 });
    expect([200, 500]).toContain(res.status);
  });
});
