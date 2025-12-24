import {afterAll, beforeAll, describe, expect, it} from "@jest/globals";
import request from "supertest";
import {cleanupUsers, setupUsers} from "./users.setup.js";

let app, dataSource, userRepository;
const testUsernames = [];

describe("E2E: profile configuration", () => {
    beforeAll(async () => {
        ({ app, dataSource, userRepository } = await setupUsers());
    }, 30000);

    afterAll(async () => {
        await cleanupUsers(dataSource, userRepository, testUsernames);
    });

    it('full citizen flow: signup -> config -> pfp', async () => {
        const agent = request.agent(app);
        const rnd = Math.random().toString(36).slice(2,8);
        const username = `cit_cfg_${rnd}`;
        testUsernames.push(username);
        const signUpRes = await agent.post('/api/v1/sessions/signup').send({
            username,
            email: `${username}@example.com`,
            name: 'Test',
            surname: 'Config',
            password: 'Password#123',
            userType: 'citizen'
        });
        expect([200,201]).toContain(signUpRes.status);
        const userId = signUpRes.body.id || signUpRes.body.user?.id || signUpRes.body?.userId || signUpRes.body?.user?.userId;
        const photoBuffer = Buffer.from('fakepngdata');
        const configRes = await agent
            .patch(`/api/v1/sessions/${userId}/config`)
            .field('telegramId','tel_999')
            .field('emailNotifications','true')
            .attach('photo', photoBuffer, { filename: 'avatar.png', contentType: 'image/png' });
        expect(configRes.status).toBe(200);
        expect(configRes.body.user.telegramId).toBe('tel_999');
        expect(configRes.body.user.emailNotifications).toBe(true);
        const pfpRes = await agent.get(`/api/v1/sessions/${userId}/pfp`);
        expect(pfpRes.status).toBe(200);
        const bodyText = pfpRes.text || JSON.stringify(pfpRes.body);
        expect(bodyText).toMatch(/public\/.+/i);
    }, 30000);

    it('returns 401 for config without auth', async () => {
        const res = await request(app)
            .patch('/api/v1/sessions/999/config')
            .field('telegramId','x');
        expect(res.status).toBe(401);
    });

    it('returns 401 for pfp without auth', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/999/pfp');
        expect(res.status).toBe(401);
    });
})