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

const crypto = require('crypto');

const dotenv = require('dotenv');

const nodemailer = require('nodemailer'); // Import nodemailer

const { botModel, submitTool } = require('./agent');

const { createSession, getSession } = require('./db');

const {
  checkVerified,

  getVerifiedUser,

  verifyUser,
} = require('./verification');

// Load environment variables from .env file

dotenv.config();

// Define your bot's token and client ID from .env

const TOKEN = process.env.TOKEN;

const CLIENT_ID = process.env.CLIENT_ID;

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

// Now stores { userId: { state: 'awaiting_report_details', sessionId: '...' } }

const reportStates = new Map();

// Stores media attachments temporarily for a user's current submission

// Stores { userId: { media: ['url1', 'url2', ...] } }

const submissionData = new Map();

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
  }, // --- NEW: /media command definition ---

  {
    name: 'media',

    description: 'Upload a photo/media file to include in your report.',

    options: [
      {
        name: 'file',

        type: ApplicationCommandOptionType.Attachment, // Use Attachment type for files

        description: 'The photo or media file you want to upload.',

        required: true,
      },
    ],
  }, // --- NEW: /submit command definition ---

  {
    name: 'submit',

    description: 'Submit your report details and any attached media.',

    options: [
      {
        name: 'details',

        type: ApplicationCommandOptionType.String,

        description: 'Any final details you want to add to your report.',

        required: false, // Optional, as some reports might only be media
      },
    ],
  },
];

// --- Register Slash Commands (for demonstration - usually in a separate deploy script) ---

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('Started refreshing application (/) commands.'); // Register commands globally or for specific guilds

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

  const userId = user.id;
  const sessionid = crypto.randomBytes(32).toString('hex').normalize();
  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'verify') {
    // Defer the reply immediately to prevent interaction timeout

    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email'); // Basic email format validation

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await interaction.editReply({
        content: 'Please provide a valid email address.',
      });

      return;
    } // Check if user is already verified // Assuming checkVerified takes userId or email to check against the database/storage

    const boolCheck = await checkVerified({ email: email });

    if (boolCheck) {
      await interaction.editReply({
        content: 'You are already verified!',
      });

      return;
    } // Generate a 6-digit verification code

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

      console.log(`Verification email sent to ${email} for user ${user.tag}`); // Mark user as verified in your persistence layer (e.g., database)

      await verifyUser({
        user: userId,

        email: email,

        verified: true, // This should likely be `false` until code is actually verified
      });
    } catch (error) {
      console.error(`Error sending verification email to ${email}:`, error);

      await interaction.editReply({
        content:
          "There was an error sending the verification email. Please check your email address and try again later. Ensure your bot's email credentials are correct.",
      }); // Clean up the stored code if email sending fails

      verificationCodes.delete(userId);
    }
  } else if (commandName === 'verify_code') {
    const submittedCode = interaction.options.getString('code');

    const storedVerification = verificationCodes.get(userId);

    if (!storedVerification) {
      await interaction.reply({
        content:
          'No pending verification found for you. Please use `/verify <your_email>` first.',

        ephemeral: true,
      });

      return;
    } // Check for code expiry

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
      verifiedUsers.add(userId); // Mark user as verified in in-memory set // Update the user's verification status in your persistence layer to `true`

      await verifyUser({
        user: userId,

        email: storedVerification.email,

        verified: true,
      });

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
    // Check if the user is email verified

    const isVerified = await checkVerified({ user: userId }); // Assuming checkVerified can take userId

    if (!isVerified) {
      await interaction.reply({
        content:
          'You must verify your email first to use the `/report` command. Please use `/verify <your_email>` to start the verification process.',

        ephemeral: true,
      });

      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      const dmChannel = await user.createDM();

      await createSession({
        userId: userId,

        sessionid: sessionid,
      });

      const initial_response = await botModel(
        userId,

        'hi, I need to report something',

        sessionid
      );

      await dmChannel.send(initial_response); // Set user state to awaiting_report_details and store the session ID

      reportStates.set(userId, {
        state: 'awaiting_report_details',

        sessionId: sessionid,
      });

      await interaction.editReply({
        content:
          "Please check your DMs! I've sent you some questions to gather more details for your report.",
      });
    } catch (error) {
      console.error(`Error initiating report DM with ${user.tag}:`, error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content:
            'There was an error starting your report process. Please ensure your DMs are open or try again later.',
        });
      }
    }
  } // --- Handle /media command ---
  else if (commandName === 'media') {
    await interaction.deferReply({ ephemeral: true }); // Ensure the user is in a reporting state to accept media

    const userState = reportStates.get(userId);

    if (!userState || userState.state !== 'awaiting_report_details') {
      await interaction.editReply({
        content:
          'You can only upload media after starting a report with `/report`.',
      });

      return;
    }

    const attachment = interaction.options.getAttachment('file'); // Changed option name to 'file' for broader use

    if (attachment) {
      // Store the image URL in submissionData

      if (!submissionData.has(userId)) {
        submissionData.set(userId, { media: [] });
      }

      submissionData.get(userId).media.push(attachment.url);

      await interaction.editReply({
        content: `Thank you! I've attached your media (${attachment.url}) to your current report. You can attach more or use \`/submit\` when ready.`,
      });
    } else {
      await interaction.editReply({
        content:
          'No file attachment found. Please attach a file when using this command.',
      });
    }
  } // --- Handle /submit command ---
  else if (commandName === 'submit') {
    const response = await submitTool(userId);
    console.log(response);
  }
});

// --- messageCreate event handler (for bot mentions and DMs) ---

client.on(Events.MessageCreate, async (msg) => {
  // Ignore messages from bots to prevent infinite loops or unwanted responses

  if (msg.author.bot) return; // Handle Direct Messages

  if (msg.channel.type === ChannelType.DM) {
    const userId = msg.author.id;

    const userState = reportStates.get(userId);

    const userMessageContent = msg.content.trim();

    if (userState && userState.state === 'awaiting_report_details') {
      // Continue the conversation with botModel using the stored session ID

      console.log(userState.sessionId);
      const response = await botModel(
        userId,

        userMessageContent,

        userState.sessionId
      );

      await msg.reply(response);
    } else {
      // For DMs outside of a report flow, you might have a general DM handling

      // or prompt them to start a report.

      await msg.reply(
        "It looks like you're not in an active report session. To start a report, please use the `/report` command in a server where I'm present."
      );
    }

    return; // Important: return after handling DM to prevent falling into mention logic
  } // Original mention logic (only if not a DM)

  if (msg.mentions.has(msg.client.user)) {
    const responseContent = `Hello <@${msg.author.id}>! You mentioned me! How can I help you today?`;

    await msg.reply({
      content: responseContent,

      flags: MessageFlags.Ephemeral, // This makes the reply private to the user
    });
  }
});

// Log in to Discord with your client's token

client.login(TOKEN);
