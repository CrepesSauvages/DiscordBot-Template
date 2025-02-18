// filepath: /c:/Users/babou/OneDrive/Bureau/DiscordBot-Template/src/utils/Handlers/RegistreCommands.js
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../../config/commandsCache.json');

module.exports = async (client) => {
    client.logs.info('🚀 Vérification des mises à jour des commandes...');

    const commands = [];
    const devCommands = [];
    const registeredNames = new Set();

    for (const [, command] of client.commands) {
        try {
            if (!command.data) throw new Error(`Commande invalide: pas de \`data\` trouvé.`);

            const commandData = command.data.toJSON();
            commandData.dm_permission ??= false;

            if (registeredNames.has(commandData.name)) continue;
            registeredNames.add(commandData.name);

            if (command.dev) {
                devCommands.push(commandData);
                client.logs.info(`🔧 Commande de développement trouvée: ${commandData.name}`);
            } else {
                commands.push(commandData);
                client.logs.info(`✅ Commande globale trouvée: ${commandData.name}`);
            }
        } catch (error) {
            client.logs.error(`❌ [REGISTER] Échec de l'enregistrement de ${command?.data?.name || "Inconnu"} : ${error.message}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(client.config.token);

    let cache = { global: [], dev: [] };
    if (fs.existsSync(CACHE_FILE)) {
        try {
            cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        } catch (error) {
            client.logs.warn("⚠️ Impossible de lire `commandsCache.json`, création d'un nouveau.");
        }
    }

    try {
        if (JSON.stringify(commands) !== JSON.stringify(cache.global)) {
            await rest.put(Routes.applicationCommands(client.config.app_ip), { body: commands });
            client.logs.info(`✅ ${commands.length} commandes globales mises à jour.`);
            cache.global = commands;
        } else {
            client.logs.info("🔄 Aucune modification des commandes globales.");
        }

        if (client.config.dev_guild_id && JSON.stringify(devCommands) !== JSON.stringify(cache.dev)) {
            await rest.put(
                Routes.applicationGuildCommands(client.config.app_ip, client.config.dev_guild_id),
                { body: devCommands }
            );
            client.logs.info(`🔧 ${devCommands.length} commandes de développement mises à jour.`);
            cache.dev = devCommands;
        } else {
            client.logs.info("🔄 Aucune modification des commandes de développement.");
        }

        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 4), 'utf-8');
    } catch (error) {
        client.logs.error(`❌ Erreur lors de l'enregistrement des commandes : ${error.message}`);
    }

    client.logs.info('🎉 Vérification des mises à jour des commandes terminée.');
};