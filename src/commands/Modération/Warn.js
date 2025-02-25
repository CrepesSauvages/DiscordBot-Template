const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const WarnModel = require('../../utils/Schemas/Moderation/Warn.js');
const config = require('../../config/main.json');

module.exports = {
    cooldown: 3,
    userPerms: ['ModerateMembers'],
    clientPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Système de gestion des avertissements')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajouter un avertissement')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('L\'utilisateur à avertir')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Raison de l\'avertissement')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                    .setDescription('Durée du warn (ex: 7d, 24h, 30m)')
                    .setRequired(false))
                .addStringOption(option =>
                    option.setName('proof')
                        .setDescription('URL de la preuve (optionnel)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retirer un avertissement')
                .addStringOption(option =>
                    option.setName('warnid')
                        .setDescription('ID de l\'avertissement')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Voir les avertissements d\'un utilisateur')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à vérifier')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('expired')
                .setDescription('Voir les avertissements expirés')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('L\'utilisateur à vérifier')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('recent')
                .setDescription('Voir les avertissements récents')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                await handleAddWarn(interaction, interaction.client);
                break;
            case 'remove':
                await handleRemoveWarn(interaction, interaction.client);
                break;
            case 'list':
                await handleListWarn(interaction);
                break;
            case 'expired':
                await handleExpiredWarns(interaction);
                break;
            case 'recent':
                await handleRecentWarns(interaction);
                break;
        }
    }
};

// Fonction pour convertir la durée en millisecondes
function parseDuration(duration) {
    if (!duration) return null;
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'm': return value * 60 * 1000;
        default: return null;
    }
}

// Fonction pour appliquer les sanctions automatiques
async function applyAutoModeration(interaction, user, activeWarns) {
    const warnCount = activeWarns.length;
    const automodConfig = config.moderation.automod.warns;
    
    if (warnCount >= automodConfig.ban.threshold) {
        try {
            await interaction.guild.members.ban(user.id, { reason: `Sanctions automatiques: ${warnCount} avertissements` });
            await interaction.client.logManager.sendLogEmbed(interaction.guild.id, {
                color: '#FF0000',
                title: '🔨 Ban Automatique',
                description: `${user.tag} a été banni automatiquement`,
                fields: [
                    { name: 'Raison', value: `${warnCount} avertissements atteints` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors du ban automatique:', error);
        }
    } else if (warnCount >= automodConfig.kick.threshold) {
        try {
            await interaction.guild.members.kick(user.id, `Sanctions automatiques: ${warnCount} avertissements`);
            await interaction.client.logManager.sendLogEmbed(interaction.guild.id, {
                color: '#FFA500',
                title: '👢 Kick Automatique',
                description: `${user.tag} a été expulsé automatiquement`,
                fields: [
                    { name: 'Raison', value: `${warnCount} avertissements atteints` }
                ]
            });
        } catch (error) {
            console.error('Erreur lors du kick automatique:', error);
        }
    } else if (warnCount >= automodConfig.mute.threshold) {
        try {
            const member = await interaction.guild.members.fetch(user.id);
            const muteDuration = parseDuration(automodConfig.mute.duration) || 24 * 60 * 60 * 1000; // 24h par défaut
            await member.timeout(muteDuration, `Sanctions automatiques: ${warnCount} avertissements`);
            await interaction.client.logManager.sendLogEmbed(interaction.guild.id, {
                color: '#FFFF00',
                title: '🔇 Mute Automatique',
                description: `${user.tag} a été mute automatiquement`,
                fields: [
                    { name: 'Raison', value: `${warnCount} avertissements atteints` },
                    { name: 'Durée', value: automodConfig.mute.duration }
                ]
            });
        } catch (error) {
            console.error('Erreur lors du mute automatique:', error);
        }
    }
}

async function handleAddWarn(interaction, client) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const proof = interaction.options.getString('proof');
    const duration = interaction.options.getString('duration');
    
    // Convertir la durée
    const durationMs = parseDuration(duration);
    const expiresAt = durationMs ? new Date(Date.now() + durationMs) : null;
    
    const warnId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const warn = new WarnModel({
        warnId: warnId,
        userId: user.id,
        moderatorId: interaction.user.id,
        reason: reason,
        proof: proof || 'Aucune preuve fournie',
        guildId: interaction.guild.id,
        expiresAt: expiresAt
    });

    await warn.save();

    // Obtenir les warns actifs
    const activeWarns = await WarnModel.getActiveWarns(user.id, interaction.guild.id);
    
    // Appliquer les sanctions automatiques
    await applyAutoModeration(interaction, user, activeWarns);

    // Log l'action
    await client.logManager.sendLogEmbed(interaction.guild.id, {
        color: '#FF0000',
        title: '⚠️ Nouvel Avertissement',
        description: `Un avertissement a été ajouté pour ${user.toString()}`,
        fields: [
            { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
            { name: 'Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'ID de l\'avertissement', value: warnId, inline: true },
            { name: 'Raison', value: reason },
            { name: 'Preuve', value: proof || 'Aucune preuve fournie' },
            { name: 'Expire', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Jamais' }
        ],
        thumbnail: user.displayAvatarURL()
    });

    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Nouvel Avertissement')
        .setDescription(`Un avertissement a été ajouté pour ${user.toString()}`)
        .addFields(
            { name: 'ID de l\'avertissement', value: warnId },
            { name: 'Raison', value: reason },
            { name: 'Preuve', value: proof || 'Aucune preuve fournie' },
            { name: 'Modérateur', value: interaction.user.toString() },
            { name: 'Expire', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Jamais' }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleRemoveWarn(interaction, client) {
    const warnId = interaction.options.getString('warnid');
    
    const warn = await WarnModel.findOneAndDelete({ 
        warnId: warnId, 
        guildId: interaction.guild.id 
    });
    
    if (!warn) {
        return interaction.reply({
            content: '❌ Avertissement non trouvé.',
            ephemeral: true
        });
    }

    // Log l'action
    await client.logManager.sendLogEmbed(interaction.guild.id, {
        color: '#00FF00',
        title: '✅ Avertissement Retiré',
        description: `L'avertissement ${warnId} a été retiré`,
        fields: [
            { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
            { name: 'Utilisateur', value: `<@${warn.userId}> (${warn.userId})`, inline: true },
            { name: 'ID de l\'avertissement', value: warnId, inline: true },
            { name: 'Raison originale', value: warn.reason }
        ]
    });

    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Avertissement Retiré')
        .setDescription(`L'avertissement ${warnId} a été retiré`)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleListWarn(interaction) {
    const user = interaction.options.getUser('user');
    
    const warns = await WarnModel.find({ 
        userId: user.id,
        guildId: interaction.guild.id
    }).sort({ timestamp: -1 });

    if (warns.length === 0) {
        return interaction.reply({
            content: `${user.toString()} n'a aucun avertissement.`,
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Avertissements de ${user.tag}`)
        .setDescription(`Total: ${warns.length} avertissement(s)`)
        .setTimestamp();

    warns.forEach((warn) => {
        embed.addFields({
            name: `Avertissement ${warn.warnId}`,
            value: `**Raison:** ${warn.reason}\n**Date:** <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>\n**Modérateur:** <@${warn.moderatorId}>\n**Preuve:** ${warn.proof}\n**Expire:** ${warn.expiresAt ? `<t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>` : 'Jamais'}`
        });
    });

    await interaction.reply({ embeds: [embed] });
}

async function handleExpiredWarns(interaction) {
    const user = interaction.options.getUser('user');
    
    const expiredWarns = await WarnModel.getExpiredWarns(user.id, interaction.guild.id);

    if (expiredWarns.length === 0) {
        return interaction.reply({
            content: `${user.toString()} n'a aucun avertissement expiré.`,
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle(`Avertissements expirés de ${user.tag}`)
        .setDescription(`Total: ${expiredWarns.length} avertissement(s) expiré(s)`)
        .setTimestamp();

    expiredWarns.forEach((warn) => {
        embed.addFields({
            name: `Avertissement ${warn.warnId}`,
            value: `**Raison:** ${warn.reason}\n**Date:** <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>\n**Expiré le:** <t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>\n**Modérateur:** <@${warn.moderatorId}>`
        });
    });

    await interaction.reply({ embeds: [embed] });
}

async function handleRecentWarns(interaction) {
    const recentWarns = await WarnModel.find({ 
        guildId: interaction.guild.id 
    })
    .sort({ timestamp: -1 })
    .limit(10);

    if (recentWarns.length === 0) {
        return interaction.reply({
            content: 'Aucun avertissement récent.',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('Avertissements Récents')
        .setDescription(`Les ${recentWarns.length} derniers avertissements`)
        .setTimestamp();

    recentWarns.forEach((warn) => {
        embed.addFields({
            name: `Avertissement ${warn.warnId}`,
            value: `**Utilisateur:** <@${warn.userId}>\n**Raison:** ${warn.reason}\n**Date:** <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>\n**Modérateur:** <@${warn.moderatorId}>\n**Expire:** ${warn.expiresAt ? `<t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>` : 'Jamais'}`
        });
    });

    await interaction.reply({ embeds: [embed] });
}