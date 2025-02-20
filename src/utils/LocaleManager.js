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
            const locale = file.split('.')[0];
            const translations = require(path.join(localesPath, file));
            this.locales.set(locale, translations);
            this.client.logs.info(`Locale chargée: ${locale}`);
        }
    }

    translate(key, locale = this.defaultLocale, replacements = {}) {
        try {
            const translations = this.locales.get(locale) || this.locales.get(this.defaultLocale);
            let translation = key.split('.').reduce((obj, k) => obj?.[k], translations);

            if (!translation) {
                this.client.logs.warn(`Clé de traduction manquante: ${key} (${locale})`);
                return key;
            }

            // Remplacer les variables
            return translation.replace(/\{\{(\w+)\}\}/g, (_, k) => replacements[k] || `{{${k}}}`);
        } catch (error) {
            this.client.logs.error(`Erreur de traduction: ${error.message}`);
            return key;
        }
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
        if (!this.locales.has(locale)) {
            throw new Error(`Langue non supportée: ${locale}`);
        }

        try {
            await GuildSettings.findOneAndUpdate(
                { guildId: guildId },
                { locale: locale },
                { upsert: true, new: true }
            );
            
            this.client.logs.info(`Langue définie pour le serveur ${guildId}: ${locale}`);
            return true;
        } catch (error) {
            this.client.logs.error(`Erreur lors de la définition de la langue: ${error.message}`);
            throw error;
        }
    }

    async getGuildLocale(guildId) {
        try {
            const settings = await GuildSettings.findOne({ guildId: guildId });
            return settings?.locale || this.defaultLocale;
        } catch (error) {
            this.client.logs.error(`Erreur lors de la récupération de la langue: ${error.message}`);
            return this.defaultLocale;
        }
    }
}

module.exports = LocaleManager; 