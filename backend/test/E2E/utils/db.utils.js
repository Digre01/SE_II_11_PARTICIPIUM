import {seedDatabase} from "../../../database/seeder.js";
import {AppDataSourcePostgres} from "../../../config/data-source.js";

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