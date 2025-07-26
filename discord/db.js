require('dotenv').config(); // Load environment variables from .env file

// Import the MongoClient from the mongodb package
const { client } = require('./db-client');

let dbName = 'ngo';
let collectionName = 'session';
/**
 * Creates a new session (inserts a document) into the specified collection.
 * Connects and disconnects for each operation as per the provided structure.
 * @param {Object} sessionData - The data for the session to be created.
 * @returns {Promise<Object>} - The result of the insert operation, including the insertedId.
 */
async function createSession(sessionData) {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log('\nCreating a new session...');
    const result = await collection.insertOne(sessionData);
    return result;
  } catch (err) {
    console.error('Error creating session:', err);
    throw err;
  } finally {
    // Close connection after operation
  }
}

/**
 * Updates an existing session (document) in the specified collection.
 * Connects and disconnects for each operation as per the provided structure.
 * @param {Object} filter - The filter to find the session(s) to update.
 * @param {Object} updateDoc - The update operation to apply (e.g., using $set).
 * @returns {Promise<Object>} - The result of the update operation.
 */
async function updateSession(filter, updateDoc) {
  try {
    // Connect for this operation
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log('\nUpdating session(s)...');
    // Ensure updateOne receives both filter and update document
    const result = await collection.updateOne(filter, updateDoc);
    console.log(`${result.matchedCount} session(s) matched the filter.`);
    console.log(`${result.modifiedCount} session(s) updated.`);
    return result;
  } catch (err) {
    console.error('Error updating session:', err);
    throw err;
  } finally {
    // Close connection after operation
  }
}

/**
 * Retrieves a single session (document) from the specified collection.
 * Returns null if no session is found.
 * Connects and disconnects for each operation as per the provided structure.
 * @param {Object} filter - The filter to find the session.
 * @returns {Promise<Object|null>} - The found session document, or null if not found.
 */
async function getSession(filter) {
  try {
    // Connect for this operation
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log(
      `\nAttempting to retrieve session with filter: ${JSON.stringify(
        filter
      )}...`
    );
    // Use findOne to retrieve a single document
    const session = await collection.findOne(filter);
    if (session) {
      console.log('Session found:', session);
    } else {
      console.log('No session found matching the filter.');
    }
    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    throw err;
  } finally {
    // Close connection after operation
  }
}

// Export the functions for use in other modules
module.exports = { createSession, updateSession, getSession };
