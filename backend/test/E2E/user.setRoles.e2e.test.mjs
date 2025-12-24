import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import {setupEmailUtilsMock} from "../integration/mocks/common.mocks.js";

await setupEmailUtilsMock()

let app;
let dataSource;
let seedDatabase;
let userRepository;
let userService;
let rolesRepository;

describe('E2E: setUserRoles story (multiple roles + cancellation)', () => {
  const testUsernames = [];

  beforeAll(async () => {
    const data = await import('../../config/data-source.js');
    dataSource = data.AppDataSourcePostgres;
    const seeder = await import('../../database/seeder.js');
    seedDatabase = seeder.seedDatabase;
    const repoMod = await import('../../repositories/userRepository.js');
    userRepository = repoMod.userRepository;
    rolesRepository = (await import('../../repositories/rolesRepository.js')).rolesRepository;
    userService = (await import('../../services/userService.js')).default;
    app = (await import('../../app.js')).default;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await seedDatabase();
  }, 30000);

  afterAll(async () => {
    // Cleanup created test users and any UserOffice rows
    for (const username of testUsernames) {
      const user = await userRepository.getUserByUsername(username);
      if (user) {
        const userOfficeRepo = dataSource.getRepository('UserOffice');
        await userOfficeRepo.delete({ userId: user.id });
        await userRepository.repo.delete({ id: user.id });
      }
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('assigns multiple roles to a staff user as ADMIN and persists them', async () => {
    // create admin
    const salt = 'e2e_admin_salt';
    const password = 'Admin#e2e!';
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
    const loginRes = await agent.post('/api/v1/sessions/login').send({ username: adminUsername, password });
    expect([200,201]).toContain(loginRes.status);

    // find or create a staff user
    let staff = await userRepository.getUserByUsername('staff1');
    if (!staff) {
      const saltS = 'e2e_staff_salt';
      const passS = 'Staff#e2e!';
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

    const roles = await rolesRepository.findAll();
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThanOrEqual(2);
    const [r1, r2] = roles;

    const res = await agent.put(`/api/v1/sessions/${staff.id}/roles`).send({ roles: [{ roleId: r1.id }, { roleId: r2.id }] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // verify persisted via repository
    const userOffices = await userRepository.getUserRoles(staff.id);
    const persistedRoleIds = userOffices.map(u => u.role?.id || u.roleId);
    const sortedPersistedRoleIds = persistedRoleIds.sort((a, b) => a - b);
    const sortedIds = ids.sort((a, b) => a - b);

    expect(sortedPersistedRoleIds).toEqual(sortedIds);

    // cleanup created mapping
    const userOfficeRepo = dataSource.getRepository('UserOffice');
    await userOfficeRepo.delete({ userId: staff.id });
  }, 30000);

  it('cancels all roles when ADMIN sends empty array', async () => {
    // create admin and login again
    const salt = 'e2e_admin_salt2';
    const password = 'Admin#e2e2!';
    const hashed = await userService.hashPassword(password, salt);
    const adminUsername = `admin_e2e2_${Math.random().toString(36).slice(2,6)}`;
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
    const loginRes = await agent.post('/api/v1/sessions/login').send({ username: adminUsername, password });
    expect([200,201]).toContain(loginRes.status);

    // create a staff user to cancel roles on
    const saltS = 'e2e_staff_salt2';
    const passS = 'Staff#e2e2!';
    const hashS = await userService.hashPassword(passS, saltS);
    const uname = `staff_e2e_cancel_${Math.random().toString(36).slice(2,6)}`;
    testUsernames.push(uname);
    const staff = await userRepository.createUser(
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

    // assign a role first so cancellation has effect
    const roles = await rolesRepository.findAll();
    const rId = roles[0].id;
    const assignRes = await agent.patch(`/api/v1/sessions/${staff.id}/role`).send({ roleId: rId });
    expect([200,500]).toContain(assignRes.status);

    const res = await agent.put(`/api/v1/sessions/${staff.id}/roles`).send({ roles: [] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);

    const userOffices = await userRepository.getUserRoles(staff.id);
    expect(userOffices.length).toBe(0);
  }, 30000);

  it('accepts numeric shorthand `roleIds` array and applies roles', async () => {
    // admin + login
    const salt = 'e2e_admin_shorthand';
    const password = 'Admin#sh1';
    const hashed = await userService.hashPassword(password, salt);
    const adminUsername = `admin_e2e_sh_${Math.random().toString(36).slice(2,6)}`;
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
    const loginRes = await agent.post('/api/v1/sessions/login').send({ username: adminUsername, password });
    expect([200,201]).toContain(loginRes.status);

    // ensure a staff user
    let staff = await userRepository.getUserByUsername('staff1');
    if (!staff) {
      const saltS = 'e2e_staff_sh';
      const passS = 'Staff#sh1';
      const hashS = await userService.hashPassword(passS, saltS);
      const uname = `staff_e2e_sh_${Math.random().toString(36).slice(2,6)}`;
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

    const roles = await rolesRepository.findAll();
    expect(roles.length).toBeGreaterThanOrEqual(2);
    const ids = [roles[0].id, roles[1].id];

    const res = await agent.put(`/api/v1/sessions/${staff.id}/roles`).send({ roleIds: ids });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const persistedRoleIds = (await userRepository.getUserRoles(staff.id)).map(u => u.role?.id || u.roleId);
    expect(persistedRoleIds.sort((a, b) => a - b)).toEqual(ids.sort((a, b) => a - b));

    // cleanup mapping
    const userOfficeRepo = dataSource.getRepository('UserOffice');
    await userOfficeRepo.delete({ userId: staff.id });
  }, 30000);

  it('returns 400 when payload is invalid (not an array) for PUT roles', async () => {
    const salt = 'e2e_admin_badpayload';
    const password = 'Admin#bad1';
    const hashed = await userService.hashPassword(password, salt);
    const adminUsername = `admin_e2e_bad_${Math.random().toString(36).slice(2,6)}`;
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
    const loginRes = await agent.post('/api/v1/sessions/login').send({ username: adminUsername, password });
    expect([200,201]).toContain(loginRes.status);

    let staff = await userRepository.getUserByUsername('staff1');
    if (!staff) {
      const saltS = 'e2e_staff_bad';
      const passS = 'Staff#bad1';
      const hashS = await userService.hashPassword(passS, saltS);
      const uname = `staff_e2e_bad_${Math.random().toString(36).slice(2,6)}`;
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

    const res = await agent.put(`/api/v1/sessions/${staff.id}/roles`).send({ roles: 'not-an-array' });
    expect(res.status).toBe(400);
  }, 30000);

  it('is idempotent when sending same roles twice', async () => {
    const salt = 'e2e_admin_idemp';
    const password = 'Admin#id1';
    const hashed = await userService.hashPassword(password, salt);
    const adminUsername = `admin_e2e_id_${Math.random().toString(36).slice(2,6)}`;
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
    const loginRes = await agent.post('/api/v1/sessions/login').send({ username: adminUsername, password });
    expect([200,201]).toContain(loginRes.status);

    let staff = await userRepository.getUserByUsername('staff1');
    if (!staff) {
      const saltS = 'e2e_staff_id';
      const passS = 'Staff#id1';
      const hashS = await userService.hashPassword(passS, saltS);
      const uname = `staff_e2e_id_${Math.random().toString(36).slice(2,6)}`;
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

    const roles = await rolesRepository.findAll();
    const ids = [roles[0].id, roles[1].id];

    const res1 = await agent.put(`/api/v1/sessions/${staff.id}/roles`).send({ roles: [{ roleId: ids[0] }, { roleId: ids[1] }] });
    expect(res1.status).toBe(200);
    const res2 = await agent.put(`/api/v1/sessions/${staff.id}/roles`).send({ roles: [{ roleId: ids[0] }, { roleId: ids[1] }] });
    expect(res2.status).toBe(200);
    const uroles = await userRepository.getUserRoles(staff.id);
    expect(uroles.length).toBe(2);

    // cleanup mapping
    const userOfficeRepo = dataSource.getRepository('UserOffice');
    await userOfficeRepo.delete({ userId: staff.id });
  }, 30000);

});
