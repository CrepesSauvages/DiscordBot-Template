const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

class TempCommandManager {
    constructor(client) {
        this.client = client;
        this.tempCommands = new Map();
        this.rest = new REST({ version: '10' }).setToken(client.config.token);
    }

    async create(commandName, options, duration) {
        try {
            // Créer la commande dans Discord
            const commandData = options.data.toJSON();
            await this.rest.post(
                Routes.applicationCommands(this.client.user.id),
                { body: commandData }
            );

            // Stocker la commande temporaire
            const command = {
                data: options,
                expiresAt: Date.now() + duration,
                execute: options.execute
            };
            
            this.tempCommands.set(commandName, command);
            
            // Configurer la suppression automatique
            setTimeout(async () => {
                await this.delete(commandName);
            }, duration);
            
            this.client.commands.set(commandName, options); // Ajouter à la collection de commandes
            this.client.logs.info(`Commande temporaire '${commandName}' créée pour ${duration/1000} secondes`);
            
            return true;
        } catch (error) {
            this.client.logs.error(`Erreur lors de la création de la commande temporaire '${commandName}': ${error}`);
            throw error;
        }
    }

    async delete(commandName) {
        try {
            if (this.tempCommands.has(commandName)) {
                // Supprimer la commande de Discord
                const commands = await this.client.application.commands.fetch();
                const commandToDelete = commands.find(cmd => cmd.name === commandName);
                if (commandToDelete) {
                    await commandToDelete.delete();
                }

                // Supprimer des collections locales
                this.tempCommands.delete(commandName);
                this.client.commands.delete(commandName);
                
                this.client.logs.info(`Commande temporaire '${commandName}' supprimée`);
                return true;
            }
            return false;
        } catch (error) {
            this.client.logs.error(`Erreur lors de la suppression de la commande temporaire '${commandName}': ${error}`);
            throw error;
        }
    }

    has(commandName) {
        return this.tempCommands.has(commandName);
    }

    get(commandName) {
        return this.tempCommands.get(commandName);
    }
}

module.exports = TempCommandManager;