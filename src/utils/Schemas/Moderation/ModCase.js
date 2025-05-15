const mongoose = require('mongoose');
const crypto = require('crypto');

// Fonction pour générer un ID unique pour les sanctions
function generateSanctionId(guildId) {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(3).toString('hex');
    return `${guildId.slice(-4)}-${timestamp}-${randomStr}`;
}

const sanctionSchema = new mongoose.Schema({
    sanctionId: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['WARN', 'MUTE', 'UNMUTE', 'BAN', 'KICK'] },
    reason: { type: String, required: true },
    proof: { type: String, default: 'Aucune preuve fournie' },
    timestamp: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    expired: { type: Boolean, default: false },
    moderatorId: { type: String, required: true },
    relatedSanctions: [{ type: String }] // Pour stocker les IDs des sanctions liées (utilisé pour UNMUTE)
});

const modCaseSchema = new mongoose.Schema({
    caseId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    sanctions: [sanctionSchema],
    totalWarns: { type: Number, default: 0 },
    totalMutes: { type: Number, default: 0 },
    totalBans: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Méthodes utilitaires
modCaseSchema.methods.isExpired = function(sanctionId) {
    const sanction = this.sanctions.id(sanctionId);
    if (!sanction || !sanction.expiresAt) return false;
    return new Date() > sanction.expiresAt;
};

// Méthodes statiques
modCaseSchema.statics.getActiveSanctions = async function(userId, guildId) {
    return this.findOne({
        userId: userId,
        guildId: guildId,
        'sanctions.expired': false,
        'sanctions.expiresAt': { $gt: new Date() }
    });
};

modCaseSchema.statics.addSanction = async function(userId, guildId, sanctionData) {
    let modCase = await this.findOne({ userId, guildId });
    if (!modCase) {
        modCase = new this({
            caseId: generateSanctionId(guildId),
            userId,
            guildId
        });
    }
    
    // Générer un ID unique pour la sanction
    sanctionData.sanctionId = generateSanctionId(guildId);
    modCase.sanctions.push(sanctionData);
    
    // Mettre à jour les compteurs
    switch(sanctionData.type) {
        case 'WARN': modCase.totalWarns++; break;
        case 'MUTE': modCase.totalMutes++; break;
        case 'UNMUTE': 
            // Rechercher la sanction MUTE correspondante et la supprimer
            const muteSanction = modCase.sanctions.find(s => s.sanctionId === sanctionData.relatedSanctions[0]);
            if (muteSanction) {
                modCase.sanctions = modCase.sanctions.filter(s => s.sanctionId !== muteSanction.sanctionId);
                modCase.totalMutes--;
            }
            break;
        case 'BAN': modCase.totalBans++; break;
    }
    
    modCase.updatedAt = new Date();
    return modCase.save();
};

modCaseSchema.statics.findSanction = async function(guildId, sanctionId) {
    return this.findOne({
        guildId: guildId,
        'sanctions.sanctionId': sanctionId
    });
};

modCaseSchema.statics.removeSanction = async function(guildId, sanctionId) {
    const modCase = await this.findOne({
        guildId: guildId,
        'sanctions.sanctionId': sanctionId
    });

    if (!modCase) return null;

    const sanction = modCase.sanctions.find(s => s.sanctionId === sanctionId);
    if (!sanction) return null;

    // Décrémenter le compteur approprié
    switch(sanction.type) {
        case 'WARN': modCase.totalWarns--; break;
        case 'MUTE': modCase.totalMutes--; break;
        case 'BAN': modCase.totalBans--; break;
    }

    // Retirer la sanction
    modCase.sanctions = modCase.sanctions.filter(s => s.sanctionId !== sanctionId);
    modCase.updatedAt = new Date();
    
    return modCase.save();
};

modCaseSchema.statics.findRecentWarns = async function(guildId, limit = 10) {
    const cases = await this.find({ guildId: guildId })
        .sort({ 'sanctions.timestamp': -1 })
        .limit(limit);

    // Aplatir et trier tous les avertissements récents
    const recentWarns = cases.reduce((acc, modCase) => {
        const warns = modCase.sanctions
            .filter(s => s.type === 'WARN')
            .map(warn => ({
                ...warn.toObject(),
                userId: modCase.userId
            }));
        return [...acc, ...warns];
    }, []);

    // Trier par date décroissante et limiter le nombre
    return recentWarns
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
};

const ModCase = mongoose.model('ModCase', modCaseSchema);

module.exports = {
    ModCase,
    generateSanctionId
};