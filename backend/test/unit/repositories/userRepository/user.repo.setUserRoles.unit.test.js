import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
    userRepoStub,
    rolesRepoStub,
    officeRepoStub,
    userOfficeRepoStub
} from "../../mocks/shared.mocks.js";
import { resetUserRepositoryMocks } from "./userRepository.setup.js";

const { userRepository } = await import('../../../../repositories/userRepository.js');

describe("setUserRoles", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetUserRepositoryMocks();
        userOfficeRepoStub.find.mockReset();
    });

    it('adds new role and removes obsolete role (sync)', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, officeId: 1, roleId: 1 },
            { userId: 1, officeId: 2, roleId: 2 },
        ]);

        rolesRepoStub.findOneBy
            .mockImplementationOnce(async ({ id }) => ({ id: 1, officeId: 1 }))
            .mockImplementationOnce(async ({ id }) => ({ id: 3, officeId: 3 }));

        officeRepoStub.findOneBy
            .mockImplementation(async ({ id }) => ({ id }));

        userOfficeRepoStub.create.mockReturnValue({ userId: 1, officeId: 3, roleId: 3 });
        userOfficeRepoStub.save.mockResolvedValue({ userId: 1, officeId: 3, roleId: 3 });

        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, office: { id: 1 }, role: { id: 1 } },
            { userId: 1, office: { id: 3 }, role: { id: 3 } },
        ]);

        const result = await userRepository.setUserRoles(1, [
            { roleId: 1 },
            { roleId: 3 }
        ]);

        expect(userOfficeRepoStub.delete)
            .toHaveBeenCalledWith({ userId: 1, officeId: 2, roleId: 2 });

        expect(userOfficeRepoStub.create)
            .toHaveBeenCalledWith({ userId: 1, officeId: 3, roleId: 3 });

        expect(userOfficeRepoStub.save).toHaveBeenCalled();

        expect(result).toEqual([
            { userId: 1, office: { id: 1 }, role: { id: 1 } },
            { userId: 1, office: { id: 3 }, role: { id: 3 } },
        ]);
    });

    it('cancels all roles when given an empty array', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([
            { userId: 1, officeId: 1, roleId: 1 },
            { userId: 1, officeId: 2, roleId: 2 },
        ]);

        userOfficeRepoStub.find.mockResolvedValueOnce([]);

        const result = await userRepository.setUserRoles(1, []);

        expect(userOfficeRepoStub.delete)
            .toHaveBeenCalledWith({ userId: 1, officeId: 1, roleId: 1 });
        expect(userOfficeRepoStub.delete)
            .toHaveBeenCalledWith({ userId: 1, officeId: 2, roleId: 2 });

        expect(result).toEqual([]);
    });

    it('throws NotFoundError when user not found', async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce(null);

        await expect(
            userRepository.setUserRoles(999, [])
        ).rejects.toThrow("User with id '999' not found");
    });

    it('throws NotFoundError when a role is not found', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([]);
        rolesRepoStub.findOneBy.mockResolvedValueOnce(null);

        await expect(
            userRepository.setUserRoles(1, [{ roleId: 42 }])
        ).rejects.toThrow("Role with id '42' not found");
    });

    it('throws when role has no internal office', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([]);
        rolesRepoStub.findOneBy.mockResolvedValueOnce({ id: 7, officeId: null });

        await expect(
            userRepository.setUserRoles(1, [{ roleId: 7 }])
        ).rejects.toThrow(
            "Role with id '7' does not have an associated office for internal assignment"
        );
    });

    it('creates mapping for external role using officeIdExternal', async () => {
        userOfficeRepoStub.find
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                { userId: 1, office: { id: 10 }, role: { id: 5 } }
            ]);

        rolesRepoStub.findOneBy.mockResolvedValueOnce({
            id: 5,
            officeId: 1,
            officeIdExternal: 10
        });

        officeRepoStub.findOneBy.mockResolvedValueOnce({ id: 10 });

        userOfficeRepoStub.create.mockReturnValue({
            userId: 1,
            officeId: 10,
            roleId: 5
        });

        userOfficeRepoStub.save.mockResolvedValue({
            userId: 1,
            officeId: 10,
            roleId: 5
        });

        const result = await userRepository.setUserRoles(1, [
            { roleId: 5, isExternal: true }
        ]);

        expect(result).toEqual([
            { userId: 1, office: { id: 10 }, role: { id: 5 } }
        ]);
    });


    it('throws when external role has no external officeId', async () => {
        userOfficeRepoStub.find.mockResolvedValueOnce([]);
        rolesRepoStub.findOneBy.mockResolvedValueOnce({
            id: 6,
            officeId: 2,
            officeIdExternal: null
        });

        await expect(
            userRepository.setUserRoles(1, [{ roleId: 6, isExternal: true }])
        ).rejects.toThrow(
            "Role with id '6' does not have an associated office for external assignment"
        );
    });

    it('accepts numeric shorthand and creates mappings', async () => {
        userOfficeRepoStub.find
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                { userId: 1, office: { id: 7 }, role: { id: 7 } },
                { userId: 1, office: { id: 8 }, role: { id: 8 } },
            ]);


        rolesRepoStub.findOneBy
            .mockImplementationOnce(async ({ id }) => ({ id: 7, officeId: 7 }))
            .mockImplementationOnce(async ({ id }) => ({ id: 8, officeId: 8 }));

        officeRepoStub.findOneBy
            .mockImplementation(async ({ id }) => ({ id }));

        const result = await userRepository.setUserRoles(1, [7, 8]);

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
    });

    it('is idempotent when desired equals current', async () => {
        userOfficeRepoStub.find
            .mockResolvedValueOnce([
                { userId: 1, officeId: 1, roleId: 1 }
            ])
            .mockResolvedValueOnce([
                { userId: 1, office: { id: 1 }, role: { id: 1 } }
            ]);


        rolesRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, officeId: 1 });
        officeRepoStub.findOneBy.mockResolvedValueOnce({ id: 1 });

        const result = await userRepository.setUserRoles(1, [{ roleId: 1 }]);

        expect(result).toHaveLength(1);
        expect(result[0].office.id).toBe(1);
        expect(result[0].role.id).toBe(1);
    });
});
