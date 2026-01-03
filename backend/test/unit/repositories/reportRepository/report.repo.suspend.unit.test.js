import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { conversationRepoStub, reportRepoStub, savedReports } from "../../mocks/repo.stubs.js";
import { mockMessageRepo } from "../../../mocks/repositories/message.repo.mock.js";
import { setupWsHandlerMock } from "../../../mocks/common.mocks.js";

await setupWsHandlerMock();

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');
const { broadcastToConversation } = await import("../../../../wsHandler.js");

describe('ReportRepository.suspendReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
    });

    it('returns null if report does not exist', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const res = await reportRepository.suspendReport({ reportId: 99, technicianId: 1 });
        expect(res).toBeNull();
    });

    it('suspends a report and keeps technicianId if it was in_progress', async () => {
        const mock = { id: 1, status: 'in_progress', technicianId: 42 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const res = await reportRepository.suspendReport({ reportId: 1, technicianId: 42 });
        expect(res.status).toBe('suspended');
        expect(res.technicianId).toBe(42);
    });

    it('suspends a report and resets technicianId if it was not in_progress', async () => {
        const mock = { id: 2, status: 'pending', technicianId: 42 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue({ ...mock, technicianId: null });

        const res = await reportRepository.suspendReport({ reportId: 2, technicianId: 42 });
        expect(res.status).toBe('pending');
        expect(res.technicianId).toBeNull();
    });

    it('sends system message and broadcasts if conversation exists', async () => {
        const mock = { id: 3, status: 'in_progress', technicianId: 5 };
        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 999 });

        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue({ id: 123 });

        const res = await reportRepository.suspendReport({ reportId: 3, technicianId: 5 });
        expect(res.status).toBe('suspended');
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(123, expect.stringContaining('Suspended'));
        expect(broadcastToConversation).toHaveBeenCalledWith(123, { id: 999 });
    });

    it('does not broadcast if no conversation exists', async () => {
        const mock = { id: 4, status: 'in_progress', technicianId: 5 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue(null);

        const res = await reportRepository.suspendReport({ reportId: 4, technicianId: 5 });
        expect(res.status).toBe('suspended');
        expect(mockMessageRepo.createSystemMessageMock).not.toHaveBeenCalled();
        expect(broadcastToConversation).not.toHaveBeenCalled();
    });
});
