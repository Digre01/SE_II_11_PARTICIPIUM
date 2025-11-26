import { jest } from "@jest/globals";
import { setupAuthorizationMock } from "./common.mocks.js";

// Role Repository mock
export const mockOfficeRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
};

// Setup authorization middleware (no unauthorized access allowed)
await setupAuthorizationMock({ allowUnauthorizedThrough: false });

// Mock role repository
await jest.unstable_mockModule('../../../repositories/officeRepository.js', () => ({
    officeRepository: mockOfficeRepo,
}));