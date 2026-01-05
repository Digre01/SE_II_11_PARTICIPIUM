import 'dotenv/config';
import { Telegraf, Scenes, session, Markup } from 'telegraf';
import API from './API.js';
import {newReportWizard} from "./scenes/newReportWizard.js";
import {ensureVerified, verifyWizard} from "./scenes/verifyWizard.js";

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('BOT_TOKEN missing in environment. Set BOT_TOKEN in .env');
  process.exit(1);
}

const stage = new Scenes.Stage([newReportWizard, verifyWizard]);

stage.command('cancel', async (ctx) => {
  await ctx.reply('🚫 Operation canceled.', Markup.removeKeyboard());
  return ctx.scene.leave();
});

const bot = new Telegraf(token);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
  const introText =
      'Welcome!\n' +
      '1. /verify - Link your account\n' +
      '2. /newreport - Report an issue\n' +
      '3. /cancel - Stop current action';

  return ctx.reply(introText);
});

bot.command('verify', (ctx) => {
  ctx.scene.enter('verify-wizard');
});

// Fallback cancel outside scenes
bot.command('cancel', (ctx) => {
  ctx.reply('Nothing to cancel.', Markup.removeKeyboard());
});

bot.hears('/newreport', (ctx) => {
  if (!ensureVerified(ctx)) return;
  return ctx.scene.enter('new-report');
});

bot.command('newreport', (ctx) => {
  if (!ensureVerified(ctx)) return;
  return ctx.scene.enter('new-report');
});

bot.command('me', async (ctx) => {
  try {
    const user = await API.fetchCurrentUser();
    await ctx.reply(`Logged in as: ${user.name} ${user.surname} (${user.username})`);
  } catch {
    await ctx.reply('Not authenticated. Use /verify.');
  }
});

bot.catch((err, ctx) => {
  console.error('Bot error', err);
  ctx.reply('An error occurred. Try again later.');
});

bot.launch().then(() => {
  console.log('Bot started');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));