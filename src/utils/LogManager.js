const { EmbedBuilder } = require('discord.js');
const GuildSettings = require('../utils/Schemas/GuildSettings');

class LogManager {
    constructor(client) {
        this.client = client;
    }

    async getLogChannel(guildId) {
        try {
            const guildSettings = await GuildSettings.getOrCreate(guildId);
            
            const logChannelId = guildSettings.settings.get('logChannel');
        
            if (!logChannelId) {
                return null;
            }
            
            const channel = await this.client.channels.fetch(logChannelId);
            return channel;
        } catch (error) {
            console.error(`Erreur lors de la récupération du canal de logs pour le serveur ${guildId}:`, error);
            return null;
        }
    }

    async sendLogEmbed(guildId, options) {
        const channel = await this.getLogChannel(guildId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(options.color || '#0099ff')
            .setTitle(options.title)
            .setDescription(options.description)
            .setTimestamp()
            .setFooter({ 
                text: `${channel.guild.name} | Logs`, 
                iconURL: channel.guild.iconURL() 
            });

        if (options.fields && Array.isArray(options.fields)) {
            // S'assurer que chaque field a les bonnes propriétés
            const validFields = options.fields.map(field => ({
                name: String(field.name || ''),
                value: String(field.value || ''),
                inline: Boolean(field.inline)
            }));
            embed.addFields(validFields);
        }

        if (options.thumbnail) {
            embed.setThumbnail(options.thumbnail);
        }

        return channel.send({ embeds: [embed] });
    }

    // Logs de modération
    async logModAction(guildId, options) {
        const embed = {
            title: '📜 Action de Modération',
            color: '#ff0000',
            fields: [
                { name: 'Modérateur', value: options.moderator, inline: true },
                { name: 'Action', value: options.action, inline: true },
                { name: 'Utilisateur', value: options.target, inline: true },
                { name: 'Raison', value: options.reason || 'Aucune raison fournie' }
            ],
            thumbnail: options.targetAvatar
        };
        
        return this.sendLogEmbed(guildId, embed);
    }

    /* 
    // Exemple d'utilisation
    await client.logManager.logModAction(interaction.guild.id, {
        moderator: interaction.user.tag,
        action: 'Ban',
        target: `${target.user.tag} (${target.user.id})`,
        reason: reason,
        targetAvatar: target.user.displayAvatarURL()
    }); */

    // Logs de messages
    async logMessageDelete(message) {
        if (!message.guild) return;

        const embed = {
            title: '🗑️ Message Supprimé',
            color: '#ff6b6b',
            description: message.content || 'Contenu non disponible',
            fields: [
                { name: 'Auteur', value: message.author?.tag || 'Inconnu', inline: true },
                { name: 'Canal', value: `<#${message.channel.id}>`, inline: true },
                { name: 'ID du Message', value: message.id, inline: true }
            ],
            thumbnail: message.author?.displayAvatarURL()
        };

        return this.sendLogEmbed(message.guild.id, embed);
    }

    // Logs de membres
    async logMemberUpdate(oldMember, newMember) {
        const changes = [];
        
        if (oldMember.nickname !== newMember.nickname) {
            changes.push(`**Pseudo:** ${oldMember.nickname || 'Aucun'} → ${newMember.nickname || 'Aucun'}`);
        }

        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
            const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

            if (addedRoles.size > 0) {
                changes.push(`**Rôles ajoutés:** ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
            }
            if (removedRoles.size > 0) {
                changes.push(`**Rôles retirés:** ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
            }
        }

        if (changes.length > 0) {
            const embed = {
                title: '👤 Membre Mis à Jour',
                color: '#ffd93d',
                description: changes.join('\n'),
                fields: [
                    { name: 'Membre', value: `<@${newMember.id}>`, inline: true },
                    { name: 'ID', value: newMember.id, inline: true }
                ],
                thumbnail: newMember.user.displayAvatarURL()
            };

            return this.sendLogEmbed(newMember.guild.id, embed);
        }
    }

    // Logs de salon
    async logChannelUpdate(oldChannel, newChannel) {
        const changes = [];

        if (oldChannel.name !== newChannel.name) {
            changes.push(`**Nom:** ${oldChannel.name} → ${newChannel.name}`);
        }
        if (oldChannel.topic !== newChannel.topic) {
            changes.push(`**Description:** ${oldChannel.topic || 'Aucune'} → ${newChannel.topic || 'Aucune'}`);
        }
        if (oldChannel.nsfw !== newChannel.nsfw) {
            changes.push(`**NSFW:** ${oldChannel.nsfw} → ${newChannel.nsfw}`);
        }
        if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
            changes.push(`**Slowmode:** ${oldChannel.rateLimitPerUser}s → ${newChannel.rateLimitPerUser}s`);
        }

        if (changes.length > 0) {
            const embed = {
                title: '📝 Salon Modifié',
                color: '#4CAF50',
                description: changes.join('\n'),
                fields: [
                    { name: 'Salon', value: `<#${newChannel.id}>`, inline: true },
                    { name: 'ID', value: newChannel.id, inline: true }
                ]
            };

            return this.sendLogEmbed(newChannel.guild.id, embed);
        }
    }

    // Logs de création de salon
    async logChannelCreate(channel) {
        if (!channel.guild) return;

        const embed = {
            title: '📝 Nouveau Salon Créé',
            color: '#2ecc71',
            fields: [
                { name: 'Nom', value: String(channel.name), inline: true },
                { name: 'Type', value: String(this.getChannelType(channel.type)), inline: true },
                { name: 'ID', value: String(channel.id), inline: true },
                { name: 'Catégorie', value: String(channel.parent?.name || 'Aucune'), inline: true }
            ],
            description: `Salon: <#${channel.id}>\n${channel.topic ? `**Description:** ${channel.topic}` : ''}`
        };

        return this.sendLogEmbed(channel.guild.id, embed);
    }

    // Logs de suppression de salon
    async logChannelDelete(channel) {
        if (!channel.guild) return;

        const embed = {
            title: '🗑️ Salon Supprimé',
            color: '#e74c3c',
            fields: [
                { name: 'Nom', value: String(channel.name), inline: true },
                { name: 'Type', value: String(this.getChannelType(channel.type)), inline: true },
                { name: 'ID', value: String(channel.id), inline: true },
                { name: 'Catégorie', value: String(channel.parent?.name || 'Aucune'), inline: true }
            ],
            description: channel.topic ? `**Description:** ${channel.topic}` : 'Aucune description'
        };

        return this.sendLogEmbed(channel.guild.id, embed);
    }

    // Utilitaire pour obtenir le type de salon en français
    getChannelType(type) {
        const types = {
            GUILD_TEXT: 'Textuel',
            GUILD_VOICE: 'Vocal',
            GUILD_CATEGORY: 'Catégorie',
            GUILD_NEWS: 'Annonces',
            GUILD_STAGE_VOICE: 'Scène',
            GUILD_FORUM: 'Forum',
            GUILD_DIRECTORY: 'Répertoire',
            GUILD_MEDIA: 'Média'
        };
        return types[type] || type;
    }
}

module.exports = LogManager;