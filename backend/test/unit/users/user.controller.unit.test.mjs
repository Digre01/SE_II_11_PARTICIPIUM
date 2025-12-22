import {describe, it, expect, beforeEach, jest} from '@jest/globals';

const userRepository = {
    getUserByEmail: jest.fn(),
    getUserByUsername: jest.fn(),
    getAvailableStaffForRoleAssignment: jest.fn(),
    createUser: jest.fn(),
    saveEmailVerificationCode: jest.fn(),
    getEmailVerification: jest.fn(),
    markEmailVerified: jest.fn(),
    getUserById: jest.fn(),
    assignRoleToUser: jest.fn(),
    configUserAccount: jest.fn(),
    getPfpUrl: jest.fn(),
    deleteUser: jest.fn(),
};
const rolesRepository = { findAll: jest.fn() };
const officeRepository = { findAll: jest.fn() };
const userService = { hashPassword: jest.fn() };
const mapUserToDTO = jest.fn();

jest.unstable_mockModule('../../repositories/userRepository.js', () => ({ userRepository }));
jest.unstable_mockModule('../../repositories/rolesRepository.js', () => ({ rolesRepository }));
jest.unstable_mockModule('../../repositories/officeRepository.js', () => ({ officeRepository }));
jest.unstable_mockModule('../../services/userService.js', () => ({ default: userService }));
jest.unstable_mockModule('../../mappers/userMappers.js', () => ({ mapUserToDTO }));

let controller;
beforeAll(async () => {
    controller = (await import('../../../controllers/userController.js')).default;
});

describe('userController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getUserByUsernameOrEmail uses email', async () => {
        userRepository.getUserByEmail.mockResolvedValue('user-email');
        const result = await controller.getUserByUsernameOrEmail('foo@bar.com');
        expect(result).toBe('user-email');
    });
    it('getUserByUsernameOrEmail uses username', async () => {
        userRepository.getUserByUsername.mockResolvedValue('user-username');
        const result = await controller.getUserByUsernameOrEmail('foobar');
        expect(result).toBe('user-username');
    });
        it('getUserByUsernameOrEmail returns undefined if not found', async () => {
            userRepository.getUserByEmail.mockResolvedValue(undefined);
            userRepository.getUserByUsername.mockResolvedValue(undefined);
            expect(await controller.getUserByUsernameOrEmail('foo@bar.com')).toBeUndefined();
            expect(await controller.getUserByUsernameOrEmail('foobar')).toBeUndefined();
        });
    it('getAvailableStaffForRoleAssignment returns staff', async () => {
        userRepository.getAvailableStaffForRoleAssignment.mockResolvedValue(['staff']);
        const result = await controller.getAvailableStaffForRoleAssignment();
        expect(result).toEqual(['staff']);
    });
    it('getAllRoles returns roles', async () => {
        rolesRepository.findAll.mockResolvedValue(['role']);
        const result = await controller.getAllRoles();
        expect(result).toEqual(['role']);
    });
    it('getAllOffices returns offices', async () => {
        officeRepository.findAll.mockResolvedValue(['office']);
        const result = await controller.getAllOffices();
        expect(result).toEqual(['office']);
    });
    it('createUser success', async () => {
        userService.hashPassword.mockResolvedValue('hashed');
        userRepository.createUser.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
        const result = await controller.createUser({ username: 'u', email: 'e', name: 'n', surname: 's', password: 'p', userType: 'STAFF' });
        expect(result).toBe('dto');
    });
        it('createUser handles missing userType', async () => {
            userService.hashPassword.mockResolvedValue('hashed');
            userRepository.createUser.mockResolvedValue('user');
            mapUserToDTO.mockReturnValue('dto');
            const result = await controller.createUser({ username: 'u', email: 'e', name: 'n', surname: 's', password: 'p' });
            expect(result).toBe('dto');
        });
    it('createEmailVerification saves code and returns', async () => {
        userRepository.saveEmailVerificationCode.mockResolvedValue();
        const result = await controller.createEmailVerification(1);
        expect(result.code).toMatch(/\d{6}/);
        expect(result.expiresAt).toBeInstanceOf(Date);
    });
    it('verifyEmail success', async () => {
        userRepository.getEmailVerification.mockResolvedValue({ code: '123456', expiresAt: Date.now() + 10000 });
        userRepository.markEmailVerified.mockResolvedValue();
        userRepository.getUserById.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
        const result = await controller.verifyEmail(1, '123456');
        expect(result).toBe('dto');
    });
    it('verifyEmail throws if code wrong', async () => {
        userRepository.getEmailVerification.mockResolvedValue({ code: '654321', expiresAt: Date.now() + 10000 });
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Invalid verification code');
    });
    it('verifyEmail throws if expired', async () => {
        userRepository.getEmailVerification.mockResolvedValue({ code: '123456', expiresAt: Date.now() - 10000 });
        userRepository.deleteUser.mockResolvedValue();
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Verification code expired');
    });
    it('verifyEmail throws if record missing', async () => {
        userRepository.getEmailVerification.mockResolvedValue(null);
        await expect(controller.verifyEmail(1, '123456')).rejects.toThrow('Verification not found');
    });
        it('verifyEmail handles missing expiresAt', async () => {
            userRepository.getEmailVerification.mockResolvedValue({ code: '123456' });
            userRepository.markEmailVerified.mockResolvedValue();
            userRepository.getUserById.mockResolvedValue('user');
            mapUserToDTO.mockReturnValue('dto');
            const result = await controller.verifyEmail(1, '123456');
            expect(result).toBe('dto');
        });
    it('isEmailVerified returns true', async () => {
        userRepository.getUserById.mockResolvedValue({ isVerified: true });
        const result = await controller.isEmailVerified(1);
        expect(result).toEqual({ isVerified: true });
    });
    it('isEmailVerified throws if user not found', async () => {
        userRepository.getUserById.mockResolvedValue(null);
        await expect(controller.isEmailVerified(1)).rejects.toThrow('User not found');
    });
        it('isEmailVerified returns false if not verified', async () => {
            userRepository.getUserById.mockResolvedValue({ isVerified: false });
            const result = await controller.isEmailVerified(1);
            expect(result).toEqual({ isVerified: false });
        });
    it('markEmailVerified returns DTO', async () => {
        userRepository.markEmailVerified.mockResolvedValue();
        userRepository.getUserById.mockResolvedValue('user');
        mapUserToDTO.mockReturnValue('dto');
        const result = await controller.markEmailVerified(1);
        expect(result).toBe('dto');
    });
    it('assignRole single', async () => {
        userRepository.assignRoleToUser.mockResolvedValue({ userId: 1, officeId: 2, roleId: 3, role: { id: 3, name: 'Manager' }, office: { id: 2, name: 'Municipality Office' } });
        const result = await controller.assignRole(1, 3, false);
        expect(result).toEqual({ userId: 1, officeId: 2, roleId: 3, role: { id: 3, name: 'Manager' }, office: { id: 2, name: 'Municipality Office' } });
    });
        it('assignRole single with isExternal true', async () => {
            userRepository.assignRoleToUser.mockResolvedValue({ userId: 1, officeId: 2, roleId: 3, role: { id: 3, name: 'Manager' }, office: { id: 2, name: 'Municipality Office' } });
            const result = await controller.assignRole(1, 3, true);
            expect(result).toEqual({ userId: 1, officeId: 2, roleId: 3, role: { id: 3, name: 'Manager' }, office: { id: 2, name: 'Municipality Office' } });
        });
        it('assignRole with roleId undefined', async () => {
            userRepository.assignRoleToUser.mockResolvedValue({ userId: 1 });
            const result = await controller.assignRole(1, undefined, false);
            expect(result).toEqual({ userId: 1, officeId: null, roleId: null, role: null, office: null });
        });
        it('assignRole with roleId null', async () => {
            userRepository.assignRoleToUser.mockResolvedValue({ userId: 1 });
            const result = await controller.assignRole(1, null, false);
            expect(result).toEqual({ userId: 1, officeId: null, roleId: null, role: null, office: null });
        });
        it('assignRole array with isExternal true and length 1', async () => {
            userRepository.assignRoleToUser.mockResolvedValue({ userId: 1, officeId: 2, roleId: 3, role: { id: 3, name: 'Manager' }, office: { id: 2, name: 'Municipality Office' } });
            const result = await controller.assignRole(1, [3], true);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(1);
        });
    it('assignRole array', async () => {
        userRepository.assignRoleToUser.mockResolvedValue({ userId: 1, officeId: 2, roleId: 3, role: { id: 3, name: 'Manager' }, office: { id: 2, name: 'Municipality Office' } });
        const result = await controller.assignRole(1, [3,4], false);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });
    it('assignRole throws if isExternal and array > 1', async () => {
        await expect(controller.assignRole(1, [3,4], true)).rejects.toThrow('An external maintainer can only have one role');
    });
        it('assignRole array with empty array returns empty', async () => {
            const result = await controller.assignRole(1, [], false);
            expect(result).toEqual([]);
        });
        it('assignRole with null office/role', async () => {
            userRepository.assignRoleToUser.mockResolvedValue({ userId: 1 });
            const result = await controller.assignRole(1, 3, false);
            expect(result).toEqual({ userId: 1, officeId: null, roleId: null, role: null, office: null });
        });
    it('configAccount returns user', async () => {
        userRepository.configUserAccount.mockResolvedValue('user');
        const result = await controller.configAccount(1, 'tg', true, 'url');
        expect(result).toBe('user');
    });
        it('configAccount returns undefined if user not found', async () => {
            userRepository.configUserAccount.mockResolvedValue(undefined);
            const result = await controller.configAccount(1, 'tg', true, 'url');
            expect(result).toBeUndefined();
        });
    it('getPfpUrl returns url', async () => {
        userRepository.getPfpUrl.mockResolvedValue('url');
        const result = await controller.getPfpUrl(1);
        expect(result).toBe('url');
    });
        it('getPfpUrl returns undefined if not found', async () => {
            userRepository.getPfpUrl.mockResolvedValue(undefined);
            const result = await controller.getPfpUrl(1);
            expect(result).toBeUndefined();
        });
});
