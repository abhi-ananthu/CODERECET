// basic-session-functions.js
require('dotenv').config(); // Load environment variables from .env file

const { MongoClient } = require('mongodb');
const crypto = require('crypto'); // Import crypto for UUID generation

// MongoDB Connection URI
// IMPORTANT: Ensure your .env file has MONGO_URI set.
const mongoURI = process.env.MONGO_URI;
const dbName = 'ngo'; // The name of your database, as specified by the user

let client; // MongoClient instance
let db; // Database instance

/**
 * Connects to the MongoDB database.
 */
async function connectDb() {
  if (!mongoURI) {
    console.error(
      'MONGO_URI is not defined in environment variables. Please set it.'
    );
    throw new Error('MongoDB connection string missing.');
  }

  if (!client || !client.topology || !client.topology.isConnected()) {
    try {
      client = new MongoClient(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      db = client.db(dbName);
      console.log('MongoDB connected for session functions');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err; // Re-throw to indicate connection failure
    }
  } else {
    console.log('Already connected to MongoDB.');
  }
}

/**
 * Generates a unique session ID.
 * @returns {string} A unique UUID.
 */
function generateUniqueSessionId() {
  return crypto.randomUUID();
}

/**
 * Adds a message to a chat session's history. If the session does not exist
 * (either sessionId is null/undefined or not found in DB), a new session
 * will be created.
 *
 * @param {string|null} sessionId - The existing session ID, or null/undefined to create a new one.
 * @param {object} message - The new message object to add to the chat history.
 * Expected format: { role: 'user'|'ai', content: 'message text', timestamp: Date }
 * @returns {Promise<string>} The sessionId of the session that was updated or created.
 */
async function addToHistory(sessionId = null, message) {
  if (!message || typeof message !== 'object' || !message.content) {
    throw new Error('A valid message object with "content" is required.');
  }

  await connectDb(); // Ensure connection before operation
  const sessionsCollection = db.collection('sessions'); // Get the 'sessions' collection

  let currentSessionId = sessionId;
  let sessionDoc;

  try {
    if (currentSessionId) {
      // Try to find an existing session
      sessionDoc = await sessionsCollection.findOne({
        sessionId: currentSessionId,
      });
    }

    if (!sessionDoc) {
      // If session doesn't exist or no sessionId was provided, create a new one
      currentSessionId = currentSessionId || generateUniqueSessionId();
      sessionDoc = {
        sessionId: currentSessionId,
        data: { history: [message] }, // Initialize history with the first message
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await sessionsCollection.insertOne(sessionDoc);
      if (!result.acknowledged) {
        throw new Error('Failed to insert new session document.');
      }
      console.log(`New session created with ID: ${currentSessionId}`);
    } else {
      // If session exists, append the new message to its history
      await sessionsCollection.updateOne(
        { sessionId: currentSessionId },
        {
          $push: { 'data.history': message }, // Append message to history array
          $set: { updatedAt: new Date() }, // Update the timestamp
        }
      );
      console.log(`Session ${currentSessionId} updated with new message.`);
    }
    return currentSessionId; // Return the sessionId
  } catch (error) {
    console.error('Error adding to history:', error);
    throw error;
  }
}

/**
 * Retrieves session data for a given session ID.
 * @param {string} sessionId - The unique ID of the session to retrieve.
 * @returns {Promise<object|null>} The session document if found, otherwise null.
 */
async function getSession(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required.');
  }
  await connectDb(); // Ensure connection before operation
  try {
    const sessionsCollection = db.collection('sessions'); // Get the 'sessions' collection
    const session = await sessionsCollection.findOne({ sessionId });
    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
}

/**
 * Closes the MongoDB connection.
 */
async function closeDb() {
  if (client && client.topology && client.topology.isConnected()) {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

// Export the functions for use in other modules
module.exports = {
  connectDb,
  addToHistory, // Export the new function
  getSession,
  closeDb,
};

// Example Usage (for demonstration, remove in production if not needed)
/*
(async () => {
    try {
        // Connect to the database (call once at application start)
        await connectDb();

        let currentChatSessionId = null;

        // --- Scenario 1: Start a new chat session (first message) ---
        console.log('\n--- Starting a new chat session ---');
        const firstMessage = { role: 'user', content: 'Hello there!', timestamp: new Date() };
        currentChatSessionId = await addToHistory(currentChatSessionId, firstMessage); // Pass null for new session
        console.log('New Chat Session ID:', currentChatSessionId);
        let sessionAfterFirstMsg = await getSession(currentChatSessionId);
        console.log('History after first message:', sessionAfterFirstMsg.data.history);

        // --- Scenario 2: Add another message to the same session ---
        console.log('\n--- Adding another message to the same session ---');
        const aiResponse = { role: 'ai', content: 'Hi! How can I help you?', timestamp: new Date() };
        await addToHistory(currentChatSessionId, aiResponse);
        let sessionAfterAiMsg = await getSession(currentChatSessionId);
        console.log('History after AI message:', sessionAfterAiMsg.data.history);

        // --- Scenario 3: Add a third message ---
        console.log('\n--- Adding a third message ---');
        const userFollowUp = { role: 'user', content: 'Tell me about your services.', timestamp: new Date() };
        await addToHistory(currentChatSessionId, userFollowUp);
        let sessionAfterUserFollowUp = await getSession(currentChatSessionId);
        console.log('History after user follow-up:', sessionAfterUserFollowUp.data.history);

        // --- Scenario 4: Try to add a message with a non-existent ID (will create a new one) ---
        console.log('\n--- Adding message to a non-existent session ID (will create new) ---');
        const messageForNewSession = { role: 'user', content: 'This is a new chat for an old ID.', timestamp: new Date() };
        const newSessionIdFromOld = await addToHistory('some_old_non_existent_id', messageForNewSession);
        console.log('New session created with ID:', newSessionIdFromOld);
        let newSessionDoc = await getSession(newSessionIdFromOld);
        console.log('History of new session:', newSessionDoc.data.history);

    } catch (error) {
        console.error('Script execution error:', error);
    } finally {
        // Disconnect from MongoDB when your application shuts down
        await closeDb();
    }
})();
*/
