import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    categoryRepoStub,
    photoEntities,
    photoRepoStub,
    reportRepoStub,
    savedReports,
    userRepoStub
} from "../../mocks/repo.stubs.js";
import {setupWsHandlerMock} from "../../../mocks/common.mocks.js";
import { mockConversationRepo } from '../../../mocks/repositories/conversation.repo.mock.js';
import { mockMessageRepo } from '../../../mocks/repositories/message.repo.mock.js';

await setupWsHandlerMock();
const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');

describe('ReportRepository.createReport - anonymous flag handling', () => {
    const anonTrueReport = {
        title: 'Anon Test',
        description: 'Desc',
        categoryId: 5,
        userId: 10,
        latitude: 45.2,
        longitude: 9.19,
        isAnonymous: true
    };

    const anonTrueStringReport = {
        title: 'Anon Test Str',
        description: 'Desc',
        categoryId: 5,
        userId: 10,
        latitude: 45.2,
        longitude: 9.19,
        isAnonymous: 'true'
    };

    const anonFalseReport = {
        title: 'Not Anon Test',
        description: 'Desc',
        categoryId: 5,
        userId: 10,
        latitude: 45.2,
        longitude: 9.19,
        isAnonymous: false
    };

    const anonFalseStringReport = {
        title: 'Not Anon Test Str',
        description: 'Desc',
        categoryId: 5,
        userId: 10,
        latitude: 45.2,
        longitude: 9.19,
        isAnonymous: 'false'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
        photoEntities.length = 0;

        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
        categoryRepoStub.findOneBy.mockResolvedValue({ id: 5 });
        userRepoStub.find.mockResolvedValue([]);

        reportRepoStub.create.mockImplementation((data) => ({ ...data, id: 123 }));
        reportRepoStub.save.mockImplementation(async (entity) => {
            savedReports.push(entity);
            return entity;
        });

        photoRepoStub.create.mockImplementation((data) => ({ ...data, id: photoEntities.length + 1 }));
        photoRepoStub.save.mockImplementation(async (entity) => {
            photoEntities.push(entity);
            return entity;
        });

        mockConversationRepo.createConversationMock.mockResolvedValue({
            id: 999,
            report: { id: 123 },
            participants: [{ id: 10 }]
        });

        mockMessageRepo.createSystemMessageMock.mockResolvedValue({
            id: 555,
            content: 'Report status change to: Pending Approval'
        });
    });

    it('persists isAnonymous when boolean true is provided', async () => {
        const result = await reportRepository.createReport(anonTrueReport);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            ...anonTrueReport,
            status: 'pending',
            isAnonymous: true
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', true);
    });

    it('persists isAnonymous when string "true" is provided', async () => {
        const result = await reportRepository.createReport(anonTrueStringReport);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            ...anonTrueStringReport,
            status: 'pending',
            isAnonymous: true
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', true);
    });

    it('persists isAnonymous when boolean false is provided', async () => {
        const result = await reportRepository.createReport(anonFalseReport);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            ...anonFalseReport,
            status: 'pending',
            isAnonymous: false
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', false);
    });

    it('persists isAnonymous when string "false" is provided', async () => {
        const result = await reportRepository.createReport(anonFalseStringReport);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            ...anonFalseStringReport,
            status: 'pending',
            isAnonymous: false
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', false);
    });
});
