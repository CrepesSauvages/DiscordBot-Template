const mongoose = require('mongoose');

const guildSettingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    locale: {
        type: String,
        default: 'fr'
    },
    settings: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    }
}, { timestamps: true });

// Ajout de la méthode statique getOrCreate
guildSettingsSchema.statics.getOrCreate = async function(guildId) {
    try {
        let guildSettings = await this.findOne({ guildId });
        
        if (!guildSettings) {
            guildSettings = await this.create({
                guildId,
                locale: 'fr',
                settings: new Map()
            });
        }
        
        return guildSettings;
    } catch (error) {
        console.error(`Erreur lors de la récupération/création des paramètres pour le serveur ${guildId}:`, error);
        throw error;
    }
};

const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);

module.exports = GuildSettings; 