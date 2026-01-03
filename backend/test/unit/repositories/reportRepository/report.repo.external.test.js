import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { conversationRepoStub, reportRepoStub, savedReports } from "../../mocks/repo.stubs.js";
import { mockMessageRepo } from "../../../mocks/repositories/message.repo.mock.js";
import { setupWsHandlerMock } from "../../../mocks/common.mocks.js";
import {mockConversationRepo} from "../../../mocks/repositories/conversation.repo.mock.js";

await setupWsHandlerMock();

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');
const { broadcastToConversation } = await import("../../../../wsHandler.js");

describe('ReportRepository.assignReportToExternalMaintainer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
    });

    it('returns null if report does not exist', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const res = await reportRepository.assignReportToExternalMaintainer(99, 1);
        expect(res).toBeNull();
    });

    it('assigns report to external and saves it', async () => {
        const mockReport = { id: 1, assignedExternal: false };
        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockResolvedValue({ ...mockReport, assignedExternal: true });

        mockConversationRepo.createConversationMock.mockResolvedValue({ id: 456 })

        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 1 });

        const res = await reportRepository.assignReportToExternalMaintainer(1, 42);

        expect(res.assignedExternal).toBe(true);
        expect(reportRepoStub.save).toHaveBeenCalledWith({ ...mockReport, assignedExternal: true });

        expect(mockConversationRepo.addParticipantToConversationMock).toHaveBeenCalledWith(456, 42);
    });


    it('adds internal staff to conversation and broadcasts system message if conversation exists', async () => {
        const mockReport = { id: 2, assignedExternal: false };
        const existingConversation = { id: 123, participants: [] };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockResolvedValue({ ...mockReport, assignedExternal: true });

        conversationRepoStub.findOne.mockResolvedValue(existingConversation);

        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 999 });

        const res = await reportRepository.assignReportToExternalMaintainer(2, 42);

        expect(mockConversationRepo.addParticipantToConversationMock).toHaveBeenCalledWith(123, 42);

        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(
            123,
            expect.stringContaining('assigned to external office')
        );
        expect(broadcastToConversation).toHaveBeenCalledWith(123, { id: 999 });

        expect(res.assignedExternal).toBe(true);
    });

    it('creates new conversation, adds participant, sends first message and broadcasts it', async () => {
        const mockReport = { id: 3, assignedExternal: false };
        const mockConversation = { id: 456 };
        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockResolvedValue({ ...mockReport, assignedExternal: true });

        conversationRepoStub.findOne.mockResolvedValue(null); // No existing conversation
        mockConversationRepo.createConversationMock.mockResolvedValue(mockConversation);
        mockMessageRepo.createSystemMessageMock.mockResolvedValue({ id: 1000 });

        const res = await reportRepository.assignReportToExternalMaintainer(3, 42);

        expect(mockConversationRepo.createConversationMock).toHaveBeenCalledWith({
            report: mockReport,
            participants: [],
            isInternal: true
        });
        expect(mockConversationRepo.addParticipantToConversationMock).toHaveBeenCalledWith(456, 42);
        expect(mockMessageRepo.createSystemMessageMock).toHaveBeenCalledWith(
            456,
            expect.stringContaining('assigned to external office')
        );
        expect(broadcastToConversation).toHaveBeenCalledWith(456, { id: 1000 });
        expect(res.assignedExternal).toBe(true);
    })
});