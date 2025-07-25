const { invokeAgent } = require('../utils/discordAgent');

// Ensure 'invokeAgent' is imported from your agent.js file

const generateResponse = async (req, res) => {
  const { prompt } = req.query;

  // 1. Get or generate a sessionId
  // For simplicity, we'll use a hardcoded one or one from query/header.
  // In a real application, you might use:
  // - req.session.id (if using express-session)
  // - a user ID from an authentication token
  // - a unique ID generated on the client-side and sent with each request
  const sessionId = req.headers['x-session-id'] || 'default-session'; // Example: get from a custom header
  // Or if you're managing sessions with cookies/sessions middleware:
  // const sessionId = req.session.id; // Requires express-session or similar

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await invokeAgent(sessionId, prompt); // Pass sessionId to invokeAgent
    res.status(200).json({ response: response }); // Send the AI's response back to the client
  } catch (err) {
    console.error('Error generating AI response:', err); // Log the full error for debugging
    // You might want to send a more generic message to the client in production
    res
      .status(500)
      .json({ error: 'Failed to generate AI response', details: err.message });
  }
};

module.exports = { generateResponse }; // Export the middleware
