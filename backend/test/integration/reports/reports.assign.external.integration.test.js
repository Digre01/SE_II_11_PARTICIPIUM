import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { mockRepo } from '../mocks/reports.mock.js';
import {
    setupAuthorizationMocks,
    setupEmailUtilsMock, setUpLoginMock
} from '../mocks/common.mocks.js';

await setupEmailUtilsMock();
await setupAuthorizationMocks()
await setUpLoginMock()

const { default: app } = await import('../../../app.js');

const externalMaintainerId = 1;

describe('PATCH /api/v1/reports/:id/assign_external', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('returns 200 and assigns report when called by staff', async () => {
        mockRepo.assignReportToExternalMaintainer.mockResolvedValueOnce({
            id: 1,
            assignedExternal: true
        });

        const res = await request(app)
            .patch('/api/v1/reports/1/assign_external')
            .set('X-Test-User-Type', 'staff');

        expect(res.status).toBe(200);
        expect(res.body.assignedExternal).toBe(true);

        expect(mockRepo.assignReportToExternalMaintainer)
            .toHaveBeenCalledWith('1', externalMaintainerId);
    });

    it('returns 403 when called by citizen', async () => {
        const res = await request(app)
            .patch('/api/v1/reports/1/assign_external')
            .set('X-Test-User-Type', 'CITIZEN')

        expect(res.status).toBe(403);
        expect(mockRepo.assignReportToExternalMaintainer).not.toHaveBeenCalled();
    });

    it('returns 403 when called by admin', async () => {
        const res = await request(app)
            .patch('/api/v1/reports/1/assign_external')
            .set('X-Test-User-Type', 'ADMIN')

        expect(res.status).toBe(403);
        expect(mockRepo.assignReportToExternalMaintainer).not.toHaveBeenCalled();
    });

    it('returns 404 when report does not exist', async () => {
        mockRepo.assignReportToExternalMaintainer.mockResolvedValueOnce(null);

        const res = await request(app)
            .patch('/api/v1/reports/999/assign_external')
            .set('X-Test-User-Type', 'staff');

        expect(res.status).toBe(404);
    });

    it('returns 500 when repository throws', async () => {
        mockRepo.assignReportToExternalMaintainer.mockRejectedValueOnce(
            new Error('DB failure')
        );

        const res = await request(app)
            .patch('/api/v1/reports/1/assign_external')
            .set('X-Test-User-Type', 'staff');

        expect(res.status).toBe(500);
    });
});

describe('PATCH /api/v1/reports/:id/external/*', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it.each([
        ['start', 'externalStart', 'in_progress'],
        ['finish', 'externalFinish', 'resolved'],
        ['suspend', 'externalSuspend', 'suspended'],
        ['resume', 'externalResume', 'assigned']
    ])(
        'PATCH /external/%s -> 200 sets status %s',
        async (action, repoMethod, expectedStatus) => {

            mockRepo[repoMethod].mockResolvedValueOnce({
                id: 50,
                status: expectedStatus
            });

            const res = await request(app)
                .patch(`/api/v1/reports/50/external/${action}`)
                .set('X-Test-User-Type', 'staff');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe(expectedStatus);

            expect(mockRepo[repoMethod]).toHaveBeenCalledWith({
                reportId: '50',
                externalMaintainerId
            });
        }
    );

    it('returns 404 when repository returns null', async () => {
        mockRepo.externalStart.mockResolvedValueOnce(null);

        const res = await request(app)
            .patch('/api/v1/reports/999/external/start')
            .set('X-Test-User-Type', 'staff');

        expect(res.status).toBe(404);
    });
});
