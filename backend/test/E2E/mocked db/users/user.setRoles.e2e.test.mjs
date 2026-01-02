import {describe, it, expect, beforeAll, afterAll, beforeEach} from '@jest/globals';
import {setupEmailUtilsMock} from "../../../mocks/common.mocks.js";
import {cleanupUsers, setupUsers} from "./users.setup.js";
import {standardSetup, standardTeardown} from "../../utils/standard.setup.js";
import {createAdminAndLogin, createStaffUser, getTwoRoles} from "../../helpers/user.helpers.js";

await setupEmailUtilsMock()

let agent, app, dataSource, userRepository, userService, rolesRepository;

describe('E2E: setUserRoles story (multiple roles + cancellation)', () => {
  const testUsernames = [];

  beforeAll(async () => {
    const setup = await standardSetup();
    app = setup.app;
    dataSource = setup.dataSource;

    const userSetup = await setupUsers();
    userRepository = userSetup.userRepository;
    userService = userSetup.userService;
    rolesRepository = userSetup.rolesRepository;
  }, 30000);

  beforeEach(async () => {
    agent = await createAdminAndLogin({app, testUsernames, userService, userRepository})
  })

  afterAll(async () => {
    await cleanupUsers(dataSource, userRepository, testUsernames);
    await standardTeardown(dataSource)
  });

  it('assigns multiple roles to a staff user as ADMIN and persists them', async () => {
    const staff = await createStaffUser({testUsernames, userService, userRepository});
    const [r1, r2] = await getTwoRoles(rolesRepository);

    const res = await agent
        .put(`/api/v1/sessions/${staff.id}/roles`)
        .send({ roles: [{ roleId: r1.id }, { roleId: r2.id }] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const persisted = await userRepository.getUserRoles(staff.id);
    const ids = persisted.map(u => u.role?.id || u.roleId).sort();

    expect(ids).toEqual([r1.id, r2.id].sort());
  });

  it('cancels all roles when ADMIN sends empty array', async () => {
    const staff = await createStaffUser({testUsernames, userService, userRepository});
    const [r1, r2] = await getTwoRoles(rolesRepository);

    await agent
        .patch(`/api/v1/sessions/${staff.id}/role`)
        .send({ roleId: r1.id });

    const res = await agent
        .put(`/api/v1/sessions/${staff.id}/roles`)
        .send({ roles: [] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);

    const persisted = await userRepository.getUserRoles(staff.id);
    expect(persisted).toHaveLength(0);
  });

  it('accepts numeric shorthand roleIds array', async () => {
    const staff = await createStaffUser({testUsernames, userService, userRepository});
    const [r1, r2] = await getTwoRoles(rolesRepository);

    const res = await agent
        .put(`/api/v1/sessions/${staff.id}/roles`)
        .send({ roleIds: [r1.id, r2.id] });

    expect(res.status).toBe(200);

    const persisted = await userRepository.getUserRoles(staff.id);
    const ids = persisted.map(u => u.role?.id || u.roleId).sort();

    expect(ids).toEqual([r1.id, r2.id].sort());
  });

  it('returns 400 for invalid payload', async () => {
    const staff = await createStaffUser({testUsernames, userService, userRepository});

    const res = await agent
        .put(`/api/v1/sessions/${staff.id}/roles`)
        .send({ roles: 'not-an-array' });

    expect(res.status).toBe(400);
  });

  it('is idempotent when sending same roles twice', async () => {
    const staff = await createStaffUser({testUsernames, userService, userRepository});
    const [r1, r2] = await getTwoRoles(rolesRepository);

    await agent
        .put(`/api/v1/sessions/${staff.id}/roles`)
        .send({ roles: [{ roleId: r1.id }, { roleId: r2.id }] });

    await agent
        .put(`/api/v1/sessions/${staff.id}/roles`)
        .send({ roles: [{ roleId: r1.id }, { roleId: r2.id }] });

    const persisted = await userRepository.getUserRoles(staff.id);
    expect(persisted).toHaveLength(2);
  });
});
