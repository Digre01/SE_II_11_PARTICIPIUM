import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

let app;
let dataSource;
let seedDatabase;
let userRepository;
let userService;

describe('E2E: userRoutes assign role', () => {
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
    const signUpRes = await agent
      .post('/api/v1/sessions/signup')
      .send({
        username: `cit_${rnd}`,
        email: `cit_${rnd}@example.com`,
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
    await userRepository.createUser(
      adminUsername,
      `${adminUsername}@example.com`,
      'Admin',
      'E2E',
      hashed,
      salt,
      'admin'
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
      staff = await userRepository.createUser(
        uname,
        `${uname}@example.com`,
        'Staff',
        'E2E',
        hashS,
        saltS,
        'STAFF'
      );
    }

    // Assign roleId=1 and officeId=1 (from seed)
    const res = await agent
      .patch(`/api/v1/sessions/${staff.id}/role`)
      .send({ roleId: 1, officeId: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      userId: staff.id,
      roleId: 1,
      officeId: 1,
      role: expect.any(Object),
      office: expect.any(Object)
    });
  }, 30000);
});
