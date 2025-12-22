import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import {
    userRepositoryMock,
    rolesRepositoryMock,
    officeRepositoryMock,
    userServiceMock,
    mapUserToDTO
} from './user.controller.mock.js';

let controller;
beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('assignRole', () => {
    it('single', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({
            userId: 1,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' }
        });
        const result = await controller.assignRole(1, 3, false);
        expect(result).toEqual({
            userId: 1,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' }
        });
    });

    it('single with isExternal true', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({
            userId: 1,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' }
        });
        const result = await controller.assignRole(1, 3, true);
        expect(result).toEqual({
            userId: 1,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' }
        });
    });

    it('with roleId undefined', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({ userId: 1 });
        const result = await controller.assignRole(1, undefined, false);
        expect(result).toEqual({
            userId: 1,
            officeId: null,
            roleId: null,
            role: null,
            office: null
        });
    });

    it('with roleId null', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({ userId: 1 });
        const result = await controller.assignRole(1, null, false);
        expect(result).toEqual({
            userId: 1,
            officeId: null,
            roleId: null,
            role: null,
            office: null
        });
    });

    it('array with isExternal true and length 1', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({
            userId: 1,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' }
        });
        const result = await controller.assignRole(1, [3], true);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
    });

    it('array', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({
            userId: 1,
            officeId: 2,
            roleId: 3,
            role: { id: 3, name: 'Manager' },
            office: { id: 2, name: 'Municipality Office' }
        });
        const result = await controller.assignRole(1, [3,4], false);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });

    it('throws if isExternal and array > 1', async () => {
        await expect(controller.assignRole(1, [3,4], true))
            .rejects.toThrow('An external maintainer can only have one role');
    });

    it('array with empty array returns empty', async () => {
        const result = await controller.assignRole(1, [], false);
        expect(result).toEqual([]);
    });

    it('with null office/role', async () => {
        userRepositoryMock.assignRoleToUser.mockResolvedValue({ userId: 1 });
        const result = await controller.assignRole(1, 3, false);
        expect(result).toEqual({
            userId: 1,
            officeId: null,
            roleId: null,
            role: null,
            office: null
        });
    });
});

describe('setUserRoles', () => {
    it('delegates to userRepository.setUserRoles and returns result', async () => {
        userRepositoryMock.setUserRoles.mockResolvedValue([
            { userId: 1, office: { id: 1 }, role: { id: 1 } }
        ]);

        const res = await controller.setUserRoles(1, [{ roleId: 1 }]);

        expect(userRepositoryMock.setUserRoles).toHaveBeenCalledWith(1, [{ roleId: 1 }]);
        expect(Array.isArray(res)).toBe(true);
        expect(res[0].userId).toBe(1);
    });

    it('propagates repository errors (rejects) from setUserRoles', async () => {
        const err = new Error('repo failure');
        userRepositoryMock.setUserRoles.mockRejectedValue(err);

        await expect(controller.setUserRoles(1, [{ roleId: 2 }]))
            .rejects.toThrow('repo failure');
        expect(userRepositoryMock.setUserRoles).toHaveBeenCalledWith(1, [{ roleId: 2 }]);
    });

    it('accepts numeric shorthand and normalizes to objects before delegating', async () => {
        userRepositoryMock.setUserRoles.mockResolvedValue([
            { userId: 1, office: { id: 7 }, role: { id: 7 } }
        ]);

        const res = await controller.setUserRoles(1, [7, 8]);

        expect(userRepositoryMock.setUserRoles).toHaveBeenCalledWith(1, [7, 8]);
        expect(Array.isArray(res)).toBe(true);
    });
});