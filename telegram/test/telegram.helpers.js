import {Scenes, session, Telegraf} from "telegraf";
import {jest} from "@jest/globals";
import {newReportWizard} from "../src/scenes/newReportWizard.js";
import {verifyWizard} from "../src/scenes/verifyWizard.js";

export function createBot() {
    const bot = new Telegraf("FAKE_TOKEN");

    const replies = [];
    bot.use((ctx, next) => {
        ctx.reply = jest.fn((msg) => {
            replies.push(msg);
            return Promise.resolve(msg);
        });
        return next();
    });

    bot.use(session({
        defaultSession: () => ({ __scenes: {} })
    }));

    const stage = new Scenes.Stage([newReportWizard, verifyWizard]);
    bot.use(stage.middleware());

    const fakeEnsureVerified = jest.fn(() => true);

    bot.command("newreport", (ctx) => {
        return ctx.scene.enter("new-report");
    });

    bot.command("verify", (ctx) => {
        return ctx.scene.enter("verify-wizard");

    })

    bot.telegram.getMe = jest.fn().mockResolvedValue({ id: 1, is_bot: true, username: 'fakebot' });
    bot.telegram.sendMessage = jest.fn().mockResolvedValue({});
    bot.telegram.getFile = jest.fn().mockResolvedValue({ file_path: 'fake/path.jpg' });
    bot.telegram.getFileLink = jest.fn().mockResolvedValue(new URL('https://fakeurl.com/fake.jpg'));

    return { bot, replies, ensureVerified: fakeEnsureVerified };
}

let updateId = 1;

export function textUpdate(text, chatId = 1, userId = 42) {
    return {
        update_id: updateId++,
        message: {
            message_id: updateId,
            from: {
                id: userId,
                is_bot: false,
                first_name: 'Test',
                username: 'testuser'
            },
            chat: {
                id: chatId,
                type: 'private'
            },
            date: Math.floor(Date.now() / 1000),
            text: text.startsWith('/') ? text : text.trim() // assicura che i comandi inizino con /
        }
    };
}

export function locationUpdate(lat, lon, chatId = 1) {
    return {
        update_id: updateId++,
        message: {
            message_id: updateId,
            from: { id: 42, is_bot: false },
            chat: { id: chatId, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            location: { latitude: lat, longitude: lon }
        }
    };
}

export function photoUpdate(fileId = 'photo123', chatId = 1) {
    return {
        update_id: updateId++,
        message: {
            message_id: updateId,
            from: { id: 42, is_bot: false },
            chat: { id: chatId, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            photo: [
                { file_id: fileId, width: 90, height: 90 },
                { file_id: fileId + '_hd', width: 800, height: 800 }
            ]
        }
    };
}

export function commandUpdate(command, chatId = 1) {
    return {
        update_id: updateId++,
        message: {
            message_id: updateId,
            from: { id: 42, is_bot: false, first_name: 'Test' },
            chat: { id: chatId, type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: `/${command}`,
            entities: [
                {
                    offset: 0,
                    length: command.length + 1,
                    type: 'bot_command'
                }
            ]
        }
    };
}
