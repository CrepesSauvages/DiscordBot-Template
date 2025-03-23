const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastMessageTime: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index composé pour des recherches plus rapides
levelSchema.index({ userId: 1, guildId: 1 });

module.exports = mongoose.model('Levels', levelSchema);
