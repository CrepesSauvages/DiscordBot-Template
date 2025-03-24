const mongoose = require('mongoose');

const GuildSettingsLevel = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    xpMultipliers: [{
        type: { type: String, enum: ['role', 'channel'], required: true },
        targetId: { type: String, required: true },
        multiplier: { type: Number, default: 1.0 },
        endDate: { type: Date, default: null }
    }],
    levelUpChannel: { type: String, default: null },
    disabledChannels: [String]
});

module.exports = mongoose.model('GuildSettingsLevel', GuildSettingsLevel); 