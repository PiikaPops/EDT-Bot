const { SlashCommandBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const fs = require('fs');
const ical = require('node-ical');
const { startOfDay, endOfDay } = require('date-fns');

// Liste de couleurs associées aux événements
const eventColors = {
	'Anglais': '#ff0000',
	'Renforcement POO': '#ff9933',
	'RPOO': '#ff9933',
	'Compilation': '#ff66ff',
	'Algorithmes et Systèmes': '#c0ffb0',
	'Réunion': '#00ff99',
	'Ingénierie du logiciel': '#ffc7ab',
	'ENT': '#bd2d1a',
	'Communication': '#bd1a76',
	'Conférence': '#1abdaf'
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edt')
		.setDescription('Affiche EDT')
		.addStringOption(option =>
			option.setName('emploi_du_temps')
				.setDescription('Spécifiez l\'emploi du temps à afficher')
				.setRequired(true)
				.addChoices(
					{ name: 'A1', value: 'A1' },
					{ name: 'A2', value: 'A2' },
					{ name: 'B1', value: 'B1' },
					{ name: 'B2', value: 'B2' },
					{ name: 'PVP1', value: 'PVP1' },
					{ name: 'PVP2', value: 'PVP2' },
					{ name: 'PVP3', value: 'PVP3' },
				))
		.addStringOption(option =>
			option.setName('date')
				.setDescription('Spécifiez une date au format JJ/MM/AAAA')
				.setRequired(false)
		),
	async execute(interaction) {
		const emploiDuTemps = interaction.options.getString('emploi_du_temps');
		const dateOption = interaction.options.getString('date');

		// Convertissez la dateOption en objet Date s'il y en a une
		let customDate;
		if (dateOption) {
			try {
				// Analysez la date au format JJ/MM/AAAA
				const [day, month, year] = dateOption.split('/');
				const formattedDate = `${year}-${month}-${day}`;
				customDate = new Date(formattedDate);
			} catch (error) {
				return interaction.reply({content:'La date spécifiée n\'est pas au format JJ/MM/AAAA valide.', ephemeral: true});
			}
		}

		let url;
		switch (emploiDuTemps) {
			case 'A1':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=422&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			case 'A2':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=5705&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			case 'B1':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=418&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			case 'B2':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=5707&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			case 'PVP1':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7326&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			case 'PVP2':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7739&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			case 'PVP3':
				url = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7780&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
				break;
			default:
				// Si l'emploi du temps spécifié n'est pas valide, vous pouvez gérer cela ici
				return interaction.reply({content:'L\'emploi du temps spécifié n\'est pas valide.',ephemeral: true});
		}

		ical.fromURL(url, {}, function (err, data) {
			const dateCal = customDate || startOfDay(new Date());

			// Convert events to an array and sort them by start time
			const events = [];
			for (let k in data) {
				if (data.hasOwnProperty(k)) {
					const ev = data[k];
					if (ev.type == 'VEVENT') {
						if (ev.start >= dateCal && ev.start < endOfDay(dateCal)) {
							let description = ev.description.replace(/\(Exporté le:[^\n]+\)\n/, '').trim();
							const descriptionLines = description.split('\n');
							if (descriptionLines.length > 4) {
								descriptionLines.splice(4); // Supprimer les lignes excédentaires
								description = descriptionLines.join('\n');
							}
							ev.description = description;
							events.push(ev);
						}
					}
				}
			}

			events.sort((a, b) => a.start - b.start);
			// Calculate the total height needed for all events
			const eventSpacing = 20; // Space between events (adjust as needed)
			const eventHeight = 220; // Height of each event block (adjust as needed)
			const totalHeight = events.length * (eventHeight + eventSpacing) + 100;

			// Create a canvas with the calculated height
			const canvas = createCanvas(800, totalHeight);
			const ctx = canvas.getContext('2d');

			// Set background color (neutral background)
			ctx.fillStyle = '#f0f0f0'; // Change to your desired background color
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Set font and style
			ctx.font = '28px sans-serif';
			ctx.textAlign = 'left';
			ctx.fillStyle = 'black';

			let y = 50; // Initial Y position for text

			// Draw the title indicating the date
			const dateString = dateCal.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
			ctx.fillText(`Groupe ${emploiDuTemps} pour ${dateString}`, 60, y);
			y += 50; // Move down for events

			for (const ev of events) {
				const startDateString = ev.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
				const endDateString = ev.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

				// Determine the event color based on event name
				let eventColor = 'white'; // Default color
				for (const eventNameSubstring in eventColors) {
					if (ev.summary.includes(eventNameSubstring)) {
						eventColor = eventColors[eventNameSubstring];
						break; // Exit the loop once a match is found
					}
				}

				// Draw a rectangle for the event with the specified color
				ctx.fillStyle = eventColor;
				ctx.fillRect(50, y - 30, canvas.width - 100, eventHeight); // Adjust dimensions as needed

				// Set font and style for event details
				ctx.font = '30px sans-serif';
				ctx.fillStyle = 'black'; // Text color
				ctx.fillText(`${ev.summary}`, 60, y);
				ctx.font = '24px sans-serif';
				ctx.fillText(`${startDateString} - ${endDateString}`, 60, y + 30);
				ctx.fillText(`${ev.location}`, 60, y + 60);
				ctx.fillText(`${ev.description}`, 60, y + 90);
				y += eventHeight + eventSpacing; // Adjust as needed
			}

			// Save the canvas to an image file
			const buffer = canvas.toBuffer('image/png');
			fs.writeFileSync('calendar.png', buffer);

			// Send the generated image as a response
			interaction.reply({ files: ['calendar.png'], ephemeral: true});
		});
	},
};
