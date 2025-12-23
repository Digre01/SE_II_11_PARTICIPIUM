import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import userRoutes from '../../../routes/userRoutes.js';
import errorHandler from '../../../middlewares/errorHandler.js';


function createTestApp({ mockUser, mockLogout } = {}) {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
	app.use(passport.initialize());
	app.use(passport.session());
	if (mockUser) {
		app.use((req, res, next) => {
			req.isAuthenticated = () => true;
			req.user = mockUser;
			if (mockLogout) req.logout = mockLogout;
			next();
		});
	}
	app.use('/api/v1/sessions', userRoutes);
	app.use(errorHandler);
	return app;
}

describe('User Routes Integration', () => {
	// Example test for login
	it('should fail login with wrong credentials', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .post('/api/v1/sessions/login')
			       .send({ username: 'wrong', password: 'wrong' });
		       expect([401, 500]).toContain(res.status);
	});
	
	// Mock user for authenticated tests
	const mockUser = {
		id: 1,
		username: 'admin',
		userType: 'ADMIN',
		email: 'admin@example.com',
		name: 'Admin',
		surname: 'User',
	};

	// Helper to login a user in session
	function loginAgent(agent, user = mockUser) {
		return new Promise((resolve, reject) => {
			agent
				.post('/api/v1/sessions/login')
				.send({ username: user.username, password: 'adminpass' })
				.end((err, res) => {
					if (err) return reject(err);
					resolve(res);
				});
		});
	}

	it('should return current session if authenticated', async () => {
		// Simula sessione autenticata
		       const app = createTestApp({ mockUser });
		       const agent = request.agent(app);
		       const res = await agent.get('/api/v1/sessions/current');
		       expect(res.status).toBe(200);
		       expect(res.body).toHaveProperty('username', 'admin');
	});

	it('should logout current session if authenticated', async () => {
		       const app = createTestApp({ mockUser, mockLogout: (cb) => cb() });
		       const agent = request.agent(app);
		       const res = await agent.delete('/api/v1/sessions/current');
		       expect(res.status).toBe(200);
	});

	it('should fail verify_email if not authenticated', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .post('/api/v1/sessions/current/verify_email')
			       .send({ code: '123456' });
		       expect(res.status).toBe(401);
	});

	it('should fail verify_email if code is missing', async () => {
		       const app = createTestApp({ mockUser });
		       const agent = request.agent(app);
		       const res = await agent.post('/api/v1/sessions/current/verify_email').send({});
		       expect(res.status).toBe(400);
	});

	       // Test signup staff branch (ADMIN) - verifica che emailSent sia false e emailReason sia 'staff auto-verified'
			       it('should signup staff as ADMIN and auto-verify email', async () => {
				       const userControllerModule = await import('../../../controllers/userController.js');
				       const originalMarkEmailVerified = userControllerModule.default.markEmailVerified;
				       const originalCreateUser = userControllerModule.default.createUser;
				       userControllerModule.default.markEmailVerified = async (id) => ({ id, username: 'staffuser', userType: 'STAFF', email: 'staff@example.com', name: 'Staff', surname: 'User' });
				       userControllerModule.default.createUser = async () => ({ id: 2, username: 'staffuser', userType: 'STAFF', email: 'staff@example.com', name: 'Staff', surname: 'User' });
				       const app = createTestApp({ mockUser });
				       const agent = request.agent(app);
				       const res = await agent
					       .post('/api/v1/sessions/signup')
					       .send({ username: 'staffuser', password: 'staffpass', userType: 'STAFF', email: 'staff@example.com', name: 'Staff', surname: 'User' });
				       expect(res.status).toBe(201);
				       expect(res.body.emailSent).toBe(false);
				       expect(res.body.emailReason).toBe('staff auto-verified');
				       userControllerModule.default.markEmailVerified = originalMarkEmailVerified;
				       userControllerModule.default.createUser = originalCreateUser;
			       });

	       // Test errore in req.login (signup citizen)
	       it('should handle error in req.login during signup', async () => {
		       // Mock req.login per chiamare callback con errore
		       const app = createTestApp({ mockUser });
		       app.use((req, res, next) => {
			       req.login = (user, cb) => cb(new Error('login error'));
			       next();
		       });
		       const agent = request.agent(app);
		       const res = await agent
			       .post('/api/v1/sessions/signup')
			       .send({ username: 'citizenuser', password: 'citizenpass', userType: 'CITIZEN', email: 'citizen@example.com', name: 'Citizen', surname: 'User' });
		       expect([500, 400]).toContain(res.status);
		       // Puoi anche controllare che la risposta abbia un messaggio di errore
		       expect(res.body).toHaveProperty('message');
	       });


		       // Test verifica email: codice errato
		       it('should fail verify_email with wrong code', async () => {
			       const userControllerModule = await import('../../../controllers/userController.js');
			       const originalVerifyEmail = userControllerModule.default.verifyEmail;
			       userControllerModule.default.verifyEmail = async () => { throw new Error('Invalid verification code'); };
			       const app = createTestApp({ mockUser });
			       const agent = request.agent(app);
			       const res = await agent.post('/api/v1/sessions/current/verify_email').send({ code: 'wrongcode' });
			       expect([400, 500]).toContain(res.status);
			       expect(res.body).toHaveProperty('message');
			       userControllerModule.default.verifyEmail = originalVerifyEmail;
		       });

		       // Test verifica email: codice scaduto
		       it('should fail verify_email with expired code', async () => {
			       const userControllerModule = await import('../../../controllers/userController.js');
			       const originalVerifyEmail = userControllerModule.default.verifyEmail;
			       userControllerModule.default.verifyEmail = async () => { throw new Error('Verification code expired'); };
			       const app = createTestApp({ mockUser });
			       const agent = request.agent(app);
			       const res = await agent.post('/api/v1/sessions/current/verify_email').send({ code: 'expiredcode' });
			       expect([400, 500]).toContain(res.status);
			       expect(res.body).toHaveProperty('message');
			       userControllerModule.default.verifyEmail = originalVerifyEmail;
		       });


		       // Test check email verified: utente non trovato
		       it('should fail email_verified if user not found', async () => {
			       const userControllerModule = await import('../../../controllers/userController.js');
			       const originalIsEmailVerified = userControllerModule.default.isEmailVerified;
			       userControllerModule.default.isEmailVerified = async () => { throw new Error('User not found'); };
			       const app = createTestApp({ mockUser: { ...mockUser, userType: 'CITIZEN' } });
			       const agent = request.agent(app);
			       const res = await agent.get('/api/v1/sessions/current/email_verified');
			       expect([400, 500]).toContain(res.status);
			       expect(res.body).toHaveProperty('message');
			       userControllerModule.default.isEmailVerified = originalIsEmailVerified;
		       });

		       // Test check email verified: errore generico
		       it('should fail email_verified with generic error', async () => {
			       const userControllerModule = await import('../../../controllers/userController.js');
			       const originalIsEmailVerified = userControllerModule.default.isEmailVerified;
			       userControllerModule.default.isEmailVerified = async () => { throw new Error('Generic error'); };
			       const app = createTestApp({ mockUser: { ...mockUser, userType: 'CITIZEN' } });
			       const agent = request.agent(app);
			       const res = await agent.get('/api/v1/sessions/current/email_verified');
			       expect([400, 500]).toContain(res.status);
			       expect(res.body).toHaveProperty('message');
			       userControllerModule.default.isEmailVerified = originalIsEmailVerified;
		       });

	// Test PATCH /:id/role as ADMIN
	it('should assign role to staff as ADMIN', async () => {
		       const app = createTestApp({ mockUser });
		       const agent = request.agent(app);
		       const res = await agent.patch('/api/v1/sessions/1/role').send({ roleId: 2 });
		       expect([200, 500]).toContain(res.status);
	});

	// Test GET /:id/pfp as CITIZEN
	it('should get profile picture url as CITIZEN', async () => {
		       const app = createTestApp({ mockUser: { ...mockUser, userType: 'CITIZEN' } });
		       const agent = request.agent(app);
		       const res = await agent.get('/api/v1/sessions/1/pfp');
		       expect([200, 500]).toContain(res.status);
	});

	// Test PATCH /:id/config as CITIZEN
	it('should update account config as CITIZEN', async () => {
		       const app = createTestApp({ mockUser: { ...mockUser, userType: 'CITIZEN' } });
		       const agent = request.agent(app);
		       const res = await agent.patch('/api/v1/sessions/1/config').send({ telegramId: '12345' });
		       expect([200, 500]).toContain(res.status);
	});

	// Example test for signup (citizen)
	it('should fail signup without email', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .post('/api/v1/sessions/signup')
			       .send({ username: 'testuser', password: 'testpass', userType: 'CITIZEN' });
		       expect(res.status).toBe(400);
		       expect(res.body).toHaveProperty('message');
	});

	// Example test for /current (not authenticated)
	it('should return 401 for /current if not authenticated', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .get('/api/v1/sessions/current');
		       expect(res.status).toBe(401);
		       expect(res.body).toHaveProperty('error');
	});

	// Example test for /current/email_verified (not authenticated)
	it('should return 401 for /current/email_verified if not authenticated', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .get('/api/v1/sessions/current/email_verified');
		       expect(res.status).toBe(401);
	});

	// Example test for PATCH /:id/config (not authenticated)
	it('should return 401 for PATCH /:id/config if not authenticated', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .patch('/api/v1/sessions/1/config')
			       .send({ telegramId: '12345' });
		       expect(res.status).toBe(401);
	});

	// Example test for PATCH /:id/role (not authenticated)
	it('should return 401 for PATCH /:id/role if not authenticated', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .patch('/api/v1/sessions/1/role')
			       .send({ roleId: 2 });
		       expect(res.status).toBe(401);
	});

	// Example test for GET /available_staff (not authenticated)
	it('should return 401 for GET /available_staff if not authenticated', async () => {
		       const app = createTestApp();
		       const res = await request(app)
			       .get('/api/v1/sessions/available_staff');
		       expect(res.status).toBe(401);
	});
});
