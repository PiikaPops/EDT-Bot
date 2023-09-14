const { SlashCommandBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
const fs = require('fs');
const ical = require('node-ical');
const { startOfWeek, endOfWeek, eachDayOfInterval, format, startOfDay, endOfDay } = require('date-fns');
const { fr } = require('date-fns/locale');


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
        .setName('fulledt')
        .setDescription('Affiche EDT de la semaine')
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
                )),
    async execute(interaction) {
        const emploiDuTemps = interaction.options.getString('emploi_du_temps');
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
                return interaction.reply({ content: 'L\'emploi du temps spécifié n\'est pas valide.', ephemeral: true });
        }

        // Récupérez la plage de dates pour la semaine entière
        const startDate = startOfWeek(new Date());
        const endDate = endOfWeek(new Date());

        ical.fromURL(url, {}, function (err, data) {
            if (err) {
                console.error('Erreur lors de la récupération des données iCal :', err);
                return interaction.reply({ content: 'Une erreur s\'est produite lors de la récupération des données iCal.', ephemeral: true });
            }

            // Créez un tableau pour chaque jour de la semaine
            const daysOfWeek = eachDayOfInterval({ start: startDate, end: endDate });
            const includedDaysOfWeek = [1, 2, 3, 4, 5]; // Correspond à lundi à vendredi

            const canvasWidth = 1500; // Largeur du canevas
            const canvasHeight = 620; // Hauteur du canevas
            const columnWidth = canvasWidth / includedDaysOfWeek.length; // Largeur de chaque colonne

            // Créez le canevas
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            // Dessinez le fond
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw the title indicating the date
            ctx.fillStyle = 'black';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(`Emploi du temps du groupe ${emploiDuTemps} pour cette semaine`, 500, 20);

            // Pour chaque jour de la semaine
            daysOfWeek.forEach((day, columnIndex) => {
                // Vérifiez si le jour fait partie des jours inclus (lundi à vendredi)
                if (includedDaysOfWeek.includes(day.getDay())) {
                    // Filtrez les événements pour ce jour
                    const events = Object.values(data).filter((event) => {
                        return (
                            event.type === 'VEVENT' &&
                            event.start >= startOfDay(day) &&
                            event.start < endOfDay(day)
                        );
                    });

                    // Triez les événements par heure de début
                    events.sort((a, b) => a.start - b.start);

                    // Calculez la position X pour cette colonne
                    const columnX = includedDaysOfWeek.indexOf(day.getDay()) * columnWidth;

                    // Dessinez le jour de la semaine en français
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 18px sans-serif';
                    ctx.fillText(format(day, 'EEEE', { locale: fr }), columnX + 120, 60);

                    // Dessinez les événements pour ce jour
                    events.forEach((event, eventIndex) => {
                        // Determine the event color based on event name
                        let eventColor = 'white'; // Default color
                        for (const eventNameSubstring in eventColors) {
                            if (event.summary.includes(eventNameSubstring)) {
                                eventColor = eventColors[eventNameSubstring];
                                break; // Exit the loop once a match is found
                            }
                        }

                        // Calculez la position Y pour cet événement
                        const eventY = 80 + eventIndex * 110;

                        // Dessinez le carré de couleur de l'événement
                        ctx.fillStyle = eventColor;
                        ctx.fillRect(columnX + 10, eventY - 15, columnWidth - 15, 100); // Ajustez les dimensions et la position au besoin

                        // Dessinez le nom de l'événement
                        ctx.fillStyle = 'black';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(event.summary, columnX + 20, eventY + 10);

                        // Dessinez l'heure de début et de fin de l'événement
                        ctx.font = '14px sans-serif';
                        ctx.fillText(
                            `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`,
                            columnX + 20,
                            eventY + 30
                        );

                        // Dessinez la location de l'événement
                        ctx.fillText(event.location, columnX + 20, eventY + 50
                        );
                    });
                }
            });

            // Enregistrez le canevas sous forme d'image
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync('calendarFull.png', buffer);

            // Envoyez l'image générée en réponse
            interaction.reply({ files: ['calendarFull.png'] });
        });
    }
};
