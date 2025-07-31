const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
// --- FIND MUSIXMATCH LINK ---
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
const sleep = (ms) =>
  new Promise((res) => setTimeout(res, ms + Math.random() * (ms * 0.5)));
async function findMusixLinks(songName, artistName) {
  let browser;
  try {
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
    const newPage = await browser.newPage();
    // make it more like a real browser
    await newPage.setUserAgent(randomUserAgent);
    await newPage.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
    });
    // Set additional headers that real browsers send
    await newPage.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
    });

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
    console.log("Searching for MusixMatch Link...");
    const musixmatchUrl = await newPage.evaluate(() => {
      // Get all search result list items
      const searchResults = document.querySelectorAll("li.b_algo");
      for (const result of searchResults) {
        // Find the anchor (<a>) tag within the result
        const linkElement = result.querySelector("a");
        if (linkElement && linkElement.href.includes("musixmatch.com/lyrics")) {
          return linkElement.href; // Return the first one we find
        }
      }
      return null; // Return null if no link was found
    });

    if (!musixmatchUrl) {
      console.error(
        "Could not find a Musixmatch link on the first page of Bing results."
      );
      await browser.close();
      return null;
    }

    console.log(`Found Musixmatch URL: ${musixmatchUrl}`);
    // set musixmatch cookies
    await newPage.setCookie({
      name: "mxm_bab",
      value: "AA",
      domain: "www.musixmatch.com",
    });

    console.log("Navigating to Musixmatch...");
    await newPage.goto(musixmatchUrl, {
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
      console.log("inside lyrics: ", lyricsElements);
      return lyricsElements.map((element) => element.textContent.trim());
    });
    console.log("this should be lyrics: ", lyrics);
    console.log("this should be lyrics: ", lyrics.join("\n"));

    await newPage.screenshot({ path: "screenshot.jpg" });
    await browser.close();
  } catch (error) {
    console.log("this is error: ", error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
  }
}

findMusixLinks("all of me", "sarah blasko");


