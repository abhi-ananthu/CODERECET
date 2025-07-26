// Require the necessary discord.js classes
const {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST, // For registering slash commands
  Routes, // For registering slash commands
  ApplicationCommandOptionType, // For defining command options
  ChannelType, // For checking channel type (DM vs Guild)
} = require('discord.js');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer'); // Import nodemailer

// Load environment variables from .env file
dotenv.config();

// Define your bot's token and client ID from .env
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const SECRET_WORD = process.env.SECRET_WORD; // New: Define your secret word in .env

// --- IMPORTANT: Add these to your .env file ---
// TOKEN=YOUR_BOT_TOKEN_HERE
// CLIENT_ID=YOUR_BOT_APPLICATION_ID_HERE
// EMAIL_USER=YOUR_EMAIL_ADDRESS_FOR_SENDING_VERIFICATION_CODES (e.g., your_email@gmail.com)
// EMAIL_PASS=YOUR_EMAIL_PASSWORD_OR_APP_PASSWORD (for Gmail, use an App Password)
// SECRET_WORD=your_chosen_secret_word_here (e.g., "banana" or "securekey123")

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Global State for Verification and Report Process (In-memory for simplicity) ---
// In a production environment, you would use a database (e.g., Firestore)
// to persist this data across bot restarts.
const verificationCodes = new Map(); // Stores { userId: { email, code, timestamp } }
const verifiedUsers = new Set(); // Stores userId of verified users

// Stores the state of a user's report process in DMs
const reportStates = new Map(); // Stores { userId: 'awaiting_secret_word' | 'awaiting_report_details' }

// --- Nodemailer Transporter Setup ---
// Configure your email service. Example for Gmail:
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- Define Slash Commands ---
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'report',
    description: 'Start a private report process with the bot (requires email and secret word verification).',
  },
  {
    name: 'verify',
    description: 'Start the email verification process.',
    options: [
      {
        name: 'email',
        type: ApplicationCommandOptionType.String,
        description: 'Your email address for verification.',
        required: true,
      },
    ],
  },
  {
    name: 'verify_code',
    description: 'Submit the verification code received via email.',
    options: [
      {
        name: 'code',
        type: ApplicationCommandOptionType.String,
        description: 'The verification code from your email.',
        required: true,
      },
    ],
  },
];

// --- Register Slash Commands (for demonstration - usually in a separate deploy script) ---
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');
    // Register commands globally or for specific guilds
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Failed to reload application (/) commands:', error);
  }
});

// --- Handle Interactions (Slash Commands) ---
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'verify') {
    // Defer the reply immediately to prevent interaction timeout
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email');
    const userId = user.id;

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await interaction.editReply({
        content: 'Please provide a valid email address.',
      });
      return;
    }

    // Check if user is already verified
    if (verifiedUsers.has(userId)) {
      await interaction.editReply({
        content: 'You are already verified!',
      });
      return;
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + 5 * 60 * 1000; // Code expires in 5 minutes

    verificationCodes.set(userId, { email, code: verificationCode, timestamp: expiryTime });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Discord Bot Verification Code',
      text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 5 minutes. Please use the /verify_code command in Discord to complete your verification.`,
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in 5 minutes. Please use the <code>/verify_code</code> command in Discord to complete your verification.</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      await interaction.editReply({
        content: `A verification code has been sent to **${email}**. Please check your inbox (and spam folder) and use \`/verify_code <your_code>\` to complete verification. This code will expire in 5 minutes.`,
      });
      console.log(`Verification email sent to ${email} for user ${user.tag}`);
    } catch (error) {
      console.error(`Error sending verification email to ${email}:`, error);
      await interaction.editReply({
        content: 'There was an error sending the verification email. Please check your email address and try again later. Ensure your bot\'s email credentials are correct.',
      });
      // Clean up the stored code if email sending fails
      verificationCodes.delete(userId);
    }
  } else if (commandName === 'verify_code') {
    const submittedCode = interaction.options.getString('code');
    const userId = user.id;

    const storedVerification = verificationCodes.get(userId);

    if (!storedVerification) {
      await interaction.reply({
        content: 'No pending verification found for you. Please use `/verify <your_email>` first.',
        ephemeral: true,
      });
      return;
    }

    // Check for code expiry
    if (Date.now() > storedVerification.timestamp) {
      verificationCodes.delete(userId); // Remove expired code
      await interaction.reply({
        content: 'Your verification code has expired. Please use `/verify <your_email>` again to get a new code.',
        ephemeral: true,
      });
      return;
    }

    if (submittedCode === storedVerification.code) {
      verifiedUsers.add(userId); // Mark user as verified
      verificationCodes.delete(userId); // Remove the used code
      await interaction.reply({
        content: '🎉 Your email has been successfully verified! You can now use the `/report` command.',
        ephemeral: true,
      });
      console.log(`User ${user.tag} (${userId}) successfully verified.`);
    } else {
      await interaction.reply({
        content: 'Invalid verification code. Please try again or request a new code with `/verify <your_email>`.',
        ephemeral: true,
      });
    }
  } else if (commandName === 'report') {
    const userId = user.id;

    // Check if the user is email verified
    if (!verifiedUsers.has(userId)) {
      await interaction.reply({
        content: 'You must verify your email first to use the `/report` command. Please use `/verify <your_email>` to start the verification process.',
        ephemeral: true,
      });
      return;
    }

    // If email verified, initiate the secret word challenge in DM
    try {
      // Defer the reply immediately to prevent interaction timeout
      await interaction.deferReply({ ephemeral: true });

      const dmChannel = await user.createDM();
      await dmChannel.send(
        `Hello ${user.username}! To proceed with your report, please type the secret word.`
      );
      // Set user state to awaiting_secret_word
      reportStates.set(userId, 'awaiting_secret_word');

      await interaction.editReply({
        content: "Please check your DMs! I've sent you a challenge to proceed with your report.",
      });

    } catch (error) {
      console.error(`Error initiating report DM with ${user.tag}:`, error);
      // If deferReply was successful, use editReply; otherwise, use reply (though deferReply should ideally always succeed here)
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: 'There was an error starting your report process. Please ensure your DMs are open or try again later.',
        });
      } else {
        await interaction.reply({
          content: 'There was an error starting your report process. Please ensure your DMs are open or try again later.',
          ephemeral: true,
        });
      }
    }
  }
});

// --- messageCreate event handler (for bot mentions and DMs) ---
client.on(Events.MessageCreate, async (msg) => {
  // Ignore messages from bots to prevent infinite loops or unwanted responses
  if (msg.author.bot) return;

  // Handle Direct Messages
  if (msg.channel.type === ChannelType.DM) {
    const userId = msg.author.id;
    const userReportState = reportStates.get(userId);
    const userMessageContent = msg.content.trim();

    if (userReportState === 'awaiting_secret_word') {
      if (userMessageContent === SECRET_WORD) {
        reportStates.set(userId, 'awaiting_report_details'); // Move to next state
        await msg.reply(
          `That's correct! Now, please answer the following questions to help us understand your report:\n\n` +
          `1. What is the issue you are reporting? (Be specific)\n` +
          `2. When did this issue occur? (Date and Time if possible)\n` +
          `3. Who are the involved parties (users, channels, etc.)?\n` +
          `4. Do you have any evidence (screenshots, links to messages, etc.)? If so, please describe or provide them.\n\n` +
          `You can just reply to this DM with your answers.`
        );
      } else {
        await msg.reply('Incorrect secret word. Please try again or type `cancel` to stop the report process.');
      }
    } else if (userReportState === 'awaiting_report_details') {
      // User is submitting report details
      console.log(`Report details from ${msg.author.tag} (${userId}): ${userMessageContent}`);
      await msg.reply('Thank you for providing the details for your report. We will review it shortly.');
      reportStates.delete(userId); // Clear state after receiving details
    } else if (userMessageContent.toLowerCase() === 'cancel' && reportStates.has(userId)) {
      // Allow user to cancel at any stage of the report process
      reportStates.delete(userId);
      await msg.reply('Report process cancelled.');
    }
    return; // Important: return after handling DM to prevent falling through to mention logic
  }

  // Original mention logic (only if not a DM)
  if (!msg.mentions.has(msg.client.user)) {
    return;
  }

  const responseContent = `Hello <@${msg.author.id}>! You mentioned me! How can I help you today?`;

  await msg.reply({
    content: responseContent,
    flags: MessageFlags.Ephemeral, // This makes the reply private to the user
  });
});

// Log in to Discord with your client's token
client.login(TOKEN);
