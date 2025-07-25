const {
  generateResponse,
  buildPs,
} = require('../controllers/discordController');

const DiscordRouter = require('express').Router();

DiscordRouter.get('/gen-response', generateResponse);

DiscordRouter.post('/submit-problem', buildPs);

module.exports = { DiscordRouter };
