// ===== AI SERVICE =====
const { GoogleGenAI } = require("@google/genai");
const { config } = require("../config/configuration");
const logger = require("../utils/logger");
const { InputParseError } = require("../utils/customErrors");

const genAI = new GoogleGenAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // Correct model name
});

/**
 * Uses AI to parse a user's natural language query into a song title and artist.
 * @param {string} userInput - The raw text from the user (e.g., "lyrics for hello by adele").
 * @returns {Promise<{songName: string, artistName: string}>} - The parsed song and artist.
 * @throws {InputParseError} If the AI cannot reliably determine the song and artist.
 */

async function parseSongAndArtist(userInput) {
  logger.debug({ userInput }, "Attempting to parse user input with AI.");

  const prompt = `
    You are an expert at parsing song and artist names from user queries.
    Analyze the following text and extract the song title and the artist name.
    Return the result as a clean JSON object with two keys: "songName" and "artistName".
    Do not add any extra text, explanations, or markdown formatting.
    
    Example 1:
    INPUT: "hello by adele"
    OUTPUT: {"songName": "Hello", "artistName": "Adele"}

    Example 2:
    INPUT: "bohemian rhapsody queen"
    OUTPUT: {"songName": "Bohemian Rhapsody", "artistName": "Queen"}

    Example 3:
    INPUT: "get me lyrics for hotel california eagles"
    OUTPUT: {"songName": "Hotel California", "artistName": "The Eagles"}
    
    Example 4 (Invalid):
    INPUT: "just a random message"
    OUTPUT: {"songName": null, "artistName": null}

    Your turn:
    INPUT: "${userInput}"
    OUTPUT:
  `;

  try {
    // get output from ai
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();
    logger.debug({ responseText }, "Received AI response for parsing.");
    
    //parse output json from ai
    const parsedJson = JSON.parse(responseText);

    if (!parsedJson.songName || !parsedJson.artistName) {
      throw new InputParseError("AI could not determine the song and artist from your query.");
    }
    
    logger.info({ parsedResult: parsedJson }, "Successfully parsed user input.");
    return {
      songName: parsedJson.songName,
      artistName: parsedJson.artistName,
    };
  } catch (error) {
    logger.error({ error }, "AI parsing failed.");
    // We re-throw our custom error to be caught by the controller.
    if (error instanceof InputParseError) throw error;
    throw new InputParseError("Failed to parse your request. Please try again with the format: Song Name by Artist Name.");
  }
}

module.exports = { parseSongAndArtist };