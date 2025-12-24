import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import {setupEmailUtilsMock} from "../integration/mocks/common.mocks.js";

await setupEmailUtilsMock()

let app;
let dataSource;
let seedDatabase;
let userRepository;
let userService;

describe('E2E: userRoutes assign role', () => {
  // Keep track of test users to cleanup
  const testUsernames = [];

  beforeAll(async () => {
    const data = await import('../../config/data-source.js');
    dataSource = data.AppDataSourcePostgres;
    const seeder = await import('../../database/seeder.js');
    seedDatabase = seeder.seedDatabase;
    const repoMod = await import('../../repositories/userRepository.js');
    userRepository = repoMod.userRepository;
    userService = (await import('../../services/userService.js')).default;
    app = (await import('../../app.js')).default;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await seedDatabase();
  }, 30000);

  afterAll(async () => {
    // Cleanup test users and related UserOffice rows
    for (const username of testUsernames) {
      const user = await userRepository.getUserByUsername(username);
      if (user) {
        // Delete UserOffice row if exists
        const userOfficeRepo = dataSource.getRepository('UserOffice');
        await userOfficeRepo.delete({ userId: user.id });
        // Delete user
        await userRepository.repo.delete({ id: user.id });
      }
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .patch('/api/v1/sessions/5/role')
      .send({ roleId: 1, officeId: 1 });
    expect(res.status).toBe(401);
    // Accept either { error: message } or { message }
    expect(typeof (res.body.error ?? res.body.message)).toBe('string');
  });

  it('returns 403 when authenticated as citizen', async () => {
    const agent = request.agent(app);
    const rnd = Math.random().toString(36).slice(2, 8);
    const citizenUsername = `cit_${rnd}`;
    testUsernames.push(citizenUsername);
    const signUpRes = await agent
      .post('/api/v1/sessions/signup')
      .send({
        username: citizenUsername,
        email: `${citizenUsername}@example.com`,
        name: 'Test',
        surname: 'Citizen',
        password: 'password123',
        userType: 'citizen'
      });
    expect([200,201]).toContain(signUpRes.status);

    const res = await agent
      .patch('/api/v1/sessions/5/role')
      .send({ roleId: 1, officeId: 1 });
    expect(res.status).toBe(403);
    expect(typeof (res.body.error ?? res.body.message)).toBe('string');
  });

  it('updates a staff role when authenticated as admin', async () => {
    // Create a test admin directly in DB so we know the password
    const salt = 'e2e_fixed_salt_123456';
    const password = 'Admin#12345';
    const hashed = await userService.hashPassword(password, salt);
    const adminUsername = `admin_e2e_${Math.random().toString(36).slice(2,6)}`;
    testUsernames.push(adminUsername);
    await userRepository.createUser(
      adminUsername,
      `${adminUsername}@example.com`,
      'Admin',
      'E2E',
      hashed,
      salt,
      'ADMIN',
      true,
      null,
      null
    );

    const agent = request.agent(app);
    // login as the created admin
    const loginRes = await agent
      .post('/api/v1/sessions/login')
      .send({ username: adminUsername, password });
    expect([200,201]).toContain(loginRes.status);

    // Find a staff user from seed
    let staff = await userRepository.getUserByUsername('staff1');
    if (!staff) {
      // create a staff user if seed didn't include one
      const saltS = 'e2e_staff_salt';
      const passS = 'Staff#12345';
      const hashS = await userService.hashPassword(passS, saltS);
      const uname = `staff_e2e_${Math.random().toString(36).slice(2,6)}`;
      testUsernames.push(uname);
      staff = await userRepository.createUser(
        uname,
        `${uname}@example.com`,
        'Staff',
        'E2E',
        hashS,
        saltS,
        'STAFF',
        true,
        null,
        null
      );
    }

    // Assign roleId=1 and officeId=1 (from seed)
    const res = await agent
      .patch(`/api/v1/sessions/${staff.id}/role`)
      .send({ roleId: 1, officeId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.userId ?? res.body.user?.userId ?? res.body.user?.id).toBe(staff.id);
    expect(res.body.roleId ?? res.body.user?.roleId).toBe(1);
    expect(res.body.officeId ?? res.body.user?.officeId).toBe(1);
    expect(res.body.role ?? res.body.user?.role).toEqual(expect.any(Object));
    expect(res.body.office ?? res.body.user?.office).toEqual(expect.any(Object));
      // Cleanup UserOffice row
      const userOfficeRepo = dataSource.getRepository('UserOffice');
      await userOfficeRepo.delete({ userId: staff.id });
  }, 30000);

  // Config account & pfp flow
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
});
