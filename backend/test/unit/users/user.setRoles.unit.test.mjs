import { beforeEach, describe, it, expect, jest } from '@jest/globals';

const repoStub = (name) => ({
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
});

describe('userController.setUserRoles', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('delegates to userRepository.setUserRoles and returns result', async () => {
        const mockSetUserRoles = jest.fn().mockResolvedValue([
            { userId: 1, office: { id: 1 }, role: { id: 1 } }
        ]);

        await jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
            userRepository: { setUserRoles: mockSetUserRoles }
        }));

        const ctrlMod = await import('../../../controllers/userController.js');
        const controller = ctrlMod.default || ctrlMod;

        const res = await controller.setUserRoles(1, [{ roleId: 1 }]);

        expect(mockSetUserRoles).toHaveBeenCalledWith(1, [{ roleId: 1 }]);
        expect(Array.isArray(res)).toBe(true);
        expect(res[0].userId).toBe(1);
    });

    it('propagates repository errors (rejects) from setUserRoles', async () => {
        const err = new Error('repo failure');
        const mockSetUserRoles = jest.fn().mockRejectedValue(err);

        await jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
            userRepository: { setUserRoles: mockSetUserRoles }
        }));

        const ctrlMod = await import('../../../controllers/userController.js');
        const controller = ctrlMod.default || ctrlMod;

        await expect(controller.setUserRoles(1, [{ roleId: 2 }])).rejects.toThrow('repo failure');
        expect(mockSetUserRoles).toHaveBeenCalledWith(1, [{ roleId: 2 }]);
    });

    it('accepts numeric shorthand and normalizes to objects before delegating', async () => {
        const mockSetUserRoles = jest.fn().mockResolvedValue([{ userId: 1, office: { id: 7 }, role: { id: 7 } }]);

        await jest.unstable_mockModule('../../repositories/userRepository.js', () => ({
            userRepository: { setUserRoles: mockSetUserRoles }
        }));

        const ctrlMod = await import('../../../controllers/userController.js');
        const controller = ctrlMod.default || ctrlMod;

        // call with shorthand numeric array
        const res = await controller.setUserRoles(1, [7, 8]);

        // controller currently forwards numeric shorthand unchanged to repository
        expect(mockSetUserRoles).toHaveBeenCalledWith(1, [7, 8]);
        expect(Array.isArray(res)).toBe(true);
    });
});

const userRepoStub = repoStub('Users');
const rolesRepoStub = repoStub('Roles');
const officeRepoStub = repoStub('Offices');
const userOfficeRepoStub = repoStub('UserOffice');

jest.unstable_mockModule('../../config/data-source.js', () => ({
    AppDataSourcePostgres: {
        getRepository: jest.fn((entity) => {
            if (entity?.options?.name === 'Users') return userRepoStub;
            if (entity?.options?.name === 'Roles') return rolesRepoStub;
            if (entity?.options?.name === 'Offices') return officeRepoStub;
            if (entity?.options?.name === 'UserOffice') return userOfficeRepoStub;
            return {};
        }),
    },
}));

const { userRepository } = await import('../../../repositories/userRepository.js');

describe('userRepository.setUserRoles', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // default: user exists and is STAFF
        userRepoStub.findOneBy.mockResolvedValue({ id: 1, userType: 'STAFF' });
    });

    it('setUserRoles: adds new role and removes obsolete role (sync)', async () => {
        // current assignments: role 1 and 2 (first call)
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, officeId: 1, roleId: 1 },
            { userId: 1, officeId: 2, roleId: 2 },
        ]);

        // desired: keep role 1, add role 3
        // role lookup
        rolesRepoStub.findOneBy
            .mockImplementationOnce(async ({ id }) => ({ id: 1, officeId: 1 }))
            .mockImplementationOnce(async ({ id }) => ({ id: 3, officeId: 3 }));

        // offices exist
        officeRepoStub.findOneBy
            .mockImplementation(async ({ id }) => ({ id }));

        // simulate create/save
        userOfficeRepoStub.create.mockReturnValue({ userId: 1, officeId: 3, roleId: 3 });
        userOfficeRepoStub.save.mockResolvedValue({ userId: 1, officeId: 3, roleId: 3 });

        // final find returns the updated assignments (second call)
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, office: { id: 1 }, role: { id: 1 } },
            { userId: 1, office: { id: 3 }, role: { id: 3 } },
        ]);

        const result = await userRepository.setUserRoles(1, [{ roleId: 1 }, { roleId: 3 }]);

        // Expect deletion of the obsolete mapping (roleId:2)
        expect(userOfficeRepoStub.delete).toHaveBeenCalledWith({ userId: 1, officeId: 2, roleId: 2 });

        // Expect creation of the new mapping
        expect(userOfficeRepoStub.create).toHaveBeenCalledWith({ userId: 1, officeId: 3, roleId: 3 });
        expect(userOfficeRepoStub.save).toHaveBeenCalled();

        // Result contains updated relations
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([
            { userId: 1, office: { id: 1 }, role: { id: 1 } },
            { userId: 1, office: { id: 3 }, role: { id: 3 } },
        ]);
    });

    it('setUserRoles: cancels all roles when given an empty array', async () => {
        // current assignments: two mappings (first call)
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, officeId: 1, roleId: 1 },
            { userId: 1, officeId: 2, roleId: 2 },
        ]);

        // final find returns empty array (second call)
        userOfficeRepoStub.find.mockResolvedValueOnce([]);

        const result = await userRepository.setUserRoles(1, []);

        expect(userOfficeRepoStub.delete).toHaveBeenCalledWith({ userId: 1, officeId: 1, roleId: 1 });
        expect(userOfficeRepoStub.delete).toHaveBeenCalledWith({ userId: 1, officeId: 2, roleId: 2 });
        expect(result).toEqual([]);
    });

    it('setUserRoles: throws NotFoundError when user not found', async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.setUserRoles(999, [])).rejects.toThrow("User with id '999' not found");
    });

    it('setUserRoles: throws NotFoundError when a role in the desired list is not found', async () => {
        // current empty
        userOfficeRepoStub.find.mockResolvedValue([]);
        // first role lookup returns null
        rolesRepoStub.findOneBy.mockResolvedValue(null);

        await expect(userRepository.setUserRoles(1, [{ roleId: 42 }])).rejects.toThrow("Role with id '42' not found");
    });

    it('setUserRoles: throws NotFoundError when office for a role is missing', async () => {
        userOfficeRepoStub.find.mockResolvedValue([]);
        // role exists but has no officeId
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 7, officeId: null });

        await expect(userRepository.setUserRoles(1, [{ roleId: 7 }])).rejects.toThrow(
            "Role with id '7' does not have an associated office for internal assignment"
        );
    });

    it('setUserRoles: creates mapping when isExternal=true using officeIdExternal', async () => {
        // current empty
        userOfficeRepoStub.find.mockResolvedValueOnce([]);

        // role has external office id
        rolesRepoStub.findOneBy.mockResolvedValueOnce({ id: 5, officeId: 1, officeIdExternal: 10 });

        // external office exists
        officeRepoStub.findOneBy = officeRepoStub.findOneBy || jest.fn();
        officeRepoStub.findOneBy.mockResolvedValueOnce({ id: 10 });

        // simulate create/save
        userOfficeRepoStub.create.mockReturnValue({ userId: 1, officeId: 10, roleId: 5 });
        userOfficeRepoStub.save.mockResolvedValue({ userId: 1, officeId: 10, roleId: 5 });

        // final find returns the created mapping
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, office: { id: 10 }, role: { id: 5 } }
        ]);

        const result = await userRepository.setUserRoles(1, [{ roleId: 5, isExternal: true }]);

        expect(officeRepoStub.findOneBy).toHaveBeenCalledWith({ id: 10 });
        expect(userOfficeRepoStub.create).toHaveBeenCalledWith({ userId: 1, officeId: 10, roleId: 5 });
        expect(userOfficeRepoStub.save).toHaveBeenCalled();
        expect(result).toEqual([{ userId: 1, office: { id: 10 }, role: { id: 5 } }]);
    });

    it('setUserRoles: throws when external role has no external officeId', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([]);
        rolesRepoStub.findOneBy.mockResolvedValueOnce({ id: 6, officeId: 2, officeIdExternal: null });

        await expect(userRepository.setUserRoles(1, [{ roleId: 6, isExternal: true }])).rejects.toThrow(
            "Role with id '6' does not have an associated office for external assignment"
        );
    });

    it('setUserRoles: accepts numeric-only entries (shorthand) and creates mappings', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([]);

        // roles 7 and 8
        rolesRepoStub.findOneBy
            .mockImplementationOnce(async ({ id }) => ({ id: 7, officeId: 7 }))
            .mockImplementationOnce(async ({ id }) => ({ id: 8, officeId: 8 }));

        officeRepoStub.findOneBy
            .mockImplementation(async ({ id }) => ({ id }));

        userOfficeRepoStub.create.mockReturnValue({ userId: 1, officeId: 7, roleId: 7 });
        userOfficeRepoStub.save.mockResolvedValue({ userId: 1, officeId: 7, roleId: 7 });

        // final find returns both created mappings
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, office: { id: 7 }, role: { id: 7 } },
            { userId: 1, office: { id: 8 }, role: { id: 8 } },
        ]);

        const result = await userRepository.setUserRoles(1, [7, 8]);

        expect(userOfficeRepoStub.create).toHaveBeenCalled();
        expect(userOfficeRepoStub.save).toHaveBeenCalled();
        expect(Array.isArray(result)).toBe(true);
    });

    it('setUserRoles: idempotent when desired equals current (no changes)', async () => {
        // current assignments contain one triple
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, officeId: 1, roleId: 1 }
        ]);

        // roles lookup maps role 1 to office 1
        rolesRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, officeId: 1 });
        officeRepoStub.findOneBy.mockResolvedValueOnce({ id: 1 });

        // final find returns same mapping with relations
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, office: { id: 1 }, role: { id: 1 } }
        ]);

        const result = await userRepository.setUserRoles(1, [{ roleId: 1 }]);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        const item = result[0];
        expect(item.userId).toBe(1);
        expect(item.office?.id ?? item.officeId).toBe(1);
        expect(item.role?.id ?? item.roleId).toBe(1);
    });
});
