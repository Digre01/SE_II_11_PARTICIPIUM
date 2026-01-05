import { Scenes, Markup } from 'telegraf';
import API from '../API.js';
import { Categories } from '../models.js';
import { isInTurin } from '../utils/isInTurin.js';

const categories_names = Object.values(Categories);
const categoryIdByName = new Map(Object.entries(Categories).map(([id, name]) => [name, Number(id)]));
const categoryIdByNameLC = new Map(Object.entries(Categories).map(([id, name]) => [name.toLowerCase(), Number(id)]));

export const newReportWizard = new Scenes.WizardScene(
    'new-report',

    async (ctx) => {
        ctx.wizard.state.report = { photos: [] };
        await ctx.reply('📍 Please send the location on the Turin map (use the paperclip and "Location").');
        return ctx.wizard.next();
    },

    async (ctx) => {
        const loc = ctx.message?.location;
        if (!loc) {
            await ctx.reply('I did not receive a location. Send a location using the Location function.');
            return;
        }

        if (!isInTurin(loc.latitude, loc.longitude)) {
            await ctx.reply(
                '⚠️ The location is outside the administrative boundaries of Turin. Please select a point inside the city.'
            );
            return;
        }

        ctx.wizard.state.report.location = { lat: loc.latitude, lon: loc.longitude };
        await ctx.reply('Enter the title of the report.');
        return ctx.wizard.next();
    },

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

    async (ctx) => {
        const description = ctx.message?.text?.trim();
        if (!description) {
            await ctx.reply('Please send a text as description.');
            return;
        }
        ctx.wizard.state.report.description = description;
        await ctx.reply(
            'Choose a category:',
            Markup.keyboard(categories_names.map(c => [c])).oneTime().resize()
        );
        return ctx.wizard.next();
    },

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

    async (ctx) => {
        const state = ctx.wizard.state.report;
        const msg = ctx.message;
        const textInput = msg?.text?.trim().toLowerCase();

        if (textInput === 'skip') {
            if ((state.photos?.length || 0) < 1) {
                await ctx.reply('You must attach at least 1 photo before proceeding. Please send a photo.');
                return;
            }
            await ctx.reply(
                'Do you want to make the report anonymous? (Yes/No)',
                Markup.keyboard([['Yes', 'No']]).oneTime().resize()
            );
            return ctx.wizard.next();
        }

        if (msg?.photo?.length) {
            const best = msg.photo[msg.photo.length - 1];
            state.photos.push({ file_id: best.file_id });

            const count = state.photos.length;

            if (count < 3) {
                await ctx.reply(
                    `Photo added (${count}/3). Send another photo or click "Skip" to finish.`,
                    Markup.keyboard([['Skip']]).oneTime().resize()
                );
                return;
            }

            await ctx.reply(
                'You have reached the limit of 3 photos. Do you want to make the report anonymous? (Yes/No)',
                Markup.keyboard([['Yes', 'No']]).oneTime().resize()
            );
            return ctx.wizard.next();
        }

        const count = state.photos?.length || 0;
        if (count < 1) {
            await ctx.reply('Please send at least 1 photo to continue.');
        } else {
            await ctx.reply(
                'Please send a photo or click "Skip" to proceed.',
                Markup.keyboard([['Skip']]).oneTime().resize()
            );
        }
    },

    async (ctx) => {
        const txt = ctx.message?.text?.trim().toLowerCase();
        if (!txt || !['yes', 'no'].includes(txt)) {
            await ctx.reply('Answer "Yes" or "No".', Markup.keyboard([['Yes', 'No']]).oneTime().resize());
            return;
        }

        ctx.wizard.state.report.anonymous = txt === 'yes';

        const r = ctx.wizard.state.report;
        await ctx.reply(
            [
                '📝 Report summary:',
                `Title: ${r.title}`,
                `Category: ${r.categoryName}`,
                `Photos: ${r.photos.length}`,
                `Anonymous: ${r.anonymous ? 'Yes' : 'No'}`
            ].join('\n')
        );

        try {
            await API.createReportFromWizard(ctx, r);
            await ctx.reply('Thank you! Your report has been registered successfully!', Markup.removeKeyboard());
        } catch (err) {
            await ctx.reply(`Failed to submit the report: ${err}`, Markup.removeKeyboard());
        }

        return ctx.scene.leave();
    }
);
