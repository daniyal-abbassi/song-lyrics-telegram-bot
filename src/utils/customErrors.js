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

module.exports = {LyricsNotFoundError, InputParseError}