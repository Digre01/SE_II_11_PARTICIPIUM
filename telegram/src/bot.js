import 'dotenv/config';
import fs from 'fs'; 
import { Telegraf, Scenes, session, Markup } from 'telegraf';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import turinData from './data/turin_boundaries.json';
import API from './API.js';
import { Categories } from './models.js';

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  console.error('BOT_TOKEN missing in environment. Set BOT_TOKEN in .env');
  process.exit(1);
}


const categories = (process.env.CATEGORIES?.split(',').map(s => s.trim()).filter(Boolean)) 
  || Object.values(Categories);

let turinPolygon = null;

try {

  
  
  turinPolygon = turinData.geojson;
  console.log('Turin boundaries loaded successfully.');
} catch (error) {
  console.warn('⚠️ Warning: Could not load turin_boundaries.json. Location check will be skipped.');
  console.error(error.message);
}


function isInTurin(lat, lon) {
  if (!turinPolygon){
    return true;
  }

  const userLocation = point([lon, lat]);
  
  return booleanPointInPolygon(userLocation, turinPolygon);
}


// ------------------------------------------------------------------
// 3. WIZARD SCENE
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
      return; // stay on this step
    }

    if (!isInTurin(loc.latitude, loc.longitude)) {
      await ctx.reply('⚠️ The location is outside the administrative boundaries of Turin. Please select a point inside the city.');
      return; // stay on this step
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
      categories.map(c => [c])
    ).oneTime().resize());
    return ctx.wizard.next();
  },

  // STEP 5: Category
  async (ctx) => {
    const cat = ctx.message?.text?.trim();
    if (!cat || !categories.includes(cat)) {
      await ctx.reply('Select a category from the proposed list.');
      return;
    }
    ctx.wizard.state.report.category = cat;
    await ctx.reply('You can attach up to 3 photos. Send a photo now, or type "skip" to skip.');
    return ctx.wizard.next();
  },

  // STEP 6: Photos Loop
  async (ctx) => {
    const state = ctx.wizard.state.report;
    const msg = ctx.message;

    // Check skip
    if (msg?.text && msg.text.toLowerCase() === 'skip') {
      await ctx.reply('Do you want to make the report anonymous? (Yes/No)', Markup.keyboard([
        ['Yes'], ['No']
      ]).oneTime().resize());
      return ctx.wizard.next();
    }

    // Check photo
    if (msg?.photo?.length) {
      const photoSizes = msg.photo;
      const best = photoSizes[photoSizes.length - 1]; // Highest resolution
      state.photos.push({ file_id: best.file_id });

      if (state.photos.length < 3) {
        await ctx.reply(`Photo added (${state.photos.length}/3). Send another photo or type "skip".`);
        return; // stay on same step
      }
      
      // Reached limit
      await ctx.reply('You have reached the limit of 3 photos. Do you want to make the report anonymous? (Yes/No)', Markup.keyboard([
        ['Yes'], ['No']
      ]).oneTime().resize());
      return ctx.wizard.next();
    } else {
      await ctx.reply('Please send a photo or type "skip" to proceed.');
      return; // stay
    }
  },

  // STEP 7: Anonymous & Submit
  async (ctx) => {
    const txt = ctx.message?.text?.trim().toLowerCase();
    if (!txt || !['yes', 'no'].includes(txt)) {
      await ctx.reply('Answer "Yes" or "No".');
      return;
    }
    ctx.wizard.state.report.anonymous = (txt === 'yes');

    const r = ctx.wizard.state.report;
    // Show summary
    const summary = [
      'Report summary:',
      `Title: ${r.title}`,
      `Description: ${r.description}`,
      `Category: ${r.category}`,
      `Location: lat ${r.location.lat.toFixed(5)}, lon ${r.location.lon.toFixed(5)}`,
      `Photos: ${r.photos.length}`,
      `Anonymous: ${r.anonymous ? 'Yes' : 'No'}`
    ].join('\n');

    await ctx.reply(summary);

    try {
      const result = await API.createReportFromWizard(bot, r);
      await ctx.reply(`Thank you! Your report has been registered with id ${result.id}.`);
    } catch (err) {
      await ctx.reply(`Failed to submit the report: ${err}`);
    }
    return ctx.scene.leave();
  }
);

// ------------------------------------------------------------------
// 4. BOT SETUP
// ------------------------------------------------------------------
const stage = new Scenes.Stage([newReportWizard]);
const bot = new Telegraf(token);

bot.use(session());
bot.use(stage.middleware());

// Simple verification state per username (in-memory fallback). Backend is source of truth.
const verifiedUsers = new Set();

bot.start((ctx) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendUrl}/telegram_verify`;
  return ctx.reply(
    'Welcome! To link your account, open the verification page and generate your code, then send /verify <code> here. After verification you can use /newreport.',
    Markup.inlineKeyboard([
      [Markup.button.url('Open verification page', verifyUrl)]
    ])
  );
});

bot.command('verify', async (ctx) => {
  const txt = ctx.message?.text || '';
  const parts = txt.trim().split(/\s+/);
  if (parts.length < 2) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/telegram_verify`;
    return ctx.reply(
      'Usage: /verify <code>\nIf you need a code, open the verification page to generate one:',
      Markup.inlineKeyboard([[Markup.button.url('Get code', verifyUrl)]])
    );
  }
  const code = parts[1];
  const username = ctx.from?.username;
  if (!username) {
    return ctx.reply('Your Telegram account has no public username. Please set a username in Telegram settings and try again.');
  }
  try {
    const res = await fetch(`${API.SERVER_URL}/api/v1/telegram/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    const data = await res.json();
    verifiedUsers.add(username);
    await ctx.reply('Verification successful! You can now use /newreport.');
  } catch (err) {
    await ctx.reply(`Verification failed: ${err.message || err}`);
  }
});

function ensureVerified(ctx) {
  const username = ctx.from?.username;
  if (!username || !verifiedUsers.has(username)) {
    ctx.reply('You must verify your account first with /verify <code>.');
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

bot.catch((err, ctx) => {
  console.error('Bot error', err);
  ctx.reply('An error occurred. Try again later.');
});

bot.launch().then(() => {
  console.log('Bot started');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));