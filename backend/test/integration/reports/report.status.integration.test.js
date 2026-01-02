import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { mockRepo } from "../../mocks/repositories/reports.repo.mock.js";
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../../mocks/common.mocks.js";

await setupEmailUtilsMock();
await setupAuthorizationMocks()
await setUpLoginMock();

const { default: app } = await import('../../../app.js');
const staffUserId = 1;

beforeEach(() => jest.clearAllMocks());

describe('PATCH /api/v1/reports/:id/start', () => {
    it('should start a report and set status to in_progress', async () => {
        const mockReport = { id: 1, title: 'Test Report', status: 'in_progress', technicianId: staffUserId };
        mockRepo.startReport.mockResolvedValue(mockReport);

        const res = await request(app).patch('/api/v1/reports/1/start').set('X-Test-User-Type', 'staff').expect(200);

        expect(res.body).toHaveProperty('id', 1);
        expect(res.body.status).toBe('in_progress');
        expect(res.body.technicianId).toBe(staffUserId);
        expect(mockRepo.startReport).toHaveBeenCalledWith({ reportId: '1', technicianId: staffUserId });
    });

    it('should return 404 for non-existent report', async () => {
        mockRepo.startReport.mockResolvedValue(null);
        await request(app).patch('/api/v1/reports/99999/start').set('X-Test-User-Type', 'staff').expect(404);
        expect(mockRepo.startReport).toHaveBeenCalledWith({ reportId: '99999', technicianId: staffUserId });
    });

    it('should return 403 if user is not staff', async () => {
        await request(app).patch('/api/v1/reports/1/start').set('X-Test-User-Type', 'citizen').expect(403);
        expect(mockRepo.startReport).not.toHaveBeenCalled();
    });

    it('should return 401 without authentication header', async () => {
        mockRepo.startReport.mockResolvedValue(null);
        await request(app).patch('/api/v1/reports/1/start').expect(401);
    });
});

describe('PATCH /api/v1/reports/:id/finish', () => {
    it('should finish a report and set status to resolved', async () => {
        const mockReport = { id: 1, status: 'resolved', technicianId: staffUserId };
        mockRepo.finishReport.mockResolvedValue(mockReport);

        const res = await request(app).patch('/api/v1/reports/1/finish').set('X-Test-User-Type', 'staff').expect(200);

        expect(res.body.status).toBe('resolved');
        expect(res.body.technicianId).toBe(staffUserId);
        expect(mockRepo.finishReport).toHaveBeenCalledWith({ reportId: '1', technicianId: staffUserId });
    });

    it('should return 404 if report not found', async () => {
        mockRepo.finishReport.mockResolvedValue(null);
        await request(app).patch('/api/v1/reports/99999/finish').set('X-Test-User-Type', 'staff').expect(404);
        expect(mockRepo.finishReport).toHaveBeenCalledWith({ reportId: '99999', technicianId: staffUserId });
    });

    it('should return 404 if technicianId does not match', async () => {
        mockRepo.finishReport.mockResolvedValue(null);
        await request(app).patch('/api/v1/reports/1/finish').set('X-Test-User-Type', 'staff').expect(404);
        expect(mockRepo.finishReport).toHaveBeenCalledWith({ reportId: '1', technicianId: staffUserId });
    });

    it('should return 403 if user is not staff', async () => {
        await request(app).patch('/api/v1/reports/1/finish').set('X-Test-User-Type', 'citizen').expect(403);
        expect(mockRepo.finishReport).not.toHaveBeenCalled();
    });
});

describe('PATCH /api/v1/reports/:id/suspend', () => {
    it('should suspend a report', async () => {
        const mockReport = { id: 1, status: 'suspended', technicianId: staffUserId };
        mockRepo.suspendReport.mockResolvedValue(mockReport);

        const res = await request(app).patch('/api/v1/reports/1/suspend').set('X-Test-User-Type', 'staff').expect(200);
        expect(res.body.status).toBe('suspended');
        expect(res.body.technicianId).toBe(staffUserId);
        expect(mockRepo.suspendReport).toHaveBeenCalledWith({ reportId: '1', technicianId: staffUserId });
    });

    it('should return 404 for non-existent report', async () => {
        mockRepo.suspendReport.mockResolvedValue(null);
        await request(app).patch('/api/v1/reports/99999/suspend').set('X-Test-User-Type', 'staff').expect(404);
        expect(mockRepo.suspendReport).toHaveBeenCalledWith({ reportId: '99999', technicianId: staffUserId });
    });

    it('should return 403 if user is not staff', async () => {
        await request(app).patch('/api/v1/reports/1/suspend').set('X-Test-User-Type', 'citizen').expect(403);
        expect(mockRepo.suspendReport).not.toHaveBeenCalled();
    });
});

describe('PATCH /api/v1/reports/:id/resume', () => {
    it('should resume suspended report correctly', async () => {
        const mockReport = { id: 1, status: 'in_progress', technicianId: staffUserId };
        mockRepo.resumeReport.mockResolvedValue(mockReport);

        const res = await request(app).patch('/api/v1/reports/1/resume').set('X-Test-User-Type', 'staff').expect(200);
        expect(res.body.status).toBe('in_progress');
        expect(res.body.technicianId).toBe(staffUserId);
        expect(mockRepo.resumeReport).toHaveBeenCalledWith({ reportId: '1', technicianId: staffUserId });
    });

    it('should return 404 for non-existent report', async () => {
        mockRepo.resumeReport.mockResolvedValue(null);
        await request(app).patch('/api/v1/reports/99999/resume').set('X-Test-User-Type', 'staff').expect(404);
        expect(mockRepo.resumeReport).toHaveBeenCalledWith({ reportId: '99999', technicianId: staffUserId });
    });

    it('should return 403 if user is not staff', async () => {
        await request(app).patch('/api/v1/reports/1/resume').set('X-Test-User-Type', 'citizen').expect(403);
        expect(mockRepo.resumeReport).not.toHaveBeenCalled();
    });
});

describe('Status Flow Integration', () => {
    it('should handle complete workflow', async () => {
        mockRepo.startReport.mockResolvedValue({ id: 1, status: 'in_progress', technicianId: staffUserId });
        mockRepo.suspendReport.mockResolvedValue({ id: 1, status: 'suspended', technicianId: staffUserId });
        mockRepo.resumeReport.mockResolvedValue({ id: 1, status: 'in_progress', technicianId: staffUserId });
        mockRepo.finishReport.mockResolvedValue({ id: 1, status: 'resolved', technicianId: staffUserId });

        let res = await request(app).patch('/api/v1/reports/1/start').set('X-Test-User-Type', 'staff').expect(200);
        expect(res.body.status).toBe('in_progress');

        res = await request(app).patch('/api/v1/reports/1/suspend').set('X-Test-User-Type', 'staff').expect(200);
        expect(res.body.status).toBe('suspended');

        res = await request(app).patch('/api/v1/reports/1/resume').set('X-Test-User-Type', 'staff').expect(200);
        expect(res.body.status).toBe('in_progress');

        res = await request(app).patch('/api/v1/reports/1/finish').set('X-Test-User-Type', 'staff').expect(200);
        expect(res.body.status).toBe('resolved');

        expect(mockRepo.startReport).toHaveBeenCalledTimes(1);
        expect(mockRepo.suspendReport).toHaveBeenCalledTimes(1);
        expect(mockRepo.resumeReport).toHaveBeenCalledTimes(1);
        expect(mockRepo.finishReport).toHaveBeenCalledTimes(1);
    });
});

describe('PATCH /api/v1/reports/:id/review', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRepo.reviewReport.mockResolvedValue({ id: 5, status: 'assigned' });
    });

    it('rejects invalid action', async () => {
        const res = await request(app).patch('/api/v1/reports/5/review')
            .set('X-Test-User-Type', 'staff')
            .set("X-Test-Role", "Municipal Public Relations Officer")
            .send({ action: 'foobar' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Invalid action/i);
        expect(mockRepo.reviewReport).not.toHaveBeenCalled();
    });

    it('returns 404 when controller returns null', async () => {
        mockRepo.reviewReport.mockResolvedValueOnce(null);
        const res = await request(app).patch('/api/v1/reports/99/review')
            .set('X-Test-User-Type', 'staff')
            .set("X-Test-Role", "Municipal Public Relations Officer")
            .send({ action: 'accept', explanation: '', categoryId: 5 });
        expect(res.status).toBe(404);
    });

    it('accepts review and returns updated', async () => {
        const res = await request(app).patch('/api/v1/reports/5/review')
            .set('X-Test-User-Type', 'staff')
            .set("X-Test-Role", "Municipal Public Relations Officer")
            .send({ action: 'accept', explanation: '', categoryId: 5 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('assigned');
        expect(mockRepo.reviewReport).toHaveBeenCalledWith({ reportId: '5', action: 'accept', explanation: '', categoryId: 5 });
    });
});
