const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
// --- SCRAPE FROM FRONT BING-SEARCH PAGE ---
const googleSearchQuery =
  "https://www.bing.com/search?q=void+lyrics+by+melanie+martinez";

async function ScrapeBing() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new", // Use 'new' headless mode for better stealth
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Improve launch speed
    });
    const newPage = await browser.newPage();

    await newPage.setViewport({ width: 1920, height: 1080 });
    await newPage.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    console.log("Navigating to URL...");
    await newPage.goto(googleSearchQuery, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("Waiting for lyrics...");

    await newPage.waitForSelector("div.lyrics", {
      timeout: 30000,
    });
    //extract lyrics

    const lyrics = await newPage.evaluate(() => {
      const lyricElements = document.querySelectorAll("div.verse.tc_translate");

      const lyricsArray = Array.from(lyricElements).map((element) =>
        element.textContent.trim()
      );

      return lyricsArray;
    });

    lyrics.forEach((line, index) => {
      console.log(`- ${line}`);
    });

    await newPage.screenshot({ path: "screenshot.jpg" });
    await browser.close();
    return lyrics;
  } catch (error) {
    console.log("this is error: ", error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
  }
}

