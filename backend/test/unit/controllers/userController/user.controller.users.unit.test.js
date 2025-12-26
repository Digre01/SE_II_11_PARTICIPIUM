import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import {
    mapUserToDTO,
    userRepositoryMock, userServiceMock
} from './user.controller.mock.js';

let controller;
beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getUserByUsernameOrEmail', () => {
    it('uses email', async () => {
        userRepositoryMock.getUserByEmail.mockResolvedValue('user-email');
        const result = await controller.getUserByUsernameOrEmail('foo@bar.com');
        expect(result).toBe('user-email');
    });

    it('uses username', async () => {
        userRepositoryMock.getUserByUsername.mockResolvedValue('user-username');
        const result = await controller.getUserByUsernameOrEmail('foobar');
        expect(result).toBe('user-username');
    });

    it('returns undefined if not found', async () => {
        userRepositoryMock.getUserByEmail.mockResolvedValue(undefined);
        userRepositoryMock.getUserByUsername.mockResolvedValue(undefined);
        expect(await controller.getUserByUsernameOrEmail('foo@bar.com')).toBeUndefined();
        expect(await controller.getUserByUsernameOrEmail('foobar')).toBeUndefined();
    });
});

describe('createUser', () => {
    it('success', async () => {
        userServiceMock.hashPassword.mockResolvedValue('hashed');
        userRepositoryMock.createUser.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
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
        userServiceMock.hashPassword.mockResolvedValue('hashed');
        userRepositoryMock.createUser.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
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
        userRepositoryMock.configUserAccount.mockResolvedValue('user');
        const result = await controller.configAccount(1, 'tg', true, 'url');
        expect(result).toBe('user');
    });

    it('returns undefined if user not found', async () => {
        userRepositoryMock.configUserAccount.mockResolvedValue(undefined);
        const result = await controller.configAccount(1, 'tg', true, 'url');
        expect(result).toBeUndefined();
    });
});

describe('getAvailableStaffForRoleAssignment', () => {
    it('returns staff', async () => {
        userRepositoryMock.getAvailableStaffForRoleAssignment.mockResolvedValue(['staff']);
        const result = await controller.getAvailableStaffForRoleAssignment();
        expect(result).toEqual(['staff']);
    });
});