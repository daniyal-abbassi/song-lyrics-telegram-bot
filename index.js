// ===== APPLICATION ENTRY POINT =====
const { Telegraf } = require("telegraf");
const { config } = require("./src/config/configuration");
const { handleLyricsCommand } = require("./src/controllers/lyrics.controller");
const logger = require("./src/utils/logger");
require("dotenv").config();
// --- VALIDATE CONFIGURATION ---
// if (!config.botToken || !config.geminiApiKey) {
//   logger.fatal("FATAL: BOT_TOKEN or GEMINI_API_KEY is missing from environment variables. Exiting.");
//   process.exit(1);
// }
// if (!config.botToken) {
//   logger.fatal("FATAL: BOT_TOKEN or GEMINI_API_KEY is missing from environment variables. Exiting.");
//   process.exit(1);
// }
console.log(config)
// --- INITIALIZE BOT ---
const bot = new Telegraf(config.botToken);

// --- REGISTER COMMANDS ---
bot.start((ctx) => ctx.reply("Welcome! Use the /lyrics command to find song lyrics.\n\nExample: /lyrics Hotel California by The Eagles"));
bot.command("lyrics", handleLyricsCommand);

// --- LAUNCH BOT & HANDLE SHUTDOWN ---
async function startBot() {
  try {
    await bot.launch();
    logger.info("Bot is running successfully.");
  } catch (error) {
    logger.fatal({ error }, "Failed to launch the bot.");
    process.exit(1);
  }
}

startBot();

// Graceful shutdown
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  logger.info("Bot stopped due to SIGINT.");
  process.exit(0);
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  logger.info("Bot stopped due to SIGTERM.");
  process.exit(0);
});