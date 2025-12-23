import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockRoleRepo } from "./mocks/roles.mocks.js";
import {setupEmailUtilsMock} from "./mocks/common.mocks.js";

await setupEmailUtilsMock()

// Import app AFTER mocks are set up
const { default: app } = await import('../../app.js');

beforeEach(() => {
    mockRoleRepo.findAll.mockReset();
    mockRoleRepo.findById.mockReset();
});

afterEach(() => {
    // Clean up after each test
    mockRoleRepo.findAll.mockReset();
    mockRoleRepo.findById.mockReset();
});

describe('GET /api/v1/roles', () => {
    it('should return all roles when user is ADMIN', async () => {
        const mockRoles = [
            { id: 1, name: 'Technical Support' },
            { id: 2, name: 'Environmental Officer' },
            { id: 3, name: 'Manager' }
        ];

        mockRoleRepo.findAll.mockResolvedValue(mockRoles);

        const res = await request(app)
            .get('/api/v1/roles')
            .set('X-Test-User-Type', 'ADMIN')
            .expect(200);

        expect(res.body).toEqual(mockRoles);
        expect(res.body).toHaveLength(3);
        expect(mockRoleRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no roles exist', async () => {
        mockRoleRepo.findAll.mockResolvedValue([]);

        const res = await request(app)
            .get('/api/v1/roles')
            .set('X-Test-User-Type', 'ADMIN')
            .expect(200);

        expect(res.body).toEqual([]);
        expect(mockRoleRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return 403 when user is not ADMIN (staff)', async () => {
        await request(app)
            .get('/api/v1/roles')
            .set('X-Test-User-Type', 'staff')
            .expect(403);

        expect(mockRoleRepo.findAll).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not ADMIN (citizen)', async () => {
        await request(app)
            .get('/api/v1/roles')
            .set('X-Test-User-Type', 'citizen')
            .expect(403);

        expect(mockRoleRepo.findAll).not.toHaveBeenCalled();
    });

    it('should return 403 without authentication header', async () => {
        await request(app)
            .get('/api/v1/roles')
            .expect(403);

        expect(mockRoleRepo.findAll).not.toHaveBeenCalled();
    });
});