import { setupEmailUtilsMock } from '../../integration/mocks/common.mocks.js';
import { AppDataSourcePostgres } from '../../../config/data-source.js';
import { seedDatabase } from '../../../database/seeder.js';
import { loginAndGetCookie } from './auth.utils.js';

export async function standardSetup() {
    if (!AppDataSourcePostgres.isInitialized) {
        await AppDataSourcePostgres.initialize();
        await seedDatabase();
    }

    await setupEmailUtilsMock();

    const { default: app } = await import('../../../app.js');

    return {
        app,
        dataSource: AppDataSourcePostgres,

        loginAsAdmin: () =>
            loginAndGetCookie(app, 'admin', 'admin'),

        loginAsCitizen: () =>
            loginAndGetCookie(app, 'citizen', 'citizen'),

        loginAsStaff: () =>
            loginAndGetCookie(app, 'staff1', 'staff1'),
    };
}

export async function standardTeardown() {
    if (AppDataSourcePostgres.isInitialized) {
        await AppDataSourcePostgres.destroy();
    }
}
