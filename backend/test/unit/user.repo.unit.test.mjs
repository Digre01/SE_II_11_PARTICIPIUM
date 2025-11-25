import {beforeEach, describe, expect, it, jest} from "@jest/globals";

const repoStub = (name) => {
    return {
        findOneBy: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };
};

// Create individual stubs we'll control inside tests
const userRepoStub = repoStub('Users');
const officesRepoStub = repoStub('Offices');
const rolesRepoStub = repoStub('Roles');
const userOfficeRepoStub = repoStub('UserOffice');


jest.unstable_mockModule('../../config/data-source.js', () => {
    return {
        AppDataSourcePostgres: {
            getRepository: jest.fn((entity) => {
                if (entity?.options?.name === 'Users') return userRepoStub;
                if (entity?.options?.name === 'Offices') return officesRepoStub;
                if (entity?.options?.name === 'Roles') return rolesRepoStub;
                if (entity?.options?.name === 'UserOffice') return userOfficeRepoStub;
            }),
        },
    };
});

const {userRepository} = await import ("../../repositories/userRepository.js")

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
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });
        const existingMapping = { userId: 1 };
        userOfficeRepoStub.findOneBy.mockResolvedValue(existingMapping);

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

    it("throws NotFoundError when user not found", async () => {
        const missingUserId = 999
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(missingUserId, 1)).rejects.toThrow(
            `User with id '${missingUserId}' not found`)

    });

    it("throws NotFoundError when office not found", async () => {
        const missingOfficeId = 999;
        rolesRepoStub.findOneBy.mockResolvedValue({ id: 1, officeId: missingOfficeId });
        officesRepoStub.findOneBy.mockResolvedValue(null);

        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow(
            `Office with id '${missingOfficeId}' not found`
        );
    });

    it("throws NotFoundError when role not found", async () => {
        const missingRoleId = 999
        rolesRepoStub.findOneBy.mockResolvedValue(null);
        await expect(userRepository.assignRoleToUser(1, missingRoleId)).rejects.toThrow(
            `Role with id '${missingRoleId}' not found`)

    })

    it("throws InsufficientRightsError when assigning to roles that are not STAFF", async () => {
        userRepoStub.findOneBy.mockResolvedValue({id: 1, userType: "citizen"});
        await expect(userRepository.assignRoleToUser(1, 1)).rejects.toThrow(
            'Only staff accounts can be assigned a role')

    })
});



