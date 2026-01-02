import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { mockUserRepo } from "../../../mocks/repositories/users.repo.mock.js";
import {mapUserToDTO, userServiceMock} from "../../../mocks/services.mocks.js";
import {setupEmailUtilsMock} from "../../../mocks/common.mocks.js";

await setupEmailUtilsMock()
let controller;

beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo.getUserByEmail.mockResolvedValue(undefined);
    mockUserRepo.getUserByUsername.mockResolvedValue(undefined);
    mockUserRepo.createUser.mockResolvedValue('user');
    mockUserRepo.configUserAccount.mockResolvedValue(undefined);
    mockUserRepo.getAvailableStaffForRoleAssignment.mockResolvedValue([]);
    userServiceMock.hashPassword.mockResolvedValue('hashed');
    mapUserToDTO.mockReturnValue('dto');
});

describe('getUserByUsernameOrEmail', () => {
    it('uses email', async () => {
        mockUserRepo.getUserByEmail.mockResolvedValue('user-email');
        const result = await controller.getUserByUsernameOrEmail('foo@bar.com');
        expect(result).toBe('user-email');
    });

    it('uses username', async () => {
        mockUserRepo.getUserByUsername.mockResolvedValue('user-username');
        const result = await controller.getUserByUsernameOrEmail('foobar');
        expect(result).toBe('user-username');
    });

    it('returns undefined if not found', async () => {
        const emailResult = await controller.getUserByUsernameOrEmail('foo@bar.com');
        const usernameResult = await controller.getUserByUsernameOrEmail('foobar');
        expect(emailResult).toBeUndefined();
        expect(usernameResult).toBeUndefined();
    });
});

describe('createUser', () => {
    it('success', async () => {
        const result = await controller.createUser({
            username: 'u',
            email: 'e',
            name: 'n',
            surname: 's',
            password: 'p',
            userType: 'STAFF'
        });
        expect(result).toBe('dto');
    });

    it('handles missing userType', async () => {
        const result = await controller.createUser({
            username: 'u',
            email: 'e',
            name: 'n',
            surname: 's',
            password: 'p'
        });
        expect(result).toBe('dto');
    });
});

describe('configAccount', () => {
    it('returns user', async () => {
        mockUserRepo.configUserAccount.mockResolvedValue('user');
        const result = await controller.configAccount(1, 'tg', true, 'url');
        expect(result).toBe('user');
    });

    it('returns undefined if user not found', async () => {
        const result = await controller.configAccount(1, 'tg', true, 'url');
        expect(result).toBeUndefined();
    });
});

describe('getAvailableStaffForRoleAssignment', () => {
    it('returns staff', async () => {
        mockUserRepo.getAvailableStaffForRoleAssignment.mockResolvedValue(['staff']);
        const result = await controller.getAvailableStaffForRoleAssignment();
        expect(result).toEqual(['staff']);
    });
});
