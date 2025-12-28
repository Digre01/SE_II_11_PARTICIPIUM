import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    reportRepoStub,
    userRepoStub,
    categoryRepoStub,
    photoRepoStub,
    savedReports,
    photoEntities
} from '../../mocks/repo.stubs.js';
import { mockConversationRepo } from '../../../mocks/repositories/conversation.repo.mock.js';
import { mockMessageRepo } from '../../../mocks/repositories/message.repo.mock.js';

const { reportRepository } = await import('../../../../repositories/reportRepository.mjs');

describe('ReportRepository.createReport', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        savedReports.length = 0;
        photoEntities.length = 0;

        userRepoStub.findOneBy.mockResolvedValue({ id: 10 });
        categoryRepoStub.findOneBy.mockResolvedValue({ id: 5 });

        userRepoStub.find.mockResolvedValue([
            {
                id: 20,
                userType: 'STAFF',
                userOffice: {
                    role: { name: 'Municipal Public Relations Officer' }
                }
            }
        ]);

        reportRepoStub.create.mockImplementation(data => ({
            ...data,
            id: 123
        }));

        reportRepoStub.save.mockImplementation(async entity => {
            savedReports.push(entity);
            return entity;
        });

        photoRepoStub.create.mockImplementation(data => ({
            ...data,
            id: photoEntities.length + 1
        }));

        photoRepoStub.save.mockImplementation(async entity => {
            photoEntities.push(entity);
            return entity;
        });

        mockConversationRepo.createConversationMock.mockResolvedValue({
            id: 999,
            report: { id: 123 },
            participants: [{ id: 10 }]
        });

        mockMessageRepo.createSystemMessageMock.mockResolvedValue({
            id: 555,
            content: 'Report status change to: Pending Approval'
        });
    });

    it('creates report and associated photos', async () => {
        const input = {
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            photos: ['/public/a.jpg', '/public/b.jpg']
        };

        const result = await reportRepository.createReport(input);

        expect(userRepoStub.findOneBy).toHaveBeenCalledWith({ id: 10 });
        expect(categoryRepoStub.findOneBy).toHaveBeenCalledWith({ id: 5 });
        expect(reportRepoStub.create).toHaveBeenCalled();
        expect(photoRepoStub.create).toHaveBeenCalledTimes(2);
        expect(photoEntities.map(p => p.link))
            .toEqual(['/public/a.jpg', '/public/b.jpg']);
        expect(result.id).toBe(123);
    });

    it('throws when user not found', async () => {
        userRepoStub.findOneBy.mockResolvedValue(null);

        await expect(
            reportRepository.createReport({
                title: 'T',
                description: 'D',
                categoryId: 5,
                userId: 99,
                latitude: 0,
                longitude: 0,
                photos: []
            })
        ).rejects.toThrow(/userId '99' not found/);
    });

    it('throws when category not found', async () => {
        categoryRepoStub.findOneBy.mockResolvedValue(null);

        await expect(
            reportRepository.createReport({
                title: 'T',
                description: 'D',
                categoryId: 555,
                userId: 10,
                latitude: 0,
                longitude: 0,
                photos: []
            })
        ).rejects.toThrow(/categoryId '555' not found/);
    });

    it('does not persist photos when photos array empty', async () => {
        await reportRepository.createReport({
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 1,
            longitude: 2,
            photos: []
        });

        expect(photoRepoStub.create).not.toHaveBeenCalled();
        expect(photoRepoStub.save).not.toHaveBeenCalled();
    });

    it('does not persist photos when photos is undefined', async () => {
        await reportRepository.createReport({
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 1,
            longitude: 2
        });

        expect(photoRepoStub.create).not.toHaveBeenCalled();
        expect(photoRepoStub.save).not.toHaveBeenCalled();
    });

    it('creates conversation with only reporting user when no municipal staff exists', async () => {
        const mockConversation = {
            report: expect.objectContaining({ id: 123 }),
            participants: [{ id: 10 }]
        };

        userRepoStub.find.mockResolvedValue([
            {
                id: 30,
                userType: 'STAFF',
                userOffice: {
                    role: { name: 'Other Role' }
                }
            }
        ]);

        mockConversationRepo.createConversationMock
            .mockResolvedValue(mockConversation);

        await reportRepository.createReport({
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 1,
            longitude: 2,
            photos: []
        });

        expect(mockConversationRepo.createConversationMock)
            .toHaveBeenCalledWith(mockConversation);
    });

    it('handles userOffice array correctly when filtering municipal staff', async () => {
        userRepoStub.find.mockResolvedValue([
            {
                id: 20,
                userType: 'STAFF',
                userOffice: [
                    { role: { name: 'Municipal Public Relations Officer' } }
                ]
            }
        ]);

        await reportRepository.createReport({
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 1,
            longitude: 2,
            photos: []
        });

        expect(mockConversationRepo.createConversationMock)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    participants: expect.arrayContaining([
                        { id: 10 },
                        expect.objectContaining({ id: 20 })
                    ])
                })
            );
    });

    it('creates system message after conversation creation', async () => {
        await reportRepository.createReport({
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 1,
            longitude: 2,
            photos: []
        });

        expect(mockMessageRepo.createSystemMessageMock)
            .toHaveBeenCalledWith(
                999,
                'Report status change to: Pending Approval'
            );
    });

});
