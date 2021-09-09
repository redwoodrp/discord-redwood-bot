const {SlashCommandBuilder} = require('@discordjs/builders');
const Canvas = require('canvas');
const {MessageAttachment} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tuv-format')
    .setDescription('Correct format of a license.'),
  async execute(interaction) {
    interaction.reply(`Format that best works with the bot:

Issued: date
Owner: 
Seats:  _number_

License Plate:
1st Registry Date:
Year:
Brand:
Model:
Engine Type: _decimal number_ _some text_ _example: 4.5L V_
Engine Power: 
Fuel Type: 
Transmission and Gears:
Body Type:
Color:
Weight: 
Additional Infos: _optional/doesn't have to exist_`);
  },
};
