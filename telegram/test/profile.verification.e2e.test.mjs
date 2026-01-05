import { describe, test, beforeEach, expect, jest } from '@jest/globals';

const { mockTelegramAPIs } = await import('./telegram.mocks.js');

const { textUpdate, commandUpdate, createBot } = await import('./telegram.helpers.js');
const { ensureVerified, verifyWizard } = await import('../src/scenes/verifyWizard.js');

let bot, replies;

describe('verifyWizard E2E', () => {
    beforeEach(() => {
        ({ bot, replies } = createBot());
        replies.length = 0;
        mockTelegramAPIs.verifyTelegram.mockReset();
    });

    test('successful verification flow', async () => {
        mockTelegramAPIs.verifyTelegram.mockResolvedValueOnce(true);

        // Step 1: start wizard
        await bot.handleUpdate(commandUpdate('verify'));
        // Trigger first step
        await bot.handleUpdate(textUpdate(''));
        expect(replies.some(r => r.includes('Insert your code'))).toBe(true);

        // Step 2: send valid code
        await bot.handleUpdate(textUpdate('VALID_CODE'));
        expect(replies.some(r => r.includes('Verifying'))).toBe(true);
        expect(mockTelegramAPIs.verifyTelegram).toHaveBeenCalledWith('testuser', 'VALID_CODE');
        expect(replies.some(r => r.includes('Verification successful'))).toBe(true);

        // ensureVerified should now return true
        const ctxFake = { from: { username: 'testuser' }, reply: jest.fn() };
        expect(ensureVerified(ctxFake)).toBe(true);
    });

    test('empty code input', async () => {
        await bot.handleUpdate(commandUpdate('verify'));
        await bot.handleUpdate(textUpdate(''));
        await bot.handleUpdate(textUpdate('')); // empty code
        expect(replies.some(r => r.includes('Invalid input'))).toBe(true);
    });

    test('user without username', async () => {
        const fakeCtx = { from: {}, reply: jest.fn(), scene: { leave: jest.fn() } };
        // Step 2 handler directly
        await verifyWizard.steps[1](fakeCtx);
        expect(fakeCtx.reply).toHaveBeenCalledWith(
            'Invalid input. Please send the text code or type /cancel to stop.'
        );
    });

    test('verification fails due to API error', async () => {
        mockTelegramAPIs.verifyTelegram.mockRejectedValueOnce(new Error('Wrong code'));
        await bot.handleUpdate(commandUpdate('verify'));
        await bot.handleUpdate(textUpdate(''));
        await bot.handleUpdate(textUpdate('INVALID_CODE'));
        expect(replies.some(r => r.includes('❌ Verification failed'))).toBe(true);

        // ensureVerified should return false
        const ctxFake = { from: { username: 'user2' }, reply: jest.fn() };
        expect(ensureVerified(ctxFake)).toBe(false);
    });

    test('ensureVerified requires verification', async () => {
        const ctxFake = { from: { username: 'not_verified_user' }, reply: jest.fn() };
        expect(ensureVerified(ctxFake)).toBe(false);
        expect(ctxFake.reply).toHaveBeenCalledWith('You must verify your account first with /verify.');
    });
});