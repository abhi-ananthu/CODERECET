// agent.js
require('dotenv').config();

const {
  GoogleGenAI, // Changed import to GoogleGenAI
  Type,
} = require('@google/genai'); // Updated package import
const { updateSession, getSession } = require('./db'); // Added getSession
const { client } = require('./db-client');

// Initialize GoogleGenAI with your API key
const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY); // Pass API key here

// Use a Map to store chat history for each user in memory for the current runtime.
// This acts as a cache, with the database as the source of truth.
const chatHistories = new Map();

/**
 * Handles general conversational interaction with the bot.
 * It fetches/updates chat history from/to the database.
 * @param {string} userId - The Discord user's ID.
 * @param {string} input - The user's message.
 * @param {string} sessionid - The current session ID for the user.
 * @returns {Promise<string|Object>} - The bot's response as a string, or an error object.
 */

const systemPrompt = `You're an AI agent helping citizens report issues and connect with NGOs. Greet, ask for a brief issue description, request consent to collect more info, then gather one detail at a time (name, age, location URL, photo). End by thanking them for their civic sense.`;

const botModel = async (userId, input, sessionid) => {
  if (!userId || !input) {
    console.error('Missing userId or input for botModel.');
    return { error: 'An internal error occurred: missing user ID or input.' };
  }

  try {
    // Attempt to load history from the database first if not in memory
    let userHistory = chatHistories.get(userId);
    if (!userHistory) {
      const sessionDoc = await getSession({
        userId: userId,
        sessionid: sessionid,
      });
      if (sessionDoc && sessionDoc.data && Array.isArray(sessionDoc.data)) {
        // Ensure the loaded data is in the correct format for Gemini history
        userHistory = sessionDoc.data.map((entry) => ({
          role: entry.role,
          parts: entry.parts.map((part) => ({ text: part.text })),
        }));
        chatHistories.set(userId, userHistory); // Cache it in memory
        console.log(
          `[botModel] Loaded history from DB for ${userId}. History length: ${userHistory.length}`
        );
      } else {
        userHistory = [];
        console.log(
          `[botModel] No history found in DB for ${userId}. Starting new history.`
        );
      }
    } else {
      console.log(
        `[botModel] Using in-memory history for ${userId}. History length: ${userHistory.length}`
      );
    }

    // Get the generative model
    const model_chat = genAI.chats.create({
      model: 'gemini-2.5-flash', // Using 1.5-flash for efficiency
      systemInstruction: systemPrompt,
      history: userHistory,
    });

    const result = await model_chat.sendMessage({
      message: input,
    });

    const responseText = result.text;

    // After the message is sent and a response is received,
    // update the chatHistories Map with the latest history from the chat session.
    const updatedHistory = model_chat.getHistory(); // Await getHistory()
    chatHistories.set(userId, updatedHistory);

    // Update session in DB
    console.log(
      await updateSession(
        { userId: userId, sessionid: sessionid },
        { $set: { data: chatHistories } } // Store the actual history array
      )
    );

    return responseText;
  } catch (error) {
    console.error('Error in botModel:', error);
    return { error: 'An error occurred while processing your request.' };
  }
};

/**
 * Extracts structured information from the user's chat history for submission.
 * @param {string} userId - The Discord user's ID.
 * @param {string} sessionid - The current session ID for the user.
 * @returns {Promise<Object>} - A structured JSON object containing extracted report details.
 */

const submitTool = async (userId, sessionid) => {
  const db = client.db('ngo');
  const collection = db.collection('complaints');
  try {
    const sessionDoc = await getSession({ userId, sessionid });

    const userHistory =
      sessionDoc && sessionDoc['data'][userId]
        ? sessionDoc['data'][userId]
        : [];

    if (!userHistory.length) {
      return { error: 'No chat history found for this user to summarize.' };
    }

    const contents = userHistory.map((entry) => ({
      role: entry.role,
      parts: entry.parts.map((part) => ({ text: part.text || '' })),
    }));

    // Append final instruction
    contents.push({
      role: 'user',
      parts: [
        {
          text: 'Please extract the core information from our conversation regarding the reported social issue, focusing on the issue description, a suitable title, and the location. Format your response as a JSON object strictly according to the specified schema. If a location is not clearly provided, infer it from the context (e.g., "Thiruvananthapuram, Kerala, India" if default, or "Not Provided").',
        },
      ],
    });

    // Call the model
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction:
          "You are an json output parser. Your job is to convert incoming prompts to give json data. Do not use '```' json at the beginning of file or any other extra info.",
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.Object,
          properties: {
            title: {
              type: Type.STRING,
            },
            mediaLink: {
              type: Type.STRING,
            },
            location: {
              type: Type.STRING,
            },
            brief: {
              type: Type.STRING,
            },
          },
        },
      },
    });

    let rawOutput = response.text;

    // Remove surrounding triple backticks if they exist
    if (rawOutput.startsWith('```json') && rawOutput.endsWith('```')) {
      rawOutput = rawOutput.slice(7, -3).trim(); // Remove ```json at start and ``` at end
    } else if (rawOutput.startsWith('```') && rawOutput.endsWith('```')) {
      rawOutput = rawOutput.slice(3, -3).trim(); // Remove just ``` if not labeled as json
    }

    // Now parse
    const structuredOutput = JSON.parse(rawOutput);

    // Save to DB
    chatHistories.delete(userId);
    const data = await collection.insertOne(structuredOutput);

    return data;
  } catch (error) {
    console.error('Error in submitTool:', error);
    return {
      error:
        'An error occurred during submission and structured output generation.',
    };
  }
};

module.exports = { botModel, submitTool };
