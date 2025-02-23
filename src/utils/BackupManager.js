const { Guild, Collection } = require('discord.js');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Schéma MongoDB pour les sauvegardes
const backupSchema = new mongoose.Schema({
    id: String,
    guildId: String,
    createdAt: Date,
    includeMessages: Boolean,
    data: {
        name: String,
        icon: String,
        banner: String,
        verificationLevel: Number,
        explicitContentFilter: Number,
        defaultMessageNotifications: Number,
        roles: Array,
        channels: Array,
        emojis: Array,
        messages: Array,
        settings: Object
    }
});

const BackupModel = mongoose.model('Backup', backupSchema);

class BackupManager {
    constructor(client) {
        this.client = client;
    }

    async createBackup(guild, includeMessages = false) {
        const backup = {
            id: crypto.randomBytes(4).toString('hex'),
            guildId: guild.id,
            createdAt: new Date(),
            includeMessages,
            data: {
                name: guild.name,
                icon: guild.icon,
                banner: guild.banner,
                verificationLevel: guild.verificationLevel,
                explicitContentFilter: guild.explicitContentFilter,
                defaultMessageNotifications: guild.defaultMessageNotifications,
                roles: await this._backupRoles(guild),
                channels: await this._backupChannels(guild, includeMessages),
                emojis: await this._backupEmojis(guild),
                settings: await this._backupSettings(guild)
            }
        };

        await BackupModel.create(backup);
        return backup;
    }

    async loadBackup(guild, backupId) {
        const backup = await BackupModel.findOne({ id: backupId, guildId: guild.id });
        if (!backup) throw new Error('Sauvegarde non trouvée');

        // Restauration des paramètres du serveur
        await guild.setName(backup.data.name);
        if (backup.data.icon) await guild.setIcon(backup.data.icon);
        if (backup.data.banner) await guild.setBanner(backup.data.banner);

        // Supprimer les rôles existants (sauf @everyone)
        await Promise.all(guild.roles.cache
            .filter(role => role.id !== guild.id)
            .map(role => role.delete().catch(() => null))
        );

        // Restaurer les rôles
        for (const roleData of backup.data.roles) {
            if (roleData.id !== guild.id) {
                await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: roleData.permissions,
                    mentionable: roleData.mentionable
                }).catch(() => null);
            }
        }

        // Supprimer les salons existants
        await Promise.all(guild.channels.cache.map(channel => channel.delete().catch(() => null)));

        // Restaurer les salons
        for (const channelData of backup.data.channels) {
            const channel = await guild.channels.create({
                name: channelData.name,
                type: channelData.type,
                parent: channelData.parentId,
                topic: channelData.topic,
                nsfw: channelData.nsfw,
                bitrate: channelData.bitrate,
                userLimit: channelData.userLimit,
                rateLimitPerUser: channelData.rateLimitPerUser,
                position: channelData.position
            }).catch(() => null);

            // Restaurer les messages si nécessaire
            if (backup.includeMessages && channel && channelData.messages) {
                for (const msgData of channelData.messages) {
                    try {
                        const messageOptions = {
                            content: msgData.content || null,
                            embeds: msgData.embeds || []
                        };

                        // Gérer les pièces jointes
                        if (msgData.attachments && msgData.attachments.length > 0) {
                            messageOptions.files = msgData.attachments.map(att => ({
                                attachment: att.url,
                                name: att.name,
                                description: att.description
                            }));
                        }

                        await channel.send(messageOptions);
                    } catch (error) {
                        console.warn(`Impossible de restaurer un message: ${error.message}`);
                        continue;
                    }
                }
            }
        }

        // Restaurer les paramètres
        if (backup.data.settings) {
            await this._restoreSettings(guild, backup.data.settings);
        }
    }

    async listBackups(guildId) {
        return await BackupModel.find({ guildId }).select('id createdAt includeMessages');
    }

    async deleteBackup(guildId, backupId) {
        const result = await BackupModel.deleteOne({ id: backupId, guildId });
        if (result.deletedCount === 0) throw new Error('Sauvegarde non trouvée');
    }

    async _backupRoles(guild) {
        return guild.roles.cache.map(role => ({
            id: role.id,
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: role.permissions.bitfield,
            mentionable: role.mentionable,
            position: role.position
        }));
    }

    async _backupChannels(guild, includeMessages) {
        const channels = [];

        for (const channel of guild.channels.cache.values()) {
            const channelData = {
                name: channel.name,
                type: channel.type,
                parentId: channel.parentId,
                topic: channel.topic,
                nsfw: channel.nsfw,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                rateLimitPerUser: channel.rateLimitPerUser,
                position: channel.position
            };

            if (includeMessages && channel.type === 0) { // Text channel
                const messages = await this._backupMessages(channel);
                channelData.messages = messages;
            }

            channels.push(channelData);
        }

        return channels;
    }

    async _backupMessages(channel, limit = 100) {
        const messages = [];
        let lastId;

        while (messages.length < limit) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;

            const fetchedMessages = await channel.messages.fetch(options);
            if (fetchedMessages.size === 0) break;

            for (const [, message] of fetchedMessages) {
                if (!message.system) {
                    messages.push({
                        content: message.content,
                        embeds: message.embeds,
                        attachments: message.attachments.map(att => ({
                            url: att.url,
                            name: att.name,
                            description: att.description
                        })),
                        pinned: message.pinned
                    });
                }
            }

            lastId = fetchedMessages.last().id;
            if (messages.length >= limit) break;
        }

        return messages;
    }

    async _backupEmojis(guild) {
        return guild.emojis.cache.map(emoji => ({
            name: emoji.name,
            url: emoji.url
        }));
    }

    async _backupSettings(guild) {
        // Récupérer les paramètres personnalisés du serveur depuis votre base de données
        // Exemple : préfixe personnalisé, configurations automatiques, etc.
        return {
            // Ajoutez ici les paramètres spécifiques à votre bot
        };
    }

    async _restoreSettings(guild, settings) {
        // Restaurer les paramètres personnalisés du serveur
        // Implémentez selon vos besoins
    }
}

module.exports = BackupManager;