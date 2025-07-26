const { MongoClient } = require('mongodb');

// MongoDB Connection URI from environment variables
const uri = process.env.MONGO_URI;

// Database Name
const dbName = 'ngo';

// Collection Name
const collectionName = 'session';
/**
 * Establishes a connection to the MongoDB server.
 * This function is called internally by the CRUD operations to ensure a connection exists.
 * @returns {Promise<void>}
 */
async function connectToMongo() {
  try {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    return client;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    // It's crucial to re-throw the error so calling functions can handle it.
    throw err;
  }
}

let client;
(async () => {
  client = await connectToMongo();
})();

module.exports = { client };
