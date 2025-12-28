import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    reportRepoStub,
    categoryRepoStub,
    savedReports,
    userOfficeRepoStub,
    officeRepoStub,
    conversationRepoStub
} from '../../mocks/shared.mocks.js';
import {mockConversationRepo} from "../../../mocks/conversation.repo.mock.js";

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');

describe('ReportRepository external methods', () => {
    beforeEach(() => { jest.clearAllMocks(); savedReports.length=0; });

    it('externalChangeStatus updates report and adds participant', async () => {
        const mockReport = {
            id: 1,
            assignedExternal:true,
            status:'assigned',
            categoryId:5
        };

        reportRepoStub.findOne.mockResolvedValue(mockReport);
        categoryRepoStub.findOne.mockResolvedValue({ id:5, externalOfficeId:10 });
        userOfficeRepoStub.findOne.mockResolvedValue({ userId:77, officeId:10 });
        officeRepoStub.findOneBy.mockResolvedValue({ id:10, isExternal:true });
        conversationRepoStub.findOne.mockResolvedValue({ id:321, participants:[], isInternal:false });
        reportRepoStub.save.mockResolvedValue(mockReport);

        const res = await reportRepository._externalChangeStatus({ reportId:1, status:'resolved', externalMaintainerId:77 });
        expect(res.status).toBe('resolved');
        expect(mockConversationRepo.addParticipantToConversationMock).toHaveBeenCalledWith(321, 77);
    });
});