const { generateResponse } = require('../controllers/discordController');

const DiscordRouter = require('express').Router();

DiscordRouter.get('/gen-response', generateResponse);

DiscordRouter.post('/compare-context', (req, res) => {
  res.send({ message: 'compared context' });
});

module.exports = { DiscordRouter };
