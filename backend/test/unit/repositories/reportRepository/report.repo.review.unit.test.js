import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {conversationRepoStub, reportRepoStub, savedReports} from "../../mocks/repo.stubs.js";
import {mockMessageRepo} from "../../../mocks/repositories/message.repo.mock.js";
import {setupWsHandlerMock} from "../../../mocks/common.mocks.js";

await setupWsHandlerMock()

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');
const { broadcastToConversation } = await import("../../../../wsHandler.js")

describe('ReportRepository.reviewReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length=0;
    });

    it('returns null if report does not exist', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const res = await reportRepository.reviewReport({ reportId: 99, action: 'accept' });
        expect(res).toBeNull();
    });

    it('accepts a report and sets categoryId if provided', async () => {
        const mock = { id: 1, status: 'pending', categoryId: 0 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const res = await reportRepository.reviewReport({ reportId: 1, action: 'accept', categoryId: 5 });
        expect(res.status).toBe('assigned');
        expect(res.categoryId).toBe(5);
    });

    it('rejects a report and sends system message if conversation exists', async () => {
        const mock = { id: 2, status: 'pending', reject_explanation: '' };
        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 999 });

        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue({ id: 123 });

        const res = await reportRepository.reviewReport({ reportId: 2, action: 'reject', explanation: 'No info' });

        expect(res.status).toBe('rejected');
        expect(res.reject_explanation).toBe('No info');
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(123, expect.stringContaining('Rejected'));
        expect(broadcastToConversation).toHaveBeenCalledWith(123, { id: 999 });
    });

    it('accepts a report and sends system message if conversation exists', async () => {
        const mock = { id: 3, status: 'pending', categoryId: 0 };
        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 999 });

        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue({ id: 456 });

        const res = await reportRepository.reviewReport({ reportId: 3, action: 'accept' });
        expect(res.status).toBe('assigned');
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(456, expect.stringContaining('Assigned'));
        expect(broadcastToConversation).toHaveBeenCalledWith(456, { id: 999 });
    });
});