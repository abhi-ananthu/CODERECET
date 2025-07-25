require('dotenv').config();

const express = require('express');
const { DiscordRouter } = require('./routes/discord-route');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'welcome to agent' });
});
app.use('/discord', DiscordRouter);

app.listen(process.env.PORT, () => {
  console.log(
    `server running on http://${process.env.HOST}:${process.env.PORT}/`
  );
});
