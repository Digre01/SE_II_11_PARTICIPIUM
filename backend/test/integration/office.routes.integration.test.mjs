import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { mockOfficeRepo } from "./mocks/office.mocks.js";
import { setupAuthorizationMock, setupEmailUtilsMock } from "./mocks/common.mocks.js";

await setupAuthorizationMock({ allowUnauthorizedThrough: false });
await setupEmailUtilsMock();

const { default: app } = await import('../../app.js');

beforeEach(() => jest.resetAllMocks());

describe('GET /api/v1/offices', () => {
    it('returns all offices for ADMIN', async () => {
        const mockOffices = [
            { id: 1, name: 'Municipality Office' },
            { id: 2, name: 'Technical Office' },
            { id: 3, name: 'Environmental Office' }
        ];
        mockOfficeRepo.findAll.mockResolvedValue(mockOffices);

        const res = await request(app).get('/api/v1/offices').set('X-Test-User-Type', 'ADMIN').expect(200);

        expect(res.body).toEqual(mockOffices);
        expect(res.body).toHaveLength(3);
        expect(mockOfficeRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no offices exist', async () => {
        mockOfficeRepo.findAll.mockResolvedValue([]);

        const res = await request(app).get('/api/v1/offices').set('X-Test-User-Type', 'ADMIN').expect(200);

        expect(res.body).toEqual([]);
        expect(mockOfficeRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns 403 for non-ADMIN users or missing auth', async () => {
        for (const role of ['staff', 'citizen', undefined]) {
            const req = request(app).get('/api/v1/offices').set("Authorization", "Bearer token");
            if (role) req.set('X-Test-User-Type', role);
            await req.expect(403);
            expect(mockOfficeRepo.findAll).not.toHaveBeenCalled();
        }
    });
});
