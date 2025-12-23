import {jest} from "@jest/globals";

export const mockRepo = {
    getMessagesForConversation: jest.fn(),
    sendStaffMessage: jest.fn(),
};

await jest.unstable_mockModule('../../../repositories/messageRepository.js', () => ({
    getMessagesForConversation: mockRepo.getMessagesForConversation,
    sendStaffMessage: mockRepo.sendStaffMessage,
    createMessage: jest.fn(),
    createSystemMessage: jest.fn(),
}));
