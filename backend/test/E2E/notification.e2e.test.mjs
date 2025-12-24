import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import {setupEmailUtilsMock} from "../integration/mocks/common.mocks.js";

await setupEmailUtilsMock()

// Mock notification repository
const mockRepo = {
  getUnreadNotifications: jest.fn(),
  getUnreadCountByConversation: jest.fn(),
  markNotificationsAsReadForConversation: jest.fn(),
};

await jest.unstable_mockModule('../../repositories/notificationRepository.js', () => ({
  createNotification: jest.fn(),
  getUnreadNotifications: mockRepo.getUnreadNotifications,
  markNotificationsAsReadForConversation: mockRepo.markNotificationsAsReadForConversation,
  getUnreadCountByConversation: mockRepo.getUnreadCountByConversation,
}));

// Mock authorization middleware
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
  authorizeUserType: (allowed) => (req, _res, next) => {
    const roleHdr = req.header('X-Test-Role');
    if (roleHdr) {
      req.user = { id: 42, userType: roleHdr };
      const normalized = (allowed || []).map(a => String(a).toUpperCase());
      const caller = String(roleHdr).toUpperCase();
      if (!normalized.includes(caller)) {
        return next(new InsufficientRightsError('Forbidden'));
      }
      return next();
    }

    if (req.header('Authorization')) {
      req.user = { id: 42, userType: 'citizen' };
      return next();
    }

    if (req.path && req.path.includes('/assigned')) {
      return next(new UnauthorizedError('UNAUTHORIZED'));
    }

    return next();
  },
  requireAdminIfCreatingStaff: () => (req, _res, next) => next(),
  authorizeRole: (requiredRole) => (req, _res, next) => {
    const roleHdr = req.header('X-Test-Role');
    if (!roleHdr) return next(new InsufficientRightsError('Forbidden'));
    if (String(roleHdr).toUpperCase() !== String(requiredRole).toUpperCase()) {
      return next(new InsufficientRightsError('Forbidden'));
    }
    next();
  },
}));

// Import the app after mocks
const { default: app } = await import('../../app.js');

describe('E2E notifications: notification routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /api/v1/notifications - returns unread notifications for user', async () => {
    const sample = [
      { id: 1, conversationId: '100', content: 'New message', createdAt: '2025-01-01T00:00:00Z' },
      { id: 2, conversationId: '101', content: 'Another', createdAt: '2025-01-02T00:00:00Z' }
    ];

    mockRepo.getUnreadNotifications.mockResolvedValueOnce(sample);

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(2);
    expect(res.body[0].content).toBe('New message');
    expect(mockRepo.getUnreadNotifications).toHaveBeenCalledWith(42);
  });

  it('GET /api/v1/notifications/counts - returns unread counts grouped by conversation', async () => {
    const counts = [
      { conversationId: '100', unread: 3 },
      { conversationId: '101', unread: 1 }
    ];

    mockRepo.getUnreadCountByConversation.mockResolvedValueOnce(counts);

    const res = await request(app)
      .get('/api/v1/notifications/counts')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toEqual(counts);
    expect(mockRepo.getUnreadCountByConversation).toHaveBeenCalledWith(42);
  });

  it('POST /api/v1/notifications/:conversationId/read - marks notifications as read', async () => {
    mockRepo.markNotificationsAsReadForConversation.mockResolvedValueOnce(5);

    const res = await request(app)
      .post('/api/v1/notifications/100/read')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 5 });
    expect(mockRepo.markNotificationsAsReadForConversation).toHaveBeenCalledWith(42, '100');
  });

  it('GET /api/v1/notifications - forbidden for unauthorized role', async () => {
    // If role header is set to a role not in allowed list, middleware should return 403
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('X-Test-Role', 'GUEST');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('name', 'InsufficientRightsError');
  });

  it('GET /api/v1/notifications - repository error returns 500', async () => {
    mockRepo.getUnreadNotifications.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('name', 'InternalServerError');
    expect(res.body).toHaveProperty('message', 'DB error');
  });

  it('GET /api/v1/notifications/counts - returns empty array when no counts', async () => {
    mockRepo.getUnreadCountByConversation.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/notifications/counts')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(0);
    expect(mockRepo.getUnreadCountByConversation).toHaveBeenCalledWith(42);
  });

  it('POST /api/v1/notifications/:conversationId/read - returns 0 when nothing updated', async () => {
    mockRepo.markNotificationsAsReadForConversation.mockResolvedValueOnce(0);

    const res = await request(app)
      .post('/api/v1/notifications/200/read')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 0 });
    expect(mockRepo.markNotificationsAsReadForConversation).toHaveBeenCalledWith(42, '200');
  });

  it('GET /api/v1/notifications/counts - repository throws AppError -> mapped to 403', async () => {
    const { InsufficientRightsError } = await import('../../errors/InsufficientRightsError.js');
    mockRepo.getUnreadCountByConversation.mockRejectedValueOnce(new InsufficientRightsError('No access'));

    const res = await request(app)
      .get('/api/v1/notifications/counts')
      .set('Authorization', 'Bearer citizen-token');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('name', 'InsufficientRightsError');
    expect(res.body).toHaveProperty('message', 'No access');
  });
});
