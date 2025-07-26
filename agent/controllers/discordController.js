require('dotenv').config();
const { GoogleGenAI, HarmSeverity } = require('@google/genai');

const genAI = new GoogleGenAI({
  apiKey: process.env.GENAI_API_KEY,
});

// Use a Map to store chat history for each user.
// The key will be userId, and the value will be an array of chat history entries.
const chatHistories = new Map();

const botModel = async (req, res) => {
  const { userId, input } = req.query;

  console.log(input);

  // Basic validation for userId and input
  if (!userId || !input) {
    return res.status(400).send('Missing userId or input in query parameters.');
  }

  try {
    // Get the existing chat history for the current user.
    // If no history exists for this userId, initialize it as an empty array.
    const userHistory = chatHistories.get(userId) || [];

    // Create a new chat session with the model, providing the user's history.
    const chat = genAI.chats.create({
      config: {
        systemInstruction: `You are a discord bot for the sole purpose of hearing citizens reports on their social issues, so always be considerate. Your main task is to ask relevant questions.
        First ask for a short description of the issue, then ask for the relevant photos. Then ask for the location`,
      },
      model: 'gemini-1.5-flash',
      // The history property expects an array of chat history entries.
      history: userHistory,
      // You can also set safety settings if needed
      safetySettings: [
        {
          category: HarmSeverity.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmSeverity.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
        },
        {
          category: HarmSeverity.HARM_CATEGORY_HARASSMENT,
          threshold: HarmSeverity.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
        },
        {
          category: HarmSeverity.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmSeverity.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
        },
        {
          category: HarmSeverity.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmSeverity.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
        },
      ],
    });

    // Send the user's current message to the model.
    const result = await chat.sendMessage({ message: input });

    // After the message is sent and a response is received,
    // update the chatHistories Map with the latest history from the chat session.
    // chat.getHistory() returns the full conversation history including the latest turn.
    chatHistories.set(userId, chat.getHistory());

    // Send the model's response back to the client.
    return res.send(result.text);
  } catch (error) {
    console.error('Error in botModel:', error); // Log the error for debugging
    return res
      .status(500)
      .send('An error occurred while processing your request.');
  }
};

module.exports = { botModel };
