import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import request from 'supertest';
import {
	setupAuthorizationMocks,
	setupEmailUtilsMock, setUpLoginMock
} from '../../mocks/common.mocks.js';
import {ConflictError} from "../../../errors/ConflictError.js";
import {mockUserRepo, mockUserService} from "../../mocks/repositories/users.repo.mock.js";

await setupEmailUtilsMock();
const { sendVerificationEmail } = await import('../../../utils/email.js');

await setupAuthorizationMocks();
await setUpLoginMock()

const { default: app } = await import('../../../app.js');

beforeEach(() => jest.clearAllMocks());

describe('POST /sessions/login', () => {
	it('should fail login with wrong credentials', async () => {
		mockUserRepo.getUserByUsername.mockResolvedValue(null);

		const res = await request(app)
			.post('/api/v1/sessions/login')
			.send({ username: 'wrong', password: 'wrong' });

		expect(res.status).toBe(401);
	});

	it('should successfully login with correct credentials', async () => {
		const mockUser = {
			id: 1,
			username: 'testuser',
			email: 'test@example.com',
			userType: 'CITIZEN',
			isVerified: true
		};

		mockUserRepo.getUserByUsername.mockResolvedValue({
			...mockUser,
			password: 'hashedpassword',
			salt: 'somesalt'
		});

		const res = await request(app)
			.post('/api/v1/sessions/login')
			.send({ username: 'testuser', password: 'correctpassword' });

		console.log('Status:', res.status);
		console.log('Body:', res.body);
		console.log('Error:', res.error);

		expect(res.status === 200 || res.status === 201).toBe(true);
		expect(res.body).toHaveProperty('username', 'testuser');
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
			.set('X-Test-User-Type', 'CITIZEN');

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ username: 'testuser', userType: 'CITIZEN' });
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

	beforeEach(() => {
		mockUserRepo.saveEmailVerificationCode.mockResolvedValue(undefined);
		mockUserRepo.markEmailVerified.mockResolvedValue(undefined);
	});

	it('should fail signup without email', async () => {
		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.send({ username: 'testuser', password: 'testpass', userType: 'CITIZEN' });
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty('message');
	});

	it('registers staff when called by admin', async () => {
		const mockStaffUser = {
			id: 123,
			username: 'staff1',
			email: 'staff@email.com',
			userType: 'STAFF',
			name: 'Nome',
			surname: 'Cognome',
			isVerified: false
		};

		mockUserService.hashPassword.mockResolvedValue("hashed_pw")

		mockUserRepo.createUser.mockImplementation(async (username, email, name, surname, hashedPassword, salt, userType) => {
			return { ...mockStaffUser, hashedPassword, salt };
		});

		mockUserRepo.markEmailVerified.mockResolvedValue({
			...mockStaffUser,
			isVerified: true
		});

		mockUserRepo.getUserById.mockResolvedValue({
			...mockStaffUser,
			isVerified: true
		});

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('X-Test-User-Type', 'ADMIN')
			.send({
				username: 'staff1',
				email: 'staff@email.com',
				name: 'Nome',
				surname: 'Cognome',
				password: 'pw',
				userType: 'STAFF'
			});

		expect(res.status).toBe(201);
		expect(res.body.user.userType).toBe('STAFF');
		expect(res.body.emailSent).toBe(false);
		expect(res.body.emailReason).toBe('staff auto-verified');

		expect(mockUserRepo.createUser).toHaveBeenCalledWith(
			'staff1',                              // username
			'staff@email.com',                     // email
			'Nome',                                // name
			'Cognome',                             // surname
			"hashed_pw", // hashedPassword (64 char hex)
			expect.any(String),                    // salt
			'STAFF'                                // userType
		);

		expect(mockUserRepo.markEmailVerified).toHaveBeenCalledWith(123);
	});

	it('forbids staff registration by non-admin', async () => {
		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer citizen')
			.set('X-Test-User-Type', 'CITIZEN')
			.send({
				username: 'staff2',
				email: 'staff2@email.com',
				name: 'Nome',
				surname: 'Cognome',
				password: 'pw',
				userType: 'STAFF'
			});

		expect(res.status).toBe(403);
		expect(mockUserRepo.createUser).not.toHaveBeenCalled();
	});

	it('registers citizen without admin', async () => {
		const mockCitizenUser = {
			id: 456,
			username: 'citizen1',
			email: 'cit@email.com',
			userType: 'CITIZEN',
			name: 'Nome',
			surname: 'Cognome',
			isVerified: false
		};

		mockUserRepo.createUser.mockResolvedValue(mockCitizenUser);
		mockUserRepo.getUserById.mockResolvedValue(mockCitizenUser);

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer citizen')
			.set('X-Test-User-Type', 'CITIZEN')
			.send({
				username: 'citizen1',
				email: 'cit@email.com',
				name: 'Nome',
				surname: 'Cognome',
				password: 'pw',
				userType: 'CITIZEN'
			});

		expect(res.status).toBe(201);
		expect(res.body.user.userType).toBe('CITIZEN');
		expect(res.body).toHaveProperty('emailSent');
		expect(mockUserRepo.createUser).toHaveBeenCalled();
		expect(mockUserRepo.saveEmailVerificationCode).toHaveBeenCalledWith(
			456,
			expect.any(String), // verification code
			expect.any(Date) // expiry date
		);
	});

	it('keeps signup successful when verification email fails', async () => {
		const mockCitizenUser = {
			id: 789,
			username: 'citizen2',
			email: 'cit2@email.com',
			userType: 'CITIZEN',
			name: 'Nome',
			surname: 'Cognome',
			isVerified: false
		};

		mockUserRepo.createUser.mockResolvedValue(mockCitizenUser);
		mockUserRepo.getUserById.mockResolvedValue(mockCitizenUser);
		sendVerificationEmail.mockRejectedValueOnce(new Error('smtp down'));

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer citizen')
			.set('X-Test-User-Type', 'CITIZEN')
			.send({
				username: 'citizen2',
				email: 'cit2@email.com',
				name: 'Nome',
				surname: 'Cognome',
				password: 'pw',
				userType: 'CITIZEN'
			});

		expect(res.status).toBe(201);
		expect(res.body.user).toMatchObject({ id: 789, email: 'cit2@email.com' });
		expect(res.body.emailSent).toBe(false);
		expect(String(res.body.emailReason || '')).toMatch(/smtp down/i);
		expect(sendVerificationEmail).toHaveBeenCalledWith('cit2@email.com', expect.any(String));
	});

	it('fails if username already exists', async () => {
		mockUserRepo.createUser.mockRejectedValueOnce(
			new ConflictError('User with username dupuser already exists')
		);

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer admin')
			.set('X-Test-User-Type', 'ADMIN')
			.send({
				username: 'dupuser',
				email: 'staff@email.com',
				name: 'Nome',
				surname: 'Cognome',
				password: 'pw',
				userType: 'STAFF'
			});

		expect(res.status).toBe(409);
		expect(res.body).toHaveProperty('message');
	});

	it('fails if email already exists', async () => {
		mockUserRepo.createUser.mockRejectedValueOnce(
			new ConflictError('User with email dup@email.com already exists')
		);

		const res = await request(app)
			.post('/api/v1/sessions/signup')
			.set('Authorization', 'Bearer admin')
			.set('X-Test-User-Type', 'ADMIN')
			.send({
				username: 'staff6',
				email: 'dup@email.com',
				name: 'Nome',
				surname: 'Cognome',
				password: 'pw',
				userType: 'STAFF'
			});

		expect(res.status).toBe(409);
		expect(res.body).toHaveProperty('message');
	});
});