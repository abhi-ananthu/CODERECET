const { MongoClient } = require('mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const dotenv = require('dotenv');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// --- Configuration Variables ---
const pineconeIndexName = 'db-data'; // Your Pinecone index name
const mongoUri = process.env.MONGO_URI; // Your MongoDB connection string
const mongoDbName = 'ngo'; // Replace with your MongoDB database name
const mongoCollectionName = 'ngos'; // Replace with your MongoDB collection name
const contextFieldName = 'context';

// --- Initialize Embedding Generator (Google Generative AI) ---
const embeddingsGenerator = new GoogleGenerativeAIEmbeddings({
  modelName: 'embedding-001', // Use 'embedding-001' for text embeddings
  apiKey: process.env.GEMINI_API_KEY, // Your Google Generative AI API Key
});

// --- Initialize Pinecone Client ---
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY, // Your Pinecone API Key
});

/**
 * Indexes documents from a MongoDB collection into a Pinecone index.
 * This function connects to MongoDB, fetches documents, generates embeddings
 * using Google Generative AI, and upserts these embeddings into Pinecone.
 *
 * @returns {Promise<void>} A promise that resolves when indexing is complete.
 */
(async function indexMongoDBCollection() {
  let mongoClient;
  try {
    // 1. Connect to MongoDB
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set.');
    }
    mongoClient = new MongoClient(mongoUri);
    console.log(mongoUri);
    await mongoClient.connect();
    console.log('Connected to MongoDB.');

    const db = mongoClient.db(mongoDbName);
    const collection = db.collection(mongoCollectionName);

    // 2. Fetch documents from MongoDB
    // You can add filters (e.g., { processed: false }) or limits (.limit(100))
    // for large collections or incremental indexing.
    const cursor = collection.find({});
    const documentsToIndex = [];
    await cursor.forEach((doc) => {
      // Ensure the contextFieldName exists and is a string
      if (doc[contextFieldName] && typeof doc[contextFieldName] === 'string') {
        documentsToIndex.push({
          id: doc._id.toString(), // Use MongoDB's _id as Pinecone's ID
          text: doc[contextFieldName], // The text content to be embedded
          metadata: {
            mongoId: doc._id.toString(),
            // Include any other relevant metadata from your MongoDB document here.
            // This metadata will be returned with search results from Pinecone.
            // Be mindful of Pinecone's metadata size limits if including the entire doc.
            // Example: title: doc.title, category: doc.category, date: doc.date
            ...doc, // Optionally include the entire document as metadata
          },
        });
      }
    });
    console.log(
      `Found ${documentsToIndex.length} documents with '${contextFieldName}' to index from MongoDB.`
    );

    if (documentsToIndex.length === 0) {
      console.log(
        'No documents with a valid context field found to index. Skipping upsert.'
      );
      return;
    }

    // 3. Generate embeddings and prepare for Pinecone upsert
    const vectorsToUpsert = [];
    for (const doc of documentsToIndex) {
      console.log(
        `Generating embedding for MongoDB document ID: ${doc.id.substring(
          0,
          10
        )}...`
      );
      // Use the initialized embeddingsGenerator to get the vector
      const embedding = await embeddingsGenerator.embedQuery(doc.text);

      vectorsToUpsert.push({
        id: doc.id,
        values: embedding,
        metadata: doc.metadata, // Attach the metadata to the vector
      });
    }
    console.log(
      `Generated embeddings for ${vectorsToUpsert.length} documents.`
    );

    // 4. Upsert into Pinecone index
    const pineconeIndex = pc.index(pineconeIndexName);

    // Pinecone recommends upserting in batches for large datasets to optimize performance.
    const batchSize = 100; // Adjust batch size based on your Pinecone plan and network conditions
    for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
      const batch = vectorsToUpsert.slice(i, i + batchSize);
      console.log(
        `Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          vectorsToUpsert.length / batchSize
        )} (${batch.length} vectors)...`
      );
      await pineconeIndex.upsert(batch);
    }

    console.log('MongoDB collection successfully indexed into Pinecone!');
  } catch (error) {
    console.error('Error during MongoDB to Pinecone indexing:', error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed.');
    }
  }
})();

/**
 * Performs a similarity search in Pinecone based on a user prompt.
 * It generates an embedding for the prompt and queries the Pinecone index
 * to find the most similar vectors, returning the metadata of the best match.
 *
 * @param {string} prompt - The user's input query or context.
 * @returns {Promise<object | null>} A Promise that resolves to the metadata object
 * of the most relevant document, or null if no sufficiently relevant match is found.
 */
(async function SimiliaritySearch(prompt = 'Health care') {
  try {
    // Generate embedding for the user's prompt
    console.log('Generating embedding for user prompt...');
    const queryEmbedding = await embeddingsGenerator.embedQuery(prompt);

    // Access the Pinecone index
    const index = pc.index(pineconeIndexName);
    console.log('Performing similarity search in Pinecone...');

    // Query Pinecone for the top 1 most similar vector, including its metadata
    const queryResult = await index.query({
      topK: 1, // Retrieve only the single best match
      vector: queryEmbedding,
      includeMetadata: true, // Ensure the original metadata (including MongoDB fields) is returned
    });

    // Process the query results
    if (queryResult.matches && queryResult.matches.length > 0) {
      const mostRel = queryResult.matches[0];
      console.log(`Found a match with score: ${mostRel.score.toFixed(4)}`);

      // Define a relevance threshold. Adjust this value based on your data and needs.
      // A score > 0.7 is a common starting point for good similarity.
      if (mostRel.score > 0.6) {
        console.log('Match found above relevance threshold.');
        console.log(mostRel.metadata);
        // The metadata object will contain the original MongoDB document fields
        // that you stored during the indexing process.
        return mostRel.metadata;
      } else {
        console.log(
          'Match found, but score is below relevance threshold (0.7).'
        );
      }
    } else {
      console.log('No matches found in Pinecone for the given prompt.');
    }
  } catch (error) {
    console.error('Error during similarity search:', error);
  }
  return null; // Return null if no relevant match is found or an error occurs
})();
