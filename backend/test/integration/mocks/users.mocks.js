import {jest} from "@jest/globals";

export const mockRepo = {
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
    markEmailVerified: jest.fn()
}

await jest.unstable_mockModule('../../../repositories/userRepository.js', () => ({
    userRepository: mockRepo,
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