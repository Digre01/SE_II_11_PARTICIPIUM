import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {reportRepoStub} from "../../mocks/repo.stubs.js";

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');

const emptyArray = [];

const baseMockReports = [
    {
        id: 1,
        title: 'Report 1',
        description: 'Description 1',
        status: 'pending',
        categoryId: 1,
        technicianId: 1,
        assignedExternal: false,
        category: { id: 1, name: 'Infrastructure' },
        photos: [{ id: 1, link: '/public/photo1.jpg' }]
    },
    {
        id: 2,
        title: 'Report 2',
        description: 'Description 2',
        status: 'resolved',
        categoryId: 1,
        technicianId: 1,
        assignedExternal: false,
        category: { id: 1, name: 'Public Safety' },
        photos: []
    }
];

describe('ReportRepository.getAllReports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns all reports with photos and category relations', async () => {
        reportRepoStub.find.mockResolvedValue(baseMockReports);

        const result = await reportRepository.getAllReports();

        expect(reportRepoStub.find).toHaveBeenCalledWith({
            relations: ['photos', 'category']
        });
        expect(result).toEqual(baseMockReports);
        expect(result).toHaveLength(2);
    });

    it('returns empty array when no reports exist', async () => {
        reportRepoStub.find.mockResolvedValue(emptyArray);

        const result = await reportRepository.getAllReports();

        expect(reportRepoStub.find).toHaveBeenCalled();
        expect(result).toEqual(emptyArray);
        expect(result).toHaveLength(0);
    });
});

describe('ReportRepository.getReportById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns a specific report with relations when found', async () => {
        const mockReport = {
            ...baseMockReports[0],
            latitude: 45.123,
            longitude: 9.456
        };

        reportRepoStub.findOne.mockResolvedValue(mockReport);

        const result = await reportRepository.getReportById(1);

        expect(reportRepoStub.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            relations: ['photos', 'category']
        });
        expect(result).toEqual(mockReport);
        expect(result.photos).toHaveLength(1);
    });

    it('returns null when report not found', async () => {
        reportRepoStub.findOne.mockResolvedValue(null);

        const result = await reportRepository.getReportById(999);

        expect(result).toBeNull();
    });

    it('converts string id to number', async () => {
        reportRepoStub.findOne.mockResolvedValue(baseMockReports[0]);

        await reportRepository.getReportById('1');

        expect(reportRepoStub.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            relations: ['photos', 'category']
        });
    });
});

describe("ReportRepository.getReportsByCategory", () => {
    const categoryId = 1;

    it("returns reports for internal technician", async () => {
        reportRepoStub.findBy.mockResolvedValue(baseMockReports);

        const result = await reportRepository.getReportsByCategory(categoryId);

        expect(result).toEqual(baseMockReports);
        expect(reportRepoStub.findBy).toHaveBeenCalledWith({ categoryId });
    });

    it("returns reports for external technician", async () => {
        const externalReports = baseMockReports.map(r => ({
            ...r,
            assignedExternal: true
        }));

        reportRepoStub.findBy.mockResolvedValue(externalReports);

        const result = await reportRepository.getReportsByCategory(categoryId, true);

        expect(result).toEqual(externalReports);
        expect(reportRepoStub.findBy).toHaveBeenCalledWith({
            categoryId,
            assignedExternal: true
        });
    });
});

/* =========================
   getReportsByTechnician
========================= */

describe("ReportRepository.getReportsByTechnicianId", () => {
    const technicianId = 1;

    it("returns reports for technician", async () => {
        reportRepoStub.findBy.mockResolvedValue(baseMockReports);

        const result = await reportRepository.getReportsByTechnician(technicianId);

        expect(result).toEqual(baseMockReports);
        expect(reportRepoStub.findBy).toHaveBeenCalledWith({ technicianId });
    });

    it("returns empty array if no reports are assigned", async () => {
        reportRepoStub.findBy.mockResolvedValue(emptyArray);

        const result = await reportRepository.getReportsByTechnician(technicianId);

        expect(result).toEqual(emptyArray);
    });
});

describe("ReportRepository.getAcceptedReports", () => {
    const acceptedReports = [
        { ...baseMockReports[0], status: 'assigned' },
        { ...baseMockReports[1], status: 'in_progress' }
    ];

    it("returns accepted reports", async () => {
        reportRepoStub.find.mockResolvedValue(acceptedReports);

        const result = await reportRepository.getAcceptedReports();

        expect(result).toEqual(acceptedReports);
    });

    it("returns empty array if no reports are accepted", async () => {
        reportRepoStub.find.mockResolvedValue(emptyArray);

        const result = await reportRepository.getAcceptedReports();

        expect(result).toEqual(emptyArray);
    });
});
