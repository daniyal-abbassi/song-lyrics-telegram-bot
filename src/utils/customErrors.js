// ===== UTILITY - CUSTOM ERRORS =====
/*
* With this classes, you can catch and handle specific error types differently;
**/
class LyricsNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "LyricsNotFoundError";
    }
};


class InputParseError extends Error {
    constructor(message) {
        super(message);
        this.name = "InputParseError";
    }
}

/**
 * Custom error to be thrown when lyrics cannot be scraped, but fallback links were found.
 * @param {string} message - The error message.
 * @param {Array<{title: string, url: string}>} links - The array of found links.
 */
class NoLyricsFoundButLinksAvailableError extends Error {
  constructor(message, links) {
    super(message);
    this.name = "NoLyricsFoundButLinksAvailableError";
    this.links = links; // This property will hold the array of links.
  }
}


module.exports = {LyricsNotFoundError, InputParseError, NoLyricsFoundButLinksAvailableError}