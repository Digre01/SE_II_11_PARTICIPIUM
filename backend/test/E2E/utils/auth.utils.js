import request from 'supertest';
import { expect } from '@jest/globals';

export async function loginAndGetCookie(app, username, password) {
    const res = await request(app)
        .post('/api/v1/sessions/login')
        .send({ username, password });

    expect(res.status).toBe(201);

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();

    return setCookie.map(c => c.split(';')[0]).join('; ');
}