import {describe, it, expect, beforeAll, jest, afterAll} from '@jest/globals';
import request from 'supertest';
import { standardSetup, standardTeardown } from '../utils/standard.setup.js';
import { mockRepo } from './reports.mock.js';

describe('GET /api/v1/reports/:id (E2E - mocked)', () => {
    let app;
    let dataSource;
    let citizenCookie;
    let staffCookieWithRole;
    const createdReportId = 123;

    beforeAll(async () => {
        const setup = await standardSetup();
        app = setup.app;
        dataSource = setup.dataSource;

        citizenCookie = await setup.loginAsCitizen();
        staffCookieWithRole = await setup.loginAsStaff();

        // Reset dei mock prima dei test
        jest.resetAllMocks();
    }, 30000);

    afterAll(async () => {
        await standardTeardown(dataSource);
    });

    it('should fail without authentication', async () => {
        const res = await request(app).get(`/api/v1/reports/${createdReportId}`);
        expect(res.status).toBe(401);
    });

    it('should fail when accessed by citizen', async () => {
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', citizenCookie);

        expect(res.status).toBe(403);
    });

    it('should fail when report does not exist', async () => {
        mockRepo.getReportById.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/v1/reports/999999')
            .set('Cookie', staffCookieWithRole);

        expect(res.status).toBe(404);
    });

    it('should retrieve report with proper staff role', async () => {
        mockRepo.getReportById.mockResolvedValue({
            id: createdReportId,
            title: 'Test Report for GET',
            description: 'Desc',
            categoryId: 5,
            latitude: 12.3,
            longitude: 3.21,
            status: 'pending',
            photos: ['/public/a.jpg', '/public/b.jpg'],
            category: { id: 5, name: 'Road Issues' }
        });

        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', staffCookieWithRole);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdReportId);
        expect(Array.isArray(res.body.photos)).toBe(true);
        expect(res.body.photos.length).toBe(2);
        expect(res.body.category).toBeDefined();
        expect(res.body.category.id).toBe(5);
    });
});
