import {beforeEach, describe, expect, it, jest} from "@jest/globals";
import {reportRepoStub} from "../../mocks/shared.mocks.js";

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');

describe('ReportRepository.getAllReports', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns all reports with photos and category relations', async () => {
        const mockReports = [
            {
                id: 1,
                title: 'Report 1',
                description: 'Description 1',
                status: 'pending',
                category: { id: 5, name: 'Infrastructure' },
                photos: [{ id: 1, link: '/public/photo1.jpg' }]
            },
            {
                id: 2,
                title: 'Report 2',
                description: 'Description 2',
                status: 'resolved',
                category: { id: 6, name: 'Public Safety' },
                photos: []
            }
        ];

        reportRepoStub.find.mockResolvedValue(mockReports);

        const result = await reportRepository.getAllReports();

        expect(reportRepoStub.find).toHaveBeenCalledWith({
            relations: ['photos', 'category']
        });
        expect(result).toEqual(mockReports);
        expect(result).toHaveLength(2);
    });

    it('returns empty array when no reports exist', async () => {
        reportRepoStub.find.mockResolvedValue([]);

        const result = await reportRepository.getAllReports();

        expect(reportRepoStub.find).toHaveBeenCalled();
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    it('returns reports with complete category and photos information', async () => {
        const mockReportsWithRelations = [
            {
                id: 1,
                title: 'Pothole on Main St',
                description: 'Large pothole causing traffic issues',
                status: 'pending',
                latitude: 45.123,
                longitude: 9.456,
                userId: 10,
                categoryId: 5,
                category: {
                    id: 5,
                    name: 'Infrastructure',
                    description: 'Roads, bridges, and public infrastructure'
                },
                photos: [
                    { id: 1, link: '/public/photo1.jpg', reportId: 1 },
                    { id: 2, link: '/public/photo2.jpg', reportId: 1 }
                ]
            }
        ];

        reportRepoStub.find.mockResolvedValue(mockReportsWithRelations);

        const result = await reportRepository.getAllReports();

        expect(reportRepoStub.find).toHaveBeenCalled();
        expect(result[0]).toHaveProperty('category');
        expect(result[0]).toHaveProperty('photos');
        expect(result[0].category).toHaveProperty('id', 5);
        expect(result[0].category).toHaveProperty('name', 'Infrastructure');
        expect(result[0].photos).toHaveLength(2);
    });
});

describe('ReportRepository.getReportById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns a specific report with relations when found', async () => {
        const mockReport = {
            id: 1,
            title: 'Pothole Report',
            description: 'Large pothole on Main St',
            status: 'pending',
            latitude: 45.123,
            longitude: 9.456,
            category: { id: 5, name: 'Infrastructure' },
            photos: [
                { id: 1, link: '/public/photo1.jpg' },
                { id: 2, link: '/public/photo2.jpg' }
            ]
        };

        reportRepoStub.findOne.mockResolvedValue(mockReport);

        const result = await reportRepository.getReportById(1);

        expect(reportRepoStub.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
            relations: ['photos', 'category']
        });
        expect(result).toEqual(mockReport);
        expect(result.photos).toHaveLength(2);
        expect(result.category.name).toBe('Infrastructure');
    });

    it('returns null when report not found', async () => {
        reportRepoStub.findOne.mockResolvedValue(null);

        const result = await reportRepository.getReportById(999);

        expect(reportRepoStub.findOne).toHaveBeenCalledWith({
            where: { id: 999 },
            relations: ['photos', 'category']
        });
        expect(result).toBeNull();
    });

    it('converts string id to number', async () => {
        const mockReport = { id: 42, title: 'Test', status: 'pending' };
        reportRepoStub.findOne.mockResolvedValue(mockReport);

        await reportRepository.getReportById('42');

        expect(reportRepoStub.findOne).toHaveBeenCalledWith({
            where: { id: 42 },
            relations: ['photos', 'category']
        });
    });

});

describe("ReportRepository.getReportsByCategory", () => {
    const categoryId = 1
    const mockReports = [
        {
            id: 1,
            title: 'Report 1',
            description: 'Description 1',
            status: 'pending',
            category: { id: categoryId, name: 'Infrastructure' },
            photos: [{ id: 1, link: '/public/photo1.jpg' }]
        },
        {
            id: 2,
            title: 'Report 2',
            description: 'Description 2',
            status: 'resolved',
            category: { id: categoryId, name: 'Public Safety' },
            photos: []
        }
    ];

    it("Returns report for internal technician", async () => {
        reportRepoStub.findBy.mockResolvedValue(mockReports)

        const result = await reportRepository.getReportsByCategory(categoryId)

        expect(result).toEqual(mockReports);
        expect(reportRepoStub.findBy).toHaveBeenCalledWith({categoryId})
    })

    it("Returns report for internal technician", async () => {
        const mockExternalReports = mockReports.map(r => ({...r, assignedExternal: true}))
        reportRepoStub.findBy.mockResolvedValue(mockExternalReports)

        const result = await reportRepository.getReportsByCategory(categoryId, true)

        expect(result).toEqual(mockExternalReports);
        expect(reportRepoStub.findBy).toHaveBeenCalledWith({categoryId, assignedExternal: true})
    })
})