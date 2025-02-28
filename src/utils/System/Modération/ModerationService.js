const ModCase = require('../../Schemas/Moderation/ModCase');

class ModerationService {
    constructor(client) {
        this.client = client;
        this.checkInterval = 60000; // Vérifier toutes les minutes
    }

    async start() {
        this.checkExpiredSanctions();
        setInterval(() => this.checkExpiredSanctions(), this.checkInterval);
    }

    async checkExpiredSanctions() {
        try {
            const now = new Date();
            
            // Trouver tous les cas avec des sanctions non expirées qui devraient l'être
            const cases = await ModCase.find({
                'sanctions.expired': false,
                'sanctions.expiresAt': { $lte: now }
            });

            for (const modCase of cases) {
                const expiredSanctions = modCase.sanctions.filter(s => 
                    !s.expired && s.expiresAt && s.expiresAt <= now
                );

                for (const sanction of expiredSanctions) {
                    sanction.expired = true;

                    // Traitement spécifique selon le type de sanction
                    if (sanction.type === 'MUTE') {
                        const guild = await this.client.guilds.fetch(modCase.guildId).catch(() => null);
                        if (guild) {
                            const member = await guild.members.fetch(modCase.userId).catch(() => null);
                            if (member && member.isCommunicationDisabled()) {
                                await member.timeout(null, 'Expiration automatique du mute').catch(console.error);
                            }
                        }
                    }

                    // Log l'expiration
                    const guild = await this.client.guilds.fetch(modCase.guildId).catch(() => null);
                    if (guild) {
                        await this.client.logManager.sendLogEmbed(guild.id, {
                            color: '#FFA500',
                            title: `🕒 ${sanction.type} Expiré`,
                            description: `La sanction de <@${modCase.userId}> a expiré`,
                            fields: [
                                { name: 'Type', value: sanction.type },
                                { name: 'ID de Sanction', value: sanction.sanctionId },
                                { name: 'Raison Originale', value: sanction.reason }
                            ]
                        });
                    }
                }

                await modCase.save();
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des sanctions expirées:', error);
        }
    }

    // Méthode pour vérifier si un utilisateur est actuellement sanctionné
    async getActiveSanctions(userId, guildId) {
        try {
            const modCase = await ModCase.findOne({ userId, guildId });
            if (!modCase) return [];

            return modCase.sanctions.filter(s => 
                !s.expired && (!s.expiresAt || s.expiresAt > new Date())
            );
        } catch (error) {
            console.error('Erreur lors de la récupération des sanctions actives:', error);
            return [];
        }
    }

    // Méthode pour obtenir les statistiques de modération
    async getModStats(guildId) {
        try {
            const cases = await ModCase.find({ guildId });
            
            const stats = {
                totalCases: cases.length,
                totalSanctions: 0,
                activeSanctions: 0,
                byType: {
                    WARN: 0,
                    MUTE: 0,
                    UNMUTE: 0,
                    BAN: 0,
                    KICK: 0
                },
                moderators: {},
                recentActions: []
            };

            const now = new Date();
            const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

            for (const modCase of cases) {
                stats.totalSanctions += modCase.sanctions.length;
                
                for (const sanction of modCase.sanctions) {
                    // Compter par type
                    stats.byType[sanction.type] = (stats.byType[sanction.type] || 0) + 1;
                    
                    // Compter les sanctions actives (sauf UNMUTE qui n'est pas une sanction active)
                    if (sanction.type !== 'UNMUTE' && !sanction.expired && (!sanction.expiresAt || sanction.expiresAt > now)) {
                        stats.activeSanctions++;
                    }

                    // Compter les actions par modérateur
                    if (!stats.moderators[sanction.moderatorId]) {
                        stats.moderators[sanction.moderatorId] = {
                            total: 0,
                            byType: {}
                        };
                    }
                    stats.moderators[sanction.moderatorId].total++;
                    stats.moderators[sanction.moderatorId].byType[sanction.type] = 
                        (stats.moderators[sanction.moderatorId].byType[sanction.type] || 0) + 1;

                    // Ajouter aux actions récentes si dans les 30 derniers jours
                    if (sanction.timestamp > thirtyDaysAgo) {
                        stats.recentActions.push({
                            type: sanction.type,
                            timestamp: sanction.timestamp,
                            moderatorId: sanction.moderatorId,
                            userId: modCase.userId
                        });
                    }
                }
            }

            // Trier les actions récentes par date
            stats.recentActions.sort((a, b) => b.timestamp - a.timestamp);

            // Trouver le modérateur le plus actif
            stats.topModerator = Object.entries(stats.moderators)
                .sort(([,a], [,b]) => b.total - a.total)[0]?.[0] || null;

            return stats;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return null;
        }
    }
}

module.exports = ModerationService;