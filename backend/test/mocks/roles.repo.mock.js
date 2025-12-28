import { jest } from "@jest/globals";

// Role Repository mock
export const mockRoleRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
};

// Mock role repository
await jest.unstable_mockModule('../../../repositories/rolesRepository.js', () => ({
    rolesRepository: mockRoleRepo,
}));