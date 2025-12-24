import {expect} from "@jest/globals";
import request from "supertest";
import fs from "fs";
import path from "node:path";
import {AppDataSourcePostgres} from "../../../config/data-source.js";
import './reports.mock.js';
import {seedDatabase} from "../../../database/seeder.js";
import {setupEmailUtilsMock} from "../../integration/mocks/common.mocks.js";

export let cookie;
export let cookie_staff;
export let app;

export function attachFakeImage(req, name) {
    const buffer = Buffer.from(
        '89504E470D0A1A0A0000000D4948445200000001000000010806000000' +
        '1F15C4890000000A49444154789C6360000002000100A8C6B28B00000000' +
        '49454E44AE426082',
        'hex'
    );
    return req.attach('photos', buffer, name);
}

export function deleteReturnedPhotos(photos) {
    for (const p of photos || []) {
        try {
            const full = path.join(path.dirname(new URL('../../../app.js', import.meta.url).pathname), p);
            fs.existsSync(full) && fs.unlinkSync(full);
        } catch {}
    }
}

export async function globalSetup() {
    await AppDataSourcePostgres.initialize();
    await seedDatabase();

    await setupEmailUtilsMock()

    const module = await import("../../../app.js");
    app = module.default;

    cookie = await loginAndGetCookie();
    cookie_staff = await loginAndGetCookieStaff();
}

export async function loginAndGetCookie() {
    const res = await request(app)
        .post('/api/v1/sessions/login')
        .send({ username: 'citizen', password: 'citizen' });
    expect(res.status).toBe(201);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    return setCookie.map(c => c.split(';')[0]).join('; ');
}

export async function loginAndGetCookieStaff() {
    const res = await request(app)
        .post('/api/v1/sessions/login')
        .send({ username: 'staff1', password: 'staff1' });
    expect(res.status).toBe(201);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    return setCookie.map(c => c.split(';')[0]).join('; ');
}

export async function globalTeardown() {
    if (AppDataSourcePostgres.isInitialized) {
        await AppDataSourcePostgres.destroy();
    }
}