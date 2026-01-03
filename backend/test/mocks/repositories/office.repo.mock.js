import { jest } from "@jest/globals";

// Role Repository mock
export const mockOfficeRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
};

await jest.unstable_mockModule('../../../repositories/officeRepository.js', () => ({
    officeRepository: mockOfficeRepo,
}));

await jest.unstable_mockModule('../../../repositories/messageRepository.js', () => ({
    createSystemMessage: jest.fn().mockResolvedValue({
        id: 1,
        content: 'System message',
    }),
    getMessagesForConversation: jest.fn(),
    sendStaffMessage: jest.fn()
}));