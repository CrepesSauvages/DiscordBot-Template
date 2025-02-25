const { EmbedBuilder } = require('discord.js');
const MuteModel = require('../../Schemas/Moderation/Mute');
const WarnModel = require('../../Schemas/Moderation/Warn');

class ModerationService {
    constructor(client) {
        this.client = client;
        this.checkInterval = null;
    }

    // Démarrer le service
    start() {
        if (this.checkInterval) return;
        this.checkInterval = setInterval(() => this.checkMutes(), 60000); // Vérifier toutes les minutes
        this.client.logs.custom('Service de modération démarré', 0x7289DA);
    }

    // Arrêter le service
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.client.logs.custom('Service de modération arrêté', 0x7289DA);
        }
    }

    // Vérifier les mutes expirés
    async checkMutes() {
        try {
            const guilds = await this.client.guilds.fetch();
            
            for (const [guildId, guild] of guilds) {
                const expiredMutes = await MuteModel.find({
                    guildId: guildId,
                    active: true,
                    expiresAt: { $lte: new Date() }
                });
                
                for (const mute of expiredMutes) {
                    await this.handleExpiredMute(guild, mute);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des mutes:', error);
        }
    }

    // Gérer un mute expiré
    async handleExpiredMute(guild, mute) {
        try {
            const member = await guild.members.fetch(mute.userId);
            await member.timeout(null, 'Mute expiré');
            mute.active = false;
            await mute.save();
            
            // Log dans le terminal
            this.client.logs.custom(`🔊 Le mute de ${member.user.tag} a expiré`, 0x00FF00);
            
            // Créer l'embed pour les logs Discord
            const logEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔊 Mute Expiré')
                .addFields(
                    { name: 'Utilisateur', value: `${member.user.tag} (${member.user.id})` },
                    { name: 'Raison', value: 'Durée du mute expirée' }
                )
                .setTimestamp();

            // Envoyer l'embed dans le canal de logs s'il existe
            const logsChannel = guild.channels.cache.find(channel => channel.name === 'mod-logs');
            if (logsChannel) {
                await logsChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error(`Erreur lors de l'auto-unmute de ${mute.userId}:`, error);
        }
    }

    // Stats Mod
    async getModStats(guild, timeframe = '7d') {
        const stats = {
            mutes: 0,
            warns: 0,
            kicks: 0,
            bans: 0,
            mostActivemod: null
        };
    
        // Récupérer les actions de modération récentes
        const since = this.parseTimeframe(timeframe);
        
        // Compter les mutes
        stats.mutes = await MuteModel.countDocuments({
            guildId: guild.id,
            timestamp: { $gte: since }
        });

        stats.warns = await WarnModel.countDocuments({
            guildId: guild.id,
            timestamp: { $gte: since }
        })
    
        // Identifier le modérateur le plus actif
        const actions = await MuteModel.aggregate([
            { $match: { guildId: guild.id, timestamp: { $gte: since } } },
            { $group: { _id: '$moderatorId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const actions2 = await WarnModel.aggregate([
            { $match: { guildId: guild.id, timestamp: { $gte: since } } },
            { $group: { _id: '$moderatorId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
    
        if (actions.length > 0 || actions2.length > 0) {
            stats.mostActivemod = actions[0]._id;
        }
        return stats;
    }

    // Convertir une période en timestamp
    parseTimeframe(timeframe) {
        const value = parseInt(timeframe);
        const unit = timeframe.slice(-1);
        const now = new Date();

        switch (unit) {
            case 'd':
                return new Date(now - value * 24 * 60 * 60 * 1000);
            case 'h':
                return new Date(now - value * 60 * 60 * 1000);
            default:
                return new Date(now - 7 * 24 * 60 * 60 * 1000); // Par défaut 7 jours
        }
    }

    // Obtenir les statistiques basées sur le temps
    async getTimeBasedStats(guild, timeframe) {
        const since = this.parseTimeframe(timeframe);
        const interval = timeframe === '1d' ? 'hour' : 'day';
        
        const actions = await MuteModel.aggregate([
            {
                $match: {
                    guildId: guild.id,
                    timestamp: { $gte: since }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: interval === 'hour' ? '%Y-%m-%d-%H' : '%Y-%m-%d',
                            date: '$timestamp'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        // Générer les labels et données
        const labels = [];
        const data = [];
        
        if (interval === 'hour') {
            for (let i = 0; i < 24; i++) {
                const date = new Date();
                date.setHours(date.getHours() - i);
                const label = date.getHours() + 'h';
                labels.unshift(label);
                
                const action = actions.find(a => {
                    const actionDate = new Date(a._id);
                    return actionDate.getHours() === date.getHours();
                });
                
                data.unshift(action ? action.count : 0);
            }
        } else {
            for (let i = 0; i < parseInt(timeframe); i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const label = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                labels.unshift(label);
                
                const action = actions.find(a => a._id === date.toISOString().split('T')[0]);
                data.unshift(action ? action.count : 0);
            }
        }

        return { labels, data };
    }
}

module.exports = ModerationService;