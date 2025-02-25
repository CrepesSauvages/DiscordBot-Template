const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    warnId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    proof: { type: String, default: 'Aucune preuve fournie' },
    timestamp: { type: Date, default: Date.now },
    guildId: { type: String, required: true },
    expiresAt: { type: Date, default: null },
    expired: { type: Boolean, default: false }
});

// Méthode pour vérifier si le warn est expiré
warnSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Méthode statique pour obtenir les warns actifs d'un utilisateur
warnSchema.statics.getActiveWarns = async function(userId, guildId) {
    return this.find({
        userId: userId,
        guildId: guildId,
        expired: false,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    });
};

// Méthode statique pour obtenir les warns expirés d'un utilisateur
warnSchema.statics.getExpiredWarns = async function(userId, guildId) {
    return this.find({
        userId: userId,
        guildId: guildId,
        $or: [
            { expired: true },
            { expiresAt: { $lte: new Date() } }
        ]
    });
};

module.exports = mongoose.model('Warn', warnSchema);
