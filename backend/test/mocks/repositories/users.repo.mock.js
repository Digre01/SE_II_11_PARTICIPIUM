import {jest} from "@jest/globals";

export const mockUserRepo = {
    configUserAccount: jest.fn().mockResolvedValue({
        id: 1,
        telegramId: 'tg_123',
        emailNotifications: true,
        photoId: 42,
    }),
    getPfpUrl: jest.fn().mockResolvedValue('/public/abc123.png'),
    setUserRoles: jest.fn(),
    createUser: jest.fn(),
    getEmailVerification: jest.fn(),
    isEmailVerified: jest.fn(),
    assignRoleToUser: jest.fn(),
    getUserByUsername: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserById: jest.fn(),
    saveEmailVerificationCode: jest.fn(),
    markEmailVerified: jest.fn(),
    getUserRoles: jest.fn(),
    getAvailableStaffForRoleAssignment: jest.fn(),
    getAssignedStaffForRoleModification: jest.fn(),
    findOneBy: jest.fn(),
    deleteUser: jest.fn(),
    requestTelegramVerificationCode: jest.fn(),
    verifyTelegramCode: jest.fn(),
}

await jest.unstable_mockModule('../../../repositories/userRepository.js', () => ({
    userRepository: mockUserRepo,
}));

await jest.unstable_mockModule('../../../middlewares/uploadMiddleware.js', () => ({
    default: {
        single: () => (req, _res, next) => {
            req.file = { filename: 'mocked.png', path: 'mocked.png' };
            next();
        },
        array: () => (req, _res, next) => {
            req.files = [{ filename: 'mocked1.png', path: 'mocked1.png' }];
            next();
        },
    }
}));

export const mockUserService = {
    verifyPassword: jest.fn(() => true), // sempre "password corretta"
    hashPassword: jest.fn()
}

await jest.unstable_mockModule("../../../services/userService.js", () => ({
    default: mockUserService
}));
