import { access, readFile } from "fs/promises";
import { resolve, join } from "path";
import { fileURLToPath } from "url";

import TelegramBot from "node-telegram-bot-api";

import { config } from "./config.js";
import { readState, writeState } from "./stateUtils.js";
import { arrayToChunks } from "./utils/arrayToChunks.js";

const screenshotsFolderPath = resolve(
  fileURLToPath(import.meta.url),
  "../../screenshots"
);

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const runTelegramBot = async () => {
  const bot = new TelegramBot(config.telegramBotKey, { polling: true });

  bot.on("message", async (msg) => {
    if (msg.from.id !== config.telegramAllowedFromId) {
      await bot.sendMessage(msg.chat.id, "You are not allowed to use this bot");
      return;
    }
  });

  bot.on("polling_error", (error) => {
    console.log(error);
  });

  bot.on("callback_query", async (query) => {
    if (query.from.id !== config.telegramAllowedFromId) {
      await bot.sendMessage(
        query.message.chat.id,
        "You are not allowed to use this bot"
      );
      return;
    }

    const excludeRegex = /exclude_(\d+)/;

    const excludeMatch = query.data.match(excludeRegex);

    if (query.data === "include") {
      bot.answerCallbackQuery(query.id, `Included`);

      bot.editMessageReplyMarkup(
        {},
        {
          message_id: query.message.message_id,
          chat_id: query.message.chat.id,
        }
      );
    } else {
      bot.answerCallbackQuery(query.id, `Excluded`);
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  });

  bot.onText(/^\/start/, async (msg) => {
    if (msg.from.id !== config.telegramAllowedFromId) {
      await bot.sendMessage(msg.chat.id, "You are not allowed to use this bot");
      return;
    }
    await bot.sendMessage(msg.chat.id, "Welcome", {
      reply_markup: {
        keyboard: [["/selected"], ["/delimiter"]],
      },
    });
  });

  bot.onText(/^\/delimiter/, async (msg) => {
    if (msg.from.id !== config.telegramAllowedFromId) {
      await bot.sendMessage(msg.chat.id, "You are not allowed to use this bot");
      return;
    }

    await bot.sendMessage(msg.chat.id, "=====================");
  });

  const sendPhotosForSelection = async () => {
    let { lastPhotoIdSentToTelegram, lastProcessedPhotoId, ...restOfState } =
      await readState();
    while (lastPhotoIdSentToTelegram < lastProcessedPhotoId) {
      console.log(
        `Sending to telegram ${lastPhotoIdSentToTelegram}/${lastProcessedPhotoId}`
      );
      const screenshotPath = join(
        screenshotsFolderPath,
        `screenshot_${lastPhotoIdSentToTelegram + 1}.png`
      );
      if (await exists(screenshotPath)) {
        await bot.sendDocument(
          config.telegramAllowedFromId,
          await readFile(screenshotPath),
          {
            disable_notification: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Inlcude",
                    callback_data: "include",
                  },
                  {
                    text: "Exclude",
                    callback_data: "exclude",
                  },
                ],
              ],
            },
          },
          {
            filename: `screenshot_${lastPhotoIdSentToTelegram + 1}`,
          }
        );
      }
      await writeState({
        lastPhotoIdSentToTelegram: ++lastPhotoIdSentToTelegram,
        lastProcessedPhotoId,
        ...restOfState,
      });
    }
  };

  await sendPhotosForSelection();

  setInterval(sendPhotosForSelection, 1000 * 60 * 30);
};
