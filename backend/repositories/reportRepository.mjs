
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

		return savedReport;
	}

	async getApprovedReports() {
		const reports = await this.repo.find({
			where: { status: 'approved' },
			relations: ['photos', 'user', 'category']
		});
		return reports;
	}
}

export const reportRepository = new ReportRepository();
