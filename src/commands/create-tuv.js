const {SlashCommandBuilder} = require('@discordjs/builders');
const Canvas = require('canvas');
const {MessageAttachment} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-tuv')
    .setDescription('Create a tüv license.')
    .addStringOption(option => option.setName('vin').setDescription('VIN to be printed on the card').setRequired(true))
    .addStringOption(option => option.setName('category').setDescription('Vehicle category').setRequired(true).addChoices([
      ['B', 'B'],
      ['A', 'A'],
      ['A2', 'A2'],
      ['B1', 'B1'],
      ['B2', 'B2'],
      ['D', 'D'],
      ['C', 'C'],
      ['CE', 'CE'],
      ['E', 'E'],
    ])),
  async execute(interaction) {
    const vin = interaction.options.getString('vin');
    const category = interaction.options.getString('category');

    const tuvRegex = /license plate: ?([A-z0-9-/(). ]+)\n?1st ?registry date: ?([A-z0-9-/().]*)\n?brand: ?([A-z0-9-/(). ]*)\n?model: ?([A-z0-9-/(). ]*)\n?year: ?([A-z0-9-/(). ]*)\n?engine type: ?([A-z0-9-/(). ]*)\n?engine power ?\(hp\): ?([A-z0-9-/(). ]*)\n?fuel type: ?([A-z0-9-/(). ]*)\n?transmission and gears: ?([A-z0-9-/(). ]*)\n?body type: ?([A-z0-9-/(). ]*)\n?color: ?([A-z0-9-/(). ]*)\n?weight ?\(k?g?\): ?([A-z0-9-/(). ]*)\n?(?:additional infos: ?([A-z0-9-/(). ]*))?/i;

    const labels = {
      issued: 'issued',
      owner: 'owner',
      licensePlate: 'license plate',
      firstRegistry: '1st registry date',
      brand: 'brand',
      model: 'model',
      year: 'year',
      motorSize: 'motor size(?: ?\\(ccm\\))?',
      enginePower: 'engine power(?: ?\\(hp\\))?',
      fuelType: 'fuel type',
      transmission: 'transmission and gears',
      bodyType: 'body type',
      color: 'colou?r',
      weight: 'weight ?(?:\\(kg\\))?',
      seats: 'seats',
      additionalInfos: 'additional ?(?:infos?|informations?)?',
    };
    const getVehicleInfo = (inp) => {
      const baseRegex = ': ?([A-z0-9-()/., ]*)';
      let vehicleOut = {
        // expiresIn: `${dn.getUTCDay()}/${dn.getUTCMonth()}/${dn.getUTCFullYear()}`,
        expiresIn: 'Issued + 1 month',
        motorSize: 'error',
        signature: interaction.member.displayName,
        category,
        issued: 'N/A',
        // issued: `${d.getDay()}/${d.getMonth()}/${d.getFullYear()}`,
        vin,
        owner: 'N/A',
        licensePlate: 'N/A',
        firstRegistry: 'N/A',
        brand: 'N/A',
        model: 'N/A',
        year: 'N/A',
        engineType: 'N/A',
        enginePower: 'N/A',
        fuelType: 'N/A',
        transmission: 'N/A',
        bodyType: 'N/A',
        color: 'N/A',
        weight: 'N/A',
        seats: 'N/A',
        additionalInfos: 'N/A',
      };

      Object.keys(labels).forEach((key) => {
        const val = labels[key];
        const regex = new RegExp(`${val}${baseRegex}`, 'i');
        const match = inp.match(regex);

        if (match) vehicleOut[key] = match[1];
      });

      // const motorSizeMatch = vehicleOut.engineType.match(/([0-9].[0-9])/gi);
      // if (motorSizeMatch) vehicleOut.motorSize = parseFloat(motorSizeMatch[0]) * 1000;

      return vehicleOut;
    };

    const filter = response => {
      // Backup regex: /license plate: ?([A-z0-9-/().]+)\n1st ?registry date: ?([A-z0-9-/().]*)\nbrand: ?([A-z0-9-/(). ]*)\nmodel: ?([A-z0-9-/(). ]*)\nyear: ?([A-z0-9-/(). ]*)\nengine type: ?([A-z0-9-/(). ]*)\nengine power\(hp\): ?([A-z0-9-/(). ]*)\ntransmission and gears: ?([A-z0-9-/(). ]*)\nbody type: ?([A-z0-9-/(). ]*)\ncolor: ?([A-z0-9-/(). ]*)\nweight\(kg\): ?([A-z0-9-/(). ]*)\nadditional Infos: ?([A-z0-9-/(). ]*)/gi
      //  return tuvRegex.test(response.content) && response.author.id === interaction.member.id;
      const tempVehicle = getVehicleInfo(response.content);

      Object.keys(labels).forEach((label) => {
        if (tempVehicle[label] === undefined || tempVehicle[label] === null) {
          console.log('missing: ', label);
          return false;
        }
      });
      return true;
    };

    interaction.reply('Post the form in the correct format below. Don\'t know the format? Just type `/tuv-format`', {fetchReply: true})
      .then(() => {
        interaction.channel.awaitMessages({filter, max: 1, time: 30000})
          .then(async collected => {
            const reply = collected.first();

            await interaction.followUp(`<a:loading:884762811195072542> Processing and sending the generated image to you...`);

            const vehicle = getVehicleInfo(reply.content);

            // Image manipulation starts
            const background = await Canvas.loadImage('./src/assets/tuv-template.png');

            const canvas = Canvas.createCanvas(background.width, background.height);
            const context = canvas.getContext('2d');

            context.font = '22px Arial';

            context.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Draw text
            let currentY = [[192, 377], [116, 596, 705, 341]]; // initialize with start pos
            const xMap = [[223, 139], [864, 660, 893, 1091]];
            const tables = [
              [
                ['licensePlate', 'firstRegistry', 'expiresIn', 'brand', 'model'],
                ['vin', 'owner', 's', 's', 's', 's', 's', 'owner'],
              ],
              [
                ['bodyType', 's', 's', 'weight', 's', 'issued', 'category', 's', 'motorSize', 'color', 's', 'seats'],
                ['additionalInfos'],
                [{label: 'signature', font: '70px "nanumpen"'}],
                ['enginePower', 's', 'fuelType'],
              ],
            ];

            tables.forEach((table, tableIndex) => {
              table.forEach((arr, arrIndex) => {
                let y = currentY[tableIndex][arrIndex];
                arr.forEach((key) => {
                  context.font = '22px Arial';
                  if (typeof key === 'object') {
                    if (key.font) context.font = key.font;
                    if (key.label) context.fillText(vehicle[key.label], xMap[tableIndex][arrIndex], y); // s = skip
                  } else if (key !== 's') {
                    context.fillText(vehicle[key], xMap[tableIndex][arrIndex], y); // s = skip
                  }

                  y += 37; // 37 = table height
                });
              });
            });


            // Use the helpful Attachment class structure to process the file for you
            const attachment = new MessageAttachment(canvas.toBuffer(), 'tuv.jpg');
            await reply.author.send(`VIN: ${vehicle.vin}`);
            await reply.author.send({files: [attachment]});
          })
          .catch(collected => {
            console.log(collected);

            if (filter(collected)) return;
            interaction.followUp('Right format was not given in time. If you think this is an error made by me, then contact my developer @JustMe#8491');
          });
      });
  },
};
