// Require the necessary discord.js classes
const {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST, // For registering slash commands
  Routes, // For registering slash commands
  ApplicationCommandOptionType, // For defining command options
} = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define your bot's token and client ID from .env
const TOKEN = process.env.TOKEN; // Use DISCORD_TOKEN for consistency
const CLIENT_ID = process.env.CLIENT_ID; // Your bot's Application ID

// --- IMPORTANT: Add DISCORD_TOKEN and DISCORD_CLIENT_ID to your .env file ---
// DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
// DISCORD_CLIENT_ID=YOUR_BOT_APPLICATION_ID_HERE

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages, // NEW: Required to receive/send DMs
    GatewayIntentBits.MessageContent,
  ],
});

// --- Define Slash Commands ---
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'report',
    description: 'Start a private report process with the bot.',
  },
];

// --- Register Slash Commands (for demonstration - usually in a separate deploy script) ---
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Failed to reload application (/) commands:', error);
  }
});

// --- Handle Interactions (Slash Commands) ---
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'report') {
    try {
      // Reply ephemerally in the channel, telling the user to check their DMs
      await interaction.reply({
        content:
          "Please check your DMs! I've sent you some questions to gather more details for your report.",
        ephemeral: true,
      });

      // Send a private message (DM) to the user who used the command
      const user = interaction.user;
      const dmChannel = await user.createDM(); // Ensures a DM channel exists

      // Send your template questions in the DM
      await dmChannel.send(
        `Hello ${user.username}! You used the /report command. ` +
          `Please answer the following questions to help us understand your report:\n\n` +
          `1. What is the issue you are reporting? (Be specific)\n` +
          `2. When did this issue occur? (Date and Time if possible)\n` +
          `3. Who are the involved parties (users, channels, etc.)?\n` +
          `4. Do you have any evidence (screenshots, links to messages, etc.)? If so, please describe or provide them.\n\n` +
          `You can just reply to this DM with your answers.`
      );
    } catch (error) {
      console.error(
        `Error initiating report DM with ${interaction.user.tag}:`,
        error
      );
      await interaction.reply({
        content:
          'There was an error starting your report process. Please ensure your DMs are open or try again later.',
        ephemeral: true,
      });
    }
  }
});

// --- messageCreate event handler (for bot mentions) ---
client.on(Events.MessageCreate, async (msg) => {
  // Ignore messages from bots to prevent infinite loops or unwanted responses
  if (msg.author.bot) return;

  // Only proceed if the bot itself is mentioned in the message
  if (!msg.mentions.has(msg.client.user)) {
    return;
  }

  // You can customize this response or integrate with your botModel logic here
  const responseContent = `Hello <@${msg.author.id}>! You mentioned me! How can I help you today?`;

  await msg.reply({
    content: responseContent,
    flags: MessageFlags.Ephemeral, // This makes the reply private to the user
  });
});

// Log in to Discord with your client's token
client.login(TOKEN);
