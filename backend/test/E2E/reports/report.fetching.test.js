import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { standardSetup, standardTeardown } from '../utils/standard.setup.js';
import { attachFakeImage, deleteReturnedPhotos } from '../utils/files.utils.js';
import { AppDataSourcePostgres } from '../../../config/data-source.js';
import { mockRepo } from './reports.mock.js';

describe('GET /api/v1/reports/:id (E2E)', () => {
    let app;
    let loginAsCitizen;
    let loginAsStaff;

    let citizenCookie;
    let staffCookieWithRole;
    let createdReportId;

    beforeAll(async () => {
        const setup = await standardSetup();

        app = setup.app;
        loginAsCitizen = setup.loginAsCitizen;
        loginAsStaff = setup.loginAsStaff;

        citizenCookie = await loginAsCitizen();

        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', citizenCookie)
            .field('title', 'Test Report for GET')
            .field('description', 'Desc')
            .field('categoryId', '5')
            .field('latitude', '12.3')
            .field('longitude', '3.21');

        req = attachFakeImage(req, 'a.jpg');
        req = attachFakeImage(req, 'b.jpg');

        const createRes = await req;
        expect(createRes.status).toBe(201);

        deleteReturnedPhotos(createRes.body.photos);

        const { Users } = await import('../../../entities/Users.js');
        const { Report } = await import('../../../entities/Reports.js');

        const userRepo = AppDataSourcePostgres.getRepository(Users);
        const reportRepo = AppDataSourcePostgres.getRepository(Report);

        const citizenUser = await userRepo.findOne({
            where: { username: 'citizen' }
        });

        const report = await reportRepo.findOne({
            where: { userId: citizenUser.id },
            order: { id: 'DESC' }
        });

        createdReportId = report.id;

        /** -------------------------
         *  Assign role to staff1
         *  ------------------------- */
        const staffUser = await userRepo.findOne({
            where: { username: 'staff1' }
        });

        const { Roles } = await import('../../../entities/Roles.js');
        const { UserOffice } = await import('../../../entities/UserOffice.js');

        const rolesRepo = AppDataSourcePostgres.getRepository(Roles);
        const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);

        const mpRole = await rolesRepo.findOne({
            where: { name: 'Municipal Public Relations Officer' }
        });

        let userOffice = await userOfficeRepo.findOne({
            where: { userId: staffUser.id }
        });

        if (!userOffice) {
            userOffice = userOfficeRepo.create({
                userId: staffUser.id,
                roleId: mpRole.id
            });
        } else {
            userOffice.roleId = mpRole.id;
        }

        await userOfficeRepo.save(userOffice);

        staffCookieWithRole = await loginAsStaff();
    }, 30000);

    afterAll(async () => {
        await standardTeardown();
    });

    it('should fail without authentication', async () => {
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`);

        expect(res.status).toBe(401);
    });

    it('should fail when accessed by citizen', async () => {
        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', citizenCookie);

        expect(res.status).toBe(403);
    });

    it('should fail when report does not exist', async () => {
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
            status: 'pending'
        });

        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', staffCookieWithRole);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(createdReportId);
    });

    it('should include photos in the response', async () => {
        mockRepo.getReportById.mockResolvedValue({
            photos: ['/public/a.jpg', '/public/b.jpg']
        });

        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', staffCookieWithRole);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.photos)).toBe(true);
    });

    it('should include category information', async () => {
        mockRepo.getReportById.mockResolvedValue({
            category: { id: 5, name: 'Road Issues' }
        });

        const res = await request(app)
            .get(`/api/v1/reports/${createdReportId}`)
            .set('Cookie', staffCookieWithRole);

        expect(res.status).toBe(200);
        expect(res.body.category.id).toBe(5);
    });
});
