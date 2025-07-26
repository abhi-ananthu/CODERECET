const {
  generateResponse,
  buildPs,
  botModel,
} = require('../controllers/discordController');

const DiscordRouter = require('express').Router();

DiscordRouter.get('/gen-response', botModel);

// DiscordRouter.post('/submit-problem', buildPs);

module.exports = { DiscordRouter };
