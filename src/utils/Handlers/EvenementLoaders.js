const fs = require('fs');
const { Events } = require('discord.js');
const ReadFolder = require('../ReadingFolder.js');

const IGNORED_EVENTS = ['hotReload'];

module.exports = function (client) {

    const files = ReadFolder('events');
    let loadedEvents = 0;

    for (const { path, data } of files) {
        try {
            if (!data.name) throw '❌ L’événement n’a pas de nom !';
            if (typeof data.name !== 'string') throw '❌ Le nom de l’événement doit être une chaîne de caractères !';

            // Vérifier et convertir les noms des événements de v13 à v14
            const eventRegex_v13 = /^[A-Z_]+$/;
            if (eventRegex_v13.test(data.name)) {
                data.name = data.name.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            }

            if (Events[data.name]) data.name = Events[data.name];

            if (!Events[data.name] && !Object.values(Events).includes(data.name) && !IGNORED_EVENTS.includes(data.name)) {
                client.logs.warn(`⚠️ Nom d’événement potentiellement invalide "${data.name}"`);
            }

            if (typeof data.execute !== 'function') throw '❌ L’événement n’a pas de fonction `execute` !';

            client[data.once ? 'once' : 'on'](data.name, data.execute.bind(null, client));
            loadedEvents++;
        } catch (error) {
            client.logs.error(`❌ Échec du chargement de l'événement ${path} : ${error}`);
        }
    }

    client.logs.info(`✅ ${loadedEvents} événements chargés depuis ${files.length} fichiers.`);
};
