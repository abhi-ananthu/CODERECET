import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)).default;
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('🔃 Registering slash commands...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error(error);
  }
})();
