import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {setupAuthorizationMock, setupEmailUtilsMock, setUpLoginMock} from '../mocks/common.mocks.js';
import {mockRepo} from "../mocks/users.mocks.js";

await setupAuthorizationMock({
	allowUnauthorizedThrough: false,
});
await setupEmailUtilsMock();
await setUpLoginMock()

const { default: app } = await import('../../../app.js');

beforeEach(() => jest.clearAllMocks());

describe('POST /sessions/login', () => {
	it('should fail login with wrong credentials', async () => {
		mockRepo.login.mockRejectedValueOnce(new Error('Invalid credentials'));
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

	it('registers staff when called by admin', async () => {
		mockRepo.createUser.mockResolvedValue({
			id: 123, username: 'staff1', email: 'staff@email.com', userType: 'STAFF', name: 'Nome', surname: 'Cognome'
		});

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer admin')
			.set('X-Test-User-Type', 'ADMIN')
			.send({ username: 'staff1', email: 'staff@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });

		expect(res.status).toBe(201);
		expect(res.body.user.userType).toBe('STAFF');
		expect(mockRepo.createUser).toHaveBeenCalledWith(expect.objectContaining({
			username: 'staff1', email: 'staff@email.com', userType: 'STAFF'
		}));
	});

	it('forbids staff registration by non-admin', async () => {
		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer citizen')
			.set('X-Test-User-Type', 'CITIZEN')
			.send({ username: 'staff2', email: 'staff2@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });

		expect(res.status).toBe(403);
		expect(mockRepo.createUser).not.toHaveBeenCalled();
	});

	it('registers citizen without admin', async () => {
		mockRepo.createUser.mockResolvedValue({
			id: 456, username: 'citizen1', email: 'cit@email.com', userType: 'citizen', name: 'Nome', surname: 'Cognome'
		});

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer citizen')
			.set('X-Test-User-Type', 'CITIZEN')
			.send({ username: 'citizen1', email: 'cit@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'citizen' });

		expect(res.status).toBe(201);
		expect(res.body.user.userType).toBe('citizen');
		expect(mockRepo.createUser).toHaveBeenCalledWith(expect.objectContaining({
			username: 'citizen1', email: 'cit@email.com', userType: 'citizen'
		}));
	});

	it('fails if username or email already exists', async () => {
		// Duplicate username
		mockRepo.createUser.mockRejectedValueOnce(new ConflictError('User with username dupuser already exists'));
		let res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer admin')
			.set('X-Test-User-Type', 'ADMIN')
			.send({ username: 'dupuser', email: 'staff@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
		expect(res.status).toBe(409);

		// Duplicate email
		mockRepo.createUser.mockRejectedValueOnce(new ConflictError('User with email dup@email.com already exists'));
		res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer admin')
			.set('X-Test-User-Type', 'ADMIN')
			.send({ username: 'staff6', email: 'dup@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
		expect(res.status).toBe(409);
	});
});