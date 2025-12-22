import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    reportRepoStub,
    userRepoStub,
    categoryRepoStub,
    photoRepoStub,
    savedReports,
    photoEntities,
    userOfficeRepoStub,
    officeRepoStub,
    conversationRepoStub
} from '../mocks/reports.mock.js';
import {addParticipantToConversationMock} from "../mocks/external.mocks.js";

const { reportRepository } = await import('../../../repositories/reportRepository.mjs');

describe('ReportRepository.createReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
        photoEntities.length = 0;

        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
        categoryRepoStub.findOneBy.mockResolvedValue({ id: 5 });

        userRepoStub.find.mockResolvedValue([{ id: 20, userType: 'STAFF', userOffice: { role: { name: 'Municipal Public Relations Officer' } } }]);

        reportRepoStub.create.mockImplementation((data) => ({ ...data, id: 123 }));
        reportRepoStub.save.mockImplementation(async (entity) => { savedReports.push(entity); return entity; });

        photoRepoStub.create.mockImplementation((data) => ({ ...data, id: photoEntities.length + 1 }));
        photoRepoStub.save.mockImplementation(async (entity) => { photoEntities.push(entity); return entity; });
    });

    it('creates report and associated photos', async () => {
        const input = { title: 'Title', description: 'Desc', categoryId: 5, userId: 10, latitude: 45.2, longitude: 9.19, photos: ['/public/a.jpg','/public/b.jpg'] };
        const result = await reportRepository.createReport(input);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 10 });
        expect(categoryRepoStub.findOneBy).toHaveBeenCalledWith({ id: 5 });
        expect(reportRepoStub.create).toHaveBeenCalled();
        expect(photoRepoStub.create).toHaveBeenCalledTimes(2);
        expect(photoEntities.map(p => p.link)).toEqual(['/public/a.jpg','/public/b.jpg']);
        expect(result.id).toBe(123);
    });

    it('throws when user not found', async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        await expect(reportRepository.createReport({ title: 'T', description: 'D', categoryId: 5, userId: 99, latitude: 0, longitude: 0, photos: [] }))
            .rejects.toThrow(/userId '99' not found/);
    });

    it('throws when category not found', async () => {
        categoryRepoStub.findOneBy.mockResolvedValue(null);
        await expect(reportRepository.createReport({ title: 'T', description: 'D', categoryId: 555, userId: 10, latitude: 0, longitude: 0, photos: [] }))
            .rejects.toThrow(/categoryId '555' not found/);
    });

    it('does not persist photos when photos array empty', async () => {
        await reportRepository.createReport({ title: 'Title', description: 'Desc', categoryId: 5, userId: 10, latitude: 1, longitude: 2, photos: [] });
        expect(photoRepoStub.create).not.toHaveBeenCalled();
        expect(photoRepoStub.save).not.toHaveBeenCalled();
    });
});

describe('ReportRepository.reviewReport', () => {
    beforeEach(() => { jest.clearAllMocks(); savedReports.length=0; });

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

describe('ReportRepository external methods', () => {
    beforeEach(() => { jest.clearAllMocks(); savedReports.length=0; });

    it('externalChangeStatus updates report and adds participant', async () => {
        const mockReport = { id: 1, assignedExternal:true, status:'assigned', categoryId:5 };
        reportRepoStub.findOne.mockResolvedValue(mockReport);
        categoryRepoStub.findOne.mockResolvedValue({ id:5, externalOfficeId:10 });
        userOfficeRepoStub.findOne.mockResolvedValue({ userId:77, officeId:10 });
        officeRepoStub.findOneBy.mockResolvedValue({ id:10, isExternal:true });
        conversationRepoStub.findOne.mockResolvedValue({ id:321, participants:[], isInternal:false });
        reportRepoStub.save.mockResolvedValue(mockReport);

        const res = await reportRepository._externalChangeStatus({ reportId:1, status:'resolved', externalMaintainerId:77 });
        expect(res.status).toBe('resolved');
        expect(addParticipantToConversationMock).toHaveBeenCalledWith(321, 77);
    });
});

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