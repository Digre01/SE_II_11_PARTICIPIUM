import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { conversationRepoStub, reportRepoStub, savedReports } from "../../mocks/repo.stubs.js";
import { mockMessageRepo } from "../../../mocks/repositories/message.repo.mock.js";
import { setupWsHandlerMock } from "../../../mocks/common.mocks.js";

await setupWsHandlerMock();

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');
const { broadcastToConversation } = await import("../../../../wsHandler.js");

describe('ReportRepository.finishReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
    });

    it('returns null if report does not exist', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const res = await reportRepository.finishReport({ reportId: 99, technicianId: 42 });
        expect(res).toBeNull();
        expect(reportRepoStub.save).not.toHaveBeenCalled();
    });

    it('returns null if technicianId does not match', async () => {
        const mock = { id: 1, status: 'in_progress', technicianId: 1 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);

        const res = await reportRepository.finishReport({ reportId: 1, technicianId: 999 });
        expect(res).toBeNull();
        expect(reportRepoStub.save).not.toHaveBeenCalled();
    });

    it('sets status to resolved and saves report when technicianId matches', async () => {
        const mock = { id: 2, status: 'in_progress', technicianId: 42 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue(null); // Nessuna conversazione

        const res = await reportRepository.finishReport({ reportId: 2, technicianId: 42 });
        expect(res.status).toBe('resolved');
        expect(reportRepoStub.save).toHaveBeenCalledWith(mock);
    });

    it('sends system message and broadcasts if conversation exists', async () => {
        const mock = { id: 3, status: 'in_progress', technicianId: 42 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const conversation = { id: 123 };
        conversationRepoStub.findOne.mockResolvedValue(conversation);

        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 999 });

        const res = await reportRepository.finishReport({ reportId: 3, technicianId: 42 });

        expect(res.status).toBe('resolved');
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(
            123,
            expect.stringContaining('Resolved')
        );
        expect(broadcastToConversation).toHaveBeenCalledWith(123, { id: 999 });
    });

    it('converts string reportId and technicianId to numbers', async () => {
        const mock = { id: 4, status: 'in_progress', technicianId: 42 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);
        conversationRepoStub.findOne.mockResolvedValue(null);

        const res = await reportRepository.finishReport({
            reportId: String(mock.id),
            technicianId: String(mock.technicianId)
        });

        expect(reportRepoStub.findOneBy).toHaveBeenCalledWith({ id: mock.id });
        expect(res.status).toBe('resolved');
    });
});
