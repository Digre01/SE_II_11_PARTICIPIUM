import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Stub repository methods
const userRepoStub = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
};

// Mock data-source BEFORE importing repository
await jest.unstable_mockModule('../../config/data-source.js', () => ({
    AppDataSourcePostgres: {
        getRepository: jest.fn(() => userRepoStub),
    },
}));

const { userRepository } = await import('../../../repositories/userRepository.js');

describe('UserRepository.createUser (staff)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        userRepoStub.findOneBy.mockResolvedValue(null); // No duplicate
        userRepoStub.create.mockImplementation((data) => ({ ...data, id: 123 }));
        userRepoStub.save.mockImplementation(async (entity) => ({ ...entity, id: 123 }));
    });

    it('creates staff user when called by admin', async () => {
        const result = await userRepository.createUser(
            'staff1',
            'staff1@email.com',
            'Nome',
            'Cognome',
            'pw',
            'salt',
            'STAFF'
        );
        expect(userRepoStub.save).toHaveBeenCalledWith(expect.objectContaining({ userType: 'STAFF' }));
        expect(result.id).toBe(123);
    });

    it('throws error if username already exists', async () => {
        userRepoStub.findOneBy.mockResolvedValueOnce({ id: 99 }); // username
        await expect(userRepository.createUser(
            'staff1',
            'staff1@email.com',
            'Nome',
            'Cognome',
            'pw',
            'salt',
            'STAFF'
        )).rejects.toThrow("User with username staff1 already exists");
    });

    it('throws error if email already exists', async () => {
        userRepoStub.findOneBy
            .mockResolvedValueOnce(null) // username not found
            .mockResolvedValueOnce({ id: 88 }); // email found
        await expect(userRepository.createUser(
            'staff2',
            'staff2@email.com',
            'Nome',
            'Cognome',
            'pw',
            'salt',
            'STAFF'
        )).rejects.toThrow("User with email staff2@email.com already exists");
    });

    it('creates citizen user', async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        const result = await userRepository.createUser(
            'citizen1',
            'citizen@email.com',
            'Nome',
            'Cognome',
            'pw',
            'salt',
            'CITIZEN'
        );
        expect(userRepoStub.save).toHaveBeenCalledWith(expect.objectContaining({ userType: 'CITIZEN' }));
        expect(result.id).toBe(123);
    });
});
