// ======================== IMPORTS ========================
const {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  ApplicationCommandOptionType,
  ChannelType,
} = require('discord.js');

const crypto = require('crypto');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { botModel, submitTool } = require('./agent');
const { client: cl } = require('./db-client');
const { createSession, getSession } = require('./db');
const {
  checkVerified,
  getVerifiedUser,
  verifyUser,
} = require('./verification');
const { dbRefreshEmitter } = require('./trigger');

// ======================== ENV + CLIENT ========================
dotenv.config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ======================== STATE ========================
const verificationCodes = new Map();
const verifiedUsers = new Set();
const reportStates = new Map();
const submissionData = new Map();

// ======================== EMAIL ========================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================== SLASH COMMANDS ========================
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
  {
    name: 'media',
    description: 'Upload one or more media files for your report.',
    options: [
      {
        name: 'file',
        type: ApplicationCommandOptionType.Attachment,
        description: 'Media file (image, video, etc.)',
        required: true,
      },
    ],
  },
  {
    name: 'location',
    description: 'Add your location details for the report.',
    options: [
      {
        name: 'place',
        type: ApplicationCommandOptionType.String,
        description: 'Your location (e.g., city, address, landmark)',
        required: true,
      },
    ],
  },
  {
    name: 'submit',
    description: 'Submit your report details and any attached media.',
    options: [
      {
        name: 'details',
        type: ApplicationCommandOptionType.String,
        description: 'Any final details you want to add to your report.',
        required: false,
      },
    ],
  },
];

// ======================== REGISTER SLASH COMMANDS ========================
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

// ======================== INTERACTION HANDLER ========================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const userId = user.id;
  const sessionid = crypto.randomBytes(32).toString('hex').normalize();

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true });
    const email = interaction.options.getString('email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await interaction.editReply({
        content: 'Please provide a valid email address.',
      });
      return;
    }
    const boolCheck = await checkVerified({ email });
    if (boolCheck) {
      await interaction.editReply({ content: 'You are already verified!' });
      return;
    }
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiryTime = Date.now() + 5 * 60 * 1000;
    verificationCodes.set(userId, {
      email,
      code: verificationCode,
      timestamp: expiryTime,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Discord Bot Verification Code',
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      await interaction.editReply({
        content: `A verification code has been sent to **${email}**.`,
      });
      await verifyUser({ user: userId, email, verified: false });
    } catch (error) {
      console.error(`Error sending email:`, error);
      verificationCodes.delete(userId);
      await interaction.editReply({
        content: 'Failed to send verification email. Try again later.',
      });
    }
  } else if (commandName === 'verify_code') {
    const submittedCode = interaction.options.getString('code');
    const stored = verificationCodes.get(userId);
    if (!stored) {
      await interaction.reply({
        ephemeral: true,
        content: 'No verification request found.',
      });
      return;
    }
    if (Date.now() > stored.timestamp) {
      verificationCodes.delete(userId);
      await interaction.reply({
        ephemeral: true,
        content: 'Code expired. Use `/verify` again.',
      });
      return;
    }
    if (submittedCode === stored.code) {
      verifiedUsers.add(userId);
      await verifyUser({ user: userId, email: stored.email, verified: true });
      verificationCodes.delete(userId);
      await interaction.reply({
        ephemeral: true,
        content: '🎉 Verified! You can now use `/report`.',
      });
    } else {
      await interaction.reply({
        ephemeral: true,
        content: 'Invalid verification code.',
      });
    }
  } else if (commandName === 'report') {
    const isVerified = await checkVerified({ user: userId });
    if (!isVerified) {
      await interaction.reply({
        ephemeral: true,
        content: 'Please verify your email with `/verify`.',
      });
      return;
    }
    try {
      await interaction.deferReply({ ephemeral: true });
      const dmChannel = await user.createDM();
      await createSession({ userId, sessionid });
      const initial_response = await botModel(
        userId,
        'hi, I need to report something',
        sessionid
      );
      await dmChannel.send(initial_response);
      reportStates.set(userId, {
        state: 'awaiting_report_details',
        sessionId: sessionid,
      });
      await interaction.editReply({
        content: 'Please check your DMs to continue the report.',
      });
    } catch (error) {
      console.error(`DM error:`, error);
      await interaction.editReply({
        content: 'Could not DM you. Check your privacy settings.',
      });
    }
  } else if (commandName === 'media') {
    await interaction.deferReply({ ephemeral: true });
    const userState = reportStates.get(userId);
    if (!userState || userState.state !== 'awaiting_report_details') {
      await interaction.editReply({
        content: 'Use `/report` before uploading media.',
      });
      return;
    }
    const attachment = interaction.options.getAttachment('file');
    const fileUrl = attachment?.url;
    if (!fileUrl) {
      await interaction.editReply({ content: 'No file attached.' });
      return;
    }
    if (!submissionData.has(userId))
      submissionData.set(userId, { media: [], location: null });
    submissionData.get(userId).media.push(fileUrl);
    await interaction.editReply({ content: `✅ Media added: ${fileUrl}` });
  } else if (commandName === 'location') {
    await interaction.deferReply({ ephemeral: true });
    const place = interaction.options.getString('place');
    const userState = reportStates.get(userId);
    if (!userState || userState.state !== 'awaiting_report_details') {
      await interaction.editReply({
        content: 'Use `/report` before setting location.',
      });
      return;
    }
    if (!submissionData.has(userId))
      submissionData.set(userId, { media: [], location: null });
    submissionData.get(userId).location = place;
    await interaction.editReply({ content: `📍 Location set: **${place}**` });
  } else if (commandName === 'submit') {
    await interaction.deferReply();
    const sessionid = reportStates.get(userId)?.sessionId;
    const response = await submitTool(userId, sessionid);
    const userSubmission = submissionData.get(userId) || {
      media: [],
      location: null,
    };

    await cl
      .db('ngo')
      .collection('complaints')
      .updateOne(
        { _id: response.insertedId },
        {
          $set: {
            mediaLink: userSubmission.media,
            location: userSubmission.location,
          },
        }
      );

    const object = await cl
      .db('ngo')
      .collection('complaints')
      .findOne({ _id: response.insertedId });
    const details = `These are the details confirm:\n\ntitle: ${object.title}\nmediaLink: ${object.mediaLink}\nlocation: ${object.location}\nbrief: ${object.brief}`;
    await interaction.editReply({ content: details });
    submissionData.delete(userId);
    reportStates.delete(userId);

    dbRefreshEmitter.emit('dbRefresh');
    const res = dbRefreshEmitter.emit('serarchNGO', object.brief);
    console.log(res);
  }
});

// ======================== MESSAGE HANDLER ========================
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (msg.channel.type === ChannelType.DM) {
    const userId = msg.author.id;
    const userState = reportStates.get(userId);
    const userMessageContent = msg.content.trim();
    if (userState?.state === 'awaiting_report_details') {
      const response = await botModel(
        userId,
        userMessageContent,
        userState.sessionId
      );
      await msg.reply(response);
    } else {
      await msg.reply(
        'You are not in a report session. Use `/report` in a server to start.'
      );
    }
    return;
  }
  if (msg.mentions.has(msg.client.user)) {
    await msg.reply({
      content: `Hello <@${msg.author.id}>! You mentioned me! How can I help you today?`,
      flags: MessageFlags.Ephemeral,
    });
  }
});

client.login(TOKEN);
