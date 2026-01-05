import { jest } from "@jest/globals";

export const mockTelegramAPIs = {
    verifyTelegram: jest.fn(),
    createReportFromWizard: jest.fn()
};

await jest.unstable_mockModule('../src/API.js', () => ({
    default: mockTelegramAPIs
}));
