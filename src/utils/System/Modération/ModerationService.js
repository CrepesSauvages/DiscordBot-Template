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
        this.client.logs.success(
            this.client.locales.translate('moderation.service.started', this.client.config.defaultLocale)
        );
    }

    // Arrêter le service
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.client.logs.warn(
                this.client.locales.translate('moderation.service.stopped', this.client.config.defaultLocale)
            );
        }
    }

    // Vérifier les mutes expirés
    async checkMutes() {
        try {
            const expiredMutes = await MuteModel.find({
                active: true,
                expiresAt: { $lte: new Date() }
            });
            
            for (const mute of expiredMutes) {
                try {
                    // Désactiver le mute dans la base de données d'abord
                    mute.active = false;
                    await mute.save();
                    
                    // Ensuite essayer de gérer le unmute Discord
                    const guild = await this.client.guilds.fetch(mute.guildId);
                    if (guild) {
                        await this.handleExpiredMute(guild, mute);
                    }
                } catch (error) {
                    const locale = await this.client.locales.getGuildLocale(mute.guildId);
                    this.client.logs.error(
                        this.client.locales.translate('moderation.service.auto_unmute_error', locale, {
                            userId: mute.userId,
                            guildId: mute.guildId,
                            error: error.message
                        })
                    );
                }
            }
        } catch (error) {
            this.client.logs.error(
                this.client.locales.translate('moderation.service.check_mutes_error', this.client.config.defaultLocale, {
                    error: error.message
                })
            );
        }
    }

    // Gérer un mute expiré
    async handleExpiredMute(guild, mute) {
        const locale = await this.client.locales.getGuildLocale(guild.id);
        const translate = (key, vars = {}) => this.client.locales.translate(key, locale, vars);

        try {
            // Récupérer le membre
            const member = await guild.members.fetch(mute.userId);
            if (!member) {
                this.client.logs.warn(translate('moderation.service.member_not_found', {
                    userId: mute.userId,
                    guildId: guild.id
                }));
                return;
            }

            // Retirer le timeout Discord
            await member.timeout(null, translate('moderation.service.mute_expired_reason'));
            
            // Log dans le terminal
            this.client.logs.success(translate('moderation.service.mute_expired_success', {
                user: member.user.tag
            }));
            
            try {
                await this.client.logManager.sendLogEmbed(guild.id, {
                    color: '#00FF00',
                    title: translate('moderation.service.mute_expired_log_title'),
                    description: translate('moderation.service.mute_expired_log_description', {
                        user: member.user.tag
                    }),
                    fields: [
                        { 
                            name: translate('common.user'),
                            value: `${member.user.tag} (${member.user.id})`
                        }
                    ],
                    timestamp: new Date()
                });
            } catch (logError) {
                // Si l'envoi des logs échoue, on log juste l'erreur sans interrompre le processus
                this.client.logs.warn(translate('moderation.service.log_send_error', {
                    error: logError.message
                }));
            }
        } catch (error) {
            this.client.logs.error(translate('moderation.service.handle_expired_mute_error', {
                userId: mute.userId,
                error: error.message
            }));
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