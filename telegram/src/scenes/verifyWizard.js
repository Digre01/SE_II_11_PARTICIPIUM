import { Scenes, Markup } from 'telegraf';
import API from '../API.js';

const verifiedUsers = new Set();

export const verifyWizard = new Scenes.WizardScene(
    'verify-wizard',

    async (ctx) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify_telegram`;

        await ctx.reply(
            `Insert your code now.\n\nIf you don't have one, generate it here (copy and paste on the browser): \n ${verifyUrl}`
        );
        return ctx.wizard.next();
    },

    async (ctx) => {
        const code = ctx.message?.text?.trim();

        if (!code) {
            await ctx.reply('Invalid input. Please send the text code or type /cancel to stop.');
            return;
        }

        const username = ctx.from?.username;
        if (!username) {
            await ctx.reply(
                'Your Telegram account has no public username. Please set a username in Telegram settings and try again.'
            );
            return ctx.scene.leave();
        }

        try {
            await ctx.reply('Verifying...');
            await API.verifyTelegram(username, code);
            verifiedUsers.add(username);
            await ctx.reply('✅ Verification successful! You can now use /newreport.', Markup.removeKeyboard());
            return ctx.scene.leave();
        } catch (err) {
            await ctx.reply(`❌ Verification failed: ${err.message}. \nPlease try /verify again.`);
            return ctx.scene.leave();
        }
    }
);

export function ensureVerified(ctx) {
    const username = ctx.from?.username;
    if (!username || !verifiedUsers.has(username)) {
        ctx.reply('You must verify your account first with /verify.');
        return false;
    }
    return true;
}
