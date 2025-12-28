import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { mockRepo } from '../../mocks/repositories/reports.repo.mock.js';
import {
    setupAuthorizationMocks,
    setupEmailUtilsMock, setUpLoginMock,
    setupUploadMiddlewareMock
} from '../../mocks/common.mocks.js';

await setupEmailUtilsMock();
await setupUploadMiddlewareMock();
await setUpLoginMock()
await setupAuthorizationMocks()

const { default: app } = await import('../../../app.js');

describe('POST /api/v1/reports', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockRepo.createReport.mockResolvedValue({ id: 1 });
    });

    it('creates report successfully with photos (1–3)', async () => {
        const body = {
            title: 'Good',
            description: 'Desc',
            categoryId: 5,
            latitude: 45.1,
            longitude: 9.2
        };

        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-User-Type', 'CITIZEN')
            .set('X-Test-Photos', 'a.jpg,b.jpg')
            .send(body);

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/Report created successfully/i);
        expect(res.body.photos).toEqual(['/public/a.jpg', '/public/b.jpg']);

        expect(mockRepo.createReport).toHaveBeenCalledWith({
            title: 'Good',
            description: 'Desc',
            categoryId: 5,
            userId: 1,
            latitude: 45.1,
            longitude: 9.2,
            photos: ['/public/a.jpg', '/public/b.jpg']
        });
    });

    it('returns 401 when user is not authenticated', async () => {
        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-Photos', 'a.jpg')
            .send({});

        expect(res.status).toBe(401);
        expect((res.body.error || res.body.message || '')).toMatch(/UNAUTHORIZED/i);
        expect(mockRepo.createReport).not.toHaveBeenCalled();
    });

    it('returns 403 when admin accesses citizen-only endpoint', async () => {
        const body = {
            title: 'T',
            description: 'D',
            categoryId: 5,
            latitude: 1,
            longitude: 2
        };

        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-User-Type', 'ADMIN')
            .set('X-Test-Photos', 'a.jpg')
            .send(body);

        expect(res.status).toBe(403);
        expect(mockRepo.createReport).not.toHaveBeenCalled();
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-User-Type', 'CITIZEN')
            .send({ title: 'Only title' });

        expect(res.status).toBe(400);
        expect((res.body.error || res.body.message || '')).toMatch(/required/i);
        expect(mockRepo.createReport).not.toHaveBeenCalled();
    });

    it('returns 400 when number of photos is invalid (0 or >3)', async () => {
        const body = {
            title: 'T',
            description: 'D',
            categoryId: 5,
            latitude: 1,
            longitude: 2
        };

        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-User-Type', 'CITIZEN')
            .set('X-Test-Photos', 'a.jpg,b.jpg,c.jpg,d.jpg')
            .send(body);

        expect(res.status).toBe(400);
        expect((res.body.error || res.body.message || '')).toMatch(/between 1 and 3 photos/i);
        expect(mockRepo.createReport).not.toHaveBeenCalled();
    });

    it('returns 400 when categoryId is invalid', async () => {
        const body = {
            title: 'Bad cat',
            description: 'D',
            categoryId: 0,
            latitude: 1,
            longitude: 2
        };

        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-User-Type', 'CITIZEN')
            .set('X-Test-Photos', 'a.jpg')
            .send(body);

        expect(res.status).toBe(400);
        expect(mockRepo.createReport).not.toHaveBeenCalled();
    });

    it('returns 500 when repository throws', async () => {
        mockRepo.createReport.mockRejectedValueOnce(
            new Error('DB failure')
        );

        const body = {
            title: 'T',
            description: 'D',
            categoryId: 5,
            latitude: 1,
            longitude: 2
        };

        const res = await request(app)
            .post('/api/v1/reports')
            .set('X-Test-User-Type', 'CITIZEN')
            .set('X-Test-Photos', 'a.jpg,b.jpg')
            .send(body);

        expect(res.status).toBe(500);
    });
});
