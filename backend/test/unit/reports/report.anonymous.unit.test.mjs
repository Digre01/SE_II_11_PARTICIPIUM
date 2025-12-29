import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    reportRepoStub,
    userRepoStub,
    categoryRepoStub,
    photoRepoStub,
    savedReports,
    photoEntities
} from '../mocks/reports.mock.js';

const { reportRepository } = await import('../../../repositories/reportRepository.mjs');

describe('ReportRepository.createReport - anonymous flag handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
        photoEntities.length = 0;

        // Default: user & category exist
        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
        categoryRepoStub.findOneBy.mockResolvedValue({ id: 5 });
        // No staff members by default (avoid undefined filter)
        userRepoStub.find.mockResolvedValue([]);

        // Report create/save behavior
        reportRepoStub.create.mockImplementation((data) => ({ ...data, id: 123 }));
        reportRepoStub.save.mockImplementation(async (entity) => {
            savedReports.push(entity);
            return entity;
        });

        // Photos create/save (no photos used in these tests but keep stubs)
        photoRepoStub.create.mockImplementation((data) => ({ ...data, id: photoEntities.length + 1 }));
        photoRepoStub.save.mockImplementation(async (entity) => {
            photoEntities.push(entity);
            return entity;
        });
    });

    it('persists isAnonymous when boolean true is provided', async () => {
        const input = {
            title: 'Anon Test',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            photos: [],
            isAnonymous: true
        };

        const result = await reportRepository.createReport(input);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            title: 'Anon Test',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            status: 'pending',
            isAnonymous: true
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', true);
    });

    it('persists isAnonymous when string "true" is provided', async () => {
        const input = {
            title: 'Anon Test Str',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            photos: [],
            isAnonymous: 'true'
        };

        const result = await reportRepository.createReport(input);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            title: 'Anon Test Str',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            status: 'pending',
            isAnonymous: true
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', true);
    });

    it('persists isAnonymous when boolean false is provided', async () => {
        const input = {
            title: 'Not Anon Test',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            photos: [],
            isAnonymous: false
        };

        const result = await reportRepository.createReport(input);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            title: 'Not Anon Test',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            status: 'pending',
            isAnonymous: false
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', false);
    });

    it('persists isAnonymous when string "false" is provided', async () => {
        const input = {
            title: 'Not Anon Test Str',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            photos: [],
            isAnonymous: 'false'
        };

        const result = await reportRepository.createReport(input);

        expect(reportRepoStub.create).toHaveBeenCalledWith({
            title: 'Not Anon Test Str',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            status: 'pending',
            isAnonymous: false
        });
        expect(result).toHaveProperty('id', 123);
        expect(savedReports[0]).toHaveProperty('isAnonymous', false);
    });
});
