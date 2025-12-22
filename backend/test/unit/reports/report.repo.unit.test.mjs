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


// --- MOCK ESM MODULES PRIMA DEGLI IMPORT ---
// Mock data-source
await jest.unstable_mockModule('../../config/data-source.js', () => ({
    AppDataSourcePostgres: {
        getRepository: jest.fn((entity) => {
            if (entity?.options?.name === 'Report') return reportRepoStub;
            if (entity?.options?.name === 'Users') return userRepoStub;
            if (entity?.options?.name === 'Categories') return categoryRepoStub;
            if (entity?.options?.name === 'Photos') return photoRepoStub;
            return reportRepoStub;
        })
    }
}));

// Mock messageRepository
const createSystemMessageMock = jest.fn().mockResolvedValue('msg');
await jest.unstable_mockModule('../../repositories/messageRepository.js', () => ({
    createSystemMessage: createSystemMessageMock
}));

// Mock wsHandler
const broadcastToConversationMock = jest.fn().mockResolvedValue();
await jest.unstable_mockModule('../../wsHandler.js', () => ({
    broadcastToConversation: broadcastToConversationMock
}));

// Mock conversationRepository (serve sia addParticipantToConversation che createConversation)
const addParticipantToConversationMock = jest.fn().mockResolvedValue();
const createConversationMock = jest.fn().mockResolvedValue({ id: 42 });
await jest.unstable_mockModule('../../repositories/conversationRepository.js', () => ({
    addParticipantToConversation: addParticipantToConversationMock,
    createConversation: createConversationMock
}));


const { reportRepository } = await import('../../../repositories/reportRepository.mjs');

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

        // --- getAllReports ---
    it('getAllReports chiama find con relations', async () => {
        reportRepoStub.find.mockResolvedValue([{ id: 1 }]);
        const result = await reportRepository.getAllReports();
        expect(reportRepoStub.find).toHaveBeenCalledWith({ relations: ['photos', 'category'] });
        expect(result).toEqual([{ id: 1 }]);
    });

    // --- getReportById ---
    it('getReportById chiama findOne con where e relations', async () => {
        reportRepoStub.findOne.mockResolvedValue({ id: 2 });
        const result = await reportRepository.getReportById(2);
        expect(reportRepoStub.findOne).toHaveBeenCalledWith({ where: { id: 2 }, relations: ['photos', 'category'] });
        expect(result).toEqual({ id: 2 });
    });

    // --- getAcceptedReports ---
    it('getAcceptedReports call find where status are assigned e suspended', async () => {
        reportRepoStub.find.mockResolvedValue([
            { id: 3, status: 'assigned' },
            { id: 4, status: 'suspended' }
        ]);
        const result = await reportRepository.getAcceptedReports();
        expect(reportRepoStub.find).toHaveBeenCalledWith({
            where: [
                { status: 'assigned' },
                { status: 'suspended' }
            ],
            relations: ['photos', 'category', 'user']
        });
        expect(result).toEqual([
            { id: 3, status: 'assigned' },
            { id: 4, status: 'suspended' }
        ]);
    });

    // --- reviewReport: null ---
    it('reviewReport ritorna null se report non trovato', async () => {
        reportRepoStub.findOneBy.mockResolvedValueOnce(null);
        const result = await reportRepository.reviewReport({ reportId: 99, action: 'accept', explanation: '', categoryId: 5 });
        expect(result).toBeNull();
    });

    // --- reviewReport: accept ---
    it('reviewReport accetta un report', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 1, status: 'pending', reject_explanation: '' };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'assigned', reject_explanation: '' });
        // Mock conversation con participants
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 10, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        const result = await reportRepository.reviewReport({ reportId: 1, action: 'accept', explanation: '', categoryId: 5 });
        expect(result).toEqual({ id: 1, status: 'assigned', reject_explanation: '' });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    // --- reviewReport: reject ---
    it('reviewReport rifiuta un report', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 2, status: 'pending', reject_explanation: '' };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'rejected', reject_explanation: 'motivo' });
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 11, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        const result = await reportRepository.reviewReport({ reportId: 2, action: 'reject', explanation: 'motivo', categoryId: 5 });
        expect(result).toEqual({ id: 2, status: 'rejected', reject_explanation: 'motivo' });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    // --- startReport ---
    it('startReport aggiorna stato e aggiunge tecnico', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 1, status: 'assigned' };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'in_progress', technicianId: 7 });
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 12, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        const result = await reportRepository.startReport({ reportId: 1, technicianId: 7 });
        expect(result).toEqual({ id: 1, status: 'in_progress', technicianId: 7 });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('startReport ritorna null se report non trovato', async () => {
        reportRepoStub.findOneBy.mockResolvedValueOnce(null);
        const result = await reportRepository.startReport({ reportId: 1, technicianId: 7 });
        expect(result).toBeNull();
    });

    // --- finishReport ---
    it('finishReport aggiorna stato se tecnico corrisponde', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 1, status: 'in_progress', technicianId: 7 };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'resolved', technicianId: 7 });
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 13, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        jest.spyOn(await import('../../../repositories/messageRepository.js'), 'createSystemMessage').mockResolvedValue('msg');
        jest.spyOn(await import('../../../wsHandler.js'), 'broadcastToConversation').mockResolvedValue();
        const result = await reportRepository.finishReport({ reportId: 1, technicianId: 7 });
        expect(result).toEqual({ id: 1, status: 'resolved', technicianId: 7 });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('finishReport ritorna null se report non trovato o tecnico non corrisponde', async () => {
        reportRepoStub.findOneBy.mockResolvedValueOnce(null);
        const result1 = await reportRepository.finishReport({ reportId: 1, technicianId: 7 });
        expect(result1).toBeNull();
        reportRepoStub.findOneBy.mockResolvedValueOnce({ id: 1, status: 'in_progress', technicianId: 8 });
        const result2 = await reportRepository.finishReport({ reportId: 1, technicianId: 7 });
        expect(result2).toBeNull();
    });

    // --- suspendReport ---
    it('suspendReport aggiorna stato', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 1, status: 'in_progress' };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'suspended' });
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 14, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        jest.spyOn(await import('../../../repositories/messageRepository.js'), 'createSystemMessage').mockResolvedValue('msg');
        jest.spyOn(await import('../../../wsHandler.js'), 'broadcastToConversation').mockResolvedValue();
        const result = await reportRepository.suspendReport({ reportId: 1, technicianId: 7 });
        expect(result).toEqual({ id: 1, status: 'suspended' });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('suspendReport ritorna null se report non trovato', async () => {
        reportRepoStub.findOneBy.mockResolvedValueOnce(null);
        const result = await reportRepository.suspendReport({ reportId: 1, technicianId: 7 });
        expect(result).toBeNull();
    });

    // --- resumeReport ---
    it('resumeReport aggiorna stato in_progress se technicianId presente', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 1, status: 'suspended', technicianId: 7 };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'in_progress', technicianId: 7 });
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 15, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        jest.spyOn(await import('../../../repositories/messageRepository.js'), 'createSystemMessage').mockResolvedValue('msg');
        jest.spyOn(await import('../../../wsHandler.js'), 'broadcastToConversation').mockResolvedValue();
        const result = await reportRepository.resumeReport({ reportId: 1, technicianId: 7 });
        expect(result).toEqual({ id: 1, status: 'in_progress', technicianId: 7 });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('resumeReport aggiorna stato assigned se technicianId assente', async () => {
        const { AppDataSourcePostgres } = await import('../../../config/data-source.js');
        const report = { id: 1, status: 'suspended', technicianId: null };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'assigned', technicianId: null });
        const convRepo = { findOne: jest.fn().mockResolvedValue({ id: 16, participants: [] }) };
        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return convRepo;
            return reportRepoStub;
        });
        jest.spyOn(await import('../../../repositories/messageRepository.js'), 'createSystemMessage').mockResolvedValue('msg');
        jest.spyOn(await import('../../../wsHandler.js'), 'broadcastToConversation').mockResolvedValue();
        const result = await reportRepository.resumeReport({ reportId: 1, technicianId: null });
        expect(result).toEqual({ id: 1, status: 'assigned', technicianId: null });
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('resumeReport ritorna null se report non trovato', async () => {
        reportRepoStub.findOneBy.mockResolvedValueOnce(null);
        const result = await reportRepository.resumeReport({ reportId: 1, technicianId: 7 });
        expect(result).toBeNull();
    });
});
/*
describe('assignReportToExternalMaintainer', () => {
    it('crea conversazione interna quando report assegnato a ufficio esterno', async () => {
        const { AppDataSourcePostgres } = await import('../../config/data-source.js');
        const report = { id: 1, status: 'assigned', assignedExternal: false };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, assignedExternal: true });

        // Mock conversazione pubblica esistente
        const publicConvRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 20,
                participants: [{ id: 10 }],
                isInternal: false
            })
        };

        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return publicConvRepo;
            return reportRepoStub;
        });

        // Mock per createConversation che deve essere chiamato con isInternal: true
        createConversationMock.mockResolvedValueOnce({ id: 100, isInternal: true });

        const result = await reportRepository.assignReportToExternalMaintainer(1, 50);

        // Verifica che sia stata creata una conversazione interna
        expect(createConversationMock).toHaveBeenCalledWith({
            report: expect.objectContaining({ id: 1 }),
            participants: [],
            isInternal: true
        });

        expect(result.assignedExternal).toBe(true);
        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('aggiunge staff interno alla conversazione interna', async () => {
        const { AppDataSourcePostgres } = await import('../../config/data-source.js');
        const report = { id: 1, status: 'assigned', assignedExternal: false };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, assignedExternal: true });

        const publicConvRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 20,
                participants: [],
                isInternal: false
            })
        };

        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return publicConvRepo;
            return reportRepoStub;
        });

        createConversationMock.mockResolvedValueOnce({ id: 101, isInternal: true });
        addParticipantToConversationMock.mockResolvedValueOnce({ id: 101, participants: [{ id: 50 }] });

        await reportRepository.assignReportToExternalMaintainer(1, 50);

        // Verifica che lo staff interno sia stato aggiunto alla conversazione interna
        expect(addParticipantToConversationMock).toHaveBeenCalledWith(101, 50);

        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('crea messaggio di sistema nella conversazione interna', async () => {
        const { AppDataSourcePostgres } = await import('../../config/data-source.js');
        const report = { id: 1, status: 'assigned', assignedExternal: false };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, assignedExternal: true });

        const publicConvRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 20,
                participants: [],
                isInternal: false
            })
        };

        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return publicConvRepo;
            return reportRepoStub;
        });

        createConversationMock.mockResolvedValueOnce({ id: 102, isInternal: true });
        createSystemMessageMock.mockResolvedValueOnce('system_msg_internal');

        await reportRepository.assignReportToExternalMaintainer(1, 50);

        // Verifica che sia stato creato un messaggio di sistema nella conversazione interna
        expect(createSystemMessageMock).toHaveBeenCalledWith(
            102,
            'Report has been assigned to external office'
        );

        // Verifica che il messaggio sia stato broadcastato
        expect(broadcastToConversationMock).toHaveBeenCalledWith(102, 'system_msg_internal');

        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('aggiunge staff interno anche alla conversazione pubblica', async () => {
        const { AppDataSourcePostgres } = await import('../../config/data-source.js');
        const report = { id: 1, status: 'assigned', assignedExternal: false };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, assignedExternal: true });

        const publicConvRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 20,
                participants: [{ id: 10 }],
                isInternal: false
            })
        };

        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return publicConvRepo;
            return reportRepoStub;
        });

        createConversationMock.mockResolvedValueOnce({ id: 103, isInternal: true });

        await reportRepository.assignReportToExternalMaintainer(1, 50);

        // Verifica che lo staff interno sia stato aggiunto ANCHE alla conversazione pubblica
        expect(addParticipantToConversationMock).toHaveBeenCalledWith(20, 50);

        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('ritorna null se report non trovato', async () => {
        reportRepoStub.findOneBy.mockResolvedValueOnce(null);
        const result = await reportRepository.assignReportToExternalMaintainer(999, 50);
        expect(result).toBeNull();
    });
});

describe('externalStart - Aggiunge manutentore esterno a conversazione interna', () => {
    it('aggiunge manutentore esterno ai partecipanti della conversazione interna', async () => {
        const { AppDataSourcePostgres } = await import('../../config/data-source.js');
        const report = { id: 1, status: 'assigned', assignedExternal: true, categoryId: 5 };
        reportRepoStub.findOne.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, status: 'in_progress' });

        // Mock conversazione interna
        const internalConvRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 200,
                participants: [{ id: 50 }],
                isInternal: true
            })
        };

        const categoryRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 5,
                externalOfficeId: 10
            })
        };

        const userOfficeRepo = {
            findOne: jest.fn().mockResolvedValue({
                userId: 60,
                officeId: 10
            })
        };

        const officeRepo = {
            findOneBy: jest.fn().mockResolvedValue({
                id: 10,
                isExternal: true
            })
        };

        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return internalConvRepo;
            if (entity?.name === 'Categories') return categoryRepo;
            if (entity?.name === 'UserOffice') return userOfficeRepo;
            if (entity?.name === 'Office') return officeRepo;
            return reportRepoStub;
        });

        await reportRepository.externalStart({ reportId: 1, externalMaintainerId: 60 });

        // Verifica che il manutentore esterno sia stato aggiunto alla conversazione interna
        expect(addParticipantToConversationMock).toHaveBeenCalledWith(200, 60);

        // Verifica messaggio di sistema nella conversazione interna
        expect(createSystemMessageMock).toHaveBeenCalledWith(
            200,
            expect.stringContaining('Report has been started by external maintainer')
        );

        AppDataSourcePostgres.getRepository = origGetRepo;
    });
});

describe('Isolamento conversazioni interne/pubbliche nei report', () => {
    it('la conversazione interna ha isInternal: true', async () => {
        const { AppDataSourcePostgres } = await import('../../config/data-source.js');
        const report = { id: 1, status: 'assigned', assignedExternal: false };
        reportRepoStub.findOneBy.mockResolvedValueOnce(report);
        reportRepoStub.save.mockResolvedValue({ ...report, assignedExternal: true });

        const publicConvRepo = {
            findOne: jest.fn().mockResolvedValue({
                id: 20,
                participants: [],
                isInternal: false
            })
        };

        const origGetRepo = AppDataSourcePostgres.getRepository;
        AppDataSourcePostgres.getRepository = jest.fn((entity) => {
            if (entity?.name === 'Conversation') return publicConvRepo;
            return reportRepoStub;
        });

        createConversationMock.mockResolvedValueOnce({ id: 300, isInternal: true });

        await reportRepository.assignReportToExternalMaintainer(1, 50);

        // Verifica che la conversazione interna sia stata creata con isInternal: true
        expect(createConversationMock).toHaveBeenCalledWith(
            expect.objectContaining({ isInternal: true })
        );

        AppDataSourcePostgres.getRepository = origGetRepo;
    });

    it('la conversazione pubblica ha isInternal: false', async () => {
        const input = {
            title: 'Title',
            description: 'Desc',
            categoryId: 5,
            userId: 10,
            latitude: 45.2,
            longitude: 9.19,
            photos: []
        };

        createConversationMock.mockResolvedValueOnce({ id: 42, isInternal: false });

        await reportRepository.createReport(input);

        // Verifica che la conversazione pubblica creata alla creazione del report sia isInternal: false
        expect(createConversationMock).toHaveBeenCalledWith(
            expect.objectContaining({
                report: expect.any(Object),
                participants: expect.any(Array)
            })
        );

        // La conversazione pubblica NON dovrebbe avere isInternal: true
        expect(createConversationMock).not.toHaveBeenCalledWith(
            expect.objectContaining({ isInternal: true })
        );
    });
});*/

