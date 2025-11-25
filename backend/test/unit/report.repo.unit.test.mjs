import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const savedReports = [];
const photoEntities = [];

const repoStub = (name) => {
    return {
        findOneBy: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
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

const { reportRepository } = await import('../../repositories/reportRepository.mjs');

describe('ReportRepository.createReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
        photoEntities.length = 0;
        // Default: user & category exist
        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
        categoryRepoStub.findOneBy.mockResolvedValue({ id: 5 });
        
        // Mock staff members for notification
        userRepoStub.find.mockResolvedValue([
            {
                id: 99,
                userType: 'staff',
                userOffice: {
                    role: { name: 'Municipal Public Relations Officer' }
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

