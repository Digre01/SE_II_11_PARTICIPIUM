import 'dotenv/config';
import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import API from './API.js';
import { Categories } from './models.js';

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('BOT_TOKEN missing in environment. Set BOT_TOKEN in .env');
  process.exit(1);
}

// ------------------------------------------------------------------
// 1. DATA LOADING & UTILS
// ------------------------------------------------------------------

const categories_names = Object.values(Categories);
const categoryIdByName = new Map(Object.entries(Categories).map(([id, name]) => [name, Number(id)]));
const categoryIdByNameLC = new Map(Object.entries(Categories).map(([id, name]) => [name.toLowerCase(), Number(id)]));

let turinPolygon = null;

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const boundariesPath = path.join(__dirname, 'data', 'turin_boundaries.json');
  const raw = fs.readFileSync(boundariesPath, 'utf-8');
  const turinData = JSON.parse(raw);
  const cityBoundary = Array.isArray(turinData)
    ? (turinData.find(d => d.addresstype === 'city') || turinData[0])
    : turinData;
  turinPolygon = cityBoundary?.geojson || null;
  console.log('Turin boundaries loaded successfully.');
} catch (error) {
  console.warn('⚠️ Warning: Could not load turin_boundaries.json. Location check will be skipped.');
}

function isInTurin(lat, lon) {
  if (!turinPolygon) return true;
  const userLocation = point([lon, lat]);
  return booleanPointInPolygon(userLocation, turinPolygon);
}

const verifiedUsers = new Set();

// ------------------------------------------------------------------
// 2. VERIFY WIZARD
// ------------------------------------------------------------------
const verifyWizard = new Scenes.WizardScene(
  'verify-wizard',
  
  // STEP 1: Ask for code
  async (ctx) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; //telegram does not like localhost >:(
    const verifyUrl = `${frontendUrl}/verify_telegram`;
    
    await ctx.reply(`Insert your code now.\n\nIf you don't have one, generate it here (copy and paste on the browser): \n ${verifyUrl}`);
    return ctx.wizard.next();
  },

  // STEP 2: Receive code and Verify
  async (ctx) => {
    const code = ctx.message?.text?.trim();

    if (!code) {
      await ctx.reply('Invalid input. Please send the text code or type /cancel to stop.');
      return; 
    }

    const username = ctx.from?.username;
    if (!username) {
      await ctx.reply('Your Telegram account has no public username. Please set a username in Telegram settings and try again.');
      return ctx.scene.leave();
    }

    try {
      await ctx.reply('Verifying...');
      await API.verifyTelegram(username, code);
      verifiedUsers.add(username);
      await ctx.reply('✅ Verification successful! You can now use /newreport.', Markup.removeKeyboard());
      return ctx.scene.leave();
    } catch (err) {
      await ctx.reply(`❌ Verification failed: ${err.message || err}. \nPlease try /verify again.`);
      return ctx.scene.leave();
    }
  }
);

// ------------------------------------------------------------------
// 3. REPORT WIZARD
// ------------------------------------------------------------------
const newReportWizard = new Scenes.WizardScene(
  'new-report',
  
  // STEP 1: Request Location
  async (ctx) => {
    ctx.wizard.state.report = { photos: [] };
    await ctx.reply('📍 Please send the location on the Turin map (use the paperclip and "Location").');
    return ctx.wizard.next();
  },

  // STEP 2: Validate Location
  async (ctx) => {
    const loc = ctx.message?.location;
    if (!loc) {
      await ctx.reply('I did not receive a location. Send a location using the Location function.');
      return;
    }

    if (!isInTurin(loc.latitude, loc.longitude)) {
      await ctx.reply('⚠️ The location is outside the administrative boundaries of Turin. Please select a point inside the city.');
      return;
    }

    ctx.wizard.state.report.location = { lat: loc.latitude, lon: loc.longitude };
    await ctx.reply('Enter the title of the report.');
    return ctx.wizard.next();
  },

  // STEP 3: Title
  async (ctx) => {
    const title = ctx.message?.text?.trim();
    if (!title) {
      await ctx.reply('Please send a text as title.');
      return;
    }
    ctx.wizard.state.report.title = title;
    await ctx.reply('Send the description (details of the problem).');
    return ctx.wizard.next();
  },

  // STEP 4: Description
  async (ctx) => {
    const description = ctx.message?.text?.trim();
    if (!description) {
      await ctx.reply('Please send a text as description.');
      return;
    }
    ctx.wizard.state.report.description = description;
    await ctx.reply('Choose a category:', Markup.keyboard(
      categories_names.map(c => [c])
    ).oneTime().resize());
    return ctx.wizard.next();
  },

  // STEP 5: Category
  async (ctx) => {
    const catRaw = ctx.message?.text?.trim();
    if (!catRaw) {
      await ctx.reply('Select a category from the proposed list.');
      return;
    }
    const catLC = catRaw.toLowerCase();
    const matchedName = categories_names.find(n => n.toLowerCase() === catLC);
    
    if (!matchedName) {
      await ctx.reply('Select a category from the proposed list.');
      return;
    }
    
    const cid = categoryIdByNameLC.get(catLC) ?? categoryIdByName.get(matchedName);
    ctx.wizard.state.report.categoryId = cid;
    ctx.wizard.state.report.categoryName = matchedName;
    
    await ctx.reply('Attach at least 1 photo (max 3). Send a photo now.');
    return ctx.wizard.next();
  },

  // STEP 6: Photos Loop
  async (ctx) => {
    const state = ctx.wizard.state.report;
    const msg = ctx.message;
    const textInput = msg?.text?.trim().toLowerCase();

    // Check for "Skip" button or command
    if (textInput === 'skip') {
      if ((state.photos?.length || 0) < 1) {
        await ctx.reply('You must attach at least 1 photo before proceeding. Please send a photo.');
        return;
      }
      await ctx.reply('Do you want to make the report anonymous? (Yes/No)', Markup.keyboard([
        ['Yes', 'No']
      ]).oneTime().resize());
      return ctx.wizard.next();
    }

    // Check photo
    if (msg?.photo?.length) {
      const photoSizes = msg.photo;
      const best = photoSizes[photoSizes.length - 1]; 
      state.photos.push({ file_id: best.file_id });

      const count = state.photos.length;

      if (count < 3) {
        await ctx.reply(
          `Photo added (${count}/3). Send another photo or click "Skip" to finish.`,
          Markup.keyboard([['Skip']]).oneTime().resize()
        );
        return; 
      }
      
      // Reached limit
      await ctx.reply('You have reached the limit of 3 photos. Do you want to make the report anonymous? (Yes/No)', Markup.keyboard([
        ['Yes', 'No']
      ]).oneTime().resize());
      return ctx.wizard.next();
    } else {
      const count = state.photos?.length || 0;
      if (count < 1) {
        await ctx.reply('Please send at least 1 photo to continue.');
      } else {
        await ctx.reply('Please send a photo or click "Skip" to proceed.', Markup.keyboard([['Skip']]).oneTime().resize());
      }
      return;
    }
  },

  // STEP 7: Anonymous & Submit
  async (ctx) => {
    const txt = ctx.message?.text?.trim().toLowerCase();
    if (!txt || !['yes', 'no'].includes(txt)) {
      await ctx.reply('Answer "Yes" or "No".', Markup.keyboard([['Yes', 'No']]).oneTime().resize());
      return;
    }
    ctx.wizard.state.report.anonymous = (txt === 'yes');

    const r = ctx.wizard.state.report;
    const summary = [
      '📝 Report summary:',
      `Title: ${r.title}`,
      `Category: ${r.categoryName}`,
      `Photos: ${r.photos.length}`,
      `Anonymous: ${r.anonymous ? 'Yes' : 'No'}`
    ].join('\n');

    await ctx.reply(summary);

    try {
      await API.createReportFromWizard(bot, r);
      await ctx.reply(`Thank you! Your report has been registered successfully!`, Markup.removeKeyboard());
    } catch (err) {
      await ctx.reply(`Failed to submit the report: ${err}`, Markup.removeKeyboard());
    }
    return ctx.scene.leave();
  }
);

// ------------------------------------------------------------------
// 4. BOT SETUP & GLOBAL CANCEL
// ------------------------------------------------------------------

const stage = new Scenes.Stage([newReportWizard, verifyWizard]);

stage.command('cancel', async (ctx) => {
  await ctx.reply('🚫 Operation canceled.', Markup.removeKeyboard());
  return ctx.scene.leave();
});

const bot = new Telegraf(token);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
  const introText = 'Welcome! \n1. /verify - Link your account\n2. /newreport - Report an issue\n3. /cancel - Stop current action';
  return ctx.reply(introText);
});

// Enters the verify wizard
bot.command('verify', (ctx) => {
  ctx.scene.enter('verify-wizard');
});

// Fallback cancel if used outside of a scene
bot.command('cancel', (ctx) => {
  ctx.reply('Nothing to cancel.', Markup.removeKeyboard());
});

function ensureVerified(ctx) {
  const username = ctx.from?.username;
  if (!username || !verifiedUsers.has(username)) {
    ctx.reply('You must verify your account first with /verify.');
    return false;
  }
  return true;
}

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
  } catch (err) {
    await ctx.reply(`Not authenticated. Use /verify.`);
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