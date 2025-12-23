import { jest } from "@jest/globals";
import { setupAuthorizationMock } from "./common.mocks.js";
import {nodemailerMock} from "../../unit/mocks/external.mocks.js";

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

await jest.unstable_mockModule('../../../utils/email.js', () => ({
    default: nodemailerMock,
    createTransport: nodemailerMock.createTransport,
    sendVerificationEmail: jest.fn()
}));

await jest.unstable_mockModule('../../../repositories/messageRepository.js', () => ({
    createSystemMessage: jest.fn().mockResolvedValue({
        id: 1,
        content: 'System message',
    }),
    getMessagesForConversation: jest.fn(),
    sendStaffMessage: jest.fn()
}));