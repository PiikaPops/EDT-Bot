const {
    SlashCommandBuilder
} = require('discord.js');
const {
    createCanvas
} = require('canvas');
const fs = require('fs');
const ical = require('node-ical');
const {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    startOfDay,
    endOfDay,
    parseISO,
    addDays
} = require('date-fns');
const {
    fr
} = require('date-fns/locale');


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
            .addChoices({
                name: 'A1',
                value: 'A1'
            }, {
                name: 'A2',
                value: 'A2'
            }, {
                name: 'B1',
                value: 'B1'
            }, {
                name: 'B2',
                value: 'B2'
            }))
        .addStringOption(option =>
            option.setName('emploi_du_tempspvp')
            .setDescription('Spécifiez l\'emploi du temps à afficher')
            .setRequired(true)
            .addChoices({
                name: 'PVP1',
                value: 'PVP1'
            }, {
                name: 'PVP2',
                value: 'PVP2'
            }, {
                name: 'PVP3',
                value: 'PVP3'
            }, ))
        .addStringOption(option =>
            option.setName('date')
            .setDescription('Spécifiez une date au format JJ/MM/AAAA')
            .setRequired(false)
        ),
    async execute(interaction) {
        const emploiDuTemps = interaction.options.getString('emploi_du_temps');
        const emploiDuTempsPVP = interaction.options.getString('emploi_du_tempspvp');
        const dateOption = interaction.options.getString('date');
        let icalgrp, icalPVP;
        switch (emploiDuTemps) {
            case 'A1':
                icalgrp = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=422&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            case 'A2':
                icalgrp = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=5705&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            case 'B1':
                icalgrp = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=418&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            case 'B2':
                icalgrp = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=5707&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            default:
                // Si l'emploi du temps spécifié n'est pas valide, vous pouvez gérer cela ici
                return interaction.reply({
                    content: 'L\'emploi du temps spécifié n\'est pas valide.',
                    ephemeral: true
                });
        }

        switch (emploiDuTempsPVP) {
            case 'PVP1':
                icalPVP = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7326&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            case 'PVP2':
                icalPVP = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7739&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            case 'PVP3':
                icalPVP = 'https://ade.univ-brest.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=7780&projectId=13&calType=ical&firstDate=2023-09-11&lastDate=2024-09-01&displayConfigId=25';
                break;
            default:
                // Si l'emploi du temps spécifié n'est pas valide, vous pouvez gérer cela ici
                return interaction.reply({
                    content: 'L\'emploi du temps spécifié n\'est pas valide.',
                    ephemeral: true
                });
        }

        let startDate, endDate;
        if (dateOption) {
            // Si une date est spécifiée, utilisez-la comme point de départ pour la semaine
            const [day, month, year] = dateOption.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            const parsedDate = parseISO(formattedDate);
            startDate = startOfWeek(parsedDate);
            endDate = endOfWeek(parsedDate);
        } else {
            // Sinon, utilisez la semaine actuelle
            startDate = startOfWeek(new Date());
            endDate = endOfWeek(new Date());
        }

        date1 = addDays(startDate, 1)
        date2 = addDays(endDate, -1)

        // Charger les données de l'emploi du temps B2
        ical.fromURL(icalgrp, {}, function (errB2, dataB2) {
            if (errB2) {
                console.error('Erreur lors de la récupération des données iCal B2 :', errB2);
                return interaction.reply({
                    content: 'Une erreur s\'est produite lors de la récupération des données iCal B2.',
                    ephemeral: true
                });
            }

            // Charger les données de l'emploi du temps B2
            ical.fromURL(icalgrp, {}, function (errB2, dataB2) {
                if (errB2) {
                    console.error('Erreur lors de la récupération des données iCal B2 :', errB2);
                    return interaction.reply({
                        content: 'Une erreur s\'est produite lors de la récupération des données iCal B2.',
                        ephemeral: true
                    });
                }

                // Charger les données de l'emploi du temps PVP3
                ical.fromURL(icalPVP, {}, function (errPVP3, dataPVP3) {
                    if (errPVP3) {
                        console.error('Erreur lors de la récupération des données iCal PVP3 :', errPVP3);
                        return interaction.reply({
                            content: 'Une erreur s\'est produite lors de la récupération des données iCal PVP3.',
                            ephemeral: true
                        });
                    }

                    // Créez un objet pour stocker les événements fusionnés
                    const mergedEvents = {};

                    // Fusionnez les événements du groupe B2 dans l'objet mergedEvents
                    Object.values(dataB2).forEach((eventB2) => {
                        if (eventB2.type === 'VEVENT') {
                            const key = `${eventB2.start.toISOString()}`;
                            mergedEvents[key] = eventB2;
                        }
                    });

                    // Fusionnez les événements du groupe PVP3 dans l'objet mergedEvents
                    Object.values(dataPVP3).forEach((eventPVP3) => {
                        if (eventPVP3.type === 'VEVENT') {
                            const key = `${eventPVP3.start.toISOString()}`;

                            // Vérifiez s'il y a un événement correspondant dans B2
                            if (mergedEvents[key]) {
                                // Utilisez l'événement de B2 en cas de doublon
                                mergedEvents[key] = mergedEvents[key];
                            } else {
                                // Sinon, utilisez l'événement de PVP3
                                mergedEvents[key] = eventPVP3;
                            }
                        }
                    });

                    // Triez les événements par heure de début
                    const mergedEventArray = Object.values(mergedEvents).sort((a, b) => a.start - b.start);

                    // Créez un tableau pour chaque jour de la semaine
                    const daysOfWeek = eachDayOfInterval({
                        start: startDate,
                        end: endDate
                    });
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
                    ctx.fillText(`Emploi du temps du groupe ${emploiDuTemps} pour la semaine du ${format(date1, 'EEEE d MMMM', { locale: fr })} au ${format(date2, 'EEEE d MMMM', { locale: fr })}`, 400, 20);

                    // Pour chaque jour de la semaine
                    daysOfWeek.forEach((day, columnIndex) => {
                        // Vérifiez si le jour fait partie des jours inclus (lundi à vendredi)
                        if (includedDaysOfWeek.includes(day.getDay())) {
                            // Filtrez les événements pour ce jour
                            const events = mergedEventArray.filter((event) => {
                                return (
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
                            ctx.fillText(format(day, 'EEEE', {
                                locale: fr
                            }), columnX + 120, 60);

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
                                ctx.fillText(event.location, columnX + 20, eventY + 50);
                            });
                        }
                    });

                    // Enregistrez le canevas sous forme d'image
                    const buffer = canvas.toBuffer('image/png');
                    fs.writeFileSync('calendarFull.png', buffer);

                    // Envoyez l'image générée en réponse
                    interaction.reply({
                        files: ['calendarFull.png'],
                        ephemeral: true
                    });
                });
            });
        })
    }
}