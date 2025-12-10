import { jest } from '@jest/globals';

// ---- Shared mock repo factory ----
export const repoStub = (name) => ({
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
});

// ---- Individual repository stubs you will use in tests ----
export const reportRepoStub = repoStub('Report');
export const userRepoStub = repoStub('Users');
export const categoryRepoStub = repoStub('Categories');
export const photoRepoStub = repoStub('Photos');
export const conversationRepoStub = repoStub("Conversation");
export const userOfficeRepoStub = repoStub('UserOffice');
export const officeRepoStub = repoStub('Offices');

export const savedReports = [];
export const photoEntities = [];

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

await jest.unstable_mockModule('../../../repositories/conversationRepository.js', () => ({
    createConversation: jest.fn().mockResolvedValue({
        id: 999,
        report: { id: 123 },
        participants: [],
    }),
    addParticipantToConversation: jest.fn().mockResolvedValue(true),
}));

await jest.unstable_mockModule('../../../entities/Conversation.js', () => ({
    Conversation: { options: { name: 'Conversation' } },
}));

// ---- MOCK: data-source ----
jest.unstable_mockModule('../../../config/data-source.js', () => ({
    AppDataSourcePostgres: {
        getRepository: jest.fn((entity) => {
            const name = entity?.options?.name;
            if (name === 'Report' || name === 'Reports') return reportRepoStub;
            if (name === 'Users') return userRepoStub;
            if (name === 'Categories') return categoryRepoStub;
            if (name === 'Photos') return photoRepoStub;
            if (name === 'Conversation') return conversationRepoStub;
            if (name === 'UserOffice') return userOfficeRepoStub;
            if (name === 'Offices') return officeRepoStub;
            return reportRepoStub;
        }),
    },
}));


