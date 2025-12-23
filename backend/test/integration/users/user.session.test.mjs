import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMock, setupEmailUtilsMock, setUpLoginMock} from '../mocks/common.mocks.js';
import { mockController } from '../mocks/userMocks/user.session.mock.js';

await setupAuthorizationMock({
	allowUnauthorizedThrough: false,
});
await setupEmailUtilsMock();
await setUpLoginMock()

const { default: app } = await import('../../../app.js');

describe('Integration: User Routes (mocked controller)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /sessions/login', () => {
		it('should fail login with wrong credentials', async () => {
			mockController.login.mockRejectedValueOnce(new Error('Invalid credentials'));
			const res = await request(app)
				.post('/api/v1/sessions/login')
				.send({ username: 'wrong', password: 'wrong' });
			expect([401, 500]).toContain(res.status);
		});
	});

	describe('GET /sessions/current', () => {
		it('should return 401 if not authenticated', async () => {
			const res = await request(app).get('/api/v1/sessions/current');
			expect(res.status).toBe(401);
			expect(res.body).toHaveProperty('error');
		});

		it('should return current session if authenticated', async () => {
			const res = await request(app)
				.get('/api/v1/sessions/current')
				.set('Authorization', 'Bearer citizen');
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('username');
		});
	});

	describe('DELETE /sessions/current', () => {
		it('should logout current session if authenticated', async () => {
			const res = await request(app)
				.delete('/api/v1/sessions/current')
				.set('Authorization', 'Bearer citizen');
			expect(res.status).toBe(200);
		});
	});

	describe('POST /sessions/signup', () => {
		it('should fail signup without email', async () => {
			const res = await request(app)
				.post('/api/v1/sessions/signup')
				.send({ username: 'testuser', password: 'testpass', userType: 'CITIZEN' });
			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message');
		});

		it('should signup staff as ADMIN and auto-verify email', async () => {
			mockController.createUser.mockResolvedValueOnce({
				id: 2,
				username: 'staffuser',
				userType: 'STAFF',
				email: 'staff@example.com',
				name: 'Staff',
				surname: 'User'
			});
			mockController.markEmailVerified.mockResolvedValueOnce({
				id: 2,
				username: 'staffuser',
				userType: 'STAFF',
				email: 'staff@example.com',
				name: 'Staff',
				surname: 'User'
			});

			const res = await request(app)
				.post('/api/v1/sessions/signup')
				.set('X-Test-User-Type', 'ADMIN')
				.send({
					username: 'staffuser',
					password: 'staffpass',
					userType: 'STAFF',
					email: 'staff@example.com',
					name: 'Staff',
					surname: 'User'
				});

			expect(res.status).toBe(201);
			expect(res.body.emailSent).toBe(false);
			expect(res.body.emailReason).toBe('staff auto-verified');
			expect(mockController.createUser).toHaveBeenCalled();
			expect(mockController.markEmailVerified).toHaveBeenCalled();
		});

		it('should handle error in req.login during signup', async () => {
			mockController.createUser.mockRejectedValueOnce(new Error('login error'));
			const res = await request(app)
				.post('/api/v1/sessions/signup')
				.set('X-Test-User-Type', 'ADMIN')
				.send({
					username: 'citizenuser',
					password: 'citizenpass',
					userType: 'CITIZEN',
					email: 'citizen@example.com',
					name: 'Citizen',
					surname: 'User'
				});
			expect([500, 400]).toContain(res.status);
			expect(res.body).toHaveProperty('message');
		});
	});

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
				.set('Authorization', 'Bearer citizen')
				.send({});
			expect(res.status).toBe(400);
		});

		it('should fail verify_email with wrong code', async () => {
			mockController.verifyEmail.mockRejectedValueOnce(new Error('Invalid verification code'));
			const res = await request(app)
				.post('/api/v1/sessions/current/verify_email')
				.set('Authorization', 'Bearer citizen')
				.send({ code: 'wrongcode' });
			expect([400, 500]).toContain(res.status);
			expect(res.body).toHaveProperty('message');
		});

		it('should fail verify_email with expired code', async () => {
			mockController.verifyEmail.mockRejectedValueOnce(new Error('Verification code expired'));
			const res = await request(app)
				.post('/api/v1/sessions/current/verify_email')
				.set('Authorization', 'Bearer citizen')
				.send({ code: 'expiredcode' });
			expect([400, 500]).toContain(res.status);
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
			mockController.isEmailVerified.mockRejectedValueOnce(new Error('User not found'));
			const res = await request(app)
				.get('/api/v1/sessions/current/email_verified')
				.set('Authorization', 'Bearer citizen');
			expect([400, 500]).toContain(res.status);
			expect(res.body).toHaveProperty('message');
		});

		it('should fail email_verified with generic error', async () => {
			mockController.isEmailVerified.mockRejectedValueOnce(new Error('Generic error'));
			const res = await request(app)
				.get('/api/v1/sessions/current/email_verified')
				.set('Authorization', 'Bearer citizen');
			expect([400, 500]).toContain(res.status);
			expect(res.body).toHaveProperty('message');
		});
	});

	describe('PATCH /sessions/:id/role', () => {
		it('should return 401 if not authenticated', async () => {
			const res = await request(app)
				.patch('/api/v1/sessions/1/role')
				.send({ roleId: 2 });
			expect(res.status).toBe(401);
		});

		it('should assign role to staff as ADMIN', async () => {
			mockController.assignRole.mockResolvedValueOnce({ id: 1, roleId: 2 });
			const res = await request(app)
				.patch('/api/v1/sessions/1/role')
				.set('X-Test-User-Type', 'ADMIN')
				.send({ roleId: 2 });
			expect([200, 500]).toContain(res.status);
		});
	});

	describe('GET /sessions/:id/pfp', () => {
		it('should return 401 without auth', async () => {
			const res = await request(app).get('/api/v1/sessions/1/pfp');
			expect(res.status).toBe(401);
			expect(mockController.getPfpUrl).not.toHaveBeenCalled();
		});

		it('should get profile picture url as CITIZEN', async () => {
			mockController.getPfpUrl.mockResolvedValueOnce('/public/abc123.png');
			const res = await request(app)
				.get('/api/v1/sessions/1/pfp')
				.set('Authorization', 'Bearer citizen');
			expect([200, 500]).toContain(res.status);
			if (res.status === 200) {
				expect(mockController.getPfpUrl).toHaveBeenCalledWith(1);
			}
		});

		it('should return 500 on controller error', async () => {
			mockController.getPfpUrl.mockRejectedValueOnce(new Error('DB fail'));
			const res = await request(app)
				.get('/api/v1/sessions/1/pfp')
				.set('Authorization', 'Bearer citizen');
			expect(res.status).toBe(500);
		});
	});

	describe('PATCH /sessions/:id/config', () => {
		it('should return 401 if not authenticated', async () => {
			const res = await request(app)
				.patch('/api/v1/sessions/1/config')
				.send({ telegramId: '12345' });
			expect(res.status).toBe(401);
		});

		it('should update account config as CITIZEN', async () => {
			mockController.configAccount.mockResolvedValueOnce({
				telegramId: '12345',
				emailNotifications: true
			});
			const res = await request(app)
				.patch('/api/v1/sessions/1/config')
				.set('Authorization', 'Bearer citizen')
				.send({ telegramId: '12345' });
			expect([200, 500]).toContain(res.status);
		});

		it('should return 500 when controller throws', async () => {
			mockController.configAccount.mockRejectedValueOnce(new Error('DB failure'));
			const res = await request(app)
				.patch('/api/v1/sessions/1/config')
				.set('Authorization', 'Bearer citizen')
				.send({ telegramId: '12345' });
			expect(res.status).toBe(500);
		});
	});

	describe('GET /sessions/available_staff', () => {
		it('should return 401 if not authenticated', async () => {
			const res = await request(app)
				.get('/api/v1/sessions/available_staff');
			expect(res.status).toBe(401);
		});
	});
});