import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const rolesRepositoryMock = { findAll: jest.fn() };

await jest.unstable_mockModule('../../repositories/rolesRepository.js', () => ({
    rolesRepository: rolesRepositoryMock,
}));

const { rolesRepository } = await import('../../../repositories/rolesRepository.js');

describe('userController - getAllRoles', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all roles successfully', async () => {
        // Arrange
        const fakeRoles = [
            { id: 1, name: 'Admin' },
            { id: 2, name: 'Operator' },
        ];
        rolesRepositoryMock.findAll.mockResolvedValue(fakeRoles);

        // Act
        const result = await rolesRepository.findAll();

        // Assert
        expect(rolesRepositoryMock.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeRoles);
    });
});
