import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report an incident to receive a suitable NGO recommendation.')
    .addStringOption(option =>
      option.setName('name').setDescription('Your name').setRequired(true))
    .addStringOption(option =>
      option.setName('age').setDescription('Your age').setRequired(true))
    .addStringOption(option =>
      option.setName('location').setDescription('Location of the incident').setRequired(true))
    .addStringOption(option =>
      option.setName('type').setDescription('Type of incident').setRequired(true))
    .addStringOption(option =>
      option.setName('context').setDescription('(Optional) Detailed context').setRequired(false)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const age = interaction.options.getString('age');
    const location = interaction.options.getString('location');
    const type = interaction.options.getString('type');
    const context = interaction.options.getString('context') || '';

    try {
      const response = await fetch('http://localhost:3000/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, location, type, context }),
      });

      const data = await response.json();

      await interaction.reply({
        content: `📝 Thank you, ${name}! Here's the recommended NGO for your case:\n\n**${data.recommendation}**`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('❌ Error submitting report:', err);
      await interaction.reply({
        content: '❌ Failed to process your report. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
