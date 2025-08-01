// ===== UTILITY - CUSTOM ERRORS =====
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