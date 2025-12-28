import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../../mocks/common.mocks.js";
import { mockRepo } from "../../mocks/users.repo.mock.js";

await setupEmailUtilsMock();
await setUpLoginMock();
await setupAuthorizationMocks()

const { default: app } = await import('../../../app.js');

beforeEach(() => jest.clearAllMocks());

describe('POST /sessions/current/verify_email', () => {
    it('should fail verify_email if not authenticated', async () => {
        const res = await request(app)
            .post('/api/v1/sessions/current/verify_email')
            .send({ code: '123456' });
        expect(res.status).toBe(401);
    });

    it('should fail verify_email if code is missing', async () => {
        const res = await request(app)
            .post('/api/v1/sessions/current/verify_email')
            .set("X-Test-User-Type", "CITIZEN")
            .send({});
        expect(res.status).toBe(400);
    });

    it('should fail verify_email with wrong code', async () => {
        mockRepo.getEmailVerification.mockRejectedValueOnce(new Error('Invalid verification code'));
        const res = await request(app)
            .post('/api/v1/sessions/current/verify_email')
            .set("X-Test-User-Type", "CITIZEN")
            .send({ code: 'wrongcode' });
        expect(res.status === 400 || res.status === 500).toBe(true)
        expect(res.body).toHaveProperty('message');
    });

    it('should fail verify_email with expired code', async () => {
        mockRepo.getEmailVerification.mockResolvedValueOnce({
            code: 'expiredcode',
            expiresAt: new Date(Date.now() - 1000) //un secondo fa, quindi scaduto
        });
        const res = await request(app)
            .post('/api/v1/sessions/current/verify_email')
            .set("X-Test-User-Type", "CITIZEN")
            .send({ code: 'expiredcode' });
        expect(res.status).toBe(410)
        expect(res.body).toHaveProperty('message');
    });
});

describe('GET /sessions/current/email_verified', () => {
    it('should return 401 if not authenticated', async () => {
        const res = await request(app)
            .get('/api/v1/sessions/current/email_verified');
        expect(res.status).toBe(401);
    });

    it('should fail email_verified if user not found', async () => {
        mockRepo.isEmailVerified.mockRejectedValueOnce(new Error('User not found'));
        const res = await request(app)
            .get('/api/v1/sessions/current/email_verified')
            .set("X-Test-User-Type", "CITIZEN");
        expect([400, 500]).toContain(res.status);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail email_verified with generic error', async () => {
        mockRepo.isEmailVerified.mockRejectedValueOnce(new Error('Generic error'));
        const res = await request(app)
            .get('/api/v1/sessions/current/email_verified')
            .set("X-Test-User-Type", "CITIZEN");
        expect(res.status === 400 || res.status === 500).toBe(true)
        expect(res.body).toHaveProperty('message');
    });
});