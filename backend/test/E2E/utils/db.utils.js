import {seedDatabase} from "../../../database/seeder.js";
import {AppDataSourcePostgres} from "../../../config/data-source.js";
import {Users} from "../../../entities/Users.js";
import {Report} from "../../../entities/Reports.js";

export async function cleanupUsers(dataSource, usernames = []) {
    const userRepo = dataSource.getRepository('Users');
    const userOfficeRepo = dataSource.getRepository('UserOffice');

    for (const username of usernames) {
        const user = await userRepo.findOneBy({ username });
        if (user) {
            await userOfficeRepo.delete({ userId: user.id });
            await userRepo.delete({ id: user.id });
        }
    }
}

export async function databaseSetup({seed = true} = {}) {
    if (!AppDataSourcePostgres.isInitialized) {
        await AppDataSourcePostgres.initialize();

        if (seed) {
            await seedDatabase();
        }
    }
    return AppDataSourcePostgres;
}

export async function getCreatedReportId() {
    const citizenUser = await AppDataSourcePostgres
        .getRepository(Users)
        .findOneBy({ username: 'citizen' })

    const report = await AppDataSourcePostgres
        .getRepository(Report)
        .findOne({
            where: { userId: citizenUser.id },
            order: { id: "DESC" }
        })

    return report.id
}