import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { mockOfficeRepo } from "./mocks/office.mocks.js";
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "./mocks/common.mocks.js";
import {mockCategoryRepo} from "./mocks/category.mocks.js";

await setupEmailUtilsMock();
await setupAuthorizationMocks()
await setUpLoginMock()

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
            const req = request(app)
                .get('/api/v1/offices')
                .set('X-test-User-Type', 'citizen')
            if (role) req.set('X-Test-User-Type', role);
            await req.expect(403);
            expect(mockOfficeRepo.findAll).not.toHaveBeenCalled();
        }
    });
});

describe("GET /api/v1/offices/:id", () => {
    const mockOffice = { id: 1, name: 'Municipality Office' };

    it("returns office by id", async () => {
        mockOfficeRepo.findById.mockResolvedValue(mockOffice)

        const res = await request(app)
            .get(`/api/v1/offices/${mockOffice.id}`)

        expect(res.status).toBe(200)
        expect(res.body).toEqual(mockOffice);
        expect(mockOfficeRepo.findById).toHaveBeenCalled();
    })

})

describe("GET /api/v1/offices/:id/categories", () => {
    const mockOfficeId = 1;
    const mockCategory = { id: 1, name: 'Infrastructure', description: 'Roads and bridges' }

    it("returns category from internal office", async () => {
        mockCategoryRepo.findCategoriesByOfficeId.mockResolvedValue(mockCategory)

        const res = await request(app)
            .get(`/api/v1/offices/${mockOfficeId}/categories`)

        expect(res.status).toBe(200)
        expect(res.body).toEqual(mockCategory);
        expect(mockCategoryRepo.findCategoriesByOfficeId).toHaveBeenCalled();
    })

    it("returns category from external office", async () => {
        mockCategoryRepo.findCategoriesByOfficeId.mockResolvedValue(mockCategory)

        const res = await request(app)
            .get(`/api/v1/offices/${mockOfficeId}/categories?isExternal=true`)

        expect(res.status).toBe(200)
        expect(res.body).toEqual(mockCategory);
        expect(mockCategoryRepo.findCategoriesByOfficeId).toHaveBeenCalled();
    })
})
