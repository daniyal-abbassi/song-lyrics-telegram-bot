const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
// --- SCRAPE FROM GOOGLE SEARCHS PAGE ---
const googleSearchQuery =
  "https://www.bing.com/search?q=void+lyrics+by+melanie+martinez";
// const url = "https://www.musixmatch.com/de/songtext/J-Cole/Port-Antonio-1";
async function test() {
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
    //mimic cookie
    // await newPage.setCookie({
    //   name: "mxm_bab",
    //   value: "AA",
    //   domain: "www.musixmatch.com",
    //   path: "/",
    // });
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
      const lyricElements = document.querySelectorAll(
        'div.verse.tc_translate'
      );
    //   console.log("lyricsElements evaluate are: ", lyricElements);
      const lyricsArray = Array.from(lyricElements).map((element) =>
        element.textContent.trim()
      );
    //   console.log("far lyrics are: ", lyricsArray);
      return lyricsArray;
    });
    // console.log("lyrics should be: ", lyrics);
    // console.log('Lyrics for "Worm" by IC3PEAK:');
    lyrics.forEach((line, index) => {
      console.log(`- ${line}`);
    });

    // await newPage.waitForNetworkIdle();
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
test();

//.r-zd98yo
//https://www.musixmatch.com/de/songtext/J-Cole/Port-Antonio-1
