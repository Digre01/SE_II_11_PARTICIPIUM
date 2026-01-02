import {expect} from "@jest/globals";
import request from "supertest";

export async function createAdminAndLogin({app, testUsernames, userService, userRepository}) {
    const salt = `e2e_admin_salt_${Math.random()}`;
    const password = 'Admin#e2e!';
    const hashed = await userService.hashPassword(password, salt);
    const username = `admin_e2e_${Math.random().toString(36).slice(2, 6)}`;

    testUsernames.push(username);

    await userRepository.createUser(
        username,
        `${username}@example.com`,
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
    const res = await agent
        .post('/api/v1/sessions/login')
        .send({ username, password });

    expect([200, 201]).toContain(res.status);

    return agent
}

export async function createStaffUser({testUsernames, userService, userRepository}) {
    const salt = `e2e_staff_salt_${Math.random()}`;
    const password = 'Staff#e2e!';
    const hashed = await userService.hashPassword(password, salt);
    const username = `staff_e2e_${Math.random().toString(36).slice(2, 6)}`;

    testUsernames.push(username);

    return userRepository.createUser(
        username,
        `${username}@example.com`,
        'Staff',
        'E2E',
        hashed,
        salt,
        'STAFF',
        true,
        null,
        null
    );
}

export async function getTwoRoles(rolesRepository) {
    const roles = await rolesRepository.findAll();
    expect(roles.length).toBeGreaterThanOrEqual(2);
    return [roles[0], roles[1]];
}

export async function getOrCreateStaff({
    userService,
    userRepository,
    testUsernames
    }) {
    let staff = await userRepository.getUserByUsername('staff1');
    if (staff) return staff;

    const salt = `e2e_staff_${Math.random()}`;
    const password = 'Staff#12345';
    const username = `staff_e2e_${Math.random().toString(36).slice(2, 6)}`;

    const hashed = await userService.hashPassword(password, salt);
    testUsernames.push(username);

    return userRepository.createUser(
        username,
        `${username}@example.com`,
        'Staff',
        'E2E',
        hashed,
        salt,
        'STAFF',
        true,
        null,
        null
    );
}