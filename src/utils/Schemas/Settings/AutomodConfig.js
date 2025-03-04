const mongoose = require('mongoose');

const AutomodConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    mute: {
        enabled: { type: Boolean, default: true },
        threshold: { type: Number, default: 3 },
        duration: { type: String, default: '24h' }
    },
    kick: {
        enabled: { type: Boolean, default: true },
        threshold: { type: Number, default: 5 }
    },
    ban: {
        enabled: { type: Boolean, default: true },
        threshold: { type: Number, default: 7 }
    }
});

module.exports = mongoose.model('AutomodConfig', AutomodConfigSchema); 