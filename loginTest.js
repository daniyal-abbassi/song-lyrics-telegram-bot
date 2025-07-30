const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const url = "https://www.musixmatch.com/search";
const songNameAndArtist = 'in the end linking park'
async function ScrapeMusixMatch() {
  let browser;
  try {
    // Launch browser with stealth
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    // Set initial cookie from your session
    await page.setCookie({
      name: "mxm_bab",
      value: "AA",
      domain: "www.musixmatch.com",
      path: "/",
    });
    // Token stuff
    await page.setCookie({
      name: "musixmatchUserToken",
      value:
        "%7B%22tokens%22%3A%7B%22mxm-account-v1.0%22%3A%222507917a0ee02e4ec5dde452b650b2bb9ab7bf21ff169574ac62%22%2C%22mxm-com-v1.0%22%3A%2225073ce424ce89daf81403160fddfcd77f7633219c12ba8e39af%22%2C%22web-desktop-app-v1.0%22%3A%222507f0c945a0e5bcb2e28f29ae0b53b9468c174b9610b55c1027%22%2C%22musixmatch-podcasts-v2.0%22%3A%22250727a516fe65cca6fea1f92b5101f2076b6db27b40cd1dd77f%22%2C%22mxm-pro-web-v1.0%22%3A%222507de987ea66c5b56e7671a407b410534c2d81e0798c735de5b%22%2C%22musixmatch-publishers-v2.0%22%3A%2225077df0683b99e385ddb1fb0e34111d433fe0cd846eae71f3b1%22%7D%2C%22version%22%3A1%7D",
      domain: "www.musixmatch.com",
      path: "/",
    });

    console.log("Navigating to URL...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    console.log("Waiting for Search results...");
    // Type the search query and press Enter
    await page.type(
      'input[placeholder="Search by song title, artist, or lyrics"]',
      `${songNameAndArtist}\n`
    );
    console.log("Waiting for results...");
    await page.waitForSelector(".r-140ww7k > div:nth-child(1)", { timeout: 10000 });
    console.log("Waiting for clicking the Best REsult...");
    const bestResultLink = await page.$(
      "div.css-146c3p1.r-fdjqy7.r-1grxjyw.r-evnaw.r-vrz42v.r-117bsoe.r-3pj75a + div.css-175oi2r a"
    );
    if (bestResultLink) {
      await bestResultLink.click();
    } else {
      throw new Error("Best result link not found");
    }
    console.log('Navigating to lyrics page...')
    await page.waitForSelector("div.css-175oi2r.r-1peese0", { timeout: 10000 });

    // Extract lyrics
    console.log('Getting lyrics...')
    const lyrics = await page.evaluate(() => {
      const lyricsElements = Array.from(
        document.querySelectorAll(
          'div.css-146c3p1.r-1inkyih.r-11rrj2j.r-13awgt0.r-fdjqy7.r-1dxmaum.r-1it3c9n.r-135wba7[dir="auto"]'
        )
      );
      return lyricsElements.map((element) => element.textContent.trim());
    });

    if (lyrics.length) {
      console.log(`Lyrics for ${songNameAndArtist}`);
      console.log(lyrics.join("\n"));
    } else {
      console.log("No lyrics found.");
    }

    await page.screenshot({ path: "screenshot.jpg" });
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    if (browser) {
      console.log("Closing the browser...");
      await browser.close();
    }
  }
}

ScrapeMusixMatch();
