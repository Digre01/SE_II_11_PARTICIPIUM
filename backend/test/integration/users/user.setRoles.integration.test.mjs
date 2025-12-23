import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
// Prevent loading real `nodemailer` by mocking the project's email util
// before importing the real routes so they can be exercised in tests.
try {
  jest.unstable_mockModule('../../utils/email.js', () => ({
    sendVerificationEmail: async () => ({ sent: false })
  }));
} catch (e) {}

import errorHandler from '../../../middlewares/errorHandler.js';
let userRoutes = null;

beforeAll(async () => {
  // Import the real routes so tests exercise route handlers and middleware.
  userRoutes = (await import('../../../routes/userRoutes.js')).default;
});

function createTestApp({ mockUser, mockLogout, mockLogin } = {}) {
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
      // Ensure req.login exists for routes that call it during signup
      req.login = mockLogin || ((user, cb) => cb && cb());
      if (mockLogout) req.logout = mockLogout;
      next();
    });
  }
  app.use('/api/v1/sessions', userRoutes);
  app.use(errorHandler);
  return app;
}

describe('User Roles - Integration (PUT /:id/roles) - focused for story', () => {
  const mockAdmin = { id: 1, username: 'admin', userType: 'ADMIN' };

  it('should set multiple roles as ADMIN', async () => {
    const returned = [{ roleId: 2, officeId: 3 }, { roleId: 4, officeId: 5 }];
    if (userRoutes) {
      const userControllerModule = await import('../../../controllers/userController.js');
      const original = userControllerModule.default.setUserRoles;
      userControllerModule.default.setUserRoles = async (userId, payload) => returned;

      const app = createTestApp({ mockUser: mockAdmin });
      const agent = request.agent(app);
      const res = await agent.put('/api/v1/sessions/42/roles').send({ roles: [{ roleId: 2 }, { roleId: 4 }] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(returned);

      userControllerModule.default.setUserRoles = original;
    } else {
      const app = createTestApp({ mockUser: mockAdmin });
      const agent = request.agent(app);
      const res = await agent.put('/api/v1/sessions/42/roles').send({ roles: [{ roleId: 2 }, { roleId: 4 }] });
      expect(res.status).toBe(200);
    }
  });

  it('should cancel all roles when empty array provided (ADMIN)', async () => {
    const returned = [];
    if (userRoutes) {
      const userControllerModule = await import('../../../controllers/userController.js');
      const original = userControllerModule.default.setUserRoles;
      userControllerModule.default.setUserRoles = async () => returned;

      const app = createTestApp({ mockUser: mockAdmin });
      const agent = request.agent(app);
      const res = await agent.put('/api/v1/sessions/42/roles').send({ roles: [] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(returned);

      userControllerModule.default.setUserRoles = original;
    } else {
      const app = createTestApp({ mockUser: mockAdmin });
      const agent = request.agent(app);
      const res = await agent.put('/api/v1/sessions/42/roles').send({ roles: [] });
      expect(res.status).toBe(200);
    }
  });

  it('should return 403 when non-admin tries to set roles', async () => {
    const mockStaff = { id: 2, username: 'staff', userType: 'STAFF' };
    const app = createTestApp({ mockUser: mockStaff });
    const agent = request.agent(app);
    const res = await agent.put('/api/v1/sessions/42/roles').send({ roles: [{ roleId: 2 }] });
    expect(res.status).toBe(403);
  });

  it('should return 401 when not authenticated', async () => {
    const app = createTestApp();
    const res = await request(app).put('/api/v1/sessions/42/roles').send({ roles: [{ roleId: 2 }] });
    expect(res.status).toBe(401);
  });

  it('should accept numeric shorthand `roleIds` array', async () => {
    if (userRoutes) {
      const userControllerModule = await import('../../../controllers/userController.js');
      const original = userControllerModule.default.setUserRoles;
      userControllerModule.default.setUserRoles = async (userId, payload) => {
        expect(payload).toEqual([{ roleId: 7 }, { roleId: 8 }]);
        return payload;
      };

      const app = createTestApp({ mockUser: mockAdmin });
      const agent = request.agent(app);
      const res = await agent.put('/api/v1/sessions/99/roles').send({ roleIds: [7, 8] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ roleId: 7 }, { roleId: 8 }]);

      userControllerModule.default.setUserRoles = original;
    } else {
      const setUserRolesHandler = async (userId, payload) => {
        expect(payload).toEqual([{ roleId: 7 }, { roleId: 8 }]);
        return payload;
      };
      const app = createTestApp({ mockUser: mockAdmin, setUserRolesHandler });
      const agent = request.agent(app);
      const res = await agent.put('/api/v1/sessions/99/roles').send({ roleIds: [7, 8] });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ roleId: 7 }, { roleId: 8 }]);
    }
  });

  it('should return 400 when payload is invalid (not an array)', async () => {
    const app = createTestApp({ mockUser: mockAdmin });
    const agent = request.agent(app);
    const res = await agent.put('/api/v1/sessions/101/roles').send({ roles: 'invalid' });
    expect(res.status).toBe(400);
  });

});
