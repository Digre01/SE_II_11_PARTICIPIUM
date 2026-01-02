import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import { mockRepo } from "../../mocks/repositories/reports.repo.mock.js";
import request from "supertest";
import {
    setupAuthorizationMocks,
    setupEmailUtilsMock,
    setUpLoginMock
} from "../../mocks/common.mocks.js";

await setupEmailUtilsMock();
await setUpLoginMock()
await setupAuthorizationMocks()
await setUpLoginMock();

const { default: app } = await import('../../../app.js');

describe('GET /api/v1/reports (staff)', () => {
    beforeEach(() => jest.resetAllMocks());

    it('returns empty array when no reports exist', async () => {
        mockRepo.getAllReports.mockResolvedValueOnce([]);
        const res = await request(app)
            .get('/api/v1/reports')
            .set('X-Test-User-Type', 'STAFF')

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toEqual([]);
        expect(mockRepo.getAllReports).toHaveBeenCalledTimes(1);
    });

    it('returns all reports for authorized staff', async () => {
        const reports = [
            { id: 101, title: 'R1', latitude: 1, longitude: 2, status: 'pending', categoryId: 1, user: null, photos: [] },
            { id: 102, title: 'R2', latitude: 3, longitude: 4, status: 'accepted', categoryId: 2, user: { username: 's', name: 'S', surname: 'S' }, photos: [] }
        ];
        mockRepo.getAllReports.mockResolvedValueOnce(reports);

        const res = await request(app)
            .get('/api/v1/reports')
            .set('X-Test-User-Type', 'STAFF')

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body.some(r => r.id === 101)).toBe(true);
        expect(mockRepo.getAllReports).toHaveBeenCalledTimes(1);
    });

    it('rejects citizen user (403)', async () => {
        const res = await request(app)
            .get('/api/v1/reports')
            .set('X-Test-User-Type', 'CITIZEN')
        expect(res.status).toBe(403);
    });
});

describe('GET /api/v1/reports/:id', () => {
    beforeEach(() => jest.resetAllMocks());

    it('returns report details for authorized staff with correct role', async () => {
        const report = {
            id: 1, title: 'Detail Report', description: 'Full details', latitude: 45.0, longitude: 9.0,
            status: 'pending', categoryId: 1, user: { username: 'citizen1', name: 'C', surname: 'Z' }, photos: []
        };
        mockRepo.getReportById.mockResolvedValueOnce(report);

        const res = await request(app)
            .get('/api/v1/reports/1')
            .set("X-Test-User-Type", "staff")
            .set("X-Test-Role", "Municipal Public Relations Officer")

        expect(res.status).toBe(200);
        expect(res.body).toEqual(report);
        expect(mockRepo.getReportById).toHaveBeenCalledWith('1');
    });

    it('returns 404 when report not found', async () => {
        mockRepo.getReportById.mockResolvedValueOnce(null);
        const res = await request(app)
            .get('/api/v1/reports/999')
            .set("X-Test-User-Type", "staff")
            .set("X-Test-Role", "Municipal Public Relations Officer")
        ;
        expect(res.status).toBe(404);
    });

    it('returns 403 for staff with wrong role', async () => {
        const res = await request(app)
            .get('/api/v1/reports/1')
            .set('X-Test-User-Type', 'STAFF')
            .set('X-Test-Role', 'Water Systems Technician')
        ;
        expect(res.status).toBe(403);
        expect(mockRepo.getReportById).not.toHaveBeenCalled();
    });

    it('returns 403 for citizen (unauthorized user type)', async () => {
        const res = await request(app).get('/api/v1/reports/1')
            .set('Authorization', 'Bearer test')
            .set("X-Test-User-Type", "citizen")
        ;
        expect(res.status).toBe(403);
        expect(mockRepo.getReportById).not.toHaveBeenCalled();
    });
});

describe('GET /api/v1/reports/:id/photos', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns photos array', async () => {
        mockRepo.getReportPhotos.mockResolvedValue([{ link: '/public/a.jpg' }]);
        const res = await request(app)
            .get('/api/v1/reports/123/photos')
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ link: '/public/a.jpg' }]);
        expect(mockRepo.getReportPhotos).toHaveBeenCalledWith('123');
    });

    it('returns 404 when controller returns null', async () => {
        mockRepo.getReportPhotos.mockResolvedValueOnce(null);
        const res = await request(app).get('/api/v1/reports/999/photos');
        expect(res.status).toBe(404);
    });
});

describe('GET /api/v1/reports/assigned and /suspended (citizen only)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRepo.getAcceptedReports.mockResolvedValue([
            { id: 1, status: 'assigned', title: 'A', latitude: 1, longitude: 2, categoryId: 5, user: { username: 'u', name: 'N', surname: 'S' }, photos: [{ link: '/public/a.jpg' }] },
            { id: 2, status: 'suspended', title: 'B', latitude: 3, longitude: 4, categoryId: 6, user: null, photos: [] },
        ]);
    });

    it('assigned returns only assigned DTOs', async () => {
        const res = await request(app)
            .get('/api/v1/reports/assigned')
            .set('X-Test-User-Type', 'CITIZEN')
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 1, title: 'A', latitude: 1, longitude: 2, status: 'assigned', categoryId: 5,
                authorUsername: 'u', authorName: 'N S', photos: [{ link: '/public/a.jpg' }] }
        ]);
        expect(mockRepo.getAcceptedReports).toHaveBeenCalledTimes(1);
    });

    it('suspended returns only suspended DTOs', async () => {
        const res = await request(app)
            .get('/api/v1/reports/suspended')
            .set('X-Test-User-Type', 'CITIZEN')
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 2, title: 'B', latitude: 3, longitude: 4, status: 'suspended', categoryId: 6,
                authorUsername: null, authorName: null, photos: [] }
        ]);
    });

    it('rejects staff user (403) as route requires citizen', async () => {
        const res = await request(app)
            .get('/api/v1/reports/assigned')
            .set('X-Test-User-Type', 'STAFF')
        expect(res.status).toBe(403);
    });
});
