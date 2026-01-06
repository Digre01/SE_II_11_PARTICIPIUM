import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {resetUserRepositoryMocks} from "./userRepository.setup.js";
import {officeRepoStub, rolesRepoStub, userOfficeRepoStub, userRepoStub} from "../../mocks/repo.stubs.js";

const {userRepository} = await import("../../../../repositories/userRepository.js");

beforeEach(() => {
    jest.clearAllMocks();
    resetUserRepositoryMocks();
});

describe("getAvailableStaffForRoleAssignment", () => {
    it("returns staff without office", async () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([{id: 7}])
        };
        userRepoStub.createQueryBuilder = jest.fn(() => qb);
        const result = await userRepository.getAvailableStaffForRoleAssignment();
        expect(result).toEqual([{id: 7}]);
        expect(qb.getMany).toHaveBeenCalled();
    });

    it("returns empty array if getMany returns undefined", async () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(undefined)
        };
        userRepoStub.createQueryBuilder = jest.fn(() => qb);
        const result = await userRepository.getAvailableStaffForRoleAssignment();
        expect(result).toBeUndefined();
        expect(qb.getMany).toHaveBeenCalled();
    });

    it("throws if createQueryBuilder is not defined", async () => {
        userRepoStub.createQueryBuilder = undefined;
        await expect(userRepository.getAvailableStaffForRoleAssignment()).rejects.toThrow();
    });
});

describe("getAssignedStaffForRoleModification", () => {
    it("returns staff with office", async () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([{id: 3}])
        };
        userRepoStub.createQueryBuilder = jest.fn(() => qb);

        const result = await userRepository.getAssignedStaffForRoleModification();

        expect(result).toEqual([{id: 3}]);
        expect(qb.getMany).toHaveBeenCalled();
    });

    it("returns empty array if getMany returns undefined", async () => {
        const qb = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue(undefined)
        };
        userRepoStub.createQueryBuilder = jest.fn(() => qb);

        const result = await userRepository.getAssignedStaffForRoleModification();

        expect(result).toBeUndefined();
        expect(qb.getMany).toHaveBeenCalled();
    });

    it("throws if createQueryBuilder is not defined", async () => {
        userRepoStub.createQueryBuilder = undefined;

        await expect(userRepository.getAssignedStaffForRoleModification()).rejects.toThrow();
    });
});

describe("assignRoleToUser", () => {
    it("assigns existing userOffice mapping (internal)", async () => {
        userRepoStub.findOne.mockResolvedValue({ id: 1, userType: "STAFF" });
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });
        const existingMapping = { userId: 1, roleId: 1, officeId: 1 };
        userOfficeRepoStub.findOneBy.mockResolvedValue(existingMapping);

        const result = await userRepository.assignRoleToUser(1, 1);

        expect(userOfficeRepoStub.save).toHaveBeenCalledWith(expect.objectContaining(existingMapping));
        expect(result).toEqual({ userId: 1, office: { id: 1 }, role: { id: 1 } });
    });

    it("assigns existing userOffice mapping (external)", async () => {
        userRepoStub.findOne.mockResolvedValue({ id: 1, userType: "STAFF" });
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1, officeIdExternal: 2 });
        const existingMapping = { userId: 1, roleId: 1, officeId: 2 };
        userOfficeRepoStub.findOneBy.mockResolvedValue(existingMapping);

        const result = await userRepository.assignRoleToUser(1, 1, true);

        expect(userOfficeRepoStub.save).toHaveBeenCalledWith(expect.objectContaining(existingMapping));
        expect(result).toEqual({ userId: 1, office: { id: 1 }, role: { id: 1 } });
    });

    it("creates new userOffice mapping (internal)", async () => {
        userRepoStub.findOne.mockResolvedValue({ id: 1, userType: "STAFF" });
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });
        userOfficeRepoStub.findOneBy.mockResolvedValue(null);

        const result = await userRepository.assignRoleToUser(1, 1);

        expect(userOfficeRepoStub.create).toHaveBeenCalledWith({ userId: 1, officeId: 1, roleId: 1 });
        expect(userOfficeRepoStub.save).toHaveBeenCalled();
        expect(result).toEqual({ userId: 1, office: { id: 1 }, role: { id: 1 } });
    });

    it("creates new userOffice mapping (external)", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1, officeIdExternal: 2 });
        userOfficeRepoStub.findOneBy.mockResolvedValue(null);

        const result = await userRepository.assignRoleToUser(1, 1, true);

        expect(userOfficeRepoStub.create).toHaveBeenCalledWith({ userId: 1, officeId: 2, roleId: 1 });
        expect(userOfficeRepoStub.save).toHaveBeenCalled();
        expect(result).toEqual({ userId: 1, office: { id: 1 }, role: { id: 1 } });
    });

    it("throws NotFoundError when office not found", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 999 });
        officeRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow(`Office with id '999' not found`);
    });

    it("throws NotFoundError when role not found", async () => {
        rolesRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(1, 999)).rejects.toThrow(`Role with id '999' not found`);
    });

    it("throws InsufficientRightsError for non-staff user", async () => {
        userRepoStub.findOneBy.mockResolvedValue({ id: 1, userType: "citizen" });
        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow('Only staff accounts can be assigned a role');
    });
});