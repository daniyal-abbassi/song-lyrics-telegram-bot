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

// --- CONFIGURE /lyrics COMMAND ---
bot.command("lyrics", async (ctx) => {
  // get the text after command
  const userInput = ctx.message.text.substring("/lyrics".length).trim();
  if (!userInput) {
    return ctx.reply("Use This Format: /lyrics Hello by Adele");
  }

  // show typing...
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  try {
    // correct types with gemini
    const correctionPrompt = `You are a spell-checking and entity-recognition expert specializing in music. Correct any typos in the following user query. The query contains a song title and an artist. Your task is to return ONLY the corrected "Song Title by Artist". Do not add any explanation, quotation marks, or other text.INPUT: "${userInput}"\nOUTPUT:`;
    const correctionResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: correctionPrompt,
    });
    const correctedQuery = await correctionResult.text.trim();
    console.log("this should be corrected query: ", correctedQuery);
    // split the input
    const parts = correctedQuery.split(/ by /i);
    if (parts.length < 2) {
      return ctx.reply("FORMAT: SONG-NAME by ARTIST-NAME");
    }
    const songName = parts[0].trim();
    const artistName = parts[1].trim();
    console.log("this should be correct text: ", correctedQuery);
    console.log("this shoud be parts: ", parts);
    // URLS 
    const URL_a='https://www.azlyrics.com/lyrics/melaniemartinez/void.html';
    const URL_b='https://www.azlyrics.com/lyrics/jcole/portantonio.html';
    const URL_c='https://www.azlyrics.com/lyrics/marilynmanson/killingstrangers.html'
    let URL=`https://www.azlyrics.com/lyrics/${artistName.toLocaleLowerCase().replace(/\s+/g,'')}/${songName.toLocaleLowerCase().replace(/\s+/g,"")}.html`;
    console.log('this is url: ',URL)
    const getLyricsPrompt = `
      you are a find and retrieve bot, you search sites like azlyrics: ${URL} to get lyrics of song [${songName}] by [${artistName}], do not generete yourself 
      
      **Output Format:**
      - If you find the verified lyrics, provide ONLY the lyrics and nothing else.
      - If you cannot find the verified lyrics, respond with the single, exact string: "ERROR::LYRICS_NOT_FOUND"
    `;

    const lyrics = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: getLyricsPrompt,
      config: {
        tools: [{urlContext: {},googleSearch: {}}],
        temperature: 0.1,
      },
    });
    // test
    console.log('this should be metadata: ',lyrics.candidates[0].urlContextMetadata)
    await ctx.reply(lyrics.text);
  } catch (error) {
    console.error("AI error: ", error);
    await ctx.reply("ai is damaged!");
  }
});



// launch the bot
bot.launch();
console.log("The Bot is Running...");
// stop handling
process.once("SIGINT", () => bot.stop("SIGING"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
