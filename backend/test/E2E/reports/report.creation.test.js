import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

import { standardSetup, standardTeardown } from '../utils/standard.setup.js';
import { attachFakeImage, deleteReturnedPhotos } from '../utils/files.utils.js';

describe('POST /api/v1/reports (E2E)', () => {
    let app;
    let loginAsCitizen;
    let citizenCookie;

    beforeAll(async () => {
        const setup = await standardSetup();

        app = setup.app;
        loginAsCitizen = setup.loginAsCitizen;

        citizenCookie = await loginAsCitizen();
    }, 30000);

    afterAll(async () => {
        await standardTeardown();
    });

    it('fails without authorization (no cookie)', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .field('title', 'No auth')
            .field('description', 'Desc')
            .field('categoryId', '5')
            .field('latitude', '45.1')
            .field('longitude', '9.2');

        req = attachFakeImage(req, 'a.jpg');

        const res = await req;

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/unauthorized/i);
    });

    it('fails missing required fields (no description)', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', citizenCookie)
            .field('title', 'Missing description')
            .field('categoryId', '5')
            .field('latitude', '45.1')
            .field('longitude', '9.2');

        req = attachFakeImage(req, 'a.jpg');

        const res = await req;

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/all fields are required/i);
    });

    it('fails with zero photos', async () => {
        const res = await request(app)
            .post('/api/v1/reports')
            .set('Cookie', citizenCookie)
            .field('title', 'No photos')
            .field('description', 'Desc')
            .field('categoryId', '2')
            .field('latitude', '1')
            .field('longitude', '2');

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/between 1 and 3 photos/i);
    });

    it('creates report with 2 photos', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', citizenCookie)
            .field('title', 'Two photos')
            .field('description', 'Desc')
            .field('categoryId', '6')
            .field('latitude', '12.3')
            .field('longitude', '3.21');

        req = attachFakeImage(req, 'a.jpg');
        req = attachFakeImage(req, 'b.jpg');

        const res = await req;

        expect(res.status).toBe(201);
        expect(res.body.photos.length).toBe(2);

        deleteReturnedPhotos(res.body.photos);
    });

    it('creates report with 3 photos', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', citizenCookie)
            .field('title', 'Three photos')
            .field('description', 'Desc')
            .field('categoryId', '9')
            .field('latitude', '1.1')
            .field('longitude', '2.2');

        req = attachFakeImage(req, 'a.jpg');
        req = attachFakeImage(req, 'b.jpg');
        req = attachFakeImage(req, 'c.jpg');

        const res = await req;

        expect(res.status).toBe(201);
        expect(res.body.photos.length).toBe(3);

        deleteReturnedPhotos(res.body.photos);
    });

    it('fails when categoryId does not exist', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', citizenCookie)
            .field('title', 'Bad category')
            .field('description', 'Desc')
            .field('categoryId', '0') // not seeded
            .field('latitude', '5')
            .field('longitude', '6');

        req = attachFakeImage(req, 'a.jpg');

        const res = await req;

        expect([400, 404]).toContain(res.status);
        deleteReturnedPhotos(res.body.photos);
    });
});
