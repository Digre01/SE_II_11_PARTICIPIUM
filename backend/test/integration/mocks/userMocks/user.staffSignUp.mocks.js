import { jest } from "@jest/globals";

export const mockController = {
    signupStaff: jest.fn(),
    signupCitizen: jest.fn()
};

// Mock the module
await jest.unstable_mockModule('../../../../controllers/userController.js', () => ({
    default: mockController
}));
