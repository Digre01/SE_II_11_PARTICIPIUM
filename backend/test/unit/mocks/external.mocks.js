import { jest } from '@jest/globals';


export const getConversationsForUserMock = jest.fn().mockResolvedValue([]);
export const createConversationMock = jest.fn().mockResolvedValue({
    id: 999,
    report: { id: 123 },
    participants: [],
});
export const addParticipantToConversationMock = jest.fn().mockResolvedValue(true);

await jest.unstable_mockModule('../../../repositories/conversationRepository.js', () => ({
    getConversationsForUser: getConversationsForUserMock,
    createConversation: createConversationMock,
    addParticipantToConversation: addParticipantToConversationMock,
}));

export const nodemailerMock = {
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({
            messageId: 'test-message-id',
            accepted: ['test@example.com'],
            rejected: [],
            response: '250 Message accepted'
        }),
        verify: jest.fn().mockResolvedValue(true),
        close: jest.fn()
    }))
};

await jest.unstable_mockModule('../../../utils/email.js', () => ({
    default: nodemailerMock,
    createTransport: nodemailerMock.createTransport
}));