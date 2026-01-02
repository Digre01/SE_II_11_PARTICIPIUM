import {jest} from "@jest/globals";

export const mockConversationRepo = {
    getConversationsForUserMock: jest.fn(),
    createConversationMock: jest.fn(),
    addParticipantToConversationMock: jest.fn(),
}

await jest.unstable_mockModule('../../../repositories/conversationRepository.js', () => ({
    getConversationsForUser: mockConversationRepo.getConversationsForUserMock,
    createConversation: mockConversationRepo.createConversationMock,
    addParticipantToConversation: mockConversationRepo.addParticipantToConversationMock
}));
