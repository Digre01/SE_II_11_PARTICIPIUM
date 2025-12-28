import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { mockUserRepo } from "../../../mocks/repositories/users.repo.mock.js";
import {setupEmailUtilsMock} from "../../../mocks/common.mocks.js";

let controller;
await setupEmailUtilsMock()

beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo.setUserRoles.mockResolvedValue([
        { userId: 1, office: { id: 1 }, role: { id: 1 } }
    ]);
});

describe('setUserRoles', () => {
    it('delegates to userRepository.setUserRoles and returns result', async () => {
        const res = await controller.setUserRoles(1, [{ roleId: 1 }]);

        expect(mockUserRepo.setUserRoles).toHaveBeenCalledWith(1, [{ roleId: 1 }]);
        expect(Array.isArray(res)).toBe(true);
        expect(res[0].userId).toBe(1);
    });

    it('propagates repository errors (rejects) from setUserRoles', async () => {
        const err = new Error('repo failure');
        mockUserRepo.setUserRoles.mockRejectedValueOnce(err);

        await expect(controller.setUserRoles(1, [{ roleId: 2 }]))
            .rejects.toThrow('repo failure');

        expect(mockUserRepo.setUserRoles).toHaveBeenCalledWith(1, [{ roleId: 2 }]);
    });

    it('accepts numeric shorthand and forwards it to repository', async () => {
        mockUserRepo.setUserRoles.mockResolvedValueOnce([
            { userId: 1, office: { id: 7 }, role: { id: 7 } }
        ]);

        const res = await controller.setUserRoles(1, [7, 8]);

        expect(mockUserRepo.setUserRoles).toHaveBeenCalledWith(1, [7, 8]);
        expect(Array.isArray(res)).toBe(true);
    });
});
