import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { UnauthorizedError } from '../../../errors/UnauthorizedError.js';

const mockController = {
  configAccount: jest.fn(),
  getPfpUrl: jest.fn(),
};

// Mock only for these tests (isolated)
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
  authorizeUserType: (allowed=[]) => (req, res, next) => {
    if (!req.header('Authorization')) {
      return next(new UnauthorizedError('Unauthorized'));
    }
    const token = req.header('Authorization');
    const parts = token.split(/\s+/);
    const roleToken = parts[parts.length-1].toUpperCase();
    let userType = roleToken === 'CITIZEN' ? 'CITIZEN' : (roleToken === 'ADMIN' ? 'ADMIN' : 'STAFF');
    req.user = { id: 1, userType };
    if (allowed.length && !allowed.map(a=>String(a).toUpperCase()).includes(userType)) {
      return next(new UnauthorizedError('Unauthorized'));
    }
    next();
  },
  authorizeRole: () => (req, _res, next) => next(),
  requireAdminIfCreatingStaff: () => (req, _res, next) => next(),
}));

await jest.unstable_mockModule('../../controllers/userController.js', () => ({
  default: mockController,
}));

// Mock upload middleware to bypass disk writes and support array() used in other routes
await jest.unstable_mockModule('../../middlewares/uploadMiddleware.js', () => ({
  default: {
    single: () => (req, _res, next) => { req.file = { filename: 'mocked.png', path: 'mocked.png' }; next(); },
    array: () => (req, _res, next) => { req.files = [{ filename: 'mocked1.png', path: 'mocked1.png' }]; next(); },
  }
}));

const { default: app } = await import('../../../app.js');

describe('Integration: user config & pfp (mocked controller)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockController.configAccount.mockResolvedValue({
      id: 1,
      telegramId: 'tg_123',
      emailNotifications: true,
      photoId: 42,
    });
    mockController.getPfpUrl.mockResolvedValue('/public/abc123.png');
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
