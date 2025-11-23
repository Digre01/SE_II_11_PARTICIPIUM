import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {conversationRepoStub, reportRepoStub} from "../mocks/reports.mock.js";

const { reportRepository } = await import('../../../repositories/reportRepository.mjs');

describe('ReportRepository.startReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        conversationRepoStub.findOne.mockResolvedValue(null); // Default: no conversation
    });

    it('updates report status to in_progress and sets technicianId', async () => {
        const mockReport = {
            id: 1,
            title: 'Test Report',
            status: 'assigned',
            technicianId: null
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.startReport({
            reportId: 1,
            technicianId: 42
        });

        expect(reportRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(result.status).toBe('in_progress');
        expect(result.technicianId).toBe(42);
        expect(reportRepoStub.save).toHaveBeenCalledWith(mockReport);
    });

    it('returns null when report not found', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const result = await reportRepository.startReport({
            reportId: 999,
            technicianId: 42
        });

        expect(result).toBeNull();
        expect(reportRepoStub.save).not.toHaveBeenCalled();
    });

    it('converts string reportId and technicianId to numbers', async () => {
        const mockReport = {
            id: 2,
            title: 'Test Report',
            status: 'assigned',
            technicianId: null
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.startReport({
            reportId: '2',
            technicianId: '99'
        });

        expect(reportRepoStub.findOneBy).toHaveBeenCalledWith({ id: 2 });
        expect(result.technicianId).toBe(99);
    });
});