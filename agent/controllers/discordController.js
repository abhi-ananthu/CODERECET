const model = require('../utils/genai');

const generateResponse = async (req, res) => {
  try {
    const res = await model.generate();
  } catch (err) {
    console.error(err);
  }
};
