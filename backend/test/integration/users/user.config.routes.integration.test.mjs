import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../../mocks/common.mocks.js";
import { mockUserRepo } from "../../mocks/repositories/users.repo.mock.js";

await setupAuthorizationMocks()
await setupEmailUtilsMock();
await setUpLoginMock();

const { default: app } = await import('../../../app.js');

describe('User config & profile picture integration (controller + repo)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('PATCH /sessions/:id/config -> 401 without auth', async () => {
    const res = await request(app)
        .patch('/api/v1/sessions/1/config')
        .field('telegramId','tg_123');
    expect(res.status).toBe(401);
  });

  it('PATCH /sessions/:id/config -> 200 with auth + photo', async () => {
    const res = await request(app)
        .patch('/api/v1/sessions/1/config')
        .set("X-Test-User-Type", "CITIZEN")
        .field('telegramId','tg_123')
        .field('emailNotifications','true')
        .attach('photo', Buffer.from('fakeimage'), { filename: 'pic.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 1,
      telegramId: 'tg_123',
      emailNotifications: true,
      photoId: 42
    });
    expect(mockUserRepo.configUserAccount).toHaveBeenCalledWith(1, undefined, undefined, expect.any(String));
  });

  it('PATCH /sessions/:id/config -> 500 when repo throws', async () => {
    mockUserRepo.configUserAccount.mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
        .patch('/api/v1/sessions/1/config')
        .set("X-Test-User-Type", "CITIZEN")
        .field('telegramId','tg_123');

    expect(res.status).toBe(500);
  });

  it('GET /sessions/:id/pfp -> 401 without auth', async () => {
    const res = await request(app).get('/api/v1/sessions/1/pfp');
    expect(res.status).toBe(401);
  });

  it('GET /sessions/:id/pfp -> 200 with auth', async () => {
    mockUserRepo.getPfpUrl.mockResolvedValue("/public/abc123.png");

    const res = await request(app)
        .get('/api/v1/sessions/1/pfp')
        .set("X-Test-User-Type", "CITIZEN")

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/\/public\/abc123\.png/);
    expect(mockUserRepo.getPfpUrl).toHaveBeenCalledWith(1);
  });

  it('GET /sessions/:id/pfp -> 500 on repo error', async () => {
    mockUserRepo.getPfpUrl.mockRejectedValueOnce(new Error('DB fail'));

    const res = await request(app)
        .get('/api/v1/sessions/1/pfp')
        .set("X-Test-User-Type", "CITIZEN")

    expect(res.status).toBe(500);
  });
});
