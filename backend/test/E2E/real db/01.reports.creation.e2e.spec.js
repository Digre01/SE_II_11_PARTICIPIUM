import { test, expect } from '@playwright/test';
import {
    createTestReport,
} from "../helpers/report.helpers.js";
import {getTestReport} from "../helpers/requests.helpers.js";


test.describe("Full report creation flow", () => {

    test('create report with real backend', async ({ page, request }) => {
        await createTestReport(page, request, "Test Report");

        expect(await getTestReport(page, request)).toBeDefined()
    });
})