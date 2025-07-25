// agent.js

require('dotenv').config(); // Load environment variables

const {
  ChatPromptTemplate,
  MessagesPlaceholder,
} = require('@langchain/core/prompts');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const { RunnableWithMessageHistory } = require('@langchain/core/runnables');
const { InMemoryChatMessageHistory } = require('@langchain/core/chat_history');
const model = require('./genai');

// 1. Initialize the Chat Model
const llm = model;

// 2. Define the Prompt Template with Chat History Placeholder
const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    "You are a helpful AI assistant. Answer the user's questions based on the conversation history.",
  ],
  new MessagesPlaceholder('chat_history'), // This is where the chat history will be injected
  ['human', '{input}'],
]);

// 3. Create a Message History Store
// For production, you would use a persistent store (e.g., a database)
const messageHistory = {}; // Stores chat history per session ID

const getMessageHistoryForSession = (sessionId) => {
  if (!messageHistory[sessionId]) {
    messageHistory[sessionId] = new InMemoryChatMessageHistory();
  }
  return messageHistory[sessionId];
};

// 4. Create the Runnable with Message History
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chatPrompt.pipe(llm),
  getMessageHistory: getMessageHistoryForSession,
  inputMessagesKey: 'input', // Key for the current human input
  historyMessagesKey: 'chat_history', // Key for the chat history in the prompt
});

// 5. Function to invoke the agent
async function invokeAgent(sessionId, input) {
  const result = await chainWithHistory.invoke(
    {
      input: input,
    },
    {
      configurable: {
        sessionId: sessionId,
      },
    }
  );
  return result.content; // The AI's response
}

// Export the invokeAgent function for use in your application
module.exports = { invokeAgent };
