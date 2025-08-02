// ===== SCRAPING SERVICE =====
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { config, USER_AGENTS, sleep } = require("../config/configuration");
const { LyricsNotFoundError } = require("../utils/customErrors");
const logger = require("../utils/logger");

puppeteer.use(StealthPlugin());

// --- PRIVATE HELPER FUNCTIONS ---

/**
 * STRATEGY 1: Tries to scrape lyrics directly from the Bing search results page.
 * @param {import("puppeteer").Page} page - The Puppeteer page object.
 * @returns {Promise<string|null>} Lyrics text or null if not found.
 */
async function _scrapeFromBingPage(page) {
  logger.debug("Strategy 1: Checking for lyrics directly on Bing page.");
  try {
    // Bing sometimes embeds lyrics directly in a div with this class.
    await page.waitForSelector("div.lyrics", { timeout: 5000 });
    const lyricsArray = await page.evaluate(() => {
      const lyricElements = document.querySelectorAll("div.verse.tc_translate");
      return Array.from(lyricElements).map((el) => el.textContent.trim());
    });

    if (lyricsArray.length > 0) {
      const lyrics = lyricsArray.join("\n");
      logger.info(
        "Successfully scraped lyrics directly from Bing search results."
      );
      return lyrics;
    }
    logger.debug("Bing lyrics container found, but no lyric verses inside.");
    return null;
  } catch (error) {
    logger.debug(
      "No embedded lyrics found on Bing page. Moving to next strategy."
    );
    return null;
  }
}

/**
 * Finds a URL for either Musixmatch or LyricsTranslate from the search results.
 * @param {import("puppeteer").Page} page - The Puppeteer page object.
 * @returns {Promise<{url: string, source: 'musixmatch' | 'lyricstranslate'}|null>}
 */
async function _findLyricsSourceUrl(page) {
  logger.debug(
    "Searching for Musixmatch or LyricsTranslate URL in search results."
  );
  return page.evaluate(() => {
    const searchResults = document.querySelectorAll("li.b_algo");
    for (const link of searchResults) {
      const linkElement = link.querySelector("a");
      if (linkElement && linkElement.href.includes("musixmatch.com/lyrics")) {
        return { url: linkElement.href, source: "musixmatch" };
      }
      if (linkElement && linkElement.href.includes("lyricstranslate.com")) {
        return { url: linkElement.href, source: "lyricstranslate" };
      }
    }
    return null;
  });
}

/**
 * Finds all URLs from the bing search result page.
 * @param {import("puppeteer").page} page - The Puppeteer page object.
 * @returns {Promise<Array<{url: string, source: string}>|null>} Array of objects with url and source, or null if no links are found.
 */
async function _findAllSourceUrls(page) {
  logger.debug("Searching for all URLs in search results.");
  return page.evaluate(() => {
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
    }

    return results.length > 0 ? results : null;
  });
}
/**
 * STRATEGY 2: Tries to scrape lyrics from a Musixmatch URL.
 * @param {import("puppeteer").Page} page - The Puppeteer page object.
 * @param {string} url - The Musixmatch URL to scrape.
 * @returns {Promise<string|null>} Lyrics text or null if scraping fails.
 */
async function _scrapeFromMusixmatch(page, url) {
  logger.debug({ url }, "Strategy 2: Navigating to Musixmatch URL.");
  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: config.puppeteer.navigationTimeout,
    });
    await sleep(config.puppeteer.minDelay);

    // Wait for a generic container of the lyrics body.
    await page.waitForSelector("div.css-175oi2r.r-1peese0", { timeout: 15000 });

    const lyrics = await page.evaluate(() => {
      const lyricsElements = Array.from(
        document.querySelectorAll(
          'div.css-146c3p1.r-1inkyih.r-11rrj2j.r-13awgt0.r-fdjqy7.r-1dxmaum.r-1it3c9n.r-135wba7[dir="auto"]'
        )
      );
      return lyricsElements.map((el) => el.textContent.trim()).join("\n");
    });

    if (lyrics && lyrics.trim().length > 0) {
      logger.info("Successfully scraped lyrics from Musixmatch.");
      return lyrics;
    }
    logger.warn("Navigated to Musixmatch, but no lyrics content was found.");
    await page.screenshot({ path: "screenshot.jpg" });
    return null;
  } catch (error) {
    logger.error(
      { error: error.message },
      "Failed to scrape lyrics from Musixmatch."
    );
    return null;
  }
}

/**
 * STRATEGY 3: Tries to scrape lyrics from a LyricsTranslate URL.
 * @param {import("puppeteer").Page} page - The Puppeteer page object.
 * @param {string} url - The LyricsTranslate URL to scrape.
 * @returns {Promise<string|null>} Lyrics text or null if scraping fails.
 */
async function _scrapeFromLyricsTranslate(page, url) {
  logger.debug({ url }, "Strategy 3: Navigating to LyricsTranslate URL.");
  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: config.puppeteer.navigationTimeout,
    });
    await sleep(config.puppeteer.minDelay);

    // This selector targets the main lyrics container on the site.
    await page.waitForSelector("#song-body", { timeout: 15000 });

    const lyrics = await page.evaluate(() => {
      const lyricsElements = Array.from(
        document.querySelectorAll("#song-body .par")
      );
      return lyricsElements
        .map((el) => el.textContent.trim())
        .filter((line) => line && !line.match(/^\s*$/)) // Remove empty lines
        .join("\n");
    });

    if (lyrics && lyrics.trim().length > 0) {
      logger.info("Successfully scraped lyrics from LyricsTranslate.");
      return lyrics;
    }
    logger.warn(
      "Navigated to LyricsTranslate, but no lyrics content was found."
    );
    return null;
  } catch (error) {
    logger.error(
      { error: error.message },
      "Failed to scrape lyrics from LyricsTranslate."
    );
    return null;
  }
}

// --- PUBLIC SERVICE FUNCTION ---

/**
 * Scrapes song lyrics from the web using a multi-step strategy.
 * @param {string} songName - The name of the song.
 * @param {string} artistName - The name of the artist.
 * @returns {Promise<string>} The scraped lyrics as a single string.
 * @throws {LyricsNotFoundError} If lyrics cannot be found after all attempts.
 * @throws {Error} For other unexpected errors during scraping.
 */
async function getLyrics(songName, artistName) {
  let browser;
  logger.debug(
    { songName, artistName },
    "Starting multi-strategy scraping process."
  );

  try {
    browser = await puppeteer.launch(config.puppeteer.launchOptions);
    const page = await browser.newPage();

    // --- Configure Browser Page ---
    const randomUserAgent =
      USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    await page.setUserAgent(randomUserAgent);
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
    });
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    });

    // --- Navigate to Bing to start the process ---
    const bingQuery = `https://www.bing.com/search?q=${encodeURIComponent(
      songName
    )}+${encodeURIComponent(artistName)}+lyrics+Musixmatch`;
    logger.info(
      { url: bingQuery },
      "Navigating to Bing to find lyrics source."
    );
    await page.goto(bingQuery, {
      waitUntil: "networkidle2",
      timeout: config.puppeteer.navigationTimeout,
    });
    await sleep(config.puppeteer.minDelay);

    // --- EXECUTE SCRAPING STRATEGIES IN ORDER ---

    // Strategy 1: Scrape directly from Bing
    let lyrics = await _scrapeFromBingPage(page);
    if (lyrics) {
      logger.info("Lyrics Found in Bing font's Page.");
      return lyrics;
    }

    // Strategy 2 & 3: Find a source URL and scrape it
    const sourceInfo = await _findLyricsSourceUrl(page);
    if (sourceInfo) {
      if (sourceInfo.source === "musixmatch") {
        logger.info({ url: sourceInfo.url }, "musixmatch URL founded!");
        lyrics = await _scrapeFromMusixmatch(page, sourceInfo.url);
        if (lyrics) return lyrics;
      }
      if (sourceInfo.source === "lyricstranslate") {
        logger.info({ url: sourceInfo.url }, "lyricstranslate URL founded!");
        lyrics = await _scrapeFromLyricsTranslate(page, sourceInfo.url);
        if (lyrics) return lyrics;
      }
    }

    // New: Collect all source URLs for debugging or future strategies
    const allSourceUrls = await _findAllSourceUrls(page);
    if (allSourceUrls) {
      logger.info(
        { allSourceUrls },
        "Collected all source URLs from Bing search results."
      );
    } else {
      logger.debug("No source URLs found in search results.");
    }
    // If all strategies fail, throw the final error.
    logger.warn(
      `All scraping strategies failed for "${songName} by ${artistName}".`
    );
    throw new LyricsNotFoundError(
      `Could not find lyrics for "${songName} by ${artistName}" after trying multiple sources.`
    );
  } catch (error) {
    logger.error(
      { error: error.message, stack: error.stack },
      "An error occurred during the scraping process."
    );
    if (error instanceof LyricsNotFoundError) {
      throw error;
    }
    throw new Error(`A technical error occurred while trying to fetch lyrics.`);
  } finally {
    if (browser) {
      logger.debug("Closing browser instance.");
      await browser.close();
    }
  }
}

module.exports = { getLyrics };
