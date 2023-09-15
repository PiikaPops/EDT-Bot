const fs = require('node:fs');
const path = require('node:path');
const {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	messageLink
} = require('discord.js');
const client = new Client({
	intents: [GatewayIntentBits.Guilds]
});
const dotenv = require('dotenv');
const ical = require('node-ical');
const {
	startOfDay,
	endOfDay
} = require('date-fns');
const {
	createCanvas
} = require('canvas');
const cron = require('node-cron');

client.commands = new Collection();

dotenv.config();

let courseFound = true;

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

// Lire le fichier de commandes
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}


// Gérer les commandes
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				ephemeral: true
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true
			});
		}
	}
});

// Fonction pour vérifier et envoyer des rappels
function checkAndSendReminders() {
	console.log("Début du check");
	const now = new Date();
	ical.fromURL('https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=5707&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25', {}, function (err, data) {
		if (err) {
			console.error('Erreur lors de la récupération des données iCal :', err);
			return;
		}

		for (let k in data) {
			if (data.hasOwnProperty(k)) {
				const ev = data[k];
				if (ev.type == 'VEVENT') {
					const eventDate = new Date(ev.start);
					const timeDifference = (eventDate - now) / (1000 * 60); // Différence en minutes
					//console.log(`L'événement "${ev.summary}" commencera dans ${timeDifference} minutes.`);

					if (timeDifference > 0 && timeDifference <= 20) {
						const channel = client.channels.cache.get('1151166913133678623');
						channel.send(`Le cours "${ev.summary}" dans la salle ${ev.location} commencera à ${ev.start.toLocaleTimeString('fr-FR')}.`);
						courseFound = true;

						// Réinitialiser le drapeau après 60 minutes
						setTimeout(() => {
							courseFound = false;
						}, 60 * 60 * 1000); // 60 minutes en millisecondes
					}
				}
			}
		}
	});
}

function sendDailyCalendar() {
	// Vérifier si le jour d'aujourd'hui est un samedi (6) ou un dimanche (0)
	const today = new Date();
	const dayOfWeek = today.getDay();
	if (dayOfWeek === 6 || dayOfWeek === 0) {
		return;
	}

	ical.fromURL('https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=5707&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25', {}, function (err, data) {
		if (err) {
			console.error('Erreur lors de la récupération des données iCal :', err);
			return;
		}
		channelDaily = client.channels.cache.get('1152311074251616256'); //salon edt du jour

		dateCal = startOfDay(new Date());
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
		const dateString = dateCal.toLocaleDateString('fr-FR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		ctx.fillText(`Groupe B2 pour ${dateString}`, 60, y);
		y += 50; // Move down for events

		for (const ev of events) {
			const startDateString = ev.start.toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
			const endDateString = ev.end.toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});

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
		fs.writeFileSync('calendarDaily.png', buffer);

		// Send the generated image as a response
		channelDaily.bulkDelete(10);
		channelDaily.send({
			files: ['calendarDaily.png']
		});
	});
}


// Événement lorsque le bot Discord est prêt
client.once('ready', () => {
	console.log(`Connecté en tant que ${client.user.tag}`);

	// Vérifiez et envoyez des rappels toutes les 5 minutes si aucun cours n'a été trouvé dans les 60 dernières minutes.
	setInterval(() => {
		if (!courseFound) {
			checkAndSendReminders()
		}
	}, 5 * 60 * 1000); // Toutes les 5 minutes

	//lancer le channelDaily tout les jours à 7h
	cron.schedule('0 7 * * *', () => {
		sendDailyCalendar();
	});
});

client.login(process.env.TOKEN);