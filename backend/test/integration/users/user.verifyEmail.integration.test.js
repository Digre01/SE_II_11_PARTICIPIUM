import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMocks, setupEmailUtilsMock, setUpLoginMock} from "../../mocks/common.mocks.js";
import {mockUserRepo} from "../../mocks/repositories/users.repo.mock.js";

await setupEmailUtilsMock();
await setUpLoginMock();
await setupAuthorizationMocks()

const { sendVerificationEmail } = await import('../../../utils/email.js');

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
        mockUserRepo.getEmailVerification.mockRejectedValueOnce(new Error('Invalid verification code'));
        const res = await request(app)
            .post('/api/v1/sessions/current/verify_email')
            .set("X-Test-User-Type", "CITIZEN")
            .send({ code: 'wrongcode' });
        expect(res.status === 400 || res.status === 500).toBe(true)
        expect(res.body).toHaveProperty('message');
    });

    it('should fail verify_email with expired code', async () => {
        mockUserRepo.getEmailVerification.mockResolvedValueOnce({
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

    it('should return 200 with verification status', async () => {
        mockUserRepo.getUserById.mockResolvedValueOnce({ id: 1, isVerified: true });

        const res = await request(app)
            .get('/api/v1/sessions/current/email_verified')
            .set("X-Test-User-Type", "CITIZEN");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ isVerified: true });
        expect(mockUserRepo.getUserById).toHaveBeenCalledWith(1);
    });

    it('should fail email_verified if user not found', async () => {
        mockUserRepo.isEmailVerified.mockRejectedValueOnce(new Error('User not found'));
        const res = await request(app)
            .get('/api/v1/sessions/current/email_verified')
            .set("X-Test-User-Type", "CITIZEN");
        expect([400, 500]).toContain(res.status);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail email_verified with generic error', async () => {
        mockUserRepo.isEmailVerified.mockRejectedValueOnce(new Error('Generic error'));
        const res = await request(app)
            .get('/api/v1/sessions/current/email_verified')
            .set("X-Test-User-Type", "CITIZEN");
        expect(res.status === 400 || res.status === 500).toBe(true)
        expect(res.body).toHaveProperty('message');
    });
});

describe('POST /sessions/current/resend_verification', () => {
    it('should return 401 when not authenticated', async () => {
        const res = await request(app)
            .post('/api/v1/sessions/current/resend_verification');
        expect(res.status).toBe(401);
    });

    it('should resend verification code for authenticated user', async () => {
        mockUserRepo.getUserById.mockResolvedValueOnce({ id: 1, email: 'citizen@test.com' });
        sendVerificationEmail.mockResolvedValueOnce({ sent: true, reason: 'ok' });

        const res = await request(app)
            .post('/api/v1/sessions/current/resend_verification')
            .set('X-Test-User-Type', 'CITIZEN');

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            message: 'Verification code resent',
            emailSent: true,
            emailReason: 'ok'
        });
        expect(mockUserRepo.saveEmailVerificationCode).toHaveBeenCalledWith(1, expect.any(String), expect.any(Date));
        expect(sendVerificationEmail).toHaveBeenCalledWith('citizen@test.com', expect.any(String));
    });
});

describe('POST /sessions/current/telegram/request_code', () => {
    it('should return 401 when not authenticated', async () => {
        const res = await request(app)
            .post('/api/v1/sessions/current/telegram/request_code');
        expect(res.status).toBe(401);
    });

    it('should return 403 when caller is not CITIZEN', async () => {
        const res = await request(app)
            .post('/api/v1/sessions/current/telegram/request_code')
            .set('X-Test-User-Type', 'STAFF');
        expect(res.status).toBe(403);
    });

    it('should request telegram code for authenticated citizen', async () => {
        const mockResult = { sent: true, code: '123456' };
        mockUserRepo.requestTelegramVerificationCode.mockResolvedValueOnce(mockResult);

        const res = await request(app)
            .post('/api/v1/sessions/current/telegram/request_code')
            .set('X-Test-User-Type', 'CITIZEN');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockResult);
        expect(mockUserRepo.requestTelegramVerificationCode).toHaveBeenCalledWith(1);
    });
});

describe('POST /sessions/telegram/verify', () => {
    it('should verify telegram code and login user', async () => {
        const mockVerification = { userId: 5, ok: true };
        mockUserRepo.verifyTelegramCode.mockResolvedValueOnce(mockVerification);
        mockUserRepo.getUserById.mockResolvedValueOnce({ id: 5, username: 'tguser', userType: 'CITIZEN' });

        const res = await request(app)
            .post('/api/v1/sessions/telegram/verify')
            .send({ username: 'tguser', code: '999999' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockVerification);
        expect(mockUserRepo.verifyTelegramCode).toHaveBeenCalledWith('tguser', '999999');
        expect(mockUserRepo.getUserById).toHaveBeenCalledWith(5);
    });

    it('should return 401 if linked user is missing', async () => {
        const mockVerification = { userId: 99 };
        mockUserRepo.verifyTelegramCode.mockResolvedValueOnce(mockVerification);
        mockUserRepo.getUserById.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/v1/sessions/telegram/verify')
            .send({ username: 'ghost', code: '111111' });

        expect([401, 500]).toContain(res.status);
    });
});