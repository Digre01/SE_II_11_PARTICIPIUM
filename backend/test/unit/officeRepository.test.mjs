/*import {beforeEach, describe, expect, it, jest} from "@jest/globals";

const repoStub = (name) => {
    return {
        findOne: jest.fn(),
    };
};

// Create individual stubs we'll control inside tests
const officesRepoStub = repoStub('Offices');


jest.unstable_mockModule('../../config/data-source.js', () => {
    return {
        AppDataSourcePostgres: {
            getRepository: jest.fn((entity) => {
                if (entity?.options?.name === 'Offices') return officesRepoStub;
            }),
        },
    };
});

const {officeRepository} = await import ("../../repositories/officeRepository.js")

describe("Role assignment: user repository", () => {

    beforeEach(() => {
        jest.clearAllMocks();

        userRepoStub.findOneBy.mockResolvedValue({ id: 1, userType: "STAFF" });
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
        userOfficeRepoStub.findOneBy.mockResolvedValue({userId: 1});

        const result = await userRepository.assignRoleToUser(1, 1, 1);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(officesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });

        expect(userOfficeRepoStub.save).toHaveBeenCalled();
        expect(result).toEqual({
            userId: 1,
            office: { id: 1 },
            role: { id: 1 },
        });
    });

    it("Success: created userOffice mapping", async () => {
        userOfficeRepoStub.findOneBy.mockResolvedValue(null);

        const result = await userRepository.assignRoleToUser(1, 1, 1);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(officesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(rolesRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
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

    it("throws NotFoundError when user not found", async () => {
        const missingUserId = 999
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(missingUserId, 1, 1)).rejects.toThrow(
            `User with id '${missingUserId}' not found`)

    });

    it("throws NotFoundError when office not found", async () => {
        const missingOfficeId = 999
        officesRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(1, 1, missingOfficeId)).rejects.toThrow(
            `Office with id '${missingOfficeId}' not found`)

    })

    it("throws NotFoundError when role not found", async () => {
        const missingRoleId = 999
        rolesRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(1, missingRoleId, 1)).rejects.toThrow(
            `Role with id '${missingRoleId}' not found`)

    })

    it("throws InsufficientRightsError when assigning to roles that are not STAFF", async () => {
        userRepoStub.findOneBy.mockResolvedValue({id: 1, userType: "citizen"});
        await expect(userRepository.assignRoleToUser(1, 1, 1)).rejects.toThrow(
            'Only staff accounts can be assigned a role')

    })
})*/