const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { ModCase, generateSanctionId } = require('../../utils/Schemas/Moderation/ModCase.js');
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
                .addAttachmentOption(option =>
                    option.setName('proof')
                        .setDescription('Image ou fichier de preuve (optionnel)')))
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
    const warnCount = activeWarns;
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
    const duration = interaction.options.getString('duration');
    const proofAttachment = interaction.options.getAttachment('proof');
    const proof = proofAttachment ? proofAttachment.url : 'Aucune preuve fournie';

    if (user.id === interaction.user.id) 
        return interaction.reply({ content: 'Vous ne pouvez pas vous avertir vous-même.', ephemeral: true });
    if (user.bot)
        return interaction.reply({ content: 'Vous ne pouvez pas avertir un bot.', ephemeral: true });

    let expiresAt = null;
    if (duration) {
        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return interaction.reply({ content: 'Format de durée invalide. Utilisez : 1d, 1h, 1m', ephemeral: true });
        }
        expiresAt = new Date(Date.now() + durationMs);
    }

    try {
        const sanctionData = {
            type: 'WARN',
            reason: reason,
            proof: proof,
            moderatorId: interaction.user.id,
            expiresAt: expiresAt,
            expired: false
        };

        const modCase = await ModCase.addSanction(user.id, interaction.guild.id, sanctionData);
        const newSanction = modCase.sanctions[modCase.sanctions.length - 1];
        
        const embed = new EmbedBuilder()
            .setColor('#FF9900') // Couleur warning en hexadécimal
            .setTitle('⚠️ Avertissement')
            .setDescription(`${user} a été averti`)
            .addFields(
                { name: 'ID de Sanction', value: newSanction.sanctionId },
                { name: 'Raison', value: reason },
                { name: 'Modérateur', value: `${interaction.user}` },
                { name: 'Expiration', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Jamais' },
                { name: 'Total Warns', value: `${modCase.totalWarns}` }
            )
            .setTimestamp();

        if (proof !== 'Aucune preuve fournie') {
            embed.addFields({ name: 'Preuve', value: proof });
        }

        await interaction.reply({ embeds: [embed] });
        await applyAutoModeration(interaction, user, modCase.totalWarns);

        // Log l'action
        await client.logManager.sendLogEmbed(interaction.guild.id, {
            color: '#FF0000',
            title: '⚠️ Nouvel Avertissement',
            description: `Un avertissement a été ajouté pour ${user.toString()}`,
            fields: [
                { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                { name: 'Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'ID de Sanction', value: newSanction.sanctionId, inline: true },
                { name: 'Raison', value: reason },
                { name: 'Preuve', value: proof || 'Aucune preuve fournie' },
                { name: 'Expire', value: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : 'Jamais' }
            ],
            thumbnail: user.displayAvatarURL()
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout du warn:', error);
        await interaction.reply({ content: 'Une erreur est survenue lors de l\'ajout de l\'avertissement.', ephemeral: true });
    }
}

async function handleRemoveWarn(interaction, client) {
    const sanctionId = interaction.options.getString('warnid');

    try {
        const modCase = await ModCase.removeSanction(interaction.guild.id, sanctionId);
        
        if (!modCase) {
            return interaction.reply({ 
                content: 'Avertissement non trouvé ou déjà supprimé.',
                ephemeral: true 
            });
        }

        // Log l'action
        await client.logManager.sendLogEmbed(interaction.guild.id, {
            color: '#00FF00',
            title: '✅ Avertissement Retiré',
            description: `L'avertissement ${sanctionId} a été retiré`,
            fields: [
                { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                { name: 'Utilisateur', value: `<@${modCase.userId}> (${modCase.userId})`, inline: true },
                { name: 'ID de Sanction', value: sanctionId, inline: true },
                { name: 'Warns Restants', value: `${modCase.totalWarns}` }
            ]
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00') // Couleur success en hexadécimal
            .setTitle('✅ Avertissement Retiré')
            .setDescription(`L'avertissement ${sanctionId} a été retiré avec succès.`)
            .addFields(
                { name: 'Utilisateur', value: `<@${modCase.userId}>` },
                { name: 'Modérateur', value: `${interaction.user}` },
                { name: 'Warns Restants', value: `${modCase.totalWarns}` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur lors de la suppression du warn:', error);
        await interaction.reply({ 
            content: 'Une erreur est survenue lors de la suppression de l\'avertissement.',
            ephemeral: true 
        });
    }
}

async function handleListWarn(interaction) {
    const user = interaction.options.getUser('user');

    try {
        const modCase = await ModCase.findOne({
            userId: user.id,
            guildId: interaction.guild.id
        });

        if (!modCase || modCase.sanctions.length === 0) {
            return interaction.reply({
                content: `${user} n'a aucun avertissement.`,
                ephemeral: true
            });
        }

        const activeWarns = modCase.sanctions.filter(s => 
            s.type === 'WARN' && (!s.expired && (!s.expiresAt || s.expiresAt > new Date()))
        );

        const embed = new EmbedBuilder()
            .setColor('#7289DA') // Couleur primary en hexadécimal
            .setTitle(`Avertissements de ${user.tag}`)
            .setDescription(`Total: ${modCase.totalWarns} | Actifs: ${activeWarns.length}`)
            .setTimestamp();

        activeWarns.forEach((warn) => {
            embed.addFields({
                name: `Warn ID: ${warn.sanctionId}`,
                value: `
                    **Raison:** ${warn.reason}
                    **Modérateur:** <@${warn.moderatorId}>
                    **Date:** <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>
                    ${warn.expiresAt ? `**Expire:** <t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>` : '**Expire:** Jamais'}
                `
            });
        });

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur lors de la liste des warns:', error);
        await interaction.reply({ 
            content: 'Une erreur est survenue lors de la récupération des avertissements.',
            ephemeral: true 
        });
    }
}

async function handleExpiredWarns(interaction) {
    const user = interaction.options.getUser('user');
    
    const expiredWarns = await ModCase.getExpiredWarns(user.id, interaction.guild.id);

    if (expiredWarns.length === 0) {
        return interaction.reply({
            content: `${user} n'a aucun avertissement expiré.`,
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
            name: `Avertissement ${warn.sanctionId}`,
            value: `**Raison:** ${warn.reason}\n**Date:** <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>\n**Expiré le:** <t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>\n**Modérateur:** <@${warn.moderatorId}>`
        });
    });

    await interaction.reply({ embeds: [embed] });
}

async function handleRecentWarns(interaction) {
    try {
        const recentWarns = await ModCase.findRecentWarns(interaction.guild.id, 10);

        if (!recentWarns || recentWarns.length === 0) {
            return interaction.reply({
                content: 'Aucun avertissement récent trouvé.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('Avertissements Récents')
            .setDescription(`Les ${recentWarns.length} derniers avertissements`)
            .setTimestamp();

        recentWarns.forEach((warn) => {
            embed.addFields({
                name: `Avertissement ${warn.sanctionId}`,
                value: `**Utilisateur:** <@${warn.userId}>\n**Raison:** ${warn.reason}\n**Date:** <t:${Math.floor(warn.timestamp.getTime() / 1000)}:R>\n**Modérateur:** <@${warn.moderatorId}>\n**Expire:** ${warn.expiresAt ? `<t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>` : 'Jamais'}`
            });
        });

        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur lors de la récupération des warns récents:', error);
        await interaction.reply({
            content: 'Une erreur est survenue lors de la récupération des avertissements récents.',
            ephemeral: true
        });
    }
}