import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {
    app,
    attachFakeImage,
    cookie,
    deleteReturnedPhotos, globalSetup, globalTeardown,
    loginAndGetCookieStaff
} from "./report.setup.js";
import {AppDataSourcePostgres} from "../../../config/data-source.js";
import {mockRepo} from "./reports.mock.js";

describe('GET /api/v1/reports/:id (E2E)', () => {
    let createdReportId;
    let cookieStaffWithRole;

    beforeAll(async () => {
        await globalSetup()

        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', cookie)
            .field('title', 'Test Report for GET')
            .field('description', 'Desc')
            .field('categoryId', '5')
            .field('latitude', '12.3')
            .field('longitude', '3.21');
        req = attachFakeImage(req, 'a.jpg');
        req = attachFakeImage(req, 'b.jpg');

        const createRes = await req;
        expect(createRes.status).toBe(201);

        // Get the created report ID
        const { Users } = await import('../../../entities/Users.js');
        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const citizenUser = await userRepo.findOne({ where: { username: 'citizen' } });

        const { Report } = await import('../../../entities/Reports.js');
        const reportRepo = AppDataSourcePostgres.getRepository(Report);
        const report = await reportRepo.findOne({
            where: { userId: citizenUser.id },
            order: { id: 'DESC' }
        });
        createdReportId = report.id;

        // Assign role to staff1
        const staffUser = await userRepo.findOne({ where: { username: 'staff1' } });
        const { Roles } = await import('../../../entities/Roles.js');
        const rolesRepo = AppDataSourcePostgres.getRepository(Roles);
        const mpRole = await rolesRepo.findOne({ where: { name: 'Municipal Public Relations Officer' } });

        const { UserOffice } = await import('../../../entities/UserOffice.js');
        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
        let existingUO = await userOfficeRepo.findOne({ where: { userId: staffUser.id } });
        if (!existingUO) {
            existingUO = { userId: staffUser.id };
        }
        existingUO.roleId = mpRole.id;
        await userOfficeRepo.save(existingUO);

        cookieStaffWithRole = await loginAndGetCookieStaff();

        deleteReturnedPhotos(createRes.body.photos);

    }, 30000);

    afterAll(async() => {
        await globalTeardown()
    })

    it('should fail without authentication (no cookie)', async () => {
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it('should fail when accessed by citizen user', async () => {
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', cookie);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should fail when accessed by staff without proper role', async () => {
        // Login with staff2 who doesn't have the Municipal Public Relations Officer role
        const cookieStaff2 = await (async () => {
            const res = await request(app)
                .post('/api/v1/sessions/login')
                .send({ username: 'staff2', password: 'staff2' });
            expect(res.status).toBe(201);
            return res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        })();

        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', cookieStaff2);

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should fail when report ID does not exist', async () => {
        const nonExistentId = 999999;
        const res = await request(app)
            .get(`/api/v1/reports/${nonExistentId}`)
            .set('Cookie', cookieStaffWithRole);

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/Not found/i);
    });

    it('should fail with invalid report ID format', async () => {
        const res = await request(app)
            .get('/api/v1/reports/invalid-id')
            .set('Cookie', cookieStaffWithRole);

        // Should either return 404 or 400 depending on validation
        expect([400, 404, 500]).toContain(res.status);
    });

    it('should successfully retrieve report with proper staff role', async () => {
        mockRepo.getReportById.mockResolvedValue({
            id: createdReportId,
            title: 'Test Report for GET',
            description: 'Desc',
            categoryId: 5,
            latitude: 12.3,
            longitude: 3.21,
            status: 'pending'
        })
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', cookieStaffWithRole);

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body.id).toBe(createdReportId);
        expect(res.body.title).toBe('Test Report for GET');
        expect(res.body.description).toBe('Desc');
        expect(res.body.categoryId).toBe(5);
        expect(res.body.latitude).toBe(12.3);
        expect(res.body.longitude).toBe(3.21);
        expect(res.body.status).toBe('pending');
    });

    it('should include photos in the response', async () => {
        mockRepo.getReportById.mockResolvedValue({photos: ['/public/a.jpg', '/public/b.jpg']});
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', cookieStaffWithRole);

        expect(res.status).toBe(200);
        expect(res.body.photos).toBeDefined();
        expect(Array.isArray(res.body.photos)).toBe(true);
    });

    it('should include category information in the response', async () => {
        mockRepo.getReportById.mockResolvedValue({category: { id: 5, name: 'Road Issues' }})
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', cookieStaffWithRole);

        expect(res.status).toBe(200);
        expect(res.body.category).toBeDefined();
        expect(res.body.category.id).toBe(5);
        expect(res.body.category.name).toBeDefined();
    });
})