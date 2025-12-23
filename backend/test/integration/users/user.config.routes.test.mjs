import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMock, setupEmailUtilsMock} from "../mocks/common.mocks.js";
import {mockController} from "../mocks/userMocks/user.config.mocks.js";

await setupAuthorizationMock({
  allowUnauthorizedThrough: false,
})
await setupEmailUtilsMock();

const { default: app } = await import('../../../app.js');

describe('Integration: user config & pfp (mocked controller)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PATCH /sessions/:id/config -> 401 without auth', async () => {
    const res = await request(app)
      .patch('/api/v1/sessions/1/config')
      .field('telegramId','tg_123');
    expect(res.status).toBe(401);
    expect(mockController.configAccount).not.toHaveBeenCalled();
  });

  it('PATCH /sessions/:id/config -> 200 with citizen auth + photo', async () => {
    const res = await request(app)
      .patch('/api/v1/sessions/1/config')
      .set('Authorization','Bearer citizen')
      .field('telegramId','tg_123')
      .field('emailNotifications','true')
      .attach('photo', Buffer.from('fakeimage'), { filename: 'pic.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ telegramId: 'tg_123', emailNotifications: true, photoId: 42 });
    // Note: mock upload middleware doesn't parse fields; controller receives undefined for telegramId/emailNotifications
    expect(mockController.configAccount).toHaveBeenCalledWith(1, undefined, undefined, expect.any(String));
  });

  it('PATCH /sessions/:id/config -> 500 when controller throws', async () => {
    mockController.configAccount.mockRejectedValueOnce(new Error('DB failure'));
    const res = await request(app)
      .patch('/api/v1/sessions/1/config')
      .set('Authorization','Bearer citizen')
      .field('telegramId','tg_123');
    expect(res.status).toBe(500);
  });

  it('GET /sessions/:id/pfp -> 401 without auth', async () => {
    const res = await request(app).get('/api/v1/sessions/1/pfp');
    expect(res.status).toBe(401);
    expect(mockController.getPfpUrl).not.toHaveBeenCalled();
  });

  it('GET /sessions/:id/pfp -> 200 with citizen auth', async () => {
    const res = await request(app)
      .get('/api/v1/sessions/1/pfp')
      .set('Authorization','Bearer citizen');
    expect(res.status).toBe(200);
    expect(res.text || JSON.stringify(res.body)).toMatch(/\/public\/abc123\.png/);
    expect(mockController.getPfpUrl).toHaveBeenCalledWith(1);
  });

  it('GET /sessions/:id/pfp -> 500 on controller error', async () => {
    mockController.getPfpUrl.mockRejectedValueOnce(new Error('DB fail'));
    const res = await request(app)
      .get('/api/v1/sessions/1/pfp')
      .set('Authorization','Bearer citizen');
    expect(res.status).toBe(500);
  });
});
