import {describe, it, expect, beforeEach, jest, beforeAll} from '@jest/globals';
import {
    rolesRepositoryMock,
    officeRepositoryMock, userRepositoryMock
} from './user.controller.mock.js';

let controller;
beforeAll(async () => {
    controller = (await import('../../../../controllers/userController.js')).default;
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getAllRoles', () => {
    it('returns roles', async () => {
        rolesRepositoryMock.findAll.mockResolvedValue(['role']);
        const result = await controller.getAllRoles();
        expect(result).toEqual(['role']);
    });
});

describe('getAllOffices', () => {
    it('returns offices', async () => {
        officeRepositoryMock.findAll.mockResolvedValue(['office']);
        const result = await controller.getAllOffices();
        expect(result).toEqual(['office']);
    });
});

describe('getPfpUrl', () => {
    it('returns url', async () => {
        userRepositoryMock.getPfpUrl.mockResolvedValue('url');
        const result = await controller.getPfpUrl(1);
        expect(result).toBe('url');
    });

    it('returns undefined if not found', async () => {
        userRepositoryMock.getPfpUrl.mockResolvedValue(undefined);
        const result = await controller.getPfpUrl(1);
        expect(result).toBeUndefined();
    });
});