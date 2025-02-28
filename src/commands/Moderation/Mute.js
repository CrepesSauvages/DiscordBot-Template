const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { ModCase, generateSanctionId } = require('../../utils/Schemas/Moderation/ModCase.js');
const ms = require('ms');

module.exports = {
    cooldown: 3,
    userPerms: ['ModerateMembers'],
    clientPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Rendre muet un utilisateur')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur à rendre muet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Durée du mute (ex: 7d, 24h, 30m)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du mute')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('proof')
                .setDescription('Image ou fichier de preuve (optionnel)')),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason');
        const proofAttachment = interaction.options.getAttachment('proof');
        const proof = proofAttachment ? proofAttachment.url : 'Aucune preuve fournie';

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Cet utilisateur n\'est pas dans le serveur.', ephemeral: true });

        if (member.id === interaction.user.id)
            return interaction.reply({ content: 'Vous ne pouvez pas vous mute vous-même.', ephemeral: true });
        if (member.user.bot)
            return interaction.reply({ content: 'Vous ne pouvez pas mute un bot.', ephemeral: true });

        const durationMs = ms(duration);
        if (!durationMs) {
            return interaction.reply({ content: 'Format de durée invalide. Utilisez : 1d, 1h, 1m', ephemeral: true });
        }

        try {
            await member.timeout(durationMs, reason);

            const sanctionData = {
                type: 'MUTE',
                reason: reason,
                proof: proof,
                moderatorId: interaction.user.id,
                expiresAt: new Date(Date.now() + durationMs),
                expired: false
            };

            const modCase = await ModCase.addSanction(user.id, interaction.guild.id, sanctionData);
            const newSanction = modCase.sanctions[modCase.sanctions.length - 1];

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔇 Utilisateur Muet')
                .setDescription(`${user} a été rendu muet`)
                .addFields(
                    { name: 'ID de Sanction', value: newSanction.sanctionId },
                    { name: 'Raison', value: reason },
                    { name: 'Durée', value: duration },
                    { name: 'Modérateur', value: `${interaction.user}` },
                    { name: 'Expire', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>` }
                )
                .setTimestamp();

            if (proof !== 'Aucune preuve fournie') {
                embed.addFields({ name: 'Preuve', value: proof });
            }

            await interaction.reply({ embeds: [embed] });

            // Log l'action
            await client.logManager.sendLogEmbed(interaction.guild.id, {
                color: '#FF0000',
                title: '🔇 Nouveau Mute',
                description: `${user.toString()} a été rendu muet`,
                fields: [
                    { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'ID de Sanction', value: newSanction.sanctionId, inline: true },
                    { name: 'Raison', value: reason },
                    { name: 'Durée', value: duration },
                    { name: 'Expire', value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>` },
                    { name: 'Preuve', value: proof }
                ],
                thumbnail: user.displayAvatarURL()
            });

        } catch (error) {
            console.error('Erreur lors du mute:', error);
            await interaction.reply({ 
                content: 'Une erreur est survenue lors du mute de l\'utilisateur.',
                ephemeral: true 
            });
        }
    }
};