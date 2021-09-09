const fs = require('fs');
const {Client, Collection, Intents} = require('discord.js');
const {guildId} = require('./config.json');
const {registerFont} = require("canvas");

registerFont('./src/assets/NanumPenScript-Regular.ttf', {family: 'nanumpen'});
require('dotenv').config();

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES]});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
  console.log('Ready!');
});

client.on('messageCreate', (message) => {
  // console.log(`${message.author.username}: ${message.content}`)
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const {commandName} = interaction;
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
  }
});

client.login(process.env.TOKEN);
