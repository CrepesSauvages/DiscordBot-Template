const fs = require('fs');
const path = require('path');
const GuildSettings = require('./Schemas/GuildSettings');

class LocaleManager {
    constructor(client) {
        this.client = client;
        this.locales = new Map();
        this.defaultLocale = 'fr';
        this.loadLocales();
    }

    loadLocales() {
        const localesPath = path.join(__dirname, '../locales');
        const localeFiles = fs.readdirSync(localesPath).filter(file => file.endsWith('.json'));

        for (const file of localeFiles) {
            const localeName = file.split('.')[0];
            const localeData = require(path.join(localesPath, file));
            this.locales.set(localeName, localeData);
        }
    }

    translate(key, locale = this.defaultLocale, replacements = {}) {
        // Obtenir les traductions pour la langue demandée ou la langue par défaut
        const translations = this.locales.get(locale) || this.locales.get(this.defaultLocale);
        
        if (!translations) {
            return key;
        }

        // Diviser la clé en parties (ex: "commands.help.description" => ["commands", "help", "description"])
        const parts = key.split('.');
        
        // Parcourir l'objet de traductions pour trouver la valeur
        let value = translations;
        for (const part of parts) {
            value = value?.[part];
            if (!value) break;
        }

        // Si aucune traduction n'est trouvée, retourner la clé
        if (!value) return key;

        // Remplacer les variables dans la traduction
        let result = value;
        for (const [key, val] of Object.entries(replacements)) {
            result = result.replace(new RegExp(`{${key}}`, 'g'), val);
        }

        return result;
    }

    translateCommand(command, locale) {
        try {
            const translations = this.locales.get(locale) || this.locales.get(this.defaultLocale);
            const commandPath = `commands.${command.data.name}`;
            
            // Traduire le nom et la description principale
            const translatedCommand = {
                ...command,
                data: {
                    ...command.data,
                    name: this.translate(`${commandPath}.name`, locale) || command.data.name,
                    description: this.translate(`${commandPath}.description`, locale) || command.data.description
                }
            };

            // Traduire les options si elles existent
            if (command.data.options) {
                translatedCommand.data.options = command.data.options.map(option => ({
                    ...option,
                    name: this.translate(`${commandPath}.options.${option.name}.name`, locale) || option.name,
                    description: this.translate(`${commandPath}.options.${option.name}.description`, locale) || option.description
                }));
            }

            return translatedCommand;
        } catch (error) {
            this.client.logs.error(`Erreur de traduction de commande: ${error.message}`);
            return command;
        }
    }

    async setGuildLocale(guildId, locale) {
        try {
            if (!this.locales.has(locale)) {
                throw new Error(`Langue non supportée: ${locale}`);
            }

            const guildSettings = await GuildSettings.getOrCreate(guildId);
            guildSettings.locale = locale;
            await guildSettings.save();

            return true;
        } catch (error) {
            console.error(`Erreur lors du changement de langue pour le serveur ${guildId}:`, error);
            throw error;
        }
    }

    async getGuildLocale(guildId) {
        try {
            const guildSettings = await GuildSettings.getOrCreate(guildId);
            return guildSettings.locale || this.defaultLocale;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la langue pour le serveur ${guildId}:`, error);
            return this.defaultLocale;
        }
    }
}

module.exports = LocaleManager; 