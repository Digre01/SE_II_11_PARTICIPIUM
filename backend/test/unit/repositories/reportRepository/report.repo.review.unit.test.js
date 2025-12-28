import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {reportRepoStub, savedReports} from "../../mocks/shared.mocks.js";

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');

describe('ReportRepository.reviewReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length=0;
    });

    it('accepts a report', async () => {
        const mock = { id: 1, status: 'pending', categoryId: 5 };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const res = await reportRepository.reviewReport({ reportId:1, action:'accept' });
        expect(res.status).toBe('assigned');
    });

    it('rejects a report', async () => {
        const mock = { id: 2, status: 'pending', reject_explanation: '' };
        reportRepoStub.findOneBy.mockResolvedValue(mock);
        reportRepoStub.save.mockResolvedValue(mock);

        const res = await reportRepository.reviewReport({ reportId:2, action:'reject', explanation:'No info' });
        expect(res.status).toBe('rejected');
        expect(res.reject_explanation).toBe('No info');
    });
});