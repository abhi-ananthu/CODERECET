require('dotenv').config();

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

module.exports = model;
