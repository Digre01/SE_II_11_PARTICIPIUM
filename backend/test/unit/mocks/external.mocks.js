import { jest } from '@jest/globals';

// ---- MOCK: WebSocket handler ----
await jest.unstable_mockModule('../../../wsHandler.js', () => ({
    broadcastToConversation: jest.fn(),
}));

// ---- MOCK: messageRepository ----
await jest.unstable_mockModule('../../../repositories/messageRepository.js', () => ({
    createSystemMessage: jest.fn().mockResolvedValue({
        id: 1,
        content: 'System message',
    }),
}));

// ---- MOCK: conversationRepository ----
await jest.unstable_mockModule('../../../repositories/conversationRepository.js', () => ({
    createConversation: jest.fn().mockResolvedValue({
        id: 999,
        report: { id: 123 },
        participants: [],
    }),
    addParticipantToConversation: jest.fn().mockResolvedValue(true),
}));