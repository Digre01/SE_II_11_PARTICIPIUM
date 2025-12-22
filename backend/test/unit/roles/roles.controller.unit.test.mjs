import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {rolesRepoStub} from "../mocks/shared.mocks.js";

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
        rolesRepoStub.find.mockResolvedValue(fakeRoles);

        // Act
        const result = await rolesRepository.findAll();

        // Assert
        expect(rolesRepoStub.find).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeRoles);
    });
});
