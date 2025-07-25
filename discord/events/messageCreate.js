import { Events } from 'discord.js';
import { botModel } from '../script.js';

export default {
  name: Events.MessageCreate,
  async execute(msg) {
    if (msg.author.bot || !msg.mentions.has(msg.client.user)) return;

    const reply = await botModel(msg.author.username, msg.content);
    if (reply) {
      await msg.reply({ content: reply });
    } else {
      await msg.reply({ content: 'I couldn’t understand that. Please try again!' });
    }
  },
};
