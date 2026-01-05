import { describe, beforeEach, test, expect } from "@jest/globals";
const { mockTelegramAPIs } = await import('./telegram.mocks.js');

const { textUpdate, locationUpdate, photoUpdate, createBot, commandUpdate } = await import('./telegram.helpers.js');

let bot, replies;
describe("Full report creation and main exceptions", () => {
    beforeEach(async () => {
        ({ bot, replies } = createBot());

        mockTelegramAPIs.createReportFromWizard.mockReset();

        mockTelegramAPIs.createReportFromWizard.mockResolvedValue({ id: 123 });

        await bot.handleUpdate(commandUpdate('newreport'));
    });

    test('full report creation flow', async () => {
        await bot.handleUpdate(locationUpdate(45.0703, 7.6869));
        await bot.handleUpdate(textUpdate('Test title'));
        await bot.handleUpdate(textUpdate('Test description'));
        await bot.handleUpdate(textUpdate('Public Lighting'));
        await bot.handleUpdate(photoUpdate('photo1'));
        await bot.handleUpdate(textUpdate('Skip'));
        await bot.handleUpdate(textUpdate('No'));

        expect(replies.some(r => r.includes('registered') || r.includes('Thank you'))).toBe(true);
        expect(mockTelegramAPIs.createReportFromWizard).toHaveBeenCalled();
    });

    test('location outside Turin boundaries', async () => {
        await bot.handleUpdate(locationUpdate(40.0, 0.0));
        expect(replies.some(r => r.includes('outside the administrative boundaries of Turin'))).toBe(true);
    });

    test('no title provided', async () => {
        await bot.handleUpdate(locationUpdate(45.0703, 7.6869));
        await bot.handleUpdate(textUpdate(''));
        expect(replies.some(r => r.includes('Please send a text as title'))).toBe(true);
    });

    test('no description provided', async () => {
        await bot.handleUpdate(locationUpdate(45.0703, 7.6869));
        await bot.handleUpdate(textUpdate('Test title'));
        await bot.handleUpdate(textUpdate(''));
        expect(replies.some(r => r.includes('Please send a text as description'))).toBe(true);
    });
})

describe("Anonymous report", () => {
    beforeEach(async () => {
        await bot.handleUpdate(commandUpdate('newreport'));
        await bot.handleUpdate(locationUpdate(45.0703, 7.6869));
        await bot.handleUpdate(textUpdate('Test title'));
        await bot.handleUpdate(textUpdate('Test description'));
        await bot.handleUpdate(textUpdate('Public Lighting'));
        await bot.handleUpdate(photoUpdate('photo1'));
        await bot.handleUpdate(textUpdate('Skip'));
    })

    test('complete flow with anonymous = yes', async () => {
        await bot.handleUpdate(textUpdate('Yes'));
        expect(replies.some(r => r.includes('Report summary'))).toBe(true);
        expect(replies.some(r => r.includes('Thank you! Your report has been registered successfully!'))).toBe(true);
    });

    test('complete flow with anonymous = no', async () => {
        await bot.handleUpdate(textUpdate('No'));

        expect(replies.some(r => r.includes('Report summary'))).toBe(true);
        expect(replies.some(r => r.includes('Thank you! Your report has been registered successfully!'))).toBe(true);
    });
})

describe('Photos exceptions', () => {
    beforeEach(async () => {
        ({ bot, replies } = createBot());

        await bot.handleUpdate(commandUpdate('newreport'));
        await bot.handleUpdate(locationUpdate(45.0703, 7.6869));
        await bot.handleUpdate(textUpdate('Test title'));
        await bot.handleUpdate(textUpdate('Test description'));
        await bot.handleUpdate(textUpdate('Public Lighting'));
    });

    test('skip without any photo', async () => {
        await bot.handleUpdate(textUpdate('Skip'));
        expect(replies.some(r => r.includes('You must attach at least 1 photo before proceeding'))).toBe(true);
    });

    test('sending more than 3 photos', async () => {
        for (let i = 1; i <= 4; i++) {
            await bot.handleUpdate(photoUpdate(`photo${i}`));
        }
        expect(replies.some(r => r.includes('Do you want to make the report anonymous? (Yes/No)'))).toBe(true);
    });
});
