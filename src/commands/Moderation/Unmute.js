const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { ModCase, generateSanctionId } = require('../../utils/Schemas/Moderation/ModCase.js');

module.exports = {
    cooldown: 3,
    userPerms: ['ModerateMembers'],
    clientPerms: ['ModerateMembers'],
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Retirer le mute d\'un utilisateur')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L\'utilisateur à démuter')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du unmute')
                .setRequired(true)),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'Cet utilisateur n\'est pas dans le serveur.', ephemeral: true });

        if (!member.isCommunicationDisabled()) {
            return interaction.reply({ content: 'Cet utilisateur n\'est pas muet.', ephemeral: true });
        }

        try {
            await member.timeout(null, reason);

            // Récupérer le cas de modération
            let modCase = await ModCase.findOne({
                userId: user.id,
                guildId: interaction.guild.id
            });

            if (!modCase) {
                modCase = new ModCase({
                    userId: user.id,
                    guildId: interaction.guild.id,
                    caseId: generateSanctionId(interaction.guild.id)
                });
            }

            // Marquer les mutes actifs comme expirés
            const activeMutes = modCase.sanctions.filter(s => 
                s.type === 'MUTE' && !s.expired && (!s.expiresAt || s.expiresAt > new Date())
            );

            for (const mute of activeMutes) {
                mute.expired = true;
                mute.expiresAt = new Date();
            }

            // Ajouter l'action d'unmute au casier
            const unmuteAction = {
                sanctionId: generateSanctionId(interaction.guild.id),
                type: 'UNMUTE',
                reason: reason,
                moderatorId: interaction.user.id,
                timestamp: new Date(),
                relatedSanctions: activeMutes.map(m => m.sanctionId)
            };

            modCase.sanctions.push(unmuteAction);
            await modCase.save();

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔊 Utilisateur Démuté')
                .setDescription(`${user} a été démuté`)
                .addFields(
                    { name: 'Raison', value: reason },
                    { name: 'Modérateur', value: `${interaction.user}` }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            // Log l'action
            await client.logManager.sendLogEmbed(interaction.guild.id, {
                color: '#00FF00',
                title: '🔊 Unmute',
                description: `${user.toString()} a été démuté`,
                fields: [
                    { name: 'Modérateur', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Utilisateur', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Raison', value: reason },
                    { name: 'Sanctions Terminées', value: activeMutes.length > 0 ? 
                        activeMutes.map(m => m.sanctionId).join(', ') : 
                        'Aucune sanction active trouvée'
                    }
                ],
                thumbnail: user.displayAvatarURL()
            });

        } catch (error) {
            console.error('Erreur lors du unmute:', error);
            await interaction.reply({ 
                content: 'Une erreur est survenue lors du unmute de l\'utilisateur.',
                ephemeral: true 
            });
        }
    }
};