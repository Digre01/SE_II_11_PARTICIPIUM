import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const savedReports = [];
const photoEntities = [];

const repoStub = (name) => {
    return {
        findOneBy: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };
};

// Create individual stubs we'll control inside tests
const reportRepoStub = repoStub('Report');
const userRepoStub = repoStub('Users');
const categoryRepoStub = repoStub('Categories');
const photoRepoStub = repoStub('Photos');

// Mock data-source BEFORE importing repository
await jest.unstable_mockModule('../../config/data-source.js', () => {
    return {
        AppDataSourcePostgres: {
            getRepository: jest.fn((entity) => {
                if (entity?.options?.name === 'Report') return reportRepoStub;
                if (entity?.options?.name === 'Users') return userRepoStub;
                if (entity?.options?.name === 'Categories') return categoryRepoStub;
                if (entity?.options?.name === 'Photos') return photoRepoStub;
                // fallback (could be actual class reference). We'll rely on name property defined in entity classes.
                    // Fallisce esplicitamente per scoprire subito l’entity “sconosciuta”
				
				return reportRepoStub;
            }),
        },
    };
});

//mock per broadcast e createSystemMessage (sto testando soltanto accept/reject del report e non i messaggi)
await jest.unstable_mockModule('../../wsHandler.js', () => ({
    broadcastToConversation: jest.fn(),
}));

await jest.unstable_mockModule('../../repositories/messageRepository.js', () => ({
    createSystemMessage: jest.fn().mockResolvedValue({ id: 1, content: 'System message' }),
}));

await jest.unstable_mockModule('../../entities/Conversation.js', () => ({
    Conversation: { options: { name: 'Conversation' } },
}));

const { reportRepository } = await import('../../repositories/reportRepository.mjs');

describe('ReportRepository.createReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
        photoEntities.length = 0;
        // Default: user & category exist
        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
        categoryRepoStub.findOneBy.mockResolvedValue({ id: 5 });
        
        // Mock staff members query for notification system
        userRepoStub.find.mockResolvedValue([
            {
                id: 20,
                userType: 'STAFF',
                userOffice: {
                    role: {
                        name: 'Municipal Public Relations Officer'
                    }
                }
            }
        ]);
        
        // Report create/save behavior
        reportRepoStub.create.mockImplementation((data) => ({ ...data, id: 123 }));
        reportRepoStub.save.mockImplementation(async (entity) => { savedReports.push(entity); return entity; });
        
        // Photos create/save
        photoRepoStub.create.mockImplementation((data) => ({ ...data, id: photoEntities.length + 1 }));
        photoRepoStub.save.mockImplementation(async (entity) => { photoEntities.push(entity); return entity; });
    });

    it('creates report and associated photos (success path)', async () => {
        const input = { title: 'Title', description: 'Desc', categoryId: 5, userId: 10, latitude: 45.2, longitude: 9.19, photos: ['/public/a.jpg', '/public/b.jpg'] };
        const result = await reportRepository.createReport(input);
        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 10 });
        expect(categoryRepoStub.findOneBy).toHaveBeenCalledWith({ id: 5 });
        expect(reportRepoStub.create).toHaveBeenCalledWith({
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            status: 'pending'
        });
        expect(result.id).toBe(123);
        expect(photoRepoStub.create).toHaveBeenCalledTimes(2);
        expect(photoRepoStub.save).toHaveBeenCalledTimes(2);
        expect(photoEntities.map(p => p.link)).toEqual(['/public/a.jpg', '/public/b.jpg']);
    });

    it('throws NotFoundError when user not found', async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);
        const input = { title: 'T', description: 'D', categoryId: 5, userId: 99, latitude: 0, longitude: 0, photos: [] };
        await expect(reportRepository.createReport(input)).rejects.toThrow(/userId '99' not found/);
        expect(reportRepoStub.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when category not found', async () => {
        categoryRepoStub.findOneBy.mockResolvedValue(null);
        const input = { title: 'T', description: 'D', categoryId: 555, userId: 10, latitude: 0, longitude: 0, photos: [] };
        await expect(reportRepository.createReport(input)).rejects.toThrow(/categoryId '555' not found/);
        expect(reportRepoStub.create).not.toHaveBeenCalled();
    });

    it('persists no photos when photos array empty', async () => {
        const input = { title: 'Title', description: 'Desc', categoryId: 5, userId: 10, latitude: 1, longitude: 2, photos: [] };
        await reportRepository.createReport(input);
        expect(photoRepoStub.create).not.toHaveBeenCalled();
        expect(photoRepoStub.save).not.toHaveBeenCalled();
    });
});

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

describe('ReportRepository.reviewReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
    });

    it('rejects report with explanation and sets status to rejected', async () => {
        const mockReport = {
            id: 1,
            title: 'Test Report',
            status: 'pending',
            reject_explanation: ''
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => {
            savedReports.push(entity);
            return entity;
        });

        const result = await reportRepository.reviewReport({
            reportId: 1,
            action: 'reject',
            explanation: 'Insufficient information provided'
        });

        expect(reportRepoStub.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(result.status).toBe('rejected');
        expect(result.reject_explanation).toBe('Insufficient information provided');
        expect(reportRepoStub.save).toHaveBeenCalledWith(mockReport);
    });

    it('rejects report without explanation (empty string)', async () => {
        const mockReport = {
            id: 2,
            title: 'Test Report',
            status: 'pending',
            reject_explanation: ''
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.reviewReport({
            reportId: 2,
            action: 'reject'
        });

        expect(result.status).toBe('rejected');
        expect(result.reject_explanation).toBe('');
    });

    it('accepts report and sets status to assigned', async () => {
        const mockReport = {
            id: 3,
            title: 'Test Report',
            status: 'pending',
            reject_explanation: 'Previous rejection',
            categoryId: 5
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.reviewReport({
            reportId: 3,
            action: 'accept'
        });

        expect(reportRepoStub.findOneBy).toHaveBeenCalledWith({ id: 3 });
        expect(result.status).toBe('assigned');
        expect(result.reject_explanation).toBe('');
        expect(reportRepoStub.save).toHaveBeenCalledWith(mockReport);
    });

    it('accepts report and updates category when categoryId provided', async () => {
        const mockReport = {
            id: 4,
            title: 'Test Report',
            status: 'pending',
            categoryId: 5
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.reviewReport({
            reportId: 4,
            action: 'accept',
            categoryId: 10
        });

        expect(result.status).toBe('assigned');
        expect(result.categoryId).toBe(10);
    });

    it('accepts report without changing category when categoryId not provided', async () => {
        const mockReport = {
            id: 5,
            title: 'Test Report',
            status: 'pending',
            categoryId: 7
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.reviewReport({
            reportId: 5,
            action: 'accept'
        });

        expect(result.status).toBe('assigned');
        expect(result.categoryId).toBe(7);
    });

    it('returns null when report not found', async () => {
        reportRepoStub.findOneBy.mockResolvedValue(null);

        const result = await reportRepository.reviewReport({
            reportId: 999,
            action: 'reject',
            explanation: 'Test'
        });

        expect(result).toBeNull();
        expect(reportRepoStub.save).not.toHaveBeenCalled();
    });

    it('converts string reportId to number', async () => {
        const mockReport = {
            id: 6,
            title: 'Test Report',
            status: 'pending'
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        await reportRepository.reviewReport({
            reportId: '6',
            action: 'reject',
            explanation: 'Test'
        });

        expect(reportRepoStub.findOneBy).toHaveBeenCalledWith({ id: 6 });
    });

    it('converts string categoryId to number when accepting', async () => {
        const mockReport = {
            id: 7,
            title: 'Test Report',
            status: 'pending',
            categoryId: 5
        };

        reportRepoStub.findOneBy.mockResolvedValue(mockReport);
        reportRepoStub.save.mockImplementation(async (entity) => entity);

        const result = await reportRepository.reviewReport({
            reportId: 7,
            action: 'accept',
            categoryId: '15'
        });

        expect(result.categoryId).toBe(15);
    });
});
