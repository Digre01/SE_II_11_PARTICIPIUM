import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {mockRepo} from "../mocks/reports.mocks.js";

// Import app AFTER mocks are set up
const { default: app } = await import('../../../app.js');

describe('Report Status Integration Tests', () => {
    const staffUserId = 10; // From your mock setup

    beforeEach(() => {
        // Reset all mocks before each test
        mockRepo.startReport.mockReset();
        mockRepo.finishReport.mockReset();
        mockRepo.suspendReport.mockReset();
        mockRepo.resumeReport.mockReset();
    });

    afterEach(() => {
        // Clean up after each test
        mockRepo.startReport.mockReset();
        mockRepo.finishReport.mockReset();
        mockRepo.suspendReport.mockReset();
        mockRepo.resumeReport.mockReset();
    });

    describe('PATCH /api/v1/reports/:id/start', () => {
        it('should start a report and set status to in_progress', async () => {
            const mockReport = {
                id: 1,
                title: 'Test Report',
                status: 'in_progress',
                technicianId: staffUserId,
                description: 'Test'
            };

            mockRepo.startReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .patch('/api/v1/reports/1/start')
                .set('X-Test-User-Type', 'staff')
                .expect(200);

            expect(res.body).toHaveProperty('id', 1);
            expect(res.body.status).toBe('in_progress');
            expect(res.body.technicianId).toBe(staffUserId);

            expect(mockRepo.startReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.startReport).toHaveBeenCalledWith({
                reportId: '1',
                technicianId: staffUserId
            });
        });

        it('should return 404 for non-existent report', async () => {
            mockRepo.startReport.mockResolvedValue(null);

            await request(app)
                .patch('/api/v1/reports/99999/start')
                .set('X-Test-User-Type', 'staff')
                .expect(404);

            expect(mockRepo.startReport).toHaveBeenCalledWith({
                reportId: '99999',
                technicianId: staffUserId
            });
        });

        it('should return 403 if user is not staff', async () => {
            await request(app)
                .patch('/api/v1/reports/1/start')
                .set('X-Test-User-Type', 'citizen')
                .expect(403);

            expect(mockRepo.startReport).not.toHaveBeenCalled();
        });

        it('should return 404 without authentication header', async () => {
            // Without auth header, mock lets request through with req.user = undefined
            // Controller calls repository with technicianId: undefined
            // Repository returns null (not found)
            mockRepo.startReport.mockResolvedValue(null);

            await request(app)
                .patch('/api/v1/reports/1/start')
                .expect(404);

            // Verify repository was called with undefined technicianId
            expect(mockRepo.startReport).toHaveBeenCalledWith({
                reportId: '1',
                technicianId: undefined
            });
        });
    });

    describe('PATCH /api/v1/reports/:id/finish', () => {
        it('should finish a report and set status to resolved', async () => {
            const mockReport = {
                id: 1,
                title: 'Test Report',
                status: 'resolved',
                technicianId: staffUserId,
                description: 'Test'
            };

            mockRepo.finishReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .patch('/api/v1/reports/1/finish')
                .set('X-Test-User-Type', 'staff')
                .expect(200);

            expect(res.body).toHaveProperty('id', 1);
            expect(res.body.status).toBe('resolved');
            expect(res.body.technicianId).toBe(staffUserId);

            expect(mockRepo.finishReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.finishReport).toHaveBeenCalledWith({
                reportId: '1',
                technicianId: staffUserId
            });
        });

        it('should return 404 if report not found', async () => {
            mockRepo.finishReport.mockResolvedValue(null);

            await request(app)
                .patch('/api/v1/reports/99999/finish')
                .set('X-Test-User-Type', 'staff')
                .expect(404);

            expect(mockRepo.finishReport).toHaveBeenCalledWith({
                reportId: '99999',
                technicianId: staffUserId
            });
        });

        it('should return 404 if technicianId does not match', async () => {
            // Repository returns null when technician doesn't match
            mockRepo.finishReport.mockResolvedValue(null);

            await request(app)
                .patch('/api/v1/reports/1/finish')
                .set('X-Test-User-Type', 'staff')
                .expect(404);

            expect(mockRepo.finishReport).toHaveBeenCalledWith({
                reportId: '1',
                technicianId: staffUserId
            });
        });

        it('should return 403 if user is not staff', async () => {
            await request(app)
                .patch('/api/v1/reports/1/finish')
                .set('X-Test-User-Type', 'citizen')
                .expect(403);

            expect(mockRepo.finishReport).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /api/v1/reports/:id/suspend', () => {
        it('should suspend a report from assigned status', async () => {
            const mockReport = {
                id: 1,
                title: 'Test Report',
                status: 'suspended',
                technicianId: null,
                description: 'Test'
            };

            mockRepo.suspendReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .patch('/api/v1/reports/1/suspend')
                .set('X-Test-User-Type', 'staff')
                .expect(200);

            expect(res.body).toHaveProperty('id', 1);
            expect(res.body.status).toBe('suspended');

            expect(mockRepo.suspendReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.suspendReport).toHaveBeenCalledWith({
                reportId: '1',
                technicianId: staffUserId
            });
        });

        it('should suspend a report from in_progress status and keep technicianId', async () => {
            const mockReport = {
                id: 1,
                title: 'Test Report',
                status: 'suspended',
                technicianId: staffUserId,
                description: 'Test'
            };

            mockRepo.suspendReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .patch('/api/v1/reports/1/suspend')
                .set('X-Test-User-Type', 'staff')
                .expect(200);

            expect(res.body.status).toBe('suspended');
            expect(res.body.technicianId).toBe(staffUserId);
        });

        it('should return 404 for non-existent report', async () => {
            mockRepo.suspendReport.mockResolvedValue(null);

            await request(app)
                .patch('/api/v1/reports/99999/suspend')
                .set('X-Test-User-Type', 'staff')
                .expect(404);

            expect(mockRepo.suspendReport).toHaveBeenCalledWith({
                reportId: '99999',
                technicianId: staffUserId
            });
        });

        it('should return 403 if user is not staff', async () => {
            await request(app)
                .patch('/api/v1/reports/1/suspend')
                .set('X-Test-User-Type', 'citizen')
                .expect(403);

            expect(mockRepo.suspendReport).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /api/v1/reports/:id/resume', () => {
        it('should resume suspended report to assigned when no technicianId', async () => {
            const mockReport = {
                id: 1,
                title: 'Test Report',
                status: 'assigned',
                technicianId: null,
                description: 'Test'
            };

            mockRepo.resumeReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .patch('/api/v1/reports/1/resume')
                .set('X-Test-User-Type', 'staff')
                .expect(200);

            expect(res.body.status).toBe('assigned');
            expect(res.body.technicianId).toBeNull();

            expect(mockRepo.resumeReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.resumeReport).toHaveBeenCalledWith({
                reportId: '1',
                technicianId: staffUserId
            });
        });

        it('should resume suspended report to in_progress when technicianId exists', async () => {
            const mockReport = {
                id: 1,
                title: 'Test Report',
                status: 'in_progress',
                technicianId: staffUserId,
                description: 'Test'
            };

            mockRepo.resumeReport.mockResolvedValue(mockReport);

            const res = await request(app)
                .patch('/api/v1/reports/1/resume')
                .set('X-Test-User-Type', 'staff')
                .expect(200);

            expect(res.body.status).toBe('in_progress');
            expect(res.body.technicianId).toBe(staffUserId);
        });

        it('should return 404 for non-existent report', async () => {
            mockRepo.resumeReport.mockResolvedValue(null);

            await request(app)
                .patch('/api/v1/reports/99999/resume')
                .set('X-Test-User-Type', 'staff')
                .expect(404);

            expect(mockRepo.resumeReport).toHaveBeenCalledWith({
                reportId: '99999',
                technicianId: staffUserId
            });
        });

        it('should return 403 if user is not staff', async () => {
            await request(app)
                .patch('/api/v1/reports/1/resume')
                .set('X-Test-User-Type', 'citizen')
                .expect(403);

            expect(mockRepo.resumeReport).not.toHaveBeenCalled();
        });
    });

    describe('Status Flow Integration', () => {
        it('should handle complete workflow: start -> suspend -> resume -> finish', async () => {
            // 1. Start report
            mockRepo.startReport.mockResolvedValue({
                id: 1,
                status: 'in_progress',
                technicianId: staffUserId
            });

            let res = await request(app)
                .patch('/api/v1/reports/1/start')
                .set('X-Test-User-Type', 'staff')
                .expect(200);
            expect(res.body.status).toBe('in_progress');

            // 2. Suspend report
            mockRepo.suspendReport.mockResolvedValue({
                id: 1,
                status: 'suspended',
                technicianId: staffUserId
            });

            res = await request(app)
                .patch('/api/v1/reports/1/suspend')
                .set('X-Test-User-Type', 'staff')
                .expect(200);
            expect(res.body.status).toBe('suspended');

            // 3. Resume report
            mockRepo.resumeReport.mockResolvedValue({
                id: 1,
                status: 'in_progress',
                technicianId: staffUserId
            });

            res = await request(app)
                .patch('/api/v1/reports/1/resume')
                .set('X-Test-User-Type', 'staff')
                .expect(200);
            expect(res.body.status).toBe('in_progress');

            // 4. Finish report
            mockRepo.finishReport.mockResolvedValue({
                id: 1,
                status: 'resolved',
                technicianId: staffUserId
            });

            res = await request(app)
                .patch('/api/v1/reports/1/finish')
                .set('X-Test-User-Type', 'staff')
                .expect(200);
            expect(res.body.status).toBe('resolved');

            // Verify all repository methods were called
            expect(mockRepo.startReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.suspendReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.resumeReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.finishReport).toHaveBeenCalledTimes(1);
        });

        it('should handle workflow: suspend from assigned -> resume to assigned', async () => {
            // 1. Suspend from assigned (no technician)
            mockRepo.suspendReport.mockResolvedValue({
                id: 1,
                status: 'suspended',
                technicianId: null
            });

            let res = await request(app)
                .patch('/api/v1/reports/1/suspend')
                .set('X-Test-User-Type', 'staff')
                .expect(200);
            expect(res.body.status).toBe('suspended');
            expect(res.body.technicianId).toBeNull();

            // 2. Resume to assigned
            mockRepo.resumeReport.mockResolvedValue({
                id: 1,
                status: 'assigned',
                technicianId: null
            });

            res = await request(app)
                .patch('/api/v1/reports/1/resume')
                .set('X-Test-User-Type', 'staff')
                .expect(200);
            expect(res.body.status).toBe('assigned');
            expect(res.body.technicianId).toBeNull();

            // Verify repository methods were called
            expect(mockRepo.suspendReport).toHaveBeenCalledTimes(1);
            expect(mockRepo.resumeReport).toHaveBeenCalledTimes(1);
        });
    });
});