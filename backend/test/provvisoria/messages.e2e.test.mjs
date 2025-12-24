import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import {setupEmailUtilsMock} from "../integration/mocks/common.mocks.js";

await setupEmailUtilsMock()

// Mock message repository
const mockRepo = {
  getMessagesForConversation: jest.fn(),
  sendStaffMessage: jest.fn(),
};

await jest.unstable_mockModule('../../repositories/messageRepository.js', () => ({
  getMessagesForConversation: mockRepo.getMessagesForConversation,
  sendStaffMessage: mockRepo.sendStaffMessage,
  createMessage: jest.fn(),
  createSystemMessage: jest.fn()
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

// Import app after mocks
const { default: app } = await import('../../app.js');

describe('E2E messages: conversation messages routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /api/v1/conversations/:conversationId/messages - returns messages for participant', async () => {
    const msgs = [
      { id: 10, content: 'Hello', sender: { id: 42, username: 'alice' }, createdAt: '2025-01-01T00:00:00Z' }
    ];
    mockRepo.getMessagesForConversation.mockResolvedValueOnce(msgs);

    const res = await request(app)
      .get('/api/v1/conversations/100/messages')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe('Hello');
    expect(mockRepo.getMessagesForConversation).toHaveBeenCalledWith('100', 42);
  });

  it('GET /api/v1/conversations/:conversationId/messages - forbidden when not participant', async () => {
    mockRepo.getMessagesForConversation.mockRejectedValueOnce(new InsufficientRightsError('Forbidden'));

    const res = await request(app)
      .get('/api/v1/conversations/999/messages')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('name', 'InsufficientRightsError');
  });

  it('POST /api/v1/conversations/:conversationId/messages - staff sends message successfully', async () => {
    const created = { id: 11, content: 'Staff message', sender: { id: 42 }, createdAt: '2025-01-02T00:00:00Z' };
    mockRepo.sendStaffMessage.mockResolvedValueOnce(created);

    const res = await request(app)
      .post('/api/v1/conversations/100/messages')
      .send({ content: 'Staff message' })
      .set('Authorization', 'Bearer token')
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 11);
    expect(mockRepo.sendStaffMessage).toHaveBeenCalledWith('100', 42, 'Staff message');
  });

  it('POST /api/v1/conversations/:conversationId/messages - returns 400 when report closed', async () => {
    mockRepo.sendStaffMessage.mockRejectedValueOnce(new BadRequestError('Cannot send messages: report is closed'));

    const res = await request(app)
      .post('/api/v1/conversations/100/messages')
      .send({ content: 'Late message' })
      .set('Authorization', 'Bearer token')
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name', 'BadRequestError');
    expect(res.body).toHaveProperty('message', 'Cannot send messages: report is closed');
  });

  it('GET /api/v1/conversations/:conversationId/messages - returns 404 when conversation not found', async () => {
    mockRepo.getMessagesForConversation.mockRejectedValueOnce(new NotFoundError('Conversation not found'));

    const res = await request(app)
      .get('/api/v1/conversations/555/messages')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('name', 'NotFoundError');
  });

  it('POST /api/v1/conversations/:conversationId/messages - returns 403 when role is not staff', async () => {
    const res = await request(app)
      .post('/api/v1/conversations/100/messages')
      .send({ content: 'Should be forbidden' })
      .set('X-Test-Role', 'citizen')
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('name', 'InsufficientRightsError');
  });

  it('POST /api/v1/conversations/:conversationId/messages - repo UnauthorizedError -> 401', async () => {
    mockRepo.sendStaffMessage.mockRejectedValueOnce(new UnauthorizedError('Forbidden: user not in conversation'));

    const res = await request(app)
      .post('/api/v1/conversations/100/messages')
      .send({ content: 'Hello' })
      .set('Authorization', 'Bearer token')
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('name', 'UnauthorizedError');
  });
});
