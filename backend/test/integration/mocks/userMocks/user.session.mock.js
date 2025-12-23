import { jest } from '@jest/globals';

export const mockController = {
    login: jest.fn(),
    createUser: jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        userType: 'CITIZEN',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User'
    }),
    markEmailVerified: jest.fn().mockResolvedValue({
        id: 1,
        username: 'testuser',
        userType: 'STAFF',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User'
    }),
    verifyEmail: jest.fn().mockResolvedValue(true),
    isEmailVerified: jest.fn().mockResolvedValue(true),
};

// Setup del mock del controller
await jest.unstable_mockModule('../../../../controllers/userController.js', () => ({
    default: mockController
}));