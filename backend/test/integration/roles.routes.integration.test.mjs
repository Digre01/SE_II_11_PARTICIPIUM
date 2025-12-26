import request from 'supertest';
import {describe, it, expect, beforeEach, jest} from '@jest/globals';
import { mockRoleRepo } from "./mocks/roles.mocks.js";
import { setupEmailUtilsMock } from "./mocks/common.mocks.js";

await setupEmailUtilsMock();
const { default: app } = await import('../../app.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/v1/roles', () => {
    it('returns all roles for ADMIN', async () => {
        const mockRoles = [
            { id: 1, name: 'Technical Support' },
            { id: 2, name: 'Environmental Officer' },
            { id: 3, name: 'Manager' }
        ];
        mockRoleRepo.findAll.mockResolvedValue(mockRoles);

        const res = await request(app).get('/api/v1/roles').set('X-Test-User-Type', 'ADMIN').expect(200);

        expect(res.body).toEqual(mockRoles);
        expect(res.body).toHaveLength(3);
        expect(mockRoleRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no roles exist', async () => {
        mockRoleRepo.findAll.mockResolvedValue([]);
        const res = await request(app).get('/api/v1/roles').set('X-Test-User-Type', 'ADMIN').expect(200);

        expect(res.body).toEqual([]);
        expect(mockRoleRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns 403 for non-ADMIN users or missing auth', async () => {
        for (const role of ['staff', 'citizen', undefined]) {
            const req = request(app).get('/api/v1/roles').set("Authorization", "Bearer token");
            if (role) req.set('X-Test-User-Type', role);
            await req.expect(403);
            expect(mockRoleRepo.findAll).not.toHaveBeenCalled();
        }
    });
});
