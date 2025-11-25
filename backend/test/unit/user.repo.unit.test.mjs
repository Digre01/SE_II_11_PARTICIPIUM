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

describe('userRepository.assignRoleToUser additional branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    usersRepo.findOneBy.mockResolvedValue({ id: 1, userType: 'STAFF' });
    rolesRepo.findOneBy.mockResolvedValue({ id: 1, officeId: 1 });
    officesRepo.findOneBy.mockResolvedValue({ id: 1 });
    userOfficeRepo.findOneBy.mockResolvedValue(null);
    userOfficeRepo.create.mockReturnValue({ userId: 1, roleId: 1, officeId: 1 });
    userOfficeRepo.save.mockResolvedValue({});
    userOfficeRepo.findOne.mockResolvedValue({ userId: 1, role: { id: 1 }, office: { id: 1 } });
  });

  it('throws NotFoundError when role has no associated office', async () => {
    rolesRepo.findOneBy.mockResolvedValueOnce({ id: 7, officeId: null });

    await expect(userRepository.assignRoleToUser(1, 7)).rejects.toThrow(
      new NotFoundError("Role with id '7' does not have an associated office").message
    );
  });
});

describe('userRepository.configUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates telegramId, emailNotifications and sets photo via Photos repo', async () => {
    const user = { id: 10, telegramId: null, emailNotifications: false, photoId: null };
    usersRepo.findOneBy.mockResolvedValueOnce({ ...user });

    // Photo creation flow
    photosRepo.create.mockImplementation((obj) => ({ id: undefined, ...obj }));
    photosRepo.save.mockResolvedValueOnce({ id: 55, link: '/public/pic.jpg' });
    usersRepo.save.mockResolvedValueOnce({});

    const updated = await userRepository.configUserAccount(10, 'tg123', true, '/public/pic.jpg');

    expect(photosRepo.create).toHaveBeenCalledWith({ link: '/public/pic.jpg' });
    expect(photosRepo.save).toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, telegramId: 'tg123', emailNotifications: true, photoId: 55 })
    );
    expect(updated).toEqual(expect.objectContaining({ id: 10 }));
  });

  it('sets telegramId to null when empty string; does not create photo when photoUrl missing', async () => {
    const user = { id: 20, telegramId: 'old', emailNotifications: true, photoId: 9 };
    usersRepo.findOneBy.mockResolvedValueOnce({ ...user });
    usersRepo.save.mockResolvedValueOnce({});

    const updated = await userRepository.configUserAccount(20, '', false, undefined);

    expect(photosRepo.create).not.toHaveBeenCalled();
    expect(photosRepo.save).not.toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 20, telegramId: null, emailNotifications: false })
    );
    expect(updated).toEqual(expect.objectContaining({ id: 20 }));
  });

  it('throws NotFoundError when user does not exist', async () => {
    usersRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(userRepository.configUserAccount(999, 'tg', true, '/x')).rejects.toThrow(
      new NotFoundError("User with id '999' not found").message
    );
  });
});

describe('userRepository.getPfpUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns photo link when everything exists', async () => {
    usersRepo.findOneBy.mockResolvedValueOnce({ id: 1, photoId: 77 });
    photosRepo.findOneBy.mockResolvedValueOnce({ id: 77, link: '/public/ok.jpg' });

    const link = await userRepository.getPfpUrl(1);
    expect(link).toBe('/public/ok.jpg');
  });

  it('throws NotFoundError when user does not exist', async () => {
    usersRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(userRepository.getPfpUrl(123)).rejects.toThrow(
      new NotFoundError("User with id '123' not found").message
    );
  });

  it('throws NotFoundError when photoId is missing on user', async () => {
    usersRepo.findOneBy.mockResolvedValueOnce({ id: 4, photoId: null });
    await expect(userRepository.getPfpUrl(4)).rejects.toThrow("'4' profile picture not found");
  });

  it('throws NotFoundError when photo entity not found', async () => {
    usersRepo.findOneBy.mockResolvedValueOnce({ id: 5, photoId: 88 });
    photosRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(userRepository.getPfpUrl(5)).rejects.toThrow("'5' profile picture not found");
  });
});


