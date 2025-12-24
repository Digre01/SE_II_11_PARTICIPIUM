import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import {app, attachFakeImage, cookie, deleteReturnedPhotos, globalSetup, globalTeardown} from "./report.setup.js";
import request from "supertest";

describe('POST /api/v1/reports (E2E)', () => {
    beforeAll(async () => {
        await globalSetup()
    });

    afterAll(async () => {
        await globalTeardown()
    })

    it('fails without authorization (no cookie)', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .field('title', 'No auth')
            .field('description', 'Desc')
            .field('categoryId', '5')
            .field('latitude', '45.1')
            .field('longitude', '9.2');
        req = attachFakeImage(req, 'a.jpg');
        let res = await req;
        expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it('fails missing required fields (no description)', async () => {
        let req = request(app)
            .post('/api/v1/reports')
            .set('Cookie', cookie)
            .field('title', 'No auth')
            .field('categoryId', '5')
            .field('latitude', '45.1')
            .field('longitude', '9.2');
        req = await attachFakeImage(req, 'a.jpg');
        let res = await req;
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/all fields are required/i);
    });

    it('fails with zero photos', async () => {
        const res = await request(app)
            .post('/api/v1/reports')
            .set('Cookie', cookie)
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
            .set('Cookie', cookie)
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
            .set('Cookie', cookie)
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
            .set('Cookie', cookie)
            .field('title', 'Bad category')
            .field('description', 'Desc')
            .field('categoryId', '0') // not seeded
            .field('latitude', '5')
            .field('longitude', '6');
        req = attachFakeImage(req, 'a.jpg');
        const res = await req;
        expect([404, 400]).toContain(res.status); // NotFound from repo or validation
        deleteReturnedPhotos(res.body.photos);
    });
});