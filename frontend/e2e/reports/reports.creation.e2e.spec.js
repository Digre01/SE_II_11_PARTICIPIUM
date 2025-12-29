import { test, expect } from '@playwright/test';
import {loginAsUser, mockCurrentSession} from "../helpers/common.helpers.js";
import {
    captureReportPost,
    fillReportForm,
    getLatLon,
    mockCategories,
    navigateToCreateReport,
} from "../helpers/report.helpers.js";
import {waitForMapAndClickCenter} from "../helpers/map.helpers.js";

test.describe("Full report creation flow", () => {
    test('full create-report flow sends coords in POST body', async ({ page }) => {
        await mockCurrentSession(page, {
            id: 1,
            username: 'alice',
            userType: 'citizen',
        });

        await mockCategories(page, [{ id: 1, name: 'Other' }]);

        const getCapturedPost = await captureReportPost(page);

        await page.goto('/');

        await waitForMapAndClickCenter(page);
        await navigateToCreateReport(page);
        await fillReportForm(page);

        const { lat, lon } = await getLatLon(page);

        await Promise.all([
            page.waitForResponse(r =>
                r.url().includes('/api/v1/reports') && r.status() === 201
            ),
            page.click('text=Submit'),
        ]);

        const capturedPost = getCapturedPost();
        expect(capturedPost).not.toBeNull();

        const raw = capturedPost.postData();
        expect(raw).toContain('name="latitude"');
        expect(raw).toContain(String(lat));
        expect(raw).toContain('name="longitude"');
        expect(raw).toContain(String(lon));
    });

    test('create report with real backend (requires running backend and seeded user)', async ({ page }) => {
        await loginAsUser(page, {
            username: 'citizen',
            password: 'password',
        });

        await waitForMapAndClickCenter(page);
        await navigateToCreateReport(page);

        // Fill form fields
        await page.fill('#title', `Real backend E2E test ${Date.now()}`);
        await page.fill('#description', 'Created during Playwright real-backend test');

        // Categories from real backend
        await page.waitForSelector('#categoryId', { timeout: 10000 });
        const firstOption = await page.$eval(
            '#categoryId',
            el => el.querySelector('option')?.value
        );
        await page.selectOption('#categoryId', firstOption);

        // Upload file
        await page.setInputFiles('#upload_foto', [{
            name: 'real-e2e.png',
            mimeType: 'image/png',
            buffer: Buffer.from('test'),
        }]);

        await page.waitForSelector('#latitude');
        await page.waitForSelector('#longitude');

        const [response] = await Promise.all([
            page.waitForResponse(resp =>
                resp.url().includes('/api/v1/reports') &&
                (resp.status() === 201 || resp.status() === 400)
            ),
            page.click('text=Submit'),
        ]);

        expect(response).not.toBeNull();
        expect([201]).toContain(response.status());

        await page.waitForSelector(
            'text=Report submitted successfully',
            { timeout: 5000 }
        );
    });
})