import { AppDataSourcePostgres } from "../config/data-source.js";
import { Report } from "../entities/Reports.js";
import { Photos } from "../entities/Photos.js";
import { Users } from "../entities/Users.js";
import { Categories } from "../entities/Categories.js";
import { UserOffice } from "../entities/UserOffice.js";
import { Office } from "../entities/Offices.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export class ReportRepository {
	get repo() {
		return AppDataSourcePostgres.getRepository(Report);
	}

	async createReport({ title, description, categoryId, userId, latitude, longitude, photos }) {
		const userRepo = AppDataSourcePostgres.getRepository(Users);
		const userExists = await userRepo.findOneBy({ id: Number(userId) });
		if (!userExists) {
			throw new NotFoundError(`userId '${userId}' not found`);
		}

		const categoryRepo = AppDataSourcePostgres.getRepository(Categories);
		const categoryExists = await categoryRepo.findOneBy({ id: Number(categoryId) });
		if (!categoryExists) {
			throw new NotFoundError(`categoryId '${categoryId}' not found`);
		}

		// Report creation
		const reportEntity = this.repo.create({
			title,
			description,
			categoryId: Number(categoryId),
			userId: Number(userId),
			latitude: Number(latitude),
			longitude: Number(longitude),
			status: 'pending'
		});
		const savedReport = await this.repo.save(reportEntity);

		// Photos association
		if (photos && photos.length > 0) {
			const photoRepo = AppDataSourcePostgres.getRepository(Photos);
			for (const url of photos) {
				const photoEntity = photoRepo.create({ link: url, report: savedReport });
				await photoRepo.save(photoEntity);
			}
		}

		// Trova tutti gli staff member con ruolo 'Municipal Public Relations Officer' tramite join
		const staffRepo = AppDataSourcePostgres.getRepository(Users);
		const staffMembers = await staffRepo.find({
			where: { userType: 'STAFF' },
			relations: ['userOffice', 'userOffice.role']
		});
		const municipalStaff = staffMembers.filter(u => {
			if (!u.userOffice) return false;
			const uos = Array.isArray(u.userOffice) ? u.userOffice : [u.userOffice];
			return uos.some(uo => uo && uo.role && uo.role.name === 'Municipal Public Relations Officer');
		});

		// Conversation creation
		const { createConversation } = await import('./conversationRepository.js');
		const participants = municipalStaff.length > 0 ? [userExists, ...municipalStaff] : [userExists];
		const savedConversation = await createConversation({ report: savedReport, participants });

		// First message
		const { createSystemMessage } = await import('./messageRepository.js');
		const systemMsg = await createSystemMessage(savedConversation.id, 'Report status change to: Pending Approval');

		// Broadcast del messaggio autogenerato
		const { broadcastToConversation } = await import('../wsHandler.js');
		await broadcastToConversation(savedConversation.id, systemMsg);

		return savedReport;
	}


	async getAllReports() {
		return await this.repo.find({ relations: ['photos', 'category'] });
	}

	async getReportById(id) {
		return await this.repo.findOne({ where: { id: Number(id) }, relations: ['photos', 'category'] });
	}

	async getReportsByCategory(categoryId) {
		return await this.repo.find({ where: { categoryId } });
	}

	async getReportsByTechnician(technicianId) {
		return await this.repo.findBy({technicianId})
	}

	async getAcceptedReports() {
		// Include both 'assigned' and 'suspended' statuses
		return await this.repo.find({
			where: [
				{ status: 'assigned' },
				{ status: 'suspended' },
				{ status: 'in_progress' }
			],
			relations: ['photos', 'category', 'user']
		});
	}

	async reviewReport({ reportId, action, explanation, categoryId }) {
		const report = await this.repo.findOneBy({ id: Number(reportId) });
		if (!report) return null;

		if (action === 'reject') {
			report.status = 'rejected';
			report.reject_explanation = explanation || '';
			// Messaggio automatico per rifiuto
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			// Trova la conversazione associata al report
			const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
			const conversation = await convRepo.findOne({ where: { report: { id: report.id } } });
			if (conversation) {
				const sysMsg = await createSystemMessage(conversation.id, `Report status change to: Rejected.${explanation ? ' Explanation:' + explanation : ''}`);
				await broadcastToConversation(conversation.id, sysMsg);
			}
		} else if (action === 'accept') {
			report.status = 'assigned';
			report.reject_explanation = '';
			if (categoryId) report.categoryId = Number(categoryId);
			// Messaggio automatico per accettazione
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			// Trova la conversazione associata al report
			const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
			const conversation = await convRepo.findOne({ where: { report: { id: report.id } } });
			if (conversation) {
				const sysMsg = await createSystemMessage(conversation.id, 'Report status change to: Assigned');
				await broadcastToConversation(conversation.id, sysMsg);
			}
		}

		return await this.repo.save(report);
	}

	async startReport({ reportId, technicianId }) {
		const report = await this.repo.findOneBy({ id: Number(reportId) });
		if (!report) return null;
		report.status = 'in_progress';
		report.technicianId = Number(technicianId);
		const savedReport = await this.repo.save(report);

		// Trova tutte le conversazioni associate al report
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversations = await convRepo.find({ where: { report: { id: report.id } }, relations: ['participants'] });
		if (conversations && conversations.length > 0) {
			const { addParticipantToConversation } = await import('./conversationRepository.js');
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			for (const conversation of conversations) {
				await addParticipantToConversation(conversation.id, technicianId);
				const sysMsg = await createSystemMessage(conversation.id, `Report status change to: In Progress`);
				await broadcastToConversation(conversation.id, sysMsg);
			}
		}
		return savedReport;
	}

	async finishReport({ reportId, technicianId }) {
		const report = await this.repo.findOneBy({ id: Number(reportId) });
		if (!report || report.technicianId !== Number(technicianId)) return null;
		report.status = 'resolved';
		const savedReport = await this.repo.save(report);

		// Trova la conversazione associata al report
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversation = await convRepo.findOne({ where: { report: { id: report.id } } });
		if (conversation) {
			// Messaggio automatico per cambio stato
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			const sysMsg = await createSystemMessage(conversation.id, `Report status change to: Resolved`);
			await broadcastToConversation(conversation.id, sysMsg);
		}
		return savedReport;
	}

		async suspendReport({ reportId, technicianId }) {
		const report = await this.repo.findOneBy({ id: Number(reportId) });
		if (!report) return null;
		report.status = 'suspended';
		// Se il report era in_progress, mantiene technicianId, altrimenti rimane null
		const savedReport = await this.repo.save(report);

		// Messaggio automatico
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversation = await convRepo.findOne({ where: { report: { id: report.id } } });
		if (conversation) {
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			const sysMsg = await createSystemMessage(conversation.id, `Report status change to: Suspended`);
			await broadcastToConversation(conversation.id, sysMsg);
		}
		return savedReport;
	}

	async resumeReport({ reportId, technicianId }) {
		const report = await this.repo.findOneBy({ id: Number(reportId) });
		if (!report) return null;
		// Se technicianId è valorizzato, torna in_progress, altrimenti torna assigned
		if (report.technicianId) {
			report.status = 'in_progress';
		} else {
			report.status = 'assigned';
		}
		const savedReport = await this.repo.save(report);

		// Messaggio automatico
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversation = await convRepo.findOne({ where: { report: { id: report.id } } });
		if (conversation) {
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			const sysMsg = await createSystemMessage(conversation.id, `Report status change to: ${report.status === 'in_progress' ? 'In Progress (Resumed)' : 'Assigned (Resumed)'}`);
			await broadcastToConversation(conversation.id, sysMsg);
		}
		return savedReport;
	}

    async assignReportToExternalMaintainer(reportId, internalStaffMemberId) {
        const report = await this.repo.findOneBy({id: Number(reportId)});
        if (!report) return null;
        report.assignedExternal = true
		// Trova la conversazione associata al report
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversation = await convRepo.findOne({ where: { report: { id: report.id } }, relations: ['participants'] });
		if (conversation) {
			// Aggiungi l'internalStaffMember ai partecipanti
			const { addParticipantToConversation } = await import('./conversationRepository.js');
			await addParticipantToConversation(conversation.id, internalStaffMemberId);

			// Messaggio automatico per cambio stato
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			const sysMsg = await createSystemMessage(conversation.id, `Report has been assigned to external office`);
			await broadcastToConversation(conversation.id, sysMsg);
		}

		// Conversation creation
		const { createConversation } = await import('./conversationRepository.js');
		const savedConversation = await createConversation({ report: report, participants: [], isInternal: true });
		const { addParticipantToConversation } = await import('./conversationRepository.js');
		await addParticipantToConversation(savedConversation.id, internalStaffMemberId);

		// First message
		const { createSystemMessage } = await import('./messageRepository.js');
		const systemMsg = await createSystemMessage(savedConversation.id, 'Report has been assigned to external office');

		// Broadcast del messaggio autogenerato
		const { broadcastToConversation } = await import('../wsHandler.js');
		await broadcastToConversation(savedConversation.id, systemMsg);
		
        return await this.repo.save(report);
    }

    async getReportPhotos(reportId) {
        const photoRepo = AppDataSourcePostgres.getRepository(Photos);
        return await photoRepo.find({ where: { reportId: Number(reportId) } });
    }

	// Questa funzione non viene mai usata dal frontend
	async externalStart({ reportId, externalMaintainerId }) {
		// Trova la conversazione associata al report
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversation = await convRepo.findOne({ where: { report: { id: reportId } }, relations: ['participants'], isInternal: true });
		if (conversation) {
			// Aggiungi l'externalMaintainer ai partecipanti
			const { addParticipantToConversation } = await import('./conversationRepository.js');
			await addParticipantToConversation(conversation.id, externalMaintainerId);

			// Messaggio automatico per cambio stato
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			const sysMsg = await createSystemMessage(conversation.id, `Report has been started by external maintainer ${externalMaintainerId}`);
			await broadcastToConversation(conversation.id, sysMsg);
		}
		return await this._externalChangeStatus({ reportId, externalMaintainerId, status: 'in_progress' });
	}

	// Questa funzione non viene mai usata dal frontend
	async externalFinish({ reportId, externalMaintainerId }) {
		return await this._externalChangeStatus({ reportId, externalMaintainerId, status: 'resolved' });
	}

	// Questa funzione non viene mai usata dal frontend
	async externalSuspend({ reportId, externalMaintainerId }) {
		return await this._externalChangeStatus({ reportId, externalMaintainerId, status: 'suspended' });
	}

	// Questa funzione non viene mai usata dal frontend
	async externalResume({ reportId, externalMaintainerId }) {
		// If the report previously had any technicianId we can't infer it here; resume to 'assigned'
		return await this._externalChangeStatus({ reportId, externalMaintainerId, status: 'assigned' });
	}

	// Questa funzione non viene mai usata dal frontend
	async _externalChangeStatus({ reportId, externalMaintainerId, status }) {
		// reuse validation: report exists, assignedExternal true, user belongs to external office
		const report = await this.repo.findOne({ where: { id: Number(reportId) }, relations: ['category'] });
		if (!report) return null;
		if (!report.assignedExternal) return null;

		const categoryRepo = AppDataSourcePostgres.getRepository(Categories);
		const category = await categoryRepo.findOne({ where: { id: Number(report.categoryId) }, relations: ['externalOffice'] });
		const externalOfficeId = category?.externalOfficeId || (category?.externalOffice && category.externalOffice.id) || null;
		if (!externalOfficeId) return null;

		const userOfficeRepo = AppDataSourcePostgres.getRepository(UserOffice);
		const membership = await userOfficeRepo.findOne({ where: { userId: Number(externalMaintainerId), officeId: Number(externalOfficeId) } });
		if (!membership) return null;

		const officeRepo = AppDataSourcePostgres.getRepository(Office);
		const office = await officeRepo.findOneBy({ id: Number(externalOfficeId) });
		if (!office || !office.isExternal) return null;

		report.status = status;
		const savedReport = await this.repo.save(report);

		// Add external maintainer to conversation participants if conversation exists
		const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
		const conversation = await convRepo.findOne({ where: { report: { id: report.id } }, relations: ['participants'], isInternal: false });
		if (conversation) {
			const { addParticipantToConversation } = await import('./conversationRepository.js');
			try {
				await addParticipantToConversation(conversation.id, externalMaintainerId);
			} catch (e) {
				// ignore participant adding errors
			}
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			const sysMsg = await createSystemMessage(conversation.id, `Report status change to: ${status}`);
			await broadcastToConversation(conversation.id, sysMsg);
		}

		return savedReport;
	}
}

export const reportRepository = new ReportRepository();
