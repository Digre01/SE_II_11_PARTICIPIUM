import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {
    userRepoStub,
    photoRepoStub,
    rolesRepoStub,
    officeRepoStub,
    userOfficeRepoStub
} from "../mocks/shared.mocks.js";

const {userRepository} = await import ("../../../repositories/userRepository.js")

describe("Role assignment: user repository", () => {


        it("getAvailableStaffForRoleAssignment returns staff without office", async () => {
            const qb = { leftJoinAndSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue([{ id: 7 }]) };
            userRepoStub.createQueryBuilder = jest.fn(() => qb);
            const result = await userRepository.getAvailableStaffForRoleAssignment();
            expect(result).toEqual([{ id: 7 }]);
            expect(qb.getMany).toHaveBeenCalled();
        });

        it("getAvailableStaffForRoleAssignment returns empty array if getMany returns undefined", async () => {
            const qb = { leftJoinAndSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue(undefined) };
            userRepoStub.createQueryBuilder = jest.fn(() => qb);
            const result = await userRepository.getAvailableStaffForRoleAssignment();
            expect(result).toEqual(undefined);
            expect(qb.getMany).toHaveBeenCalled();
        });

        it("getAvailableStaffForRoleAssignment throws if createQueryBuilder is not defined", async () => {
            userRepoStub.createQueryBuilder = undefined;
            await expect(userRepository.getAvailableStaffForRoleAssignment()).rejects.toThrow();
        });

        it("configUserAccount updates telegramId, emailNotifications, photoUrl", async () => {
            userRepoStub.findOneBy.mockResolvedValue({ id: 8 });
            userRepoStub.save.mockResolvedValue({ id: 8, telegramId: "tg", emailNotifications: true, photoId: 1 });
            photoRepoStub = {
                create: jest.fn().mockReturnValue({ link: "url" }),
                save: jest.fn().mockResolvedValue({ id: 1 })
            };
            const result = await userRepository.configUserAccount(8, "tg", true, "url");
            expect(photoRepoStub.create).toHaveBeenCalledWith({ link: "url" });
            expect(photoRepoStub.save).toHaveBeenCalledWith({ link: "url" });
            expect(userRepoStub.save).toHaveBeenCalledWith(expect.objectContaining({ telegramId: "tg", emailNotifications: true, photoId: 1 }));
            expect(result).toEqual({ id: 8, telegramId: "tg", emailNotifications: true, photoId: 1 });
        });

        it("configUserAccount throws if user not found", async () => {
            userRepoStub.findOneBy.mockResolvedValue(null);
            await expect(userRepository.configUserAccount(999, "tg", true, "url")).rejects.toThrow("User with id '999' not found");
        });

        it("getPfpUrl returns photo url", async () => {
            userRepoStub.findOneBy.mockResolvedValue({ id: 9, photoId: 2 });
            photoRepoStub = { findOneBy: jest.fn().mockResolvedValue({ id: 2, link: "pfpurl" }) };
            const result = await userRepository.getPfpUrl(9);
            expect(result).toBe("pfpurl");
        });

        it("getPfpUrl throws if user not found", async () => {
            userRepoStub.findOneBy.mockResolvedValue(null);
            await expect(userRepository.getPfpUrl(999)).rejects.toThrow("User with id '999' not found");
        });

        it("getPfpUrl throws if no photoId", async () => {
            userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
            await expect(userRepository.getPfpUrl(10)).rejects.toThrow("'10' profile picture not found");
        });

        it("getPfpUrl throws if photo not found", async () => {
            userRepoStub.findOneBy.mockResolvedValue({ id: 11, photoId: 3 });
            photoRepoStub = { findOneBy: jest.fn().mockResolvedValue(null) };
            await expect(userRepository.getPfpUrl(11)).rejects.toThrow("'11' profile picture not found");
        });

        it("deleteUser deletes user and mapping", async () => {
            userRepoStub.findOneBy.mockResolvedValue({ id: 12 });
            userOfficeRepoStub.findOneBy.mockResolvedValue({ userId: 12 });
            userRepoStub.delete = jest.fn().mockResolvedValue({});
            userOfficeRepoStub.delete = jest.fn();
            const result = await userRepository.deleteUser(12);
            expect(userOfficeRepoStub.delete).toHaveBeenCalledWith({ userId: 12 });
            expect(userRepoStub.delete).toHaveBeenCalledWith({ id: 12 });
            expect(result).toEqual({ id: 12 });
        });

        it("deleteUser deletes user if no mapping", async () => {
            userRepoStub.findOneBy.mockResolvedValue({ id: 13 });
            userOfficeRepoStub.findOneBy.mockResolvedValue(null);
            userRepoStub.delete = jest.fn().mockResolvedValue({});
            userOfficeRepoStub.delete = jest.fn();
            const result = await userRepository.deleteUser(13);
            expect(userOfficeRepoStub.delete).not.toHaveBeenCalled();
            expect(userRepoStub.delete).toHaveBeenCalledWith({ id: 13 });
            expect(result).toEqual({ id: 13 });
        });

        it("deleteUser throws if user not found", async () => {
            userRepoStub.findOneBy.mockResolvedValue(null);
            await expect(userRepository.deleteUser(999)).rejects.toThrow("User with id '999' not found");
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();

        userRepoStub.findOneBy.mockResolvedValue({ id: 1, userType: "STAFF" });
        userRepoStub.findOne.mockResolvedValue({ id: 1, userType: "STAFF" });
        officesRepoStub.findOneBy.mockResolvedValue({ id: 1 });
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1 });

        userOfficeRepoStub.create.mockReturnValue({ userId: 1, officeId: 1, roleId: 1 });
        userOfficeRepoStub.save.mockResolvedValue({});
        userOfficeRepoStub.findOne.mockResolvedValue({
            userId: 1,
            office: { id: 1 },
            role: { id: 1 },
        });
    });

    it("Success: existing userOffice mapping", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });
        const existingMapping = { userId: 1, roleId: 1, officeId: 1 };
        userOfficeRepoStub.findOneBy.mockResolvedValue(existingMapping);
        userOfficeRepoStub.save.mockResolvedValue(existingMapping);

        const result = await userRepository.assignRoleToUser(1, 1);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(officesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(userOfficeRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 1, roleId: 1, officeId: 1 })
        );

        expect(result).toEqual({
            userId: 1,
            office: { id: 1 },
            role: { id: 1 },
        });
    });

    it("Success: existing userOffice mapping (external)", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1, officeIdExternal: 2 });
        const existingMapping = { userId: 1, roleId: 1, officeId: 2 };
        userOfficeRepoStub.findOneBy.mockResolvedValue(existingMapping);

        const result = await userRepository.assignRoleToUser(1, 1, true);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(officesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });
        expect(userOfficeRepoStub.save).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 1, roleId: 1, officeId: 2 })
        );
        expect(result).toEqual({
            userId: 1,
            office: { id: 1 },
            role: { id: 1 },
        });
    });

    it("Success: created userOffice mapping", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });
        userOfficeRepoStub.findOneBy.mockResolvedValue(null);

        const result = await userRepository.assignRoleToUser(1, 1);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(officesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });

        expect(userOfficeRepoStub.create).toHaveBeenCalledWith({
            userId: 1,
            officeId: 1,
            roleId: 1,
        });
        expect(userOfficeRepoStub.save).toHaveBeenCalled();

        expect(result).toEqual({
            userId: 1,
            office: { id: 1 },
            role: { id: 1 },
        });
    });

    it("Success: created userOffice mapping (external)", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1, officeIdExternal: 2 });
        userOfficeRepoStub.findOneBy.mockResolvedValue(null);

        const result = await userRepository.assignRoleToUser(1, 1, true);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(officesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });

        expect(userOfficeRepoStub.create).toHaveBeenCalledWith({
            userId: 1,
            officeId: 2,
            roleId: 1,
        });
        expect(userOfficeRepoStub.save).toHaveBeenCalled();

        expect(result).toEqual({
            userId: 1,
            office: { id: 1 },
            role: { id: 1 },
        });
    });



    it("throws NotFoundError when office not found (internal)", async () => {
        const missingOfficeId = 999;
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: missingOfficeId });
        officesRepoStub.findOneBy.mockResolvedValue(null);

        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow(
            `Office with id '${missingOfficeId}' not found`
        );
    });

    it("throws NotFoundError when office not found (external)", async () => {
        const missingOfficeId = 888;
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1, officeIdExternal: missingOfficeId });
        officesRepoStub.findOneBy.mockResolvedValue(null);

        await expect(userRepository.assignRoleToUser(1, 1, true)).rejects.toThrow(
            `Office with id '${missingOfficeId}' not found`
        );
    });

    it("throws NotFoundError when role not found", async () => {
        const missingRoleId = 999
        rolesRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(1, missingRoleId)).rejects.toThrow(
            `Role with id '${missingRoleId}' not found`)
    });

    it("throws NotFoundError when role has no office for assignment (internal)", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: null });
        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow(
            `Role with id '1' does not have an associated office for internal assignment`
        );
    });

    it("throws NotFoundError when role has no office for assignment (external)", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1, officeIdExternal: null });
        await expect(userRepository.assignRoleToUser(1, 1, true)).rejects.toThrow(
            `Role with id '1' does not have an associated office for external assignment`
        );
    });

    it("throws InsufficientRightsError when assigning to roles that are not STAFF", async () => {
        userRepoStub.findOneBy.mockResolvedValue({id: 1, userType: "citizen"});
        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow(
            'Only staff accounts can be assigned a role')

    })
});



