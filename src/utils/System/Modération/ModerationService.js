const { EmbedBuilder } = require('discord.js');
const ModCase = require('../../Schemas/Moderation/ModCase');
const AutomodConfig = require('../../Schemas/Settings/AutomodConfig');

class ModerationService {
    constructor(client) {
        this.client = client;
        this.checkInterval = setInterval(() => this.checkExpiredSanctions(), 5 * 60 * 1000); // Vérifier toutes les 5 minutes
    }

    // Démarrer le service
    start() {
        if (this.checkInterval) return;
        this.checkInterval = setInterval(() => this.checkExpiredSanctions(), 60000); // Vérifier toutes les minutes
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

    // Méthode pour obtenir toutes les sanctions d'un utilisateur
    async getUserSanctions(userId, guildId) {
        const modCases = await ModCase.find({ userId, guildId });
        
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

        return {
            modCases,
            activeWarns,
            activeMutes,
            total: modCases.reduce((acc, mc) => acc + mc.sanction.length, 0)
        };
    }

    // Méthode pour vérifier les sanctions expirées
    async checkExpiredSanctions() {
        try {
            await Promise.all([
                this.checkExpiredMutes(),
                this.checkExpiredWarns()
            ]);
        } catch (error) {
            this.client.logs.error('Erreur lors de la vérification des sanctions expirées:', error);
        }
    }

    // Méthode pour appliquer une sanction automatique
    async applyAutoModeration(interaction, user, sanctions) {
        const config = await this.getAutomodConfig(interaction.guild.id);
        
        if (!config.enabled) return;
        
        const totalActive = sanctions.activeWarns.length + sanctions.activeMutes.length;

        if (config.ban.enabled && totalActive >= config.ban.threshold) {
            await this.banUser(interaction, user, 'Sanctions automatiques');
            await this.logSanction(interaction, 'AUTO_BAN', user, `Seuil atteint: ${totalActive}/${config.ban.threshold} sanctions`);
        } 
        else if (config.kick.enabled && totalActive >= config.kick.threshold) {
            await this.kickUser(interaction, user, 'Sanctions automatiques');
            await this.logSanction(interaction, 'AUTO_KICK', user, `Seuil atteint: ${totalActive}/${config.kick.threshold} sanctions`);
        } 
        else if (config.mute.enabled && totalActive >= config.mute.threshold) {
            await this.muteUser(interaction, user, 'Sanctions automatiques', config.mute.duration);
            await this.logSanction(interaction, 'AUTO_MUTE', user, `Seuil atteint: ${totalActive}/${config.mute.threshold} sanctions`);
        }
    }

    // Méthodes utilitaires pour les sanctions
    async kickUser(interaction, user, reason) {
        try {
            await interaction.guild.members.kick(user.id, reason);
            await this.logSanction(interaction, 'KICK', user, reason);
        } catch (error) {
            this.client.logs.error('Erreur lors du kick:', error);
        }
    }

    async muteUser(interaction, user, reason, duration) {
        const durationMs = this.parseDuration(duration);
        const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

        // Vérifier si l'utilisateur est déjà mute
        const existingMute = await ModCase.findOne({
            guildId: interaction.guild.id,
            userId: user.id,
            'sanction.type': 'MUTE',
            'sanction.active': true
        });

        if (existingMute) {
            throw new Error('Cet utilisateur est déjà mute');
        }

        // Appliquer le timeout Discord d'abord
        const member = await interaction.guild.members.fetch(user.id);
        if (durationMs && durationMs <= 2419200000) { // Max 28 jours pour Discord
            await member.timeout(durationMs, reason);
        }

        // Créer le mute dans ModCase
        const modCase = await ModCase.findOneAndUpdate(
            { guildId: interaction.guild.id, userId: user.id },
            {
                $setOnInsert: {
                    nombre: await ModCase.getNextNumber(interaction.guild.id, user.id)
                },
                $push: {
                    sanction: {
                        type: 'MUTE',
                        moderatorId: interaction.user.id,
                        reason,
                        duration: durationMs,
                        expiresAt,
                        active: true
                    }
                }
            },
            { upsert: true, new: true }
        );

        await this.logSanction(interaction, 'MUTE', user, reason, duration);
        return modCase;
    }

    async unmuteUser(interaction, user, reason) {
        // Trouver et mettre à jour le mute dans ModCase
        const modCase = await ModCase.findOneAndUpdate(
            {
                guildId: interaction.guild.id,
                userId: user.id,
                'sanction.type': 'MUTE',
                'sanction.active': true
            },
            {
                $set: {
                    'sanction.$.active': false,
                    'sanction.$.unmutedBy': interaction.user.id,
                    'sanction.$.unmutedAt': new Date(),
                    'sanction.$.unmutedReason': reason
                }
            }
        );

        if (!modCase) {
            throw new Error('Cet utilisateur n\'est pas mute');
        }

        // Retirer le timeout Discord
        const member = await interaction.guild.members.fetch(user.id);
        await member.timeout(null, reason);

        await this.logSanction(interaction, 'UNMUTE', user, reason);
        return modCase;
    }

    // Méthode pour logger les sanctions
    async logSanction(interaction, type, user, reason, duration = null) {
        const colors = {
            WARN: '#FFD700',
            MUTE: '#FFA500',
            UNMUTE: '#00FF00',
            KICK: '#FF4500',
            BAN: '#FF0000',
            AUTO_MUTE: '#FFFF00',
            AUTO_KICK: '#FFA500',
            AUTO_BAN: '#FF0000'
        };

        const emojis = {
            WARN: '⚠️',
            MUTE: '🔇',
            UNMUTE: '🔊',
            KICK: '👢',
            BAN: '🔨',
            AUTO_MUTE: '🤖🔇',
            AUTO_KICK: '🤖👢',
            AUTO_BAN: '🤖🔨'
        };

        const embed = {
            color: parseInt(colors[type].replace('#', ''), 16),
            title: `${emojis[type]} Nouvelle Sanction`,
            description: `Une sanction a été appliquée à ${user.toString()}`,
            fields: [
                { name: 'Type', value: type, inline: true },
                { name: 'Modérateur', value: interaction.user.toString(), inline: true },
                { name: 'Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Raison', value: reason }
            ],
            thumbnail: { url: user.displayAvatarURL() },
            timestamp: new Date()
        };

        if (duration) {
            embed.fields.push({ 
                name: 'Durée', 
                value: this.formatDuration(this.parseDuration(duration)),
                inline: true 
            });
        }

        await this.client.logManager.sendLogEmbed(interaction.guild.id, embed);
    }

    formatDuration(ms) {
        if (!ms) return 'Permanent';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        const parts = [];
        if (days > 0) parts.push(`${days}j`);
        if (hours % 24 > 0) parts.push(`${hours % 24}h`);
        if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
        if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
        
        return parts.join(' ') || '0s';
    }

    // Vérifier les mutes expirés
    async checkExpiredMutes() {
        const expiredMutes = await ModCase.find({
            'sanction': {
                $elemMatch: {
                    type: 'MUTE',
                    active: true,
                    expiresAt: { $lte: new Date() }
                }
            }
        });

        for (const modCase of expiredMutes) {
            try {
                const guild = await this.client.guilds.fetch(modCase.guildId);
                if (guild) {
                    const member = await guild.members.fetch(modCase.userId);
                    if (member) {
                        await member.timeout(null, 'Mute expiré');
                        
                        // Mettre à jour uniquement la sanction expirée
                        await ModCase.updateOne(
                            { 
                                _id: modCase._id,
                                'sanction': {
                                    $elemMatch: {
                                        type: 'MUTE',
                                        active: true,
                                        expiresAt: { $lte: new Date() }
                                    }
                                }
                            },
                            {
                                $set: {
                                    'sanction.$.active': false,
                                    'sanction.$.unmutedBy': this.client.user.id,
                                    'sanction.$.unmutedAt': new Date(),
                                    'sanction.$.unmutedReason': 'Mute expiré'
                                }
                            }
                        );
                    }
                }
            } catch (error) {
                this.client.logs.error(`Erreur lors du unmute automatique: ${error.message}`);
            }
        }
    }

    // Stats Mod
    async getModStats(guild, timeframe) {
        const days = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        const modCases = await ModCase.find({
            guildId: guild.id,
            'sanction.createdAt': { $gte: startDate }
        });

        const stats = {
            mutes: 0,
            warns: 0,
            kicks: 0,
            bans: 0,
            total: 0,
            moderatorActions: {}
        };

        modCases.forEach(mc => {
            mc.sanction.forEach(s => {
                if (s.createdAt >= startDate) {
                    stats.total++;
                    switch (s.type) {
                        case 'MUTE': stats.mutes++; break;
                        case 'WARN': stats.warns++; break;
                        case 'KICK': stats.kicks++; break;
                        case 'BAN': stats.bans++; break;
                    }
                    
                    stats.moderatorActions[s.moderatorId] = (stats.moderatorActions[s.moderatorId] || 0) + 1;
                }
            });
        });

        if (Object.keys(stats.moderatorActions).length > 0) {
            const [mostActivemod, actions] = Object.entries(stats.moderatorActions)
                .reduce((max, [mod, count]) => count > max[1] ? [mod, count] : max, ['', 0]);
            
            stats.mostActivemod = mostActivemod;
            stats.mostActivemodActions = actions;
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
        const days = parseInt(timeframe.replace('d', ''));
        const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));

        const modCases = await ModCase.find({
            guildId: guild.id,
            'sanction.createdAt': { $gte: startDate }
        });

        const timeStats = {
            labels: [],
            muteData: [],
            warnData: [],
            kickData: [],
            banData: []
        };

        // Créer les labels pour chaque jour/heure
        for (let i = 0; i < (days === 1 ? 24 : days); i++) {
            const date = new Date(startDate.getTime() + (i * (days === 1 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)));
            timeStats.labels.push(days === 1 ? 
                `${date.getHours()}h` : 
                `${date.getDate()}/${date.getMonth() + 1}`);
            timeStats.muteData[i] = 0;
            timeStats.warnData[i] = 0;
            timeStats.kickData[i] = 0;
            timeStats.banData[i] = 0;
        }

        modCases.forEach(mc => {
            mc.sanction.forEach(s => {
                if (s.createdAt >= startDate) {
                    const timeDiff = s.createdAt - startDate;
                    const index = Math.floor(timeDiff / (days === 1 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
                    
                    if (index >= 0 && index < timeStats.labels.length) {
                        switch (s.type) {
                            case 'MUTE': timeStats.muteData[index]++; break;
                            case 'WARN': timeStats.warnData[index]++; break;
                            case 'KICK': timeStats.kickData[index]++; break;
                            case 'BAN': timeStats.banData[index]++; break;
                        }
                    }
                }
            });
        });

        return timeStats;
    }

    async addWarn(interaction, user, { reason, proof, duration }) {
        const durationMs = this.parseDuration(duration);
        const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;

        const modCase = await ModCase.findOneAndUpdate(
            { guildId: interaction.guild.id, userId: user.id },
            {
                $setOnInsert: {
                    nombre: await ModCase.getNextNumber(interaction.guild.id, user.id)
                },
                $push: {
                    sanction: {
                        type: 'WARN',
                        moderatorId: interaction.user.id,
                        reason,
                        proof: proof || 'Aucune preuve fournie',
                        duration: durationMs,
                        expiresAt,
                        active: true
                    }
                }
            },
            { upsert: true, new: true }
        );

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⚠️ Nouvel Avertissement')
            .setDescription(`Un avertissement a été ajouté pour ${user.toString()}`)
            .addFields(
                { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                { name: 'Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Raison', value: reason },
                { name: 'Preuve', value: proof || 'Aucune preuve fournie' },
                { name: 'Expire', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Jamais' }
            )
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await this.logSanction(interaction, 'WARN', user, reason, duration);
        return modCase;
    }

    async removeWarn(interaction, warnId) {
        const modCase = await ModCase.findOneAndUpdate(
            {
                guildId: interaction.guild.id,
                'sanction.type': 'WARN',
                'sanction._id': warnId
            },
            {
                $set: {
                    'sanction.$.active': false,
                    'sanction.$.removedBy': interaction.user.id,
                    'sanction.$.removedAt': new Date()
                }
            }
        );

        if (!modCase) {
            throw new Error('Avertissement non trouvé');
        }

        await this.logSanction(interaction, 'WARN_REMOVE', user, 'Avertissement retiré');
        return modCase;
    }

    parseDuration(duration) {
        if (!duration) return null;
        
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'j': 24 * 60 * 60 * 1000
        };
        
        const match = duration.match(/^(\d+)([smhdj])$/);
        if (!match) return null;
        
        const [, amount, unit] = match;
        return parseInt(amount) * units[unit];
    }

    async banUser(interaction, user, reason) {
        try {
            await interaction.guild.members.ban(user.id, { reason });
            await this.logSanction(interaction, 'BAN', user, reason);
        } catch (error) {
            this.client.logs.error('Erreur lors du ban:', error);
        }
    }

    async getAutomodConfig(guildId) {
        let config = await AutomodConfig.findOne({ guildId });
        
        if (!config) {
            config = await AutomodConfig.create({ guildId });
        }
        
        return config;
    }

    async updateAutomodConfig(guildId, updates) {
        return await AutomodConfig.findOneAndUpdate(
            { guildId },
            updates,
            { new: true, upsert: true }
        );
    }

    async checkExpiredWarns() {
        const expiredWarns = await ModCase.find({
            'sanction': {
                $elemMatch: {
                    type: 'WARN',
                    active: true,
                    expiresAt: { $lte: new Date() }
                }
            }
        });

        for (const modCase of expiredWarns) {
            try {
                await ModCase.updateOne(
                    { 
                        _id: modCase._id,
                        'sanction': {
                            $elemMatch: {
                                type: 'WARN',
                                active: true,
                                expiresAt: { $lte: new Date() }
                            }
                        }
                    },
                    {
                        $set: {
                            'sanction.$.active': false,
                            'sanction.$.expiredAt': new Date()
                        }
                    }
                );
            } catch (error) {
                this.client.logs.error(`Erreur lors de l'expiration d'un warn: ${error.message}`);
            }
        }
    }

    // Méthode pour nettoyer les ressources lors de l'arrêt
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

module.exports = ModerationService;