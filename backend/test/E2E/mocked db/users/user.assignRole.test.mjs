import {describe, it, expect, beforeAll, afterAll, beforeEach} from '@jest/globals';
import request from 'supertest';
import {cleanupUsers, setupUsers} from "./users.setup.js";
import {standardSetup, standardTeardown} from "../../utils/standard.setup.js";
import {createAdminAndLogin, getOrCreateStaff} from "../../helpers/user.helpers.js";


describe('E2E: userRoutes assign role', () => {

  let app, dataSource, userRepository, userService;
  const testUsernames = [];

  beforeAll(async () => {
    const setup = await standardSetup();
    app = setup.app;
    dataSource = setup.dataSource;

    const userSetup = await setupUsers();
    userRepository = userSetup.userRepository;
    userService = userSetup.userService;
  }, 30000);

  afterAll(async () => {
    await cleanupUsers(dataSource, userRepository, testUsernames);
    await standardTeardown(dataSource);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
        .patch('/api/v1/sessions/5/role')
        .send({ roleId: 1, officeId: 1 });

    expect(res.status).toBe(401);
    expect(typeof (res.body.error ?? res.body.message)).toBe('string');
  });

  it('returns 403 when authenticated as citizen', async () => {
    const agent = request.agent(app);
    const username = `cit_${Math.random().toString(36).slice(2, 8)}`;
    testUsernames.push(username);

    const signupRes = await agent
        .post('/api/v1/sessions/signup')
        .send({
          username,
          email: `${username}@example.com`,
          name: 'Test',
          surname: 'Citizen',
          password: 'password123',
          userType: 'citizen'
        });

    expect([200, 201]).toContain(signupRes.status);

    const res = await agent
        .patch('/api/v1/sessions/5/role')
        .send({ roleId: 1, officeId: 1 });

    expect(res.status).toBe(403);
    expect(typeof (res.body.error ?? res.body.message)).toBe('string');
  });

  it('updates a staff role when authenticated as admin', async () => {
    const agent = await createAdminAndLogin({
      app,
      userService,
      userRepository,
      testUsernames
    });

    const staff = await getOrCreateStaff({
      userService,
      userRepository,
      testUsernames
    });

    const res = await agent
        .patch(`/api/v1/sessions/${staff.id}/role`)
        .send({ roleId: 1, officeId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.userId ?? res.body.user?.id).toBe(staff.id);
    expect(res.body.roleId ?? res.body.user?.roleId).toBe(1);
    expect(res.body.officeId ?? res.body.user?.officeId).toBe(1);
    expect(res.body.role ?? res.body.user?.role).toEqual(expect.any(Object));
    expect(res.body.office ?? res.body.user?.office).toEqual(expect.any(Object));

    const userOfficeRepo = dataSource.getRepository('UserOffice');
    await userOfficeRepo.delete({ userId: staff.id });
  }, 30000);
});

