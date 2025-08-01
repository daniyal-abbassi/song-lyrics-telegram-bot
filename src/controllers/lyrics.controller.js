// ===== LYRICS CONTROLLER =====
const aiService = require("../services/ai.service");
const scrapingService = require("../services/scraping.service");
const logger = require("../utils/logger");
const { LyricsNotFoundError, InputParseError } = require("../utils/customErrors");

/**
 * Handles the entire flow for the /lyrics command.
 * @param {import("telegraf").Context} ctx - The Telegraf context object.
 */
async function handleLyricsCommand(ctx) {
  const userInput = ctx.message.text.substring("/lyrics".length).trim();
  const chatId = ctx.chat.id;

  if (!userInput) {
    return ctx.reply("Please provide a song and artist. Usage: /lyrics Song Name by Artist Name");
  }

  logger.info({ chatId, userInput }, "Received /lyrics command.");
  await ctx.telegram.sendChatAction(chatId, "typing");
  const loadingMessage = await ctx.reply("🔍 Got it! Analyzing your request and searching for lyrics...");

  try {
    // 1. Parse Input using AI
    const { songName, artistName } = await aiService.parseSongAndArtist(userInput);
    logger.info({ songName, artistName }, "AI parsing successful.");
    await ctx.telegram.editMessageText(
      chatId,
      loadingMessage.message_id,
      null,
      `✅ Request parsed! Now scraping the web for lyrics to "${songName}" by ${artistName}... This might take a moment.`
    );
    await ctx.telegram.sendChatAction(chatId, "typing");

    // 2. Scrape Lyrics
    const lyrics = await scrapingService.getLyrics(songName, artistName);
    logger.info(`Lyrics found for "${songName}". Replying to user.`);
    
    // 3. Send Lyrics
    // Delete the "loading" message and send the final result.
    await ctx.telegram.deleteMessage(chatId, loadingMessage.message_id);
    await ctx.reply(`🎶 Here are the lyrics for "${songName}" by ${artistName}:\n\n${lyrics}`);

  } catch (error) {
    logger.error({ error: error.name, message: error.message }, "Error handling /lyrics command.");
    await ctx.telegram.deleteMessage(chatId, loadingMessage.message_id);

    // 4. Handle Specific Errors Gracefully
    if (error instanceof LyricsNotFoundError || error instanceof InputParseError) {
      // These are "expected" failures, provide a helpful message.
      await ctx.reply(`⚠️ Sorry, I ran into a problem: ${error.message}`);
    } else {
      // This is an unexpected technical error.
      await ctx.reply("🚨 An unexpected error occurred. The developers have been notified. Please try again later.");
    }
  }
}

module.exports = { handleLyricsCommand };