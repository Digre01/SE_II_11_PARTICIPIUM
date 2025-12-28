import {jest} from "@jest/globals";

export const mockMessageRepo = {
    getMessagesForConversationMock: jest.fn(),
    sendStaffMessageMock: jest.fn(),
    createMessageMock: jest.fn(),
    createSystemMessageMock: jest.fn(),
};

await jest.unstable_mockModule('../../../repositories/messageRepository.js', () => ({
    getMessagesForConversation: mockMessageRepo.getMessagesForConversationMock,
    sendStaffMessage: mockMessageRepo.sendStaffMessageMock,
    createMessage: mockMessageRepo.createMessageMock,
    createSystemMessage: mockMessageRepo.createSystemMessageMock
}));
