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

module.exports = mongoose.model('GuildSettings', guildSettingsSchema); 