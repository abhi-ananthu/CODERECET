const DiscordRouter = require('express').Router();

DiscordRouter.post('/create-ps', (req, res) => {
  res.send({ message: 'updated ps' });
});

DiscordRouter.post('/compare-context', (req, res) => {
  res.send({ message: 'compared context' });
});
