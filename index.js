// load the .env file
require("dotenv").config();
// import telegraf
const { Telegraf } = require("telegraf");
// import gemini
const { GoogleGenAI } = require("@google/genai");
// --- CONFIGURE GEMINI ---
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// create bot
const bot = new Telegraf(process.env.BOT_TOKEN);
// a handler for /start command
bot.start(async (ctx) => {
  await ctx.reply("Send me a message");
});
// handler for text message
bot.on("text", async (ctx) => {
  const userInput = ctx.message.text;
  try {
    // show typing indicator to the user
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
    // USE AI
   const geminiResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userInput,
    config: {
      thinkingConfig: {
        thinkingBudget: 0, // disable thinking ability - more spped and less token usage
      }
    }
   })
    ctx.reply(geminiResponse.text);
  } catch (error) {
    console.error("AI error: ", error);
    ctx.reply("Sorry, ai is fucked at the moment, do the thinking yourself...");
  }
});
// launch the bot
bot.launch();
console.log("The Bot is Running...");
// stop handling
process.once("SIGINT", () => bot.stop("SIGING"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
