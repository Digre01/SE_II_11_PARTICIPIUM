import { setupEmailUtilsMock } from '../../mocks/common.mocks.js';
import { loginAndGetCookie } from './auth.utils.js';
import {databaseSetup} from "./db.utils.js";
import {jest} from "@jest/globals";
import {setupWsMock} from "./ws.utils.js";

export async function standardSetup({seed = true} = {}) {
    const dataSource = await databaseSetup({seed})

    await setupEmailUtilsMock();
    await setupWsMock();

    const { default: app } = await import('../../../app.js');

    return {
        app,
        dataSource,

        loginAsAdmin: () =>
            loginAndGetCookie(app, 'admin', 'admin'),

        loginAsCitizen: () =>
            loginAndGetCookie(app, 'citizen', 'citizen'),

        loginAsStaff: () =>
            loginAndGetCookie(app, 'staff1', 'staff1'),
    };
}

export async function standardTeardown(dataSource) {
    if (dataSource?.isInitialized) {
        await dataSource.destroy();
    }
}
