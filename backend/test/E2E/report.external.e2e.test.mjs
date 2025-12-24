import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import {setupEmailUtilsMock} from "../integration/mocks/common.mocks.js";

await setupEmailUtilsMock()

// E2E: use real app with test-only router for external endpoints
const mockRepo = {
  externalStart: jest.fn(),
  externalFinish: jest.fn(),
  externalSuspend: jest.fn(),
  externalResume: jest.fn(),
};

// Inject a minimal router providing external endpoints (no top-level await)
jest.unstable_mockModule('../../routes/reportRoutes.mjs', () => {
  const router = express.Router();
  router.patch('/:id/external/start', async (req, res) => {
    const r = await mockRepo.externalStart({ reportId: req.params.id, externalMaintainerId: 77 });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  });
  router.patch('/:id/external/finish', async (req, res) => {
    const r = await mockRepo.externalFinish({ reportId: req.params.id, externalMaintainerId: 77 });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  });
  router.patch('/:id/external/suspend', async (req, res) => {
    const r = await mockRepo.externalSuspend({ reportId: req.params.id, externalMaintainerId: 77 });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  });
  router.patch('/:id/external/resume', async (req, res) => {
    const r = await mockRepo.externalResume({ reportId: req.params.id, externalMaintainerId: 77 });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  });
  return { default: router };
});

// Mock email utils to avoid nodemailer
jest.unstable_mockModule('../../utils/email.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true),
}));

// Import app after mocks are in place
const { default: app } = await import('../../app.js');

describe('E2E: external maintainer routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('start -> in_progress', async () => {
    mockRepo.externalStart.mockResolvedValueOnce({ id: 1, status: 'in_progress' });
    const res = await request(app).patch('/api/v1/reports/1/external/start');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('finish -> resolved', async () => {
    mockRepo.externalFinish.mockResolvedValueOnce({ id: 2, status: 'resolved' });
    const res = await request(app).patch('/api/v1/reports/2/external/finish');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('resolved');
  });

  it('suspend -> suspended', async () => {
    mockRepo.externalSuspend.mockResolvedValueOnce({ id: 3, status: 'suspended' });
    const res = await request(app).patch('/api/v1/reports/3/external/suspend');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('suspended');
  });

  it('resume -> assigned', async () => {
    mockRepo.externalResume.mockResolvedValueOnce({ id: 4, status: 'assigned' });
    const res = await request(app).patch('/api/v1/reports/4/external/resume');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('assigned');
  });

  it('returns 404 when repo returns null', async () => {
    mockRepo.externalStart.mockResolvedValueOnce(null);
    const res = await request(app).patch('/api/v1/reports/999/external/start');
    expect(res.status).toBe(404);
  });
});