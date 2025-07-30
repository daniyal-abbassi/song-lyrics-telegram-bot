// load the .env file
require("dotenv").config();
// import telegraf
const { Telegraf } = require("telegraf");
// import openai
const { OpenAI } = require("openai");
// --- CONFIGURE DEEPSEEK ---
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_TOKEN,
});

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
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a happy friend who gives short answares."},
        { role: "user", content: userInput }
      ],
      model: "deepseek-chat",
    });
    ctx.reply(completion.choices[0].message.content);
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
