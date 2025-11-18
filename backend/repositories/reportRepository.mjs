import { AppDataSourcePostgres } from "../config/data-source.js";
import { Report } from "../entities/Reports.js";
import { Photos } from "../entities/Photos.js";
import { Users } from "../entities/Users.js";
import { Categories } from "../entities/Categories.js";
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
		const municipalStaff = staffMembers.filter(u =>
			u.userOffice &&
			u.userOffice.role &&
			u.userOffice.role.name === 'Municipal Public Relations Officer'
		);

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
				const sysMsg = await createSystemMessage(conversation.id, `Report status change to: Rejected${explanation ? ' - ' + explanation : ''}`);
				await broadcastToConversation(conversation.id, sysMsg);
			}
		} else if (action === 'accept') {
			report.status = 'accepted';
			report.reject_explanation = '';
			if (categoryId) report.categoryId = Number(categoryId);
			// Messaggio automatico per accettazione
			const { createSystemMessage } = await import('./messageRepository.js');
			const { broadcastToConversation } = await import('../wsHandler.js');
			// Trova la conversazione associata al report
			const convRepo = AppDataSourcePostgres.getRepository((await import('../entities/Conversation.js')).Conversation);
			const conversation = await convRepo.findOne({ where: { report: { id: report.id } } });
			if (conversation) {
				const sysMsg = await createSystemMessage(conversation.id, 'Report status change to: Accepted');
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
		return await this.repo.save(report);
	}

	async finishReport({ reportId, technicianId }) {
		const report = await this.repo.findOneBy({ id: Number(reportId) });
		if (!report || report.technicianId !== Number(technicianId)) return null;
		report.status = 'resolved';
		return await this.repo.save(report);
	}
}

export const reportRepository = new ReportRepository();
