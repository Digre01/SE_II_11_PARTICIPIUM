import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictError } from '../../errors/ConflictError.js';
import { InsufficientRightsError } from '../../errors/InsufficientRightsError.js';
import request from 'supertest';

// Mock repository e middleware
await jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
	userRepository: {
		createUser: jest.fn(async (...args) => {
			// Simula duplicati
			if (args[0] === 'dupuser') throw new ConflictError(`User with username ${args[0]} already exists`);
			if (args[1] === 'dup@email.com') throw new ConflictError(`User with email ${args[1]} already exists`);
			// Simula campi mancanti
			if (!args[0]) throw { message: 'username is required', status: 400 };
			if (!args[1]) throw { message: 'email is required', status: 400 };
			if (!args[4]) throw { message: 'password is required', status: 400 };
			if (!args[6]) throw { message: 'usertype is required', status: 400 };
			return { id: 123, username: args[0], email: args[1], userType: args[6] };
		})
	}
}));
await jest.unstable_mockModule('../../middlewares/userAuthorization.js', () => ({
	requireAdminIfCreatingStaff: (req, res, next) => {
		req.isAuthenticated = () => true;
		req.user = req.header('X-Role') === 'admin' ? { userType: 'admin' } : { userType: 'citizen' };
		const requestedUserType = req.body?.userType;
		if (requestedUserType && String(requestedUserType).toUpperCase() === 'STAFF') {
			if (req.user.userType !== 'admin') {
				return next(new InsufficientRightsError('Forbidden'));
			}
		}
		next();
	},
	authorizeUserType: () => (req, res, next) => next(),
}));

const { default: app } = await import('../../app.js');

describe('POST /api/sessions/signup (integration)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('registers staff when called by admin', async () => {
		const res = await request(app)
			.post('/api/sessions/signup')
			.set('X-Role', 'admin')
			.send({ username: 'staff1', email: 'staff@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
		expect(res.status).toBe(201);
		expect(res.body.userType).toBe('STAFF');
	});

	it('forbids staff registration by non-admin', async () => {
			const res = await request(app)
				.post('/api/sessions/signup')
				.set('X-Role', 'citizen')
				.send({ username: 'staff2', email: 'staff2@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
			expect(res.status).toBe(403);
	});

	it('registers citizen without admin', async () => {
		const res = await request(app)
			.post('/api/sessions/signup')
			.set('X-Role', 'citizen')
			.send({ username: 'citizen1', email: 'cit@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'citizen' });
		expect(res.status).toBe(201);
		expect(res.body.userType).toBe('citizen');
	});

	it('fails if username already exists', async () => {
		const res = await request(app)
			.post('/api/sessions/signup')
			.set('X-Role', 'admin')
			.send({ username: 'dupuser', email: 'staff@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
	expect(res.status).toBe(409);
	});

	it('fails if email already exists', async () => {
		const res = await request(app)
			.post('/api/sessions/signup')
			.set('X-Role', 'admin')
			.send({ username: 'staff6', email: 'dup@email.com', name: 'Nome', surname: 'Cognome', password: 'pw', userType: 'STAFF' });
	expect(res.status).toBe(409);
	});
});
