import { config as localConfig } from "./config.local.js";

const defaultConfig = {
  username: "username",
  password: "password",
  telegramBotKey: "api_key",
  telegramAllowedFromId: "chat_id",
};

export const config = Object.assign({}, defaultConfig, localConfig);
