import { setupEmailUtilsMock } from "../../integration/mocks/common.mocks.js";

export async function setupUsers() {
    await setupEmailUtilsMock();

    const data = await import('../../../config/data-source.js');
    const seeder = await import('../../../database/seeder.js');
    const repoMod = await import('../../../repositories/userRepository.js');

    const dataSource = data.AppDataSourcePostgres;
    const seedDatabase = seeder.seedDatabase;
    const userRepository = repoMod.userRepository;
    const userService = (await import('../../../services/userService.js')).default;
    const rolesRepository = (await import('../../../repositories/rolesRepository.js')).rolesRepository;
    const app = (await import('../../../app.js')).default;

    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    await seedDatabase();

    return {
        app,
        dataSource,
        seedDatabase,
        userRepository,
        userService,
        rolesRepository,
    };
}

export async function cleanupUsers(dataSource, userRepository, usernames = []) {
    for (const username of usernames) {
        const user = await userRepository.getUserByUsername(username);
        if (user) {
            const userOfficeRepo = dataSource.getRepository('UserOffice');
            await userOfficeRepo.delete({ userId: user.id });
            await userRepository.repo.delete({ id: user.id });
        }
    }

    if (dataSource?.isInitialized) {
        await dataSource.destroy();
    }
}
