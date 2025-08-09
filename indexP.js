// puppeteer and scraping imports
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

require("dotenv").config();
const { Telegraf, Markup, session } = require("telegraf");
const { message } = require("telegraf/filters");
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// UserAgents
const USER_AGENTS = [
  // Chrome (Windows/Mac/Linux)
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",

  // Firefox (Windows/Mac/Linux)
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",

  // Safari (Mac)
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",

  // Edge (Windows/Mac)
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",

  // Opera
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/91.0.4516.20",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/91.0.4516.20",

  // Legacy Browsers (for diversity)
  "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko", // IE11
  "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0", // Old Firefox

  // Mobile User Agents (10)
  // Android (Chrome)
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",

  // iOS (Safari)
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPod touch; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",

  // Android (Firefox/Samsung)
  "Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0",
  "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/125.0.0.0 Mobile Safari/537.36",

  // Windows Phone (Edge)
  "Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 Edge/125.0.0.0",

  // Tablet (iPad/Android)
  "Mozilla/5.0 (Linux; Android 12; Lenovo TB-J606F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
];
// Waiting function
const sleep = (ms) =>
  new Promise((res) => setTimeout(res, ms + Math.random() * (ms * 0.5)));

// this function meant to use ai to search gathered-urls and tyr to extract lyrics from them!
async function aiGetLyricsWithUrl(urls, songName, artistName) {
  /**
  urls array looks like this: 
  [
    {
      url: 'https://genius.com/Adele-hello-lyrics', 
      source: 'genius' 
   },
    {
      url: 'https://www.songtexte.com/songtext/adele/hello-4379270f.html',
      source: 'songtexte.com'
  },
];
   */

  //loop through each source from urls array and try to get lyrics with ai URL-Context/google-search abilities.
  for (const { url, source } of urls) {
    try {
      const getLyricsPrompt = `
      you are a find and retrieve bot, you look in this site: ${source} with this URL: ${url} to get lyrics of song [${songName}] by [${artistName}], do not generete yourself.
      
    **Output Format:**
    - If you find the verified lyrics, provide ONLY the lyrics and nothing else.
    - If you cannot find the verified lyrics, respond with the single, exact string: "ERROR::LYRICS_NOT_FOUND"
    `;
      const lyrics = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: getLyricsPrompt,
        config: {
          tools: [{ urlContext: {}, googleSearch: {} }],
          temperature: 0.1,
        },
      });
      const resultOfAi = lyrics.text;
      //test output
      console.log("this is ai-output----------------: ", resultOfAi);

      if (resultOfAi === "ERROR::LYRICS_NOT_FOUND") {
        continue;
      }
      return resultOfAi;
    } catch (error) {
      console.log("even ai could not get lyrics: ", error);
    }
  } //for loop
} //gain lyrics function

let extractedLyrics = null;
async function getLyrics(songName, artistName) {
  let browser;
  try {
    // === CONFIGURE BROWSER ===
    // configure browser
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
      ],
      ignoreHTTPSErrors: true,
    });
    // random user agent
    const randomUserAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    // create a new page
    const newPage = await browser.newPage();
    // more real browser
    await newPage.setUserAgent(randomUserAgent);
    await newPage.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
    });
    await newPage.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    });

    // === BING SEARCH ===
    console.log("Navigating to URL...");
    const bingQuery = `https://www.bing.com/search?q=${encodeURIComponent(
      songName
    )}+${encodeURIComponent(artistName)}+lyrics+musixmatch`;

    console.log(`Navigating to bing: ${bingQuery}`);
    await newPage.goto(bingQuery, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await sleep(1000); //delay

    // === SCRAPE FROM BING ===
    console.log("Checking for lyrics on Bing search page...");

    let lyrics = [];
    try {
      await newPage.waitForSelector("div.lyrics", { timeout: 30000 });
      lyrics = await newPage.evaluate(() => {
        const lyricElements = document.querySelectorAll(
          "div.verse.tc_translate"
        );
        return Array.from(lyricElements).map((element) =>
          element.textContent.trim()
        );
      });
      if (lyrics.length) {
        console.log("Lyrics found on Bing search page:");
        lyrics.forEach((line, index) => console.log(`- ${line}`));
        extractedLyrics = lyrics.join("\n");
        return; // Exit if lyrics are found
      } else {
        console.log("No lyrics found directly on Bing search page.");
      }
    } catch (error) {
      console.log(
        "No lyrics section found on Bing search page:",
        error.message
      );
    }

    /// === SCRAPE MUSIXMATCH ===

    console.log("Searching for MusixMatch or lyricstranslate Link...");
    const sourceUrl = await newPage.evaluate(() => {
      // Get all search result list items
      const searchResults = document.querySelectorAll("li.b_algo");
      for (const result of searchResults) {
        // Find the anchor (<a>) tag within the result
        const linkElement = result.querySelector("a");
        if (
          (linkElement && linkElement.href.includes("musixmatch.com/lyrics")) ||
          (linkElement && linkElement.href.includes("lyricstranslate.com"))
        ) {
          return linkElement.href; // Return the first one we find
        }
      }
      return null; // Return null if no link was found
    });

    /// get all links
    if (!sourceUrl) {
      try {
        console.log("no rource url, collecting link...");
        const allSearchLinksWithText = await newPage.evaluate(() => {
          const searchResults = document.querySelectorAll("li.b_algo");
          const results = [];

          for (const result of searchResults) {
            const linkElement = result.querySelector("a.tilk");
            if (linkElement && linkElement.getAttribute("aria-label")) {
              results.push({
                url: linkElement.href,
                source: linkElement.getAttribute("aria-label").toLowerCase(),
              });
            }
          } //for loop
          return results.length > 0 ? results : null;
          // return extractedLyrics = results.length > 0 ? results : null;
        }); //get all links
        // if no sourceURL founded, return links, must return something to user,not error!
        console.log("before return: ", extractedLyrics);
        extractedLyrics = allSearchLinksWithText;
      } catch (error) {
        console.log("Can not get all links: ", error);
      }
    }
    // ADD A FALLBACK

    if (sourceUrl && sourceUrl.includes("musixmatch")) {
      try {
        console.log(`Found Musixmatch URL: ${sourceUrl}`);
        // set musixmatch cookies
        await newPage.setCookie({
          name: "mxm_bab",
          value: "AA",
          domain: "www.musixmatch.com",
        });

        console.log("Navigating to Musixmatch...");
        await newPage.goto(sourceUrl, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });
        console.log("Waiting for lyrics container to appear on Musixmatch...");
        await sleep(1000); ///delay

        await newPage.waitForSelector("div.css-175oi2r.r-1peese0", {
          timeout: 10000,
        });
        //extract lyrics
        const lyrics = await newPage.evaluate(() => {
          const lyricsElements = Array.from(
            document.querySelectorAll(
              'div.css-146c3p1.r-1inkyih.r-11rrj2j.r-13awgt0.r-fdjqy7.r-1dxmaum.r-1it3c9n.r-135wba7[dir="auto"]'
            )
          );

          return lyricsElements.map((element) => element.textContent.trim());
        });
        extractedLyrics = lyrics.join("\n");
        console.log("this should be lyrics: ", lyrics.join("\n"));
      } catch (error) {
        console.error("Error Scraping musixmatch: ", error);
      }
    } else {
      console.error(
        "Could not find a Musixmatch link on the first page of Bing results."
      );
    } //if find musixmatch link
    if (sourceUrl && sourceUrl.includes("translate")) {
      console.log("Scraping lyricstranslate...");
      try {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await newPage.goto(sourceUrl, {
              waitUntil: "networkidle2",
              timeout: 60000,
            });
            await sleep(100); // Longer delay to mimic human behavior
            await newPage.waitForSelector("#song-body", { timeout: 10000 });
            const lyrics = await newPage.evaluate(() => {
              const lyricsElements = Array.from(
                document.querySelectorAll("#song-body .par")
              );
              return lyricsElements
                .map((el) => el.textContent.trim())
                .filter((line) => line && !line.match(/^\s*$/));
            });
            if (lyrics.length) {
              console.log(
                `Lyricstranslate Lyrics (Puppeteer fallback, attempt ${attempt}):\n`,
                lyrics.join("\n")
              );
              extractedLyrics = lyrics.join("\n");
              break;
            } else {
              console.log(`No lyrics found on attempt ${attempt}.`);
            }
          } catch (fallbackError) {
            console.error(
              `Fallback attempt ${attempt} failed:`,
              fallbackError.message
            );
            if (attempt === 3) console.log("All fallback attempts failed.");
            await sleep(1000 * attempt); // Exponential backoff
          }
        }
      } catch (error) {
        console.log("puppeteer scraping also failed: ", error);
      }
    } else {
      console.error(
        "Could not find a Lyricstranslate link on the first page of Bing results."
      );
    }

    // await newPage.screenshot({ path: "screenshot.jpg" });
  } catch (error) {
    console.log("this is error: ", error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
  }
} // findMusixLink function

// --- CREATE BOT ---
const bot = new Telegraf(process.env.BOT_TOKEN);

// initiate sessions
bot.use(session());
// initialize session object
bot.use((ctx, next) => {
  ctx.session ??= {}; //ensure session is object
  return next();
});
// --- /start COMMAND ---
bot.start(async (ctx) => {
  //start keyboard selection
  await ctx.reply(
    "How to get Lyrics for you:",
    Markup.keyboard([
      ["I wanna Send a Music File."],
      ["Get Lyrics by entering name."],
    ])
      .oneTime() // The keyboard disappears after one use
      .resize() // Makes the buttons fit the screen better
  );
});
//KEYBOARD REPLY
bot.hears("I wanna Send a Music File.", async (ctx) => {
  await ctx.reply("Send me a Music");
});
bot.hears("Get Lyrics by entering name.", async (ctx) => {
  await ctx.reply("type /lyrics Name by Artist e.g: Hello by Adele");
});
//RECIEVE MUSIC FILE
bot.on(message("audio"), async (ctx) => {
  console.log("audio has sent!");
  const audio = ctx.message.audio;
  const songName = audio.title;
  const songArtist = audio.performer;
  //add info to session
  ctx.session.lastSong = { name: songName, artist: songArtist };

  await ctx.reply(
    ` title: ${songName} \n name: ${audio.file_name} \n time: ${audio.duration} \n size: ${audio.file_size} \n performer: ${songArtist} \n memeType: ${audio.mime_type} \n id: ${audio.file_id}\n uniq id: ${audio.file_unique_id} \n tumbnail: ${audio.thumbnail}`
  );
  //choose between 1-with scraping(1,2 mins) & 2-with ai(2,5min)
  await ctx.reply(
    "Specify method",
    Markup.keyboard([["Slow - 1 or 2 mins"], ["Slower - 2 or 5 mins"]])
      .oneTime()
      .resize()
  );
});
// get lyrics scraping method
bot.hears("Slow - 1 or 2 mins", async (ctx) => {
  ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  //show a message => indicating that the bot is trying go get , kink of spinner maybe, or a timer , something that tells user that the bot is in sort of a process and also the user can see how much of the process is remained.
  //get lyrics
  console.log('ctx.session should be: ',ctx.session)
  ctx.reply(
    `name is: ${ctx.session.lastSong.name} \n artist is: ${ctx.session.lastSong.artist}`
  );
  // await getLyrics(songName, songArtist);
  // await ctx.reply(`lyrics: ${extractedLyrics}`);
});

//get lyrics ai method
bot.hears("Slower - 2 or 5 mins", async (ctx) => {
  ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  //show a message => indicating that the bot is trying go get , kink of spinner maybe, or a timer , something that tells user that the bot is in sort of a process and also the user can see how much of the process is remained.
});
// --- CONFIGURE /lyrics COMMAND ---
// bot.command("lyrics", async (ctx) => {
//   // get the text after command
//   const userInput = ctx.message.text.substring("/lyrics".length).trim();
//   if (!userInput) {
//     return ctx.reply("Use This Format: /lyrics Hello by Adele");
//   }

//   // show typing...
//   await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
//   try {
//     // correct types with gemini
//     const correctionPrompt = `You are a spell-checking and entity-recognition expert specializing in music. Correct any typos in the following user query. The query contains a song title and an artist. Your task is to return ONLY the corrected "Song Title by Artist". Do not add any explanation, quotation marks, or other text.INPUT: "${userInput}"\nOUTPUT:`;
//     const correctionResult = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: correctionPrompt,
//     });
//     const correctedQuery = await correctionResult.text.trim();
//     console.log("this should be corrected query: ", correctedQuery);
//     // split the input
//     const parts = correctedQuery.split(/ by /i);
//     if (parts.length < 2) {
//       return ctx.reply("FORMAT: SONG-NAME by ARTIST-NAME");
//     }
//     const songName = parts[0].trim();
//     const artistName = parts[1].trim();
//     console.log("this should be correct text: ", correctedQuery);
//     console.log("this shoud be parts: ", parts);
//     // URLS
//     let URL=`https://www.azlyrics.com/lyrics/${artistName.toLocaleLowerCase().replace(/\s+/g,'')}/${songName.toLocaleLowerCase().replace(/\s+/g,"")}.html`;
//     console.log('this is url: ',URL)
//     const getLyricsPrompt = `
//       you are a find and retrieve bot, you search sites like azlyrics: ${URL} to get lyrics of song [${songName}] by [${artistName}], do not generete yourself

//       **Output Format:**
//       - If you find the verified lyrics, provide ONLY the lyrics and nothing else.
//       - If you cannot find the verified lyrics, respond with the single, exact string: "ERROR::LYRICS_NOT_FOUND"
//     `;

//     const lyrics = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: getLyricsPrompt,
//       config: {
//         tools: [{urlContext: {},googleSearch: {}}],
//         temperature: 0.1,
//       },
//     });
//     // test
//     console.log('this should be metadata: ',lyrics.candidates[0].urlContextMetadata)
//     await ctx.reply(lyrics.text);
//   } catch (error) {
//     console.error("AI error: ", error);
//     await ctx.reply("ai is damaged!");
//   }
// });

// test scraping lyrics and output TElegramBot

bot.command("lyrics", async (ctx) => {
  const userInput = ctx.message.text.substring("/lyrics".length).trim();
  if (!userInput) {
    await ctx.reply("Correct Format: /lyrics songName songArtist");
  }
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  try {
    //get songName and ArtistName from message
    const [songName, songArtist] = userInput.split(/ by /i);
    console.log(`songName is: ${songName} - and songArtist is: ${songArtist}`);

    //scrape function call
    await getLyrics(songName, songArtist);

    //bot reply
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
    await ctx.reply(`Wait to get Lyrics for: ${songName} by ${songArtist}...`);
    console.log("type of answare is: ", typeof extractedLyrics);
    // console.log('and the answare is: ',extractedLyrics);
    await ctx.reply(extractedLyrics);
    try {
      if (typeof extractedLyrics === "object") {
        // console.log('and the answare is: ',extractedLyrics);
        const keyboard = Markup.inlineKeyboard(
          extractedLyrics.map((site) => [
            Markup.button.url(site.source, site.url),
          ])
        );
        await ctx.reply(
          "I'm ashamed :( BUT Founded sites that migth help: ",
          keyboard
        );
        await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
        console.log("get lryics with ai...");
        const lyrics = await aiGetLyricsWithUrl(
          extractedLyrics,
          songName,
          songArtist
        );
        if (lyrics !== "ERROR::LYRICS_NOT_FOUND") {
          console.log(
            "---------------result of getting lyrics with ai: ",
            lyrics
          );
          await ctx.reply(`this should be lyrics: ${lyrics}`);
          return;
        } //if
      } // if
    } catch (error) {
      console.log("ai in bot.command if section faield: ", error);
    }
  } catch (error) {
    console.log("Error with command /lyrics: ", error);
  }
});

// launch the bot
bot.launch();
console.log("The Bot is Running...");
// stop handling
process.once("SIGINT", () => bot.stop("SIGING"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
