import {jest} from "@jest/globals";

export const mockController = {
    configAccount: jest.fn().mockResolvedValue({
        id: 1,
        telegramId: 'tg_123',
        emailNotifications: true,
        photoId: 42,
    }),
    getPfpUrl: jest.fn().mockResolvedValue('/public/abc123.png')
};

await jest.unstable_mockModule('../../../../controllers/userController.js', () => ({
    default: mockController,
}));

// Mock upload middleware to bypass disk writes and support array() used in other routes
await jest.unstable_mockModule('../../../../middlewares/uploadMiddleware.js', () => ({
    default: {
        single: () => (req, _res, next) => { req.file = { filename: 'mocked.png', path: 'mocked.png' }; next(); },
        array: () => (req, _res, next) => { req.files = [{ filename: 'mocked1.png', path: 'mocked1.png' }]; next(); },
    }
}));