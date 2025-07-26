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
// SECRET_WORD is removed as per request

// --- IMPORTANT: Add these to your .env file ---
// TOKEN=YOUR_BOT_TOKEN_HERE
// CLIENT_ID=YOUR_BOT_APPLICATION_ID_HERE
// EMAIL_USER=YOUR_EMAIL_ADDRESS_FOR_SENDING_VERIFICATION_CODES (e.g., your_email@gmail.com)
// EMAIL_PASS=YOUR_EMAIL_PASSWORD_OR_APP_PASSWORD (for Gmail, use an App Password)

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
// Now only tracks if a user is 'awaiting_report_details'
const reportStates = new Map(); // Stores { userId: 'awaiting_report_details' }

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
    description:
      'Start a private report process with the bot (requires email verification).',
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
  // --- NEW: /media command definition ---
  {
    name: 'media',
    description: 'Upload a photo and get its link.',
    options: [
      {
        name: 'photo',
        type: ApplicationCommandOptionType.Attachment, // Use Attachment type for files
        description: 'The photo you want to upload.',
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
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiryTime = Date.now() + 5 * 60 * 1000; // Code expires in 5 minutes

    verificationCodes.set(userId, {
      email,
      code: verificationCode,
      timestamp: expiryTime,
    });

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
        content:
          "There was an error sending the verification email. Please check your email address and try again later. Ensure your bot's email credentials are correct.",
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
        content:
          'No pending verification found for you. Please use `/verify <your_email>` first.',
        ephemeral: true,
      });
      return;
    }

    // Check for code expiry
    if (Date.now() > storedVerification.timestamp) {
      verificationCodes.delete(userId); // Remove expired code
      await interaction.reply({
        content:
          'Your verification code has expired. Please use `/verify <your_email>` again to get a new code.',
        ephemeral: true,
      });
      return;
    }

    if (submittedCode === storedVerification.code) {
      verifiedUsers.add(userId); // Mark user as verified
      verificationCodes.delete(userId); // Remove the used code
      await interaction.reply({
        content:
          '🎉 Your email has been successfully verified! You can now use the `/report` command.',
        ephemeral: true,
      });
      console.log(`User ${user.tag} (${userId}) successfully verified.`);
    } else {
      await interaction.reply({
        content:
          'Invalid verification code. Please try again or request a new code with `/verify <your_email>`.',
        ephemeral: true,
      });
    }
  } else if (commandName === 'report') {
    const userId = user.id;

    // Check if the user is email verified
    if (!verifiedUsers.has(userId)) {
      await interaction.reply({
        content:
          'You must verify your email first to use the `/report` command. Please use `/verify <your_email>` to start the verification process.',
        ephemeral: true,
      });
      return;
    }

    // If email verified, directly send the report questions in DM
    try {
      // Defer the reply immediately to prevent interaction timeout
      await interaction.deferReply({ ephemeral: true });

      const dmChannel = await user.createDM();
      await dmChannel.send(
        `Hello ${user.username}! You used the /report command. ` +
          `Please answer the following questions to help us understand your report:\n\n` +
          `1. What is the issue you are reporting? (Be specific)\n` +
          `2. When did this issue occur? (Date and Time if possible)\n` +
          `3. Who are the involved parties (users, channels, etc.)?\n` +
          `4. Do you have any evidence (screenshots, links to messages, etc.)? If so, please describe or provide them.\n\n` +
          `You can just reply to this DM with your answers.`
      );
      // Set user state to awaiting_report_details
      reportStates.set(userId, 'awaiting_report_details');

      await interaction.editReply({
        content:
          "Please check your DMs! I've sent you some questions to gather more details for your report.",
      });
    } catch (error) {
      console.error(`Error initiating report DM with ${user.tag}:`, error);
      // If deferReply was successful, use editReply; otherwise, use reply (though deferReply should ideally always succeed here)
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content:
            'There was an error starting your report process. Please ensure your DMs are open or try again later.',
        });
      } else {
        await interaction.reply({
          content:
            'There was an error starting your report process. Please ensure your DMs are open or try again later.',
          ephemeral: true,
        });
      }
    }
  }
  // --- NEW: Handle /media command ---
  else if (commandName === 'media') {
    // Defer the reply immediately, as fetching attachment details is quick but good practice
    await interaction.deferReply({ ephemeral: true });

    const attachment = interaction.options.getAttachment('photo');

    if (attachment) {
      // Check if the attachment is an image (optional, but good for specific media handling)
      if (
        attachment.contentType &&
        attachment.contentType.startsWith('image/')
      ) {
        const imageUrl = attachment.url;
        console.log(`Received photo from ${user.tag}. Image URL: ${imageUrl}`);
        await interaction.editReply({
          content: `Thank you for the photo! I've processed the image link. (Check console for URL)`,
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: 'The provided file is not an image. Please upload a photo.',
          ephemeral: true,
        });
      }
    } else {
      await interaction.editReply({
        content:
          'No photo attachment found. Please attach a photo when using this command.',
        ephemeral: true,
      });
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

    const response = await fetch(
      `http://localhost:3030/discord/get-response?userId=${userId}&input=${userMessageContent}`
    );

    msg.reply(response.text());
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
