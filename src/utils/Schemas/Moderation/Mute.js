const mongoose = require('mongoose');

const muteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number }, // en millisecondes, null si permanent
    expiresAt: { type: Date }, // null si permanent
    active: { type: Boolean, default: true }
});

// Vérifier si le mute est expiré
muteSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Obtenir les mutes actifs
muteSchema.statics.getActiveMutes = function(guildId) {
    return this.find({
        guildId,
        active: true,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    });
};

module.exports = mongoose.model('Mute', muteSchema);