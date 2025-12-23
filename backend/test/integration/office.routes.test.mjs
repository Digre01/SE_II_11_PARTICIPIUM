import request from 'supertest';
import {describe, it, expect, beforeEach, afterEach, jest} from '@jest/globals';
import { mockOfficeRepo } from "./mocks/office.mocks.js";
import {setupAuthorizationMock, setupEmailUtilsMock} from "./mocks/common.mocks.js";

await setupAuthorizationMock({ allowUnauthorizedThrough: false });
await setupEmailUtilsMock()

const { default: app } = await import('../../app.js');

beforeEach(() => {
    mockOfficeRepo.findAll.mockReset();
    mockOfficeRepo.findById.mockReset();
});

afterEach(() => {
    mockOfficeRepo.findAll.mockReset();
    mockOfficeRepo.findById.mockReset();
});

describe('GET /api/v1/offices', () => {
    it('should return all offices when user is ADMIN', async () => {
        const mockOffices = [
            { id: 1, name: 'Municipality Office' },
            { id: 2, name: 'Technical Office' },
            { id: 3, name: 'Environmental Office' }
        ];

        mockOfficeRepo.findAll.mockResolvedValue(mockOffices);

        const res = await request(app)
            .get('/api/v1/offices')
            .set('X-Test-User-Type', 'ADMIN')
            .expect(200);

        expect(res.body).toEqual(mockOffices);
        expect(res.body).toHaveLength(3);
        expect(mockOfficeRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no offices exist', async () => {
        mockOfficeRepo.findAll.mockResolvedValue([]);

        const res = await request(app)
            .get('/api/v1/offices')
            .set('X-Test-User-Type', 'ADMIN')
            .expect(200);

        expect(res.body).toEqual([]);
        expect(mockOfficeRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return 403 when user is not ADMIN (staff)', async () => {
        await request(app)
            .get('/api/v1/offices')
            .set('X-Test-User-Type', 'staff')
            .expect(403);

        expect(mockOfficeRepo.findAll).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not ADMIN (citizen)', async () => {
        await request(app)
            .get('/api/v1/offices')
            .set('X-Test-User-Type', 'citizen')
            .expect(403);

        expect(mockOfficeRepo.findAll).not.toHaveBeenCalled();
    });

    it('should return 403 without authentication header', async () => {
        await request(app)
            .get('/api/v1/offices')
            .expect(403);

        expect(mockOfficeRepo.findAll).not.toHaveBeenCalled();
    });
});