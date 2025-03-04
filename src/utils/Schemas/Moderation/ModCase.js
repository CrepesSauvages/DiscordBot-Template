const mongoose = require('mongoose');

const ModCaseSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    nombre: { type: Number, required: true },
    sanction: [{
        type: { 
            type: String, 
            enum: ['WARN', 'MUTE', 'BAN', 'KICK'],
            required: true 
        },
        sanctionId: { type: String, required: true },
        moderatorId: { type: String, required: true },
        reason: { type: String, required: true },
        proof: { type: String, default: 'Aucune preuve fournie' },
        duration: { type: Number },
        expiresAt: { type: Date },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        // Champs pour le suivi des actions de modération
        removedBy: { type: String },
        removedAt: { type: Date },
        unmutedBy: { type: String },
        unmutedAt: { type: Date },
        unmutedReason: { type: String },
        expiredAt: { type: Date }
    }],
    createdAt: { type: Date, default: Date.now }
});

// Méthode pour obtenir le prochain numéro de cas
ModCaseSchema.statics.getNextNumber = async function(guildId, userId) {
    const doc = await this.findOne({ guildId, userId }).sort({ nombre: -1 });
    return doc ? doc.nombre + 1 : 1;
};

// Méthode pour obtenir les sanctions actives
ModCaseSchema.statics.getActiveSanctions = function(userId, guildId, type) {
    return this.find({
        userId,
        guildId,
        'sanction.type': type,
        'sanction.active': true,
        $or: [
            { 'sanction.expiresAt': null },
            { 'sanction.expiresAt': { $gt: new Date() } }
        ]
    });
};

// Méthode pour obtenir toutes les sanctions d'un utilisateur
ModCaseSchema.statics.getUserSanctions = async function(userId, guildId) {
    const modCases = await this.find({ userId, guildId });
    
    const activeWarns = modCases.flatMap(mc => 
        mc.sanction.filter(s => 
            s.type === 'WARN' && 
            s.active && 
            (!s.expiresAt || s.expiresAt > new Date())
        )
    );
    
    const activeMutes = modCases.flatMap(mc => 
        mc.sanction.filter(s => 
            s.type === 'MUTE' && 
            s.active && 
            (!s.expiresAt || s.expiresAt > new Date())
        )
    );

    const activeBans = modCases.flatMap(mc => 
        mc.sanction.filter(s => 
            s.type === 'BAN' && 
            s.active && 
            (!s.expiresAt || s.expiresAt > new Date())
        )
    );

    const activeKicks = modCases.flatMap(mc => 
        mc.sanction.filter(s => 
            s.type === 'KICK' && 
            s.active
        )
    );

    return {
        modCases,
        activeWarns,
        activeMutes,
        activeBans,
        activeKicks,
        total: modCases.reduce((acc, mc) => acc + mc.sanction.length, 0)
    };
};

// Méthode pour générer un ID unique pour une sanction
ModCaseSchema.statics.generateSanctionId = function() {
    return mongoose.Types.ObjectId().toString();
};

module.exports = mongoose.model('ModCase', ModCaseSchema);