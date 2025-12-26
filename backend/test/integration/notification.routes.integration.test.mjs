import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { mockRepo } from "./mocks/notifications.mocks.js";
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "./mocks/common.mocks.js";

await setupEmailUtilsMock();
await setUpLoginMock()
await setupAuthorizationMocks()

const userId = 1

const { default: app } = await import('../../app.js');
const { getUserNotifications, getUnreadCounts, markAsRead } = await import('../../controllers/notificationController.js');

describe('Notification routes integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/notifications -> 200 returns notifications', async () => {
    const sample = [{ id: 1, message: { id: 11 } }];
    mockRepo.getUnreadNotifications.mockResolvedValueOnce(sample);

    const res = await request(app).get('/api/v1/notifications')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sample);
    expect(mockRepo.getUnreadNotifications).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/notifications -> 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/notifications/counts -> 200 returns counts map', async () => {
    const counts = { '123': 2 };
    mockRepo.getUnreadCountByConversation.mockResolvedValueOnce(counts);

    const res = await request(app)
        .get('/api/v1/notifications/counts')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(counts);
    expect(mockRepo.getUnreadCountByConversation).toHaveBeenCalledWith(userId);
  });

  it('POST /api/v1/notifications/:conversationId/read -> 200 marks as read', async () => {
    mockRepo.markNotificationsAsReadForConversation.mockResolvedValueOnce(3);

    const res = await request(app)
        .post('/api/v1/notifications/55/read')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 3 });
    expect(mockRepo.markNotificationsAsReadForConversation).toHaveBeenCalledWith(userId, '55');
  });

  it('POST /api/v1/notifications/:conversationId/read -> 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/v1/notifications/77/read');
    expect(res.status).toBe(401);
  });
});

describe('Notification controller unit tests', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getUserNotifications returns notifications', async () => {
    const fake = [{ id: 1 }];
    mockRepo.getUnreadNotifications.mockResolvedValueOnce(fake);
    const req = { user: { id: 42 } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await getUserNotifications(req, res, next);

    expect(mockRepo.getUnreadNotifications).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith(fake);
    expect(next).not.toHaveBeenCalled();
  });

  it('getUserNotifications forwards errors', async () => {
    const err = new Error('db');
    mockRepo.getUnreadNotifications.mockRejectedValueOnce(err);
    const req = { user: { id: 5 } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await getUserNotifications(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('GET /api/v1/notifications - repository error returns 500', async () => {
    mockRepo.getUnreadNotifications.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
        .get('/api/v1/notifications')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('name', 'InternalServerError');
    expect(res.body).toHaveProperty('message', 'DB error');
  });

  it('getUnreadCounts returns counts', async () => {
    const counts = { c1: 2 };
    mockRepo.getUnreadCountByConversation.mockResolvedValueOnce(counts);
    const req = { user: { id: 7 } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await getUnreadCounts(req, res, next);

    expect(mockRepo.getUnreadCountByConversation).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith(counts);
    expect(next).not.toHaveBeenCalled();
  });

  it('getUnreadCounts forwards errors', async () => {
    const err = new Error('boom');
    mockRepo.getUnreadCountByConversation.mockRejectedValueOnce(err);
    const req = { user: { id: 8 } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await getUnreadCounts(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('GET /api/v1/notifications/counts - repository throws AppError -> mapped to 403', async () => {
    const { InsufficientRightsError } = await import('../../errors/InsufficientRightsError.js');
    mockRepo.getUnreadCountByConversation.mockRejectedValueOnce(
        new InsufficientRightsError('No access')
    );

    const res = await request(app)
        .get('/api/v1/notifications/counts')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('name', 'InsufficientRightsError');
    expect(res.body).toHaveProperty('message', 'No access');
  });

  it('GET /api/v1/notifications/counts - returns empty array when no counts', async () => {
    mockRepo.getUnreadCountByConversation.mockResolvedValueOnce([]);

    const res = await request(app)
        .get('/api/v1/notifications/counts')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('markAsRead updates count', async () => {
    mockRepo.markNotificationsAsReadForConversation.mockResolvedValueOnce(4);
    const req = { user: { id: 9 }, params: { conversationId: '55' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await markAsRead(req, res, next);

    expect(mockRepo.markNotificationsAsReadForConversation).toHaveBeenCalledWith(9, '55');
    expect(res.json).toHaveBeenCalledWith({ updated: 4 });
    expect(next).not.toHaveBeenCalled();
  });

  it('markAsRead forwards errors', async () => {
    const err = new Error('err');
    mockRepo.markNotificationsAsReadForConversation.mockRejectedValueOnce(err);
    const req = { user: { id: 11 }, params: { conversationId: '77' } };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await markAsRead(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('POST /api/v1/notifications/:conversationId/read - returns 0 when nothing updated', async () => {
    mockRepo.markNotificationsAsReadForConversation.mockResolvedValueOnce(0);

    const res = await request(app)
        .post('/api/v1/notifications/200/read')
        .set('X-Test-User-Type', 'CITIZEN');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 0 });
  });

});
