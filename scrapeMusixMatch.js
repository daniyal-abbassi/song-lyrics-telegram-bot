const puppeteer = require("puppeteer");

const url = "https://www.musixmatch.com/de/songtext/J-Cole/Port-Antonio-1";
async function ScrapeMusixMatch() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new", // Use 'new' headless mode for better stealth
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Improve launch speed
    });
    const newPage = await browser.newPage();
    await newPage.setViewport({ width: 1920, height: 1080 });
    await newPage.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );
    //mimic cookie
    await newPage.setCookie({
      name: "mxm_bab",
      value: "AA",
      domain: "www.musixmatch.com",
      path: "/",
    });
    console.log("Navigating to URL...");
    await newPage.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    // await newPage.goto(url, {
    //   waitUntil: "domcontentloaded", // Faster than networkidle2
    //   timeout: 30000, // Reduced timeout for speed
    // });
    console.log("Waiting for lyrics...");
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
      console.log("far lyrics are: ", lyricsElements);
      return lyricsElements.map((element) => element.textContent.trim());
    });
    console.log("this should be lyrics: ", lyrics.join("\n"));
    // await newPage.waitForNetworkIdle();
    await newPage.screenshot({ path: "screenshot.jpg" });
    await browser.close();
  } catch (error) {
    console.log("this is error: ", error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
  }
}


