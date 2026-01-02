import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import {mockRoleRepo} from "../../../mocks/repositories/roles.repo.mock.js";
import {mockOfficeRepo} from "../../../mocks/repositories/office.repo.mock.js";
import {mockUserRepo} from "../../../mocks/repositories/users.repo.mock.js";
import {setupEmailUtilsMock} from "../../../mocks/common.mocks.js";

await setupEmailUtilsMock()

let controller;
beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getAllRoles', () => {
    it('returns roles', async () => {
        mockRoleRepo.findAll.mockResolvedValue(['role']);
        const result = await controller.getAllRoles();
        expect(result).toEqual(['role']);
    });
});

describe('getAllOffices', () => {
    it('returns offices', async () => {
        mockOfficeRepo.findAll.mockResolvedValue(['office']);
        const result = await controller.getAllOffices();
        expect(result).toEqual(['office']);
    });
});

describe('getPfpUrl', () => {
    it('returns url', async () => {
        mockUserRepo.getPfpUrl.mockResolvedValue('url');
        const result = await controller.getPfpUrl(1);
        expect(result).toBe('url');
    });

    it('returns undefined if not found', async () => {
        mockUserRepo.getPfpUrl.mockResolvedValue(undefined);
        const result = await controller.getPfpUrl(1);
        expect(result).toBeUndefined();
    });
});