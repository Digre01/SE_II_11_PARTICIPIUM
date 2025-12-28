import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { conversationRepoStub, reportRepoStub, savedReports } from "../../mocks/repo.stubs.js";
import { mockMessageRepo } from "../../../mocks/repositories/message.repo.mock.js";
import { setupWsHandlerMock } from "../../../mocks/common.mocks.js";

await setupWsHandlerMock();

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');
const { broadcastToConversation } = await import("../../../../wsHandler.js");

describe('ReportRepository.resumeReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
    });

    it('returns null if report does not exist', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const res = await reportRepository.resumeReport({ reportId: 99, technicianId: 1 });
        expect(res).toBeNull();
    });

    it('resumes a report to in_progress if technicianId exists', async () => {
        const mock = { id: 1, status: 'suspended', technicianId: 42 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const res = await reportRepository.resumeReport({ reportId: 1, technicianId: 42 });
        expect(res.status).toBe('in_progress');
        expect(res.technicianId).toBe(42);
    });

    it('resumes a report to assigned if technicianId is null', async () => {
        const mock = { id: 2, status: 'suspended', technicianId: null };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const res = await reportRepository.resumeReport({ reportId: 2, technicianId: null });
        expect(res.status).toBe('assigned');
        expect(res.technicianId).toBeNull();
    });

    it('sends system message and broadcasts if conversation exists (in_progress case)', async () => {
        const mock = { id: 3, status: 'suspended', technicianId: 5 };
        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 999 });

        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue({ id: 123 });

        const res = await reportRepository.resumeReport({ reportId: 3, technicianId: 5 });
        expect(res.status).toBe('in_progress');
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(
            123,
            expect.stringContaining('In Progress (Resumed)')
        );
        expect(broadcastToConversation).toHaveBeenCalledWith(123, { id: 999 });
    });

    it('sends system message and broadcasts if conversation exists (assigned case)', async () => {
        const mock = { id: 4, status: 'suspended', technicianId: null };
        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 1000 });

        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue({ id: 456 });

        const res = await reportRepository.resumeReport({ reportId: 4, technicianId: null });
        expect(res.status).toBe('assigned');
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(
            456,
            expect.stringContaining('Assigned (Resumed)')
        );
        expect(broadcastToConversation).toHaveBeenCalledWith(456, { id: 1000 });
    });

    it('does not broadcast if no conversation exists', async () => {
        const mock = { id: 5, status: 'suspended', technicianId: 5 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        conversationRepoStub.findOne.mockResolvedValue(null);

        const res = await reportRepository.resumeReport({ reportId: 5, technicianId: 5 });
        expect(res.status).toBe('in_progress');
        expect(mockMessageRepo.createSystemMessageMock).not.toHaveBeenCalled();
        expect(broadcastToConversation).not.toHaveBeenCalled();
    });
});
