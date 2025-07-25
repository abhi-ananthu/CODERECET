require('dotenv').config();

const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send({ message: 'welcome to agent' });
});

app.listen(process.env.PORT, () => {
  console.log(
    `server running on http://${process.env.HOST}:${process.env.PORT}/`
  );
});
