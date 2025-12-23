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

describe('setUserRoles', () => {
    it('delegates to userRepository.setUserRoles and returns result', async () => {
        userRepositoryMock.setUserRoles.mockResolvedValue([
            { userId: 1, office: { id: 1 }, role: { id: 1 } }
        ]);

        const res = await controller.setUserRoles(1, [{ roleId: 1 }]);

        expect(userRepositoryMock.setUserRoles)
            .toHaveBeenCalledWith(1, [{ roleId: 1 }]);
        expect(Array.isArray(res)).toBe(true);
        expect(res[0].userId).toBe(1);
    });

    it('propagates repository errors (rejects) from setUserRoles', async () => {
        const err = new Error('repo failure');
        userRepositoryMock.setUserRoles.mockRejectedValue(err);

        await expect(
            controller.setUserRoles(1, [{ roleId: 2 }])
        ).rejects.toThrow('repo failure');

        expect(userRepositoryMock.setUserRoles)
            .toHaveBeenCalledWith(1, [{ roleId: 2 }]);
    });

    it('accepts numeric shorthand and forwards it to repository', async () => {
        userRepositoryMock.setUserRoles.mockResolvedValue([
            { userId: 1, office: { id: 7 }, role: { id: 7 } }
        ]);

        const res = await controller.setUserRoles(1, [7, 8]);

        expect(userRepositoryMock.setUserRoles)
            .toHaveBeenCalledWith(1, [7, 8]);
        expect(Array.isArray(res)).toBe(true);
    });
});
