import { jest } from '@jest/globals';

export const repoStub = (name) => ({
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    getMany: jest.fn(),
    getConversationsForUser: jest.fn(),
    broadcastSpy: jest.fn(),
    delete: jest.fn(),
});

export const reportRepoStub = repoStub('Report');
export const userRepoStub = repoStub('Users');
export const categoryRepoStub = repoStub('Categories');
export const photoRepoStub = repoStub('Photos');
export const conversationRepoStub = repoStub('Conversation');
export const userOfficeRepoStub = repoStub('UserOffice');
export const officeRepoStub = repoStub('Offices');
export const messageRepoStub = repoStub('Message');
export const notificationRepoStub = repoStub('Notification');
export const rolesRepoStub = repoStub('Roles');

await jest.unstable_mockModule('../../../config/data-source.js', () => ({
    AppDataSourcePostgres: {
        getRepository: jest.fn((entity) => {
            const name = entity?.options?.name || entity;

            if (name === 'Offices') return officeRepoStub;
            if (name === 'Report' || name === 'Reports') return reportRepoStub;
            if (name === 'Users') return userRepoStub;
            if (name === 'Categories') return categoryRepoStub;
            if (name === 'Photos') return photoRepoStub;
            if (name === 'Conversation') return conversationRepoStub;
            if (name === 'UserOffice') return userOfficeRepoStub;
            if (name === 'Message') return messageRepoStub;
            if (name === 'Notification') return notificationRepoStub;
            if (name === 'Roles') return rolesRepoStub;
        }),
    },
}));

export const savedReports = [];
export const photoEntities = [];

await jest.unstable_mockModule('../../../entities/Conversation.js', () => ({
    Conversation: { options: { name: 'Conversation' } },
}));

await jest.unstable_mockModule('../../../entities/Message.js', () => ({
    Message: { options: { name: 'Message' } },
}));

await jest.unstable_mockModule('../../../entities/Categories.js', () => ({
    Categories: { options: { name: 'Categories' } },
}));

await jest.unstable_mockModule('../../../entities/Reports.js', () => ({
    Report: { options: { name: 'Report' } },
}));

await jest.unstable_mockModule('../../../entities/Users.js', () => ({
    Users: { options: { name: 'Users' } },
}));

await jest.unstable_mockModule('../../../entities/Photos.js', () => ({
    Photos: { options: { name: 'Photos' } },
}));

await jest.unstable_mockModule('../../../entities/UserOffice.js', () => ({
    UserOffice: { options: { name: 'UserOffice' } },
}));

await jest.unstable_mockModule('../../../entities/Offices.js', () => ({
    Office: { options: { name: 'Offices' } },
}));

await jest.unstable_mockModule('../../../entities/Notification.js', () => ({
    Notification: { options: { name: 'Notification' } },
}));

await jest.unstable_mockModule('../../../entities/Roles.js', () => ({
    Roles: { options: { name: 'Roles' } },
}));