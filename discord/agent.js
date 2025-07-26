// agent.js
require('dotenv').config();

const {
  GoogleGenAI, // Changed import to GoogleGenAI
  HarmCategory,
  HarmBlockThreshold,
} = require('@google/genai'); // Updated package import
const { updateSession, getSession } = require('./db'); // Added getSession

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
      model: 'gemini-1.5-flash', // Using 1.5-flash for efficiency
      systemInstruction: `You are a helpful Discord bot for hearing citizens' reports on social issues. Be considerate and empathetic.
      Your main task is to ask relevant questions to gather information for a report.
      Guide the user through these steps:
      1. First ask for a short description of the issue.
      2. Then, ask for any relevant photos or media (instruct them to use the /media command to upload files).
      3. Finally, ask for the specific location related to the report (instruct them to use the /submit command with the location option, or describe it).
      Encourage them to use the /submit command when all information is gathered.`,
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
    await updateSession(
      { userId: userId, sessionid: sessionid },
      { $set: { data: updatedHistory } } // Store the actual history array
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
  try {
    // Retrieve the chat history from the database as the source of truth for submission
    const sessionDoc = await getSession({
      sessionid: sessionid,
    });
    const userHistory = sessionDoc && sessionDoc.data ? sessionDoc.data : [];

    if (userHistory.length === 0) {
      return { error: 'No chat history found for this user to summarize.' };
    }

    const response = await genAI.models.generateContent({
      // Use getGenerativeModel directly
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json', // Crucial for structured output
        responseSchema: {
          type: 'OBJECT',
          properties: {
            brief: {
              // Changed from issueDescription to brief for consistency with Complaint model
              type: 'STRING',
              description:
                'A concise summary (max 150 words) of the social issue reported by the user, suitable for a database entry.',
            },
            title: {
              // Added title field
              type: 'STRING',
              description:
                'A short, descriptive title (max 10 words) for the reported issue.',
            },
            location: {
              type: 'STRING',
              description:
                'The location provided by the user for the social issue. If not explicitly stated, infer from context (e.g., "Thiruvananthapuram, Kerala, India" if no other location is mentioned) or state "Not Provided".',
            },
            // Note: photosProvided is better handled by checking `submissionData` directly in index.js
            // as the AI might not always correctly infer if photos were "provided" via /media command.
          },
          required: ['brief', 'title', 'location'], // Mark required fields
        },
      },
      // No systemInstruction here as the prompt explicitly defines the task
    });

    // Construct the prompt using the entire chat history
    const contents = userHistory.map((entry) => ({
      role: entry.role,
      parts: entry.parts.map((part) => ({ text: part.text })),
    }));

    // Add a final instruction to extract the information
    contents.push({
      role: 'user',
      parts: [
        {
          text: 'Please extract the core information from our conversation regarding the reported social issue, focusing on the issue description, a suitable title, and the location. Format your response as a JSON object strictly according to the specified schema. If a location is not clearly provided, infer it from the context (e.g., "Thiruvananthapuram, Kerala, India" if default, or "Not Provided").',
        },
      ],
    });

    const structuredOutput = JSON.parse(response.text);

    // Clear the in-memory history for this user after submission
    chatHistories.delete(userId);
    // Also update the session in DB to clear history if you want a fresh start
    await updateSession(
      { userId: userId, sessionid: sessionid }, // Use sessionid for precise targeting
      { $set: { data: [] } } // Clear history in DB after successful submission
    );

    return structuredOutput;
  } catch (error) {
    console.error('Error in submitTool:', error);
    return {
      error:
        'An error occurred during submission and structured output generation.',
    };
  }
};

module.exports = { botModel, submitTool };
