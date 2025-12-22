import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dei repository (entrambi)
const officeRepositoryMock = { findAll: jest.fn() };

await jest.unstable_mockModule('../../repositories/officeRepository.js', () => ({
    officeRepository: officeRepositoryMock,
}));

// Importiamo il controller DOPO i mock
const { officeRepository } = await import('../../../repositories/officeRepository.js');

describe('userController - getAllOffices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all offices successfully', async () => {
        // Arrange
        const fakeOffices = [
            { id: 1, name: 'Municipality Office' },
            { id: 2, name: 'Technical Office' },
        ];
        officeRepositoryMock.findAll.mockResolvedValue(fakeOffices);

        // Act
        const result = await officeRepositoryMock.findAll();

        // Assert
        expect(officeRepositoryMock.findAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeOffices);
    });
});
